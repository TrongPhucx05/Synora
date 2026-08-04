import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlockedEitherWay } from "@/lib/block/server";
import { assertActiveSession } from "@/lib/auth/assert-active";

type Params = { params: Promise<{ id: string }> };

const messageSelect = {
  id: true,
  content: true,
  status: true,
  createdAt: true,
  deletedAt: true,
  senderId: true,
  pinnedAt: true,
  pinnedById: true,
  pinnedBy: {
    select: { username: true, profile: { select: { displayName: true } } },
  },
  forwardedFromSender: true,
  attachments: {
    select: {
      id: true,
      url: true,
      key: true,
      name: true,
      size: true,
      type: true,
      mimeType: true,
    },
  },
  sender: {
    select: {
      id: true,
      username: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  replyToId: true,
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      attachments: {
        select: {
          id: true,
          url: true,
          key: true,
          name: true,
          size: true,
          type: true,
          mimeType: true,
        },
      },
      sender: {
        select: {
          profile: { select: { displayName: true } },
          username: true,
        },
      },
    },
  },
  reactions: {
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: {
        select: {
          username: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  isSystemMessage: true,
} as const;

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: conversationId } = await params;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!membership.isAccepted)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(membership.clearedAt
        ? { createdAt: { gt: membership.clearedAt } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: messageSelect,
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  messages.reverse();

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date(), markedUnreadAt: null },
  });

  const nextCursor = hasMore ? messages[0]?.id : null;
  return NextResponse.json({ messages, nextCursor });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await assertActiveSession();
  if (response) return response;

  const userId = session!.user.id;
  const { id: conversationId } = await params;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!membership.isAccepted) {
    return NextResponse.json(
      { error: "Bạn chưa tham gia cuộc trò chuyện này" },
      { status: 403 },
    );
    }
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      isGroup: true,
      members: { where: { userId: { not: userId } }, select: { userId: true } },
    },
  });

  if (conversation && !conversation.isGroup) {
    const other = conversation.members[0];
    if (other) {
      const blocked = await isBlockedEitherWay(userId, other.userId);
      if (blocked) {
        return NextResponse.json(
          { error: "Không thể gửi tin nhắn cho người dùng này" },
          { status: 403 },
        );
      }
    }
  }

  const body = await req.json();
  const { content, replyToId, attachments } = body as {
    content?: string;
    replyToId?: string;
    attachments?: {
      url: string;
      key: string;
      name: string;
      size: number;
      type: "IMAGE" | "VIDEO" | "DOCUMENT";
      mimeType?: string;
    }[];
  };

  if (!content?.trim() && (!attachments || attachments.length === 0))
    return NextResponse.json(
      { error: "Tin nhắn không được rỗng" },
      { status: 400 },
    );

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content?.trim() ?? null,
        replyToId: replyToId ?? null,
        status: "SENT",
        attachments: attachments?.length
          ? {
              create: attachments.map((a) => ({
                url: a.url,
                key: a.key,
                name: a.name,
                size: a.size,
                type: a.type,
                mimeType: a.mimeType ?? null,
              })),
            }
          : undefined,
      },
      select: messageSelect,
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
    prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId: { not: userId },
        hiddenAt: { not: null },
      },
      data: { hiddenAt: null },
    }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
