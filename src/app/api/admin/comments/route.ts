import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/avatar";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const comments = await prisma.comment.findMany({
    where: {
      ...(status === "VISIBLE" && { hidden: false }),
      ...(status === "HIDDEN" && { hidden: true }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      author: { include: { profile: true } },
      post: { select: { content: true } },
      _count: { select: { reports: true } },
    },
  });

  const result = comments.map((c) => {
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

  return NextResponse.json(result);
}
