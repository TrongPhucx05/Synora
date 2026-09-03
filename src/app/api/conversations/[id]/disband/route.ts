import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
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

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      isGroup: true,
      avatarKey: true,
      messages: { select: { attachments: { select: { key: true } } } },
    },
  });
  if (!conversation)
    return NextResponse.json(
      { error: "Không tìm thấy cuộc trò chuyện" },
      { status: 404 },
    );

  if (!conversation.isGroup)
    return NextResponse.json(
      { error: "Chỉ có thể giải tán nhóm" },
      { status: 400 },
    );

  if (!membership.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới có thể giải tán nhóm" },
      { status: 403 },
    );

  const attachmentKeys = conversation.messages.flatMap((m) =>
    m.attachments.map((a) => a.key),
  );
  const allKeys = [
    ...attachmentKeys,
    ...(conversation.avatarKey ? [conversation.avatarKey] : []),
  ];

  await prisma.conversation.delete({ where: { id: conversationId } });

  if (allKeys.length > 0) {
    try {
      await utapi.deleteFiles(allKeys);
    } catch (err) {
      console.error("Xóa file khi giải tán nhóm thất bại:", err);
    }
  }

  return NextResponse.json({ disbanded: true });
}
