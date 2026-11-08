import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShareRecipients } from "@/lib/chat/share-recipients";
import { getOrCreateDm } from "@/lib/chat/share-message";

const MAX_RECIPIENTS = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const userIds: string[] = Array.isArray(body?.userIds)
    ? Array.from(
        new Set<string>(
          body.userIds.filter((x: unknown) => typeof x === "string"),
        ),
      ).filter((x) => x !== meId)
    : [];
  if (userIds.length === 0 || userIds.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: "Invalid recipients" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: { role: true, status: true },
  });
  if (!me || me.role === "ADMIN" || me.status !== "ACTIVE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, authorId: true, visibility: true, hidden: true },
  });
  if (!post || post.hidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligible = new Set((await getShareRecipients(meId)).map((r) => r.id));

  const authorBlocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: post.authorId, blockedId: { in: userIds } },
        { blockerId: { in: userIds }, blockedId: post.authorId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
  const blockedWithAuthor = new Set(
    authorBlocks.map((b) =>
      b.blockerId === post.authorId ? b.blockedId : b.blockerId,
    ),
  );

  const url = `${new URL(req.url).origin}/feed?post=${post.id}`;
  const results: { userId: string; ok: boolean; reason?: string }[] = [];

  for (const userId of userIds) {
    if (!eligible.has(userId) || blockedWithAuthor.has(userId)) {
      results.push({ userId, ok: false, reason: "not_allowed" });
      continue;
    }
    try {
      const conversationId = await getOrCreateDm(meId, userId);
      await prisma.$transaction([
        prisma.message.create({
          data: { conversationId, senderId: meId, content: url },
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        }),
        prisma.conversationMember.updateMany({
          where: { conversationId },
          data: { hiddenAt: null },
        }),
      ]);
      results.push({ userId, ok: true });
    } catch (e) {
      console.error("[share post] failed for", userId, e);
      results.push({ userId, ok: false, reason: "error" });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    results,
  });
}