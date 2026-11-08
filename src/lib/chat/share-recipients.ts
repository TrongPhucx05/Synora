import { prisma } from "@/lib/prisma";

export interface ShareRecipient {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFriend: boolean;
  isPending: boolean;
  conversationId: string | null;
  lastMessageAt: Date | null;
}

export async function getShareRecipients(
  meId: string,
): Promise<ShareRecipient[]> {
  const [friendRows, memberships] = await Promise.all([
    prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: meId }, { receiverId: meId }],
      },
      select: { senderId: true, receiverId: true },
    }),
    prisma.conversationMember.findMany({
      where: {
        userId: meId,
        isAccepted: true,
        conversation: { isGroup: false, isDisabled: false },
      },
      select: {
        conversation: {
          select: {
            id: true,
            lastMessageAt: true,
            members: {
              select: { userId: true, isAccepted: true, rejectedAt: true },
            },
          },
        },
      },
    }),
  ]);

  const candidates = new Map<
    string,
    {
      conversationId: string | null;
      lastMessageAt: Date | null;
      isFriend: boolean;
      isPending: boolean;
    }
  >();

  for (const f of friendRows) {
    const otherId = f.senderId === meId ? f.receiverId : f.senderId;
    candidates.set(otherId, {
      conversationId: null,
      lastMessageAt: null,
      isFriend: true,
      isPending: false,
    });
  }

  for (const m of memberships) {
    const other = m.conversation.members.find((x) => x.userId !== meId);
    if (!other || other.rejectedAt) continue;
    const prev = candidates.get(other.userId);
    candidates.set(other.userId, {
      conversationId: m.conversation.id,
      lastMessageAt: m.conversation.lastMessageAt,
      isFriend: prev?.isFriend ?? false,
      isPending: !other.isAccepted,
    });
  }

  candidates.delete(meId);
  if (candidates.size === 0) return [];

  const ids = [...candidates.keys()];
  const [blocks, users] = await Promise.all([
    prisma.block.findMany({
      where: {
        OR: [
          { blockerId: meId, blockedId: { in: ids } },
          { blockerId: { in: ids }, blockedId: meId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.user.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      select: {
        id: true,
        username: true,
        profile: { select: { displayName: true, avatarUrl: true } },
      },
    }),
  ]);

  const blocked = new Set(
    blocks.map((b) => (b.blockerId === meId ? b.blockedId : b.blockerId)),
  );

  return users
    .filter((u) => !blocked.has(u.id))
    .map((u) => {
      const c = candidates.get(u.id)!;
      return {
        id: u.id,
        username: u.username,
        name: u.profile?.displayName ?? u.username,
        avatarUrl: u.profile?.avatarUrl ?? null,
        isFriend: c.isFriend,
        isPending: c.isPending,
        conversationId: c.conversationId,
        lastMessageAt: c.lastMessageAt,
      };
    })
    .sort((a, b) => {
      const ta = a.lastMessageAt?.getTime() ?? 0;
      const tb = b.lastMessageAt?.getTime() ?? 0;
      return tb - ta || a.name.localeCompare(b.name);
    });
}