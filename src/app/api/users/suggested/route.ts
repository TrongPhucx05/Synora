import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedIds } from "@/lib/block/server";
import { getFriendRequestEligibility } from "@/lib/chat/friends";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user?.id;

    if (session?.user?.role === "ADMIN") return NextResponse.json([]);

    let excludeIds: string[] = [];

    if (me) {
      const [sent, received, blockedIds] = await Promise.all([
        prisma.friendRequest.findMany({
          where: { senderId: me, status: { in: ["PENDING", "ACCEPTED"] } },
          select: { receiverId: true },
        }),
        prisma.friendRequest.findMany({
          where: { receiverId: me, status: { in: ["PENDING", "ACCEPTED"] } },
          select: { senderId: true },
        }),
        getBlockedIds(me),
      ]);
      excludeIds = [
        me,
        ...sent.map((r) => r.receiverId),
        ...received.map((r) => r.senderId),
        ...blockedIds,
      ];
    }

    const users = await prisma.user.findMany({
      where: {
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
        profile: { isNot: null },
        role: { not: "ADMIN" },
        status: "ACTIVE",
      },
      orderBy: { followers: { _count: "desc" } },
      take: 20,
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
        const eligibility = me
          ? await getFriendRequestEligibility(me, u.id)
          : { canSendFriendRequest: true, friendRequestBlockReason: null };
        return {
          id: u.id,
          username: u.username,
          displayName: u.profile?.displayName ?? u.username,
          avatarUrl: u.profile?.avatarUrl ?? null,
          role: [u.profile?.major, u.profile?.school]
            .filter(Boolean)
            .join(" · "),
          followerCount: u._count.followers,
          friendStatus: "none" as const,
          incomingRequestId: null,
          canSendFriendRequest: eligibility.canSendFriendRequest,
          friendRequestBlockReason: eligibility.friendRequestBlockReason,
        };
      }),
    );

    return NextResponse.json(
      result.filter((u) => u.canSendFriendRequest).slice(0, 5),
    );
  } catch (error) {
    console.error("[/api/users/suggested]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
