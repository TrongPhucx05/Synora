import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAttachmentLabel } from "@/lib/chat/utils";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const pending = await prisma.conversationMember.findMany({
    where: { userId, isAccepted: false, hiddenAt: null, origin: "INVITED", },
    select: {
      hiddenAt: true,
      invitedById: true,
      conversation: {
        select: {
          id: true,
          isGroup: true,
          name: true,
          avatarUrl: true,
          lastMessageAt: true,
          members: {
            where: { userId: { not: userId } },
            take: 1,
            orderBy: { isLeader: "desc" },
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            where: { deletedAt: null },
            select: {
              content: true,
              createdAt: true,
              senderId: true,
              attachments: { select: { type: true } },
            },
          },
          _count: {
            select: {
              messages: { where: { deletedAt: null, isSystemMessage: false } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const visible = pending.filter((m) => {
    if (!m.hiddenAt) return true;
    const lastMsgAt = m.conversation.lastMessageAt;
    return !!lastMsgAt && lastMsgAt > m.hiddenAt;
  });

  const result = await Promise.all(visible.map(async (m) => {
  const conv = m.conversation;
  let other = conv.members[0]?.user;

  if (conv.isGroup && m.invitedById) {
    const inviter = await prisma.user.findUnique({
      where: { id: m.invitedById },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    if (inviter) other = inviter;
  }
    const lastMsg = conv.messages[0];

    let content: string | null = null;
    if (lastMsg) {
      if (lastMsg.content) content = lastMsg.content;
      else if (lastMsg.attachments.length > 0)
        content = buildAttachmentLabel(lastMsg.attachments);
    }

    return conv.isGroup
      ? {
          id: conv.id,
          isGroup: true,
          senderId: other?.id ?? "",
          senderUsername: other?.username ?? "",
          sender: conv.name ?? "Nhóm chat",
          avatarUrl: conv.avatarUrl,
          content:
            content ??
            `Bạn được ${
              other?.profile?.displayName ?? other?.username ?? "ai đó"
            } mời vào nhóm`,
          createdAt: lastMsg?.createdAt?.toISOString() ?? null,
          messageCount: conv._count.messages,
        }
      : {
          id: conv.id,
          isGroup: false,
          senderId: other?.id ?? "",
          senderUsername: other?.username ?? "",
          sender:
            other?.profile?.displayName ?? other?.username ?? "Người dùng",
          avatarUrl: other?.profile?.avatarUrl ?? null,
          content,
          createdAt: lastMsg?.createdAt?.toISOString() ?? null,
          messageCount: conv._count.messages,
        };
  }));

  return NextResponse.json(result);
}
