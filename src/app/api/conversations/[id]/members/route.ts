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
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.conversationMember.findMany({
    where: { conversationId, isAccepted: true },
    orderBy: [{ isLeader: "desc" }, { joinedAt: "asc" }],
    select: {
      isLeader: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: conversationId } = await params;

  const requester = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!requester)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!requester.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới có thể thêm thành viên" },
      { status: 403 },
    );

  const body = await req.json();
  const { usernames } = body as { usernames?: string[] };
  if (!usernames || usernames.length === 0)
    return NextResponse.json(
      { error: "Thiếu danh sách thành viên" },
      { status: 400 },
    );

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { name: true },
  });
  if (!conversation)
    return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });

  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });
  if (users.length === 0)
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );

  const existing = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { in: users.map((u) => u.id) } },
    select: { userId: true, isAccepted: true, hiddenAt: true },
  });
  const existingMap = new Map(existing.map((m) => [m.userId, m]));

  const brandNewIds: string[] = [];
  const reInviteIds: string[] = [];

  for (const u of users) {
    const e = existingMap.get(u.id);
    if (!e) {
      brandNewIds.push(u.id);
    } else if (!e.isAccepted && e.hiddenAt) {
      reInviteIds.push(u.id);
    }
  }

  const invitedIds = [...brandNewIds, ...reInviteIds];
  if (invitedIds.length === 0)
    return NextResponse.json(
      { error: "Tất cả đã là thành viên hoặc đang có lời mời chờ" },
      { status: 400 },
    );

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, profile: { select: { displayName: true } } },
  });
  const actorName = actor?.profile?.displayName ?? actor?.username ?? "Ai đó";

  await prisma.$transaction([
    ...(brandNewIds.length > 0
      ? [
          prisma.conversationMember.createMany({
            data: brandNewIds.map((id) => ({
              conversationId,
              userId: id,
              isAccepted: false,
              origin: "INVITED" as const,
              invitedById: userId,
            })),
          }),
        ]
      : []),
    ...reInviteIds.map((id) =>
      prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId: id } },
        data: {
          isAccepted: false,
          origin: "INVITED",
          hiddenAt: null,
          clearedAt: null,
        },
      }),
    ),
    prisma.notification.createMany({
      data: invitedIds.map((id) => ({
        recipientId: id,
        actorId: userId,
        type: "GROUP_INVITE",
        message: `${actorName} đã mời bạn vào nhóm "${conversation.name}"`,
        conversationId,
      })),
    }),
  ]);

  return NextResponse.json({ invited: invitedIds.length }, { status: 201 });
}
