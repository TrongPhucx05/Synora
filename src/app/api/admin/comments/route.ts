import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/avatar";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const query = searchParams.get("query")?.trim();
  const onlyReported = searchParams.get("onlyReported") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const where: any = {
    ...(status === "VISIBLE" && { hidden: false }),
    ...(status === "HIDDEN" && { hidden: true }),
    ...(query && {
      OR: [
        { content: { contains: query, mode: "insensitive" } },
        { author: { username: { contains: query, mode: "insensitive" } } },
      ],
    }),
    ...(onlyReported && { reports: { some: {} } }),
  };

  const [totalCount, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { include: { profile: true } },
        post: { select: { content: true } },
        _count: { select: { reports: true } },
      },
    }),
  ]);

  const items = comments.map((c) => {
    const authorName = c.author.profile?.displayName ?? c.author.username;
    return {
      id: c.id,
      author: {
        name: authorName,
        initials: initialsFor(authorName),
        color: "bg-primary",
        username: c.author.username,
        avatarUrl: c.author.profile?.avatarUrl ?? null,
      },
      content: c.content,
      postExcerpt:
        c.post.content.length > 100
          ? c.post.content.slice(0, 100) + "…"
          : c.post.content,
      reportCount: c._count.reports,
      status: c.hidden ? "HIDDEN" : "VISIBLE",
      createdAt: c.createdAt.toLocaleDateString("vi-VN"),
    };
  });

  return NextResponse.json({
    items,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  });
}
