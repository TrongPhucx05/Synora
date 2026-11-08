import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

type Params = { params: Promise<{ id: string; messageId: string }> };

const MESSAGE_SELECT = {
  id: true,
  content: true,
  status: true,
  createdAt: true,
  deletedAt: true,
  senderId: true,
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
} as const;

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: sourceConversationId, messageId } = await params;

  const body = await req.json();
  const { targetConversationId } = body as { targetConversationId?: string };
  if (!targetConversationId)
    return NextResponse.json(
      { error: "Thiếu cuộc trò chuyện đích" },
      { status: 400 },
    );

  const sourceMembership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId: sourceConversationId, userId },
    },
  });
  if (!sourceMembership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const targetMembership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId: targetConversationId, userId },
    },
  });
  if (!targetMembership)
    return NextResponse.json(
      { error: "Bạn không phải thành viên của cuộc trò chuyện đích" },
      { status: 403 },
    );

  if (session.user.role === "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const targetConv = await prisma.conversation.findUnique({
    where: { id: targetConversationId },
    select: {
      isGroup: true,
      isDisabled: true,
      members: { select: { userId: true } },
    },
  });
  if (targetConv?.isDisabled)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (targetConv && !targetConv.isGroup) {
    const otherId = targetConv.members.find((m) => m.userId !== userId)?.userId;
    if (otherId) {
      const blocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: otherId },
            { blockerId: otherId, blockedId: userId },
          ],
        },
        select: { id: true },
      });
      if (blocked)
        return NextResponse.json(
          { error: "Không thể gửi tin nhắn cho người này" },
          { status: 403 },
        );
    }
  }
  const original = await prisma.message.findFirst({
    where: { id: messageId, conversationId: sourceConversationId },
    select: {
      content: true,
      deletedAt: true,
      senderId: true,
      attachments: {
        select: {
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
          username: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  });
  if (!original)
    return NextResponse.json(
      { error: "Tin nhắn không tồn tại" },
      { status: 404 },
    );
  if (original.deletedAt)
    return NextResponse.json(
      { error: "Không thể chuyển tiếp tin nhắn đã bị thu hồi" },
      { status: 400 },
    );
  if (!original.content && original.attachments.length === 0)
    return NextResponse.json(
      { error: "Không có nội dung để chuyển tiếp" },
      { status: 400 },
    );

  const originalSenderName =
    original.sender.profile?.displayName ?? original.sender.username;

  let duplicatedAttachments: {
    url: string;
    key: string;
    name: string;
    size: number;
    type: "IMAGE" | "VIDEO" | "DOCUMENT";
    mimeType: string | null;
  }[] = [];

  if (original.attachments.length > 0) {
    try {
      const uploadResults = await utapi.uploadFilesFromUrl(
        original.attachments.map((a) => ({ url: a.url, name: a.name })),
      );

      duplicatedAttachments = uploadResults.map((result, i) => {
        const source = original.attachments[i];
        if (!result.data) {
          throw new Error(
            result.error?.message ?? `Không thể sao chép file "${source.name}"`,
          );
        }
        return {
          url: result.data.ufsUrl ?? result.data.url,
          key: result.data.key,
          name: source.name,
          size: source.size,
          type: source.type,
          mimeType: source.mimeType,
        };
      });
    } catch (err) {
      console.error("Sao chép file khi chuyển tiếp thất bại:", err);
      return NextResponse.json(
        { error: "Không thể chuyển tiếp file đính kèm, vui lòng thử lại" },
        { status: 500 },
      );
    }
  }

  const [forwarded] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: targetConversationId,
        senderId: userId,
        content: original.content,
        forwardedFromSender: originalSenderName,
        status: "SENT",
        attachments: duplicatedAttachments.length
          ? { create: duplicatedAttachments }
          : undefined,
      },
      select: MESSAGE_SELECT,
    }),
    prisma.conversation.update({
      where: { id: targetConversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return NextResponse.json(forwarded, { status: 201 });
}