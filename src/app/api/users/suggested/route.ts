import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFriendRequestEligibility } from "@/lib/chat/friends";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    let excludeIds: string[] = [];
    let pendingReceivedMap: Record<string, string> = {};

    if (session?.user?.id) {
      const [sentRequests, receivedRequests] = await Promise.all([
        prisma.friendRequest.findMany({
          where: {
            senderId: session.user.id,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          select: { receiverId: true },
        }),
        prisma.friendRequest.findMany({
          where: {
            receiverId: session.user.id,
            status: "PENDING",
          },
          select: { senderId: true, id: true },
        }),
      ]);

      const sentIds = sentRequests.map((r) => r.receiverId);
      const receivedIds = receivedRequests.map((r) => r.senderId);
      excludeIds = [session.user.id, ...sentIds, ...receivedIds];

      for (const r of receivedRequests) {
        pendingReceivedMap[r.senderId] = r.id;
      }
    }

    const users = await prisma.user.findMany({
      where: {
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        profile: { isNot: null },
      },
      take: 10,
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            major: true,
            school: true,
          },
        },
        _count: { select: { followers: true } },
      },
    });

    const result = await Promise.all(
      users.map(async (u) => {
        const eligibility = session?.user?.id
          ? await getFriendRequestEligibility(session.user.id, u.id)
          : { canSendFriendRequest: true, friendRequestBlockReason: null };
        return {
          id: u.id,
          username: u.username,
          displayName: u.profile?.displayName ?? u.username,
          avatarUrl: u.profile?.avatarUrl ?? null,
          role:
            [u.profile?.major, u.profile?.school].filter(Boolean).join(" · ") ||
            "",
          followerCount: u._count.followers,
          friendStatus: "none" as const,
          incomingRequestId: pendingReceivedMap[u.id] ?? null,
          canSendFriendRequest: eligibility.canSendFriendRequest,
          friendRequestBlockReason: eligibility.friendRequestBlockReason,
        };
      }),
    );

    const sorted = result
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, 5);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("[/api/users/suggested]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
