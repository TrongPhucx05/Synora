import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { token } = await params;

  const link = await prisma.groupInviteLink.findUnique({
    where: { token },
    select: {
      isActive: true,
      conversation: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          _count: { select: { members: { where: { isAccepted: true } } } },
        },
      },
    },
  });

  if (!link || !link.isActive)
    return NextResponse.json(
      { error: "Link mời không tồn tại hoặc đã hết hiệu lực" },
      { status: 404 },
    );

  const conv = link.conversation;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: conv.id, userId } },
    select: { isAccepted: true, origin: true, rejectedAt: true },
  });

  let viewerStatus: "member" | "invited" | "requested" | "none" | "cooldown" =
    "none";
  let cooldownEndsAt: string | undefined;

  if (membership?.isAccepted) {
    viewerStatus = "member";
  } else if (membership?.rejectedAt) {
    const remaining =
      membership.rejectedAt.getTime() + COOLDOWN_MS - Date.now();
    if (remaining > 0) {
      viewerStatus = "cooldown";
      cooldownEndsAt = new Date(
        membership.rejectedAt.getTime() + COOLDOWN_MS,
      ).toISOString();
    }
  } else if (
    membership &&
    !membership.isAccepted &&
    membership.origin === "INVITED"
  ) {
    viewerStatus = "invited";
  } else if (
    membership &&
    !membership.isAccepted &&
    membership.origin === "REQUESTED"
  ) {
    viewerStatus = "requested";
  }

  return NextResponse.json({
    conversationId: conv.id,
    name: conv.name,
    avatarUrl: conv.avatarUrl,
    memberCount: conv._count.members,
    viewerStatus,
    cooldownEndsAt,
  });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { token } = await params;

  const link = await prisma.groupInviteLink.findUnique({
    where: { token },
    select: {
      isActive: true,
      conversation: { select: { id: true, name: true } },
    },
  });
  if (!link || !link.isActive)
    return NextResponse.json(
      { error: "Link mời không tồn tại hoặc đã hết hiệu lực" },
      { status: 404 },
    );

  const conversationId = link.conversation.id;

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (membership?.isAccepted)
    return NextResponse.json({ status: "already_member", conversationId });

  if (membership?.rejectedAt) {
    const remaining =
      membership.rejectedAt.getTime() + COOLDOWN_MS - Date.now();
    if (remaining > 0) {
      const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      return NextResponse.json(
        {
          error: `Bạn đã bị từ chối trước đó. Vui lòng thử lại sau ${days} ngày.`,
        },
        { status: 403 },
      );
    }
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profile: { select: { displayName: true } } },
    });
    const requesterName =
      requester?.profile?.displayName ??
      requester?.username ??
      "Một người dùng";
    const leaders = await prisma.conversationMember.findMany({
      where: { conversationId, isLeader: true, isAccepted: true },
      select: { userId: true },
    });

    await prisma.$transaction([
      prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: {
          isAccepted: false,
          origin: "REQUESTED",
          rejectedAt: null,
          hiddenAt: null,
        },
      }),
      prisma.notification.createMany({
        data: leaders.map((l) => ({
          recipientId: l.userId,
          actorId: userId,
          type: "GROUP_JOIN_REQUEST",
          message: `${requesterName} yêu cầu tham gia nhóm "${link.conversation.name}"`,
          conversationId,
        })),
      }),
    ]);
    return NextResponse.json({ status: "requested", conversationId });
  }

  if (membership && !membership.isAccepted && membership.origin === "INVITED") {
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isAccepted: true, hiddenAt: null },
    });
    return NextResponse.json({ status: "joined", conversationId });
  }

  if (
    membership &&
    !membership.isAccepted &&
    membership.origin === "REQUESTED"
  ) {
    return NextResponse.json({ status: "already_requested", conversationId });
  }

  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, profile: { select: { displayName: true } } },
  });
  const requesterName =
    requester?.profile?.displayName ?? requester?.username ?? "Một người dùng";

  const leaders = await prisma.conversationMember.findMany({
    where: { conversationId, isLeader: true, isAccepted: true },
    select: { userId: true },
  });

  await prisma.$transaction([
    prisma.conversationMember.create({
      data: {
        conversationId,
        userId,
        isAccepted: false,
        origin: "REQUESTED",
      },
    }),
    prisma.notification.createMany({
      data: leaders.map((l) => ({
        recipientId: l.userId,
        actorId: userId,
        type: "GROUP_JOIN_REQUEST",
        message: `${requesterName} yêu cầu tham gia nhóm "${link.conversation.name}"`,
        conversationId,
      })),
    }),
  ]);

  return NextResponse.json({ status: "requested", conversationId });
}
