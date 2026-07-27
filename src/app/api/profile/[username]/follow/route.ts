import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlockedEitherWay } from "@/lib/block/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target)
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );
  if (target.id === session.user.id)
    return NextResponse.json({ error: "Không thể tự follow" }, { status: 400 });

  const blocked = await isBlockedEitherWay(session.user.id, target.id);
  if (blocked) {
    return NextResponse.json(
      { error: "Không thể gửi lời mời kết bạn cho người dùng này" },
      { status: 403 },
    );
  }

  const senderId = session.user.id;
  const receiverId = target.id;

  return await prisma.$transaction(async (tx) => {
    async function hasMutualFriend(a: string, b: string) {
      const [rowsA, rowsB] = await Promise.all([
        tx.friendRequest.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: a }, { receiverId: a }],
          },
          select: { senderId: true, receiverId: true },
        }),
        tx.friendRequest.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: b }, { receiverId: b }],
          },
          select: { senderId: true, receiverId: true },
        }),
      ]);
      const friendsA = new Set(
        rowsA.map((r) => (r.senderId === a ? r.receiverId : r.senderId)),
      );
      const friendsB = new Set(
        rowsB.map((r) => (r.senderId === b ? r.receiverId : r.senderId)),
      );
      for (const id of friendsA) if (friendsB.has(id)) return true;
      return false;
    }

    const existingRequest = await tx.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (existingRequest) {
      if (existingRequest.status === "ACCEPTED") {
        await tx.friendRequest.delete({ where: { id: existingRequest.id } });
        await tx.friendRequest.deleteMany({
          where: { senderId: receiverId, receiverId: senderId },
        });
        await tx.follow.deleteMany({
          where: {
            OR: [
              { followerId: senderId, followingId: receiverId },
              { followerId: receiverId, followingId: senderId },
            ],
          },
        });
        return NextResponse.json({ status: "none" });
      }
      await tx.friendRequest.delete({ where: { id: existingRequest.id } });
      await tx.follow.deleteMany({
        where: { followerId: senderId, followingId: receiverId },
      });
      return NextResponse.json({ status: "none" });
    }

    const reverseRequest = await tx.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: receiverId, receiverId: senderId },
      },
    });

    if (reverseRequest?.status === "ACCEPTED") {
      await tx.friendRequest.delete({ where: { id: reverseRequest.id } });
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: senderId, followingId: receiverId },
            { followerId: receiverId, followingId: senderId },
          ],
        },
      });
      return NextResponse.json({ status: "none" });
    }

    if (reverseRequest?.status === "PENDING") {
      await tx.friendRequest.update({
        where: { id: reverseRequest.id },
        data: { status: "ACCEPTED" },
      });
      await tx.follow.deleteMany({
        where: { followerId: receiverId, followingId: senderId },
      });

      await tx.notification.create({
        data: {
          recipientId: receiverId,
          actorId: senderId,
          type: "FRIEND_ACCEPT",
        },
      });

      return NextResponse.json({ status: "friends" });
    }

    const targetProfile = await tx.profile.findUnique({
      where: { userId: receiverId },
      select: { friendRequestPermission: true },
    });
    const permission = targetProfile?.friendRequestPermission ?? "EVERYONE";

    if (permission === "NOBODY") {
      return NextResponse.json(
        { error: "Người này không nhận lời mời kết bạn" },
        { status: 403 },
      );
    }
    if (permission === "FRIENDS_OF_FRIENDS") {
      const mutual = await hasMutualFriend(senderId, receiverId);
      if (!mutual) {
        return NextResponse.json(
          {
            error: "Bạn cần có bạn chung với người này để gửi lời mời kết bạn",
          },
          { status: 403 },
        );
      }
    }

    await tx.friendRequest.create({
      data: { senderId, receiverId, status: "PENDING" },
    });
    await tx.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: senderId,
          followingId: receiverId,
        },
      },
      create: { followerId: senderId, followingId: receiverId },
      update: {},
    });

    await tx.notification.create({
      data: {
        recipientId: receiverId,
        actorId: senderId,
        type: "FRIEND_REQUEST",
      },
    });

    return NextResponse.json({ status: "pending" });
  });
}
