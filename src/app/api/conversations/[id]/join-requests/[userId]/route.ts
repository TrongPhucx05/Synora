import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requesterLeaderId = session.user.id;
  const { id: conversationId, userId: targetUserId } = await params;

  const leaderMembership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: requesterLeaderId },
    },
  });
  if (!leaderMembership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!leaderMembership.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới có thể duyệt yêu cầu" },
      { status: 403 },
    );

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: "approve" | "reject" };
  if (action !== "approve" && action !== "reject")
    return NextResponse.json(
      { error: "Hành động không hợp lệ" },
      { status: 400 },
    );

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { name: true },
  });

  const stillPendingWhere = {
    conversationId,
    userId: targetUserId,
    isAccepted: false,
    origin: "REQUESTED" as const,
  };

  if (action === "approve") {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true, profile: { select: { displayName: true } } },
    });
    const targetName =
      targetUser?.profile?.displayName ??
      targetUser?.username ??
      "Thành viên mới";

    const { count } = await prisma.conversationMember.updateMany({
      where: stillPendingWhere,
      data: { isAccepted: true },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: "Yêu cầu này đã được xử lý trước đó" },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: requesterLeaderId,
          content: `${targetName} đã tham gia nhóm`,
          status: "SENT",
          isSystemMessage: true,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      prisma.notification.create({
        data: {
          recipientId: targetUserId,
          actorId: requesterLeaderId,
          type: "GROUP_JOIN_APPROVED",
          message: `Yêu cầu tham gia nhóm "${conversation?.name}" của bạn đã được chấp nhận`,
          conversationId,
        },
      }),
    ]);

    return NextResponse.json({ approved: true });
  }

  const { count } = await prisma.conversationMember.deleteMany({
    where: stillPendingWhere,
  });

  if (count === 0) {
    return NextResponse.json(
      { error: "Yêu cầu này đã được xử lý trước đó" },
      { status: 409 },
    );
  }

  await prisma.notification.create({
    data: {
      recipientId: targetUserId,
      actorId: requesterLeaderId,
      type: "GROUP_JOIN_REJECTED",
      message: `Yêu cầu tham gia nhóm "${conversation?.name}" của bạn đã bị từ chối`,
    },
  });

  return NextResponse.json({ rejected: true });
}
