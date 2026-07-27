import { prisma } from "@/lib/prisma";

export async function areFriends(userIdA: string, userIdB: string) {
  const accepted = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userIdA, receiverId: userIdB },
        { senderId: userIdB, receiverId: userIdA },
      ],
    },
    select: { id: true },
  });
  return !!accepted;
}

export async function hasMutualFriend(userIdA: string, userIdB: string) {
  const [rowsA, rowsB] = await Promise.all([
    prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userIdA }, { receiverId: userIdA }],
      },
      select: { senderId: true, receiverId: true },
    }),
    prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userIdB }, { receiverId: userIdB }],
      },
      select: { senderId: true, receiverId: true },
    }),
  ]);
  const friendsA = new Set(
    rowsA.map((r) => (r.senderId === userIdA ? r.receiverId : r.senderId)),
  );
  const friendsB = new Set(
    rowsB.map((r) => (r.senderId === userIdB ? r.receiverId : r.senderId)),
  );
  for (const id of friendsA) if (friendsB.has(id)) return true;
  return false;
}

export type FriendRequestBlockReason = "NOBODY" | "NO_MUTUAL_FRIEND" | null;

export async function getFriendRequestEligibility(
  viewerId: string,
  targetId: string,
): Promise<{
  canSendFriendRequest: boolean;
  friendRequestBlockReason: FriendRequestBlockReason;
}> {
  if (viewerId === targetId) {
    return { canSendFriendRequest: false, friendRequestBlockReason: null };
  }
  const targetProfile = await prisma.profile.findUnique({
    where: { userId: targetId },
    select: { friendRequestPermission: true },
  });
  const permission = targetProfile?.friendRequestPermission ?? "EVERYONE";

  if (permission === "NOBODY") {
    return { canSendFriendRequest: false, friendRequestBlockReason: "NOBODY" };
  }
  if (permission === "FRIENDS_OF_FRIENDS") {
    const mutual = await hasMutualFriend(viewerId, targetId);
    return {
      canSendFriendRequest: mutual,
      friendRequestBlockReason: mutual ? null : "NO_MUTUAL_FRIEND",
    };
  }
  return { canSendFriendRequest: true, friendRequestBlockReason: null };
}