import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sweepScheduledDeletions } from "@/lib/admin/moderation-sweep";
import { initialsFor } from "@/lib/avatar";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  await sweepScheduledDeletions();

  const posts = await prisma.post.findMany({
    where: {
      ...(status === "VISIBLE" && { hidden: false }),
      ...(status === "HIDDEN" && { hidden: true }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      author: { include: { profile: true } },
      documents: { select: { type: true } },
      _count: { select: { comments: true, likes: true, reports: true } },
    },
  });

  const result = posts.map((p) => {
    const authorName = p.author.profile?.displayName ?? p.author.username;
    return {
      id: p.id,
      author: {
        name: authorName,
        initials: initialsFor(authorName),
        color: "bg-primary",
        username: p.author.username,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
      },
      excerpt:
        p.content.length > 160 ? p.content.slice(0, 160) + "…" : p.content,
      imageCount: p.documents.filter(
        (d) => d.type === "IMAGE" || d.type === "VIDEO",
      ).length,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
      reportCount: p._count.reports,
      status: p.hidden ? "HIDDEN" : "VISIBLE",
      createdAt: p.createdAt.toLocaleDateString("vi-VN"),
    };
  });

  return NextResponse.json(result);
}
