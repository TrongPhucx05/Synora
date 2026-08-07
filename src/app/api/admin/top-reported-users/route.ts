import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const grouped = await prisma.report.groupBy({
      by: ["reportedUserId"],
      where: { reportedUserId: { not: null } },
      _count: { reportedUserId: true },
      orderBy: { _count: { reportedUserId: "desc" } },
      take: 5,
    });

    if (grouped.length === 0) return NextResponse.json([]);

    const ids = grouped
      .map((g) => g.reportedUserId)
      .filter((id): id is string => !!id);

    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      include: { profile: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = grouped
      .map((g) => {
        const u = g.reportedUserId ? userMap.get(g.reportedUserId) : null;
        if (!u) return null;
        return {
          id: u.id,
          name: u.profile?.displayName ?? u.username,
          username: u.username,
          avatarUrl: u.profile?.avatarUrl ?? null,
          reportCount: g._count.reportedUserId,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/admin/top-reported-users]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
