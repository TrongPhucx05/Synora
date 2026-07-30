import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const status = searchParams.get("status") ?? "ALL";

  try {
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(status !== "ALL" && { status: status as any }),
        ...(query && {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            {
              profile: {
                displayName: { contains: query, mode: "insensitive" },
              },
            },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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
    });

    const result = users.map((u) => ({
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

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/admin/users]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
