import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

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

  const link = await prisma.groupInviteLink.findUnique({
    where: { conversationId },
    select: { token: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({
    token: link?.isActive ? link.token : null,
    isActive: link?.isActive ?? false,
  });
}

export async function POST(_req: NextRequest, { params }: Params) {
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

  const existing = await prisma.groupInviteLink.findUnique({
    where: { conversationId },
  });

  if (existing?.isActive) {
    return NextResponse.json({ token: existing.token, isActive: true });
  }

  if (existing && !existing.isActive) {
    if (!membership.isLeader)
      return NextResponse.json(
        { error: "Link mời đã bị thu hồi, chỉ trưởng nhóm mới có thể bật lại" },
        { status: 403 },
      );
    const reactivated = await prisma.groupInviteLink.update({
      where: { conversationId },
      data: { isActive: true },
    });
    return NextResponse.json({ token: reactivated.token, isActive: true });
  }

  const created = await prisma.groupInviteLink.create({
    data: { conversationId, createdById: userId },
  });

  return NextResponse.json({ token: created.token, isActive: true }, { status: 201 });
}

export async function PATCH(_req: NextRequest, { params }: Params) {
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
  if (!membership.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới có thể tạo link mới" },
      { status: 403 },
    );

  const existing = await prisma.groupInviteLink.findUnique({
    where: { conversationId },
  });
  if (!existing)
    return NextResponse.json(
      { error: "Nhóm chưa có link mời để tạo lại" },
      { status: 404 },
    );

  const updated = await prisma.groupInviteLink.update({
    where: { conversationId },
    data: { token: crypto.randomUUID(), isActive: true },
  });

  return NextResponse.json({ token: updated.token, isActive: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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
  if (!membership.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới có thể thu hồi link" },
      { status: 403 },
    );

  const existing = await prisma.groupInviteLink.findUnique({
    where: { conversationId },
  });
  if (!existing || !existing.isActive)
    return NextResponse.json({ revoked: true });

  await prisma.groupInviteLink.update({
    where: { conversationId },
    data: { isActive: false },
  });

  return NextResponse.json({ revoked: true });
}