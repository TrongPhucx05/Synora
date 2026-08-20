import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status") ?? "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const where: any = {
    isGroup: true,
    ...(status === "ACTIVE" && { isDisabled: false }),
    ...(status === "DISABLED" && { isDisabled: true }),
    ...(query && { name: { contains: query, mode: "insensitive" } }),
  };

  const [totalCount, groups] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        isDisabled: true,
        createdAt: true,
        members: {
          where: { isLeader: true },
          take: 1,
          select: {
            user: {
              select: {
                username: true,
                profile: { select: { displayName: true } },
              },
            },
          },
        },
        _count: { select: { members: true } },
        reports: { where: { status: "PENDING" }, select: { id: true } },
      },
    }),
  ]);

  const acceptedCounts = groups.length
    ? await prisma.conversationMember.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: groups.map((g) => g.id) },
          isAccepted: true,
        },
        _count: { _all: true },
      })
    : [];
  const acceptedMap = new Map(
    acceptedCounts.map((c) => [c.conversationId, c._count._all]),
  );

  const items = groups.map((g) => {
    const leader = g.members[0]?.user;
    return {
      id: g.id,
      name: g.name ?? "Nhóm chat",
      avatarUrl: g.avatarUrl,
      leaderName: leader?.profile?.displayName ?? leader?.username ?? "—",
      leaderUsername: leader?.username ?? "",
      memberCount: g._count.members,
      acceptedMemberCount: acceptedMap.get(g.id) ?? 0,
      status: g.isDisabled ? "DISABLED" : "ACTIVE",
      reportCount: g.reports.length,
      createdAt: g.createdAt.toLocaleDateString("vi-VN"),
    };
  });

  return NextResponse.json({
    items,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  });
}
