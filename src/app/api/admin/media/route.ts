import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/avatar";

const PAGE_SIZE = 24;

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
    type: { in: ["IMAGE", "VIDEO"] },
    ...(status === "VISIBLE" && { hidden: false }),
    ...(status === "HIDDEN" && { hidden: true }),
    ...(query && {
      uploader: { username: { contains: query, mode: "insensitive" } },
    }),
    ...(onlyReported && { post: { reports: { some: {} } } }),
  };

  const [totalCount, docs] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        uploader: { include: { profile: true } },
        post: {
          select: { content: true, _count: { select: { reports: true } } },
        },
      },
    }),
  ]);

  const items = docs.map((d) => {
    const authorName = d.uploader.profile?.displayName ?? d.uploader.username;
    return {
      id: d.id,
      url: d.fileUrl,
      type: d.type,
      author: {
        name: authorName,
        initials: initialsFor(authorName),
        color: "bg-primary",
        username: d.uploader.username,
        avatarUrl: d.uploader.profile?.avatarUrl ?? null,
      },
      postExcerpt: d.post?.content?.slice(0, 80) ?? "",
      reportCount: d.post?._count.reports ?? 0,
      status: d.hidden ? "HIDDEN" : "VISIBLE",
      createdAt: d.createdAt.toLocaleDateString("vi-VN"),
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
