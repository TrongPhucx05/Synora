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
  if (!membership.isLeader)
    return NextResponse.json(
      { error: "Chỉ trưởng nhóm mới xem được yêu cầu tham gia" },
      { status: 403 },
    );

  const requests = await prisma.conversationMember.findMany({
    where: { conversationId, isAccepted: false, origin: "REQUESTED", rejectedAt: null },
    orderBy: { joinedAt: "desc" },
    select: {
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

  return NextResponse.json(
    requests.map((r) => ({
      userId: r.user.id,
      username: r.user.username,
      displayName: r.user.profile?.displayName ?? r.user.username,
      avatarUrl: r.user.profile?.avatarUrl ?? null,
      requestedAt: r.joinedAt,
    })),
  );
}