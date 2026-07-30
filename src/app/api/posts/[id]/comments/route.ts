import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedIds, isBlockedEitherWay } from "@/lib/block/server";
import { assertActiveSession } from "@/lib/auth/assert-active";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  try {
    const likesInclude = session?.user?.id
      ? { where: { userId: session.user.id }, select: { id: true } }
      : undefined;

    const blockedIds = session?.user?.id
      ? await getBlockedIds(session.user.id)
      : [];

    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        parentId: null,
        ...(blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {}),
        OR: [
          { hidden: false },
          { hidden: true, hiddenByAuthor: session?.user?.id ?? "" },
          { authorId: session?.user?.id ?? "" },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: { include: { profile: true } },
        replies: {
          where: {
            ...(blockedIds.length > 0
              ? { authorId: { notIn: blockedIds } }
              : {}),
            OR: [
              { hidden: false },
              { hidden: true, hiddenByAuthor: session?.user?.id ?? "" },
              { authorId: session?.user?.id ?? "" },
            ],
          },
          include: {
            author: { include: { profile: true } },
            _count: { select: { likes: true } },
            ...(likesInclude && { likes: likesInclude }),
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true } },
        ...(likesInclude && { likes: likesInclude }),
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Comments error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { session, response } = await assertActiveSession();
  if (response) return response;

  try {
    const {
      content,
      parentId,
      imageUrl,
      videoUrl,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    } = await req.json();

    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { hidden: true, authorId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Bình luận không tồn tại" },
          { status: 404 },
        );
      }
      if (parent.hidden) {
        return NextResponse.json(
          { error: "Không thể trả lời bình luận đã bị ẩn" },
          { status: 403 },
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content ?? "",
        postId: id,
        authorId: session!.user.id,
        parentId: parentId ?? null,
        imageUrl: imageUrl ?? null,
        videoUrl: videoUrl ?? null,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        fileType: fileType ?? null,
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    const post = await prisma.post.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
      select: { authorId: true },
    });

    const recipientIds = new Set<string>();

    if (post.authorId !== session!.user.id) {
      recipientIds.add(post.authorId);
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: session!.user.id,
          type: "COMMENT",
          postId: id,
          commentId: comment.id,
        },
      });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (
        parent &&
        parent.authorId !== session!.user.id &&
        !recipientIds.has(parent.authorId)
      ) {
        recipientIds.add(parent.authorId);
        await prisma.notification.create({
          data: {
            recipientId: parent.authorId,
            actorId: session!.user.id,
            type: "REPLY",
            postId: id,
            commentId: comment.id,
          },
        });
      }
    }

    const mentionMatches: string[] =
      (content ?? "").match(/@[\wÀ-ỹ.]+/gu) ?? [];
    const mentionUsernames = Array.from(
      new Set(mentionMatches.map((m: string) => m.slice(1).toLowerCase())),
    );

    if (mentionUsernames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentionUsernames } },
        select: { id: true, username: true },
      });

      for (const u of mentionedUsers) {
        if (u.id === session!.user.id || recipientIds.has(u.id)) continue;
        const blocked = await isBlockedEitherWay(session!.user.id, u.id);
        if (blocked) continue;
        recipientIds.add(u.id);
        await prisma.notification.create({
          data: {
            recipientId: u.id,
            actorId: session!.user.id,
            type: "MENTION",
            postId: id,
            commentId: comment.id,
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
