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
  const status = searchParams.get("status");

  const requests = await prisma.supportRequest.findMany({
    where: {
      ...(status && status !== "ALL" && { status: status as any }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { include: { profile: true } },
    },
  });

  const result = requests.map((r) => ({
    id: r.id,
    user: {
      id: r.user.id,
      name: r.user.profile?.displayName ?? r.user.username,
      username: r.user.username,
      avatarUrl: r.user.profile?.avatarUrl ?? null,
    },
    subject: r.subject,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toLocaleString("vi-VN"),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toLocaleString("vi-VN") : undefined,
  }));

  return NextResponse.json(result);
}
