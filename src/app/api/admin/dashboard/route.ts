import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      totalDocuments,
      pendingReports,
      topPostsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          lastActiveAt: { gte: new Date(Date.now() - ACTIVE_WINDOW_MS) },
        },
      }),
      prisma.document.count({
        where: {
          postId: null,
          type: { notIn: ["IMAGE", "VIDEO"] },
          hidden: false,
        },
      }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.post.findMany({
        where: {
          visibility: "PUBLIC",
          OR: [{ likeCount: { gt: 0 } }, { commentCount: { gt: 0 } }],
        },
        orderBy: [{ likeCount: "desc" }, { commentCount: "desc" }],
        take: 5,
        include: {
          author: { include: { profile: true } },
          tags: { include: { tag: true } },
          documents: true,
        },
      }),
    ]);

    const topPosts = topPostsRaw.map((post) => {
      const displayName =
        post.author.profile?.displayName ?? post.author.username;

      const mediaDocs = post.documents.filter(
        (d) => d.type === "IMAGE" || d.type === "VIDEO",
      );
      const attachmentDoc = post.documents.find(
        (d) => d.type !== "IMAGE" && d.type !== "VIDEO",
      );

      return {
        id: post.id,
        authorId: post.authorId,
        content: post.content,
        excerpt:
          post.content.length > 120
            ? post.content.slice(0, 120) + "…"
            : post.content,
        authorName: displayName,
        authorUsername: post.author.username,
        avatarUrl: post.author.profile?.avatarUrl ?? null,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        images: mediaDocs.length ? mediaDocs.map((d) => d.fileUrl) : undefined,
        mediaTypes: mediaDocs.length
          ? mediaDocs.map((d) => (d.type === "VIDEO" ? "video" : "image"))
          : undefined,
        attachment: attachmentDoc
          ? {
              name: attachmentDoc.title,
              size: attachmentDoc.fileSize
                ? `${(attachmentDoc.fileSize / 1024).toFixed(1)} KB`
                : "",
              type: attachmentDoc.type,
              url: attachmentDoc.fileUrl,
              docId: attachmentDoc.id,
            }
          : undefined,
        tags: post.tags.map((t) => t.tag?.name).filter(Boolean) as string[],
        visibility: post.visibility,
        createdAt: post.createdAt.toISOString(),
        editedAt: post.editedAt ? post.editedAt.toISOString() : null,
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalPosts,
        totalComments,
        totalDocuments,
        pendingReports,
      },
      topPosts,
    });
  } catch (err) {
    console.error("[/api/admin/dashboard]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
