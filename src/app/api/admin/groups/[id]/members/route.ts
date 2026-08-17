import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;

  const members = await prisma.conversationMember.findMany({
    where: { conversationId: id },
    orderBy: [
      { isLeader: "desc" },
      { isAccepted: "desc" },
      { joinedAt: "asc" },
    ],
    select: {
      isLeader: true,
      isAccepted: true,
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

  const result = members.map((m) => ({
    userId: m.user.id,
    username: m.user.username,
    displayName: m.user.profile?.displayName ?? m.user.username,
    avatarUrl: m.user.profile?.avatarUrl ?? null,
    isLeader: m.isLeader,
    isAccepted: m.isAccepted,
    joinedAt: m.joinedAt.toLocaleDateString("vi-VN"),
  }));

  return NextResponse.json(result);
}
