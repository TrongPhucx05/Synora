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
  const status = searchParams.get("status");
  const query = searchParams.get("query")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const where: any = {
    ...(status && status !== "ALL" && { status: status as any }),
    ...(query && {
      OR: [
        { subject: { contains: query, mode: "insensitive" } },
        { user: { username: { contains: query, mode: "insensitive" } } },
        {
          user: {
            profile: { displayName: { contains: query, mode: "insensitive" } },
          },
        },
      ],
    }),
  };

  const [totalCount, requests] = await Promise.all([
    prisma.supportRequest.count({ where }),
    prisma.supportRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { include: { profile: true } } },
    }),
  ]);

  const items = requests.map((r) => ({
    id: r.id,
    user: {
      id: r.user.id,
      name: r.user.profile?.displayName ?? r.user.username,
      username: r.user.username,
      avatarUrl: r.user.profile?.avatarUrl ?? null,
    },
    subject: r.subject,
    message: r.message,
    type: r.type,
    status: r.status,
    createdAt: r.createdAt.toLocaleString("vi-VN"),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toLocaleString("vi-VN") : undefined,
  }));

  return NextResponse.json({
    items,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  });
}
