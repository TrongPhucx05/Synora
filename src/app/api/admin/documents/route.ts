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

  const docs = await prisma.document.findMany({
    where: {
      postId: null,
      type: { notIn: ["IMAGE", "VIDEO"] },
      ...(status === "VISIBLE" && { hidden: false }),
      ...(status === "HIDDEN" && { hidden: true }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      uploader: { include: { profile: true } },
      _count: { select: { reports: true } },
    },
  });

  const result = docs.map((d) => {
    const authorName = d.uploader.profile?.displayName ?? d.uploader.username;
    return {
      id: d.id,
      title: d.title,
      type: d.type,
      subject: d.subject,
      level: d.level,
      fileUrl: d.fileUrl,
      downloadCount: d.downloadCount,
      author: {
        name: authorName,
        initials: initialsFor(authorName),
        color: "bg-primary",
        username: d.uploader.username,
        avatarUrl: d.uploader.profile?.avatarUrl ?? null,
      },
      reportCount: d._count.reports,
      status: d.hidden ? "HIDDEN" : "VISIBLE",
      createdAt: d.createdAt.toLocaleDateString("vi-VN"),
    };
  });

  return NextResponse.json(result);
}
