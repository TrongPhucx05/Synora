import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/avatar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { include: { profile: true } },
      documents: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  }

  const mediaDocs = post.documents.filter(
    (d) => d.type === "IMAGE" || d.type === "VIDEO",
  );
  const fileDocs = post.documents.filter(
    (d) => d.type !== "IMAGE" && d.type !== "VIDEO",
  );
  const authorName = post.author.profile?.displayName ?? post.author.username;

  return NextResponse.json({
    id: post.id,
    authorId: post.authorId,
    author: {
      name: authorName,
      initials: initialsFor(authorName),
      color: "bg-primary",
      role: post.author.role,
      username: post.author.username,
      avatarUrl: post.author.profile?.avatarUrl ?? null,
    },
    time: post.createdAt.toLocaleString("vi-VN"),
    content: post.content,
    images: mediaDocs.length ? mediaDocs.map((d) => d.fileUrl) : undefined,
    mediaTypes: mediaDocs.length
      ? mediaDocs.map((d) => (d.type === "VIDEO" ? "video" : "image"))
      : undefined,
    mediaDocIds: mediaDocs.length ? mediaDocs.map((d) => d.id) : undefined,
    visibility: post.visibility,
    tags: post.tags.map((t) => t.tag.name),
    attachment: fileDocs[0]
      ? {
          name: fileDocs[0].title,
          size: fileDocs[0].fileSize
            ? `${(fileDocs[0].fileSize / 1024).toFixed(1)} KB`
            : "",
          type:
            fileDocs[0].title.split(".").pop()?.toUpperCase() ??
            fileDocs[0].type,
          url: fileDocs[0].fileUrl,
          docId: fileDocs[0].id,
        }
      : undefined,
    attachments: fileDocs.map((d) => ({
      name: d.title,
      size: d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "",
      type: d.title.split(".").pop()?.toUpperCase() ?? d.type,
      url: d.fileUrl,
      docId: d.id,
    })),
    likes: post._count.likes,
    isLikedByMe: false,
    comments: post._count.comments,
    editedAt: post.editedAt,
  });
}
