import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };
const LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: conversationId } = await params;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership || !membership.isAccepted)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true },
  });
  if (!conversation?.isGroup)
    return NextResponse.json(
      { error: "Chỉ nhóm mới có link mời" },
      { status: 400 },
    );

  let link = await prisma.groupInviteLink.findUnique({
    where: { conversationId },
  });

  const isExpired =
    !!link && Date.now() - link.createdAt.getTime() > LINK_LIFETIME_MS;

  if (!link) {
    link = await prisma.groupInviteLink.create({
      data: { conversationId, createdById: userId },
    });
  } else if (isExpired) {
    link = await prisma.groupInviteLink.update({
      where: { conversationId },
      data: { token: crypto.randomUUID(), createdAt: new Date() },
    });
  }

  const expiresAt = new Date(link.createdAt.getTime() + LINK_LIFETIME_MS);

  return NextResponse.json({
    token: link.token,
    expiresAt: expiresAt.toISOString(),
  });
}
