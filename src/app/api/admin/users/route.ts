import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const status = searchParams.get("status") ?? "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  try {
    const where: any = {
      role: "USER",
      ...(status !== "ALL" && { status: status as any }),
      ...(query && {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          {
            profile: { displayName: { contains: query, mode: "insensitive" } },
          },
        ],
      }),
    };

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          suspendedUntil: true,
          createdAt: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      }),
    ]);

    const items = users.map((u) => ({
      id: u.id,
      name: u.profile?.displayName ?? u.username,
      username: u.username,
      email: u.email,
      avatarUrl: u.profile?.avatarUrl ?? null,
      role: u.role,
      status: u.status,
      suspendedUntil: u.suspendedUntil ? u.suspendedUntil.toISOString() : null,
      joinedAt: u.createdAt.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));

    return NextResponse.json({
      items,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    });
  } catch (err) {
    console.error("[/api/admin/users]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
