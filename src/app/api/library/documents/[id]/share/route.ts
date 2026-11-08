import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShareRecipients } from "@/lib/chat/share-recipients";

const MAX_RECIPIENTS = 10;

async function getOrCreateDm(meId: string, otherId: string) {
  const dmKey = [meId, otherId].sort().join("_");
  const existing = await prisma.conversation.findUnique({
    where: { dmKey },
    select: { id: true },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        dmKey,
        members: { create: [{ userId: meId }, { userId: otherId }] },
      },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    const again = await prisma.conversation.findUnique({
      where: { dmKey },
      select: { id: true },
    });
    if (again) return again.id;
    throw e;
  }
}

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

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      type: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      hidden: true,
      uploaderId: true,
      post: { select: { visibility: true, hidden: true } },
    },
  });
  if (!doc || doc.hidden) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (
    doc.uploaderId !== meId &&
    doc.post &&
    (doc.post.visibility !== "PUBLIC" || doc.post.hidden)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligible = new Set((await getShareRecipients(meId)).map((r) => r.id));

  const ext = doc.type.toLowerCase();
  const name = doc.title.toLowerCase().endsWith(`.${ext}`)
    ? doc.title
    : `${doc.title}.${ext}`;
  const attachmentType =
    doc.type === "IMAGE" ? "IMAGE" : doc.type === "VIDEO" ? "VIDEO" : "DOCUMENT";

  const results: { userId: string; ok: boolean; reason?: string }[] = [];

  for (const userId of userIds) {
    if (!eligible.has(userId)) {
      results.push({ userId, ok: false, reason: "not_allowed" });
      continue;
    }
    try {
      const conversationId = await getOrCreateDm(meId, userId);
      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId,
            senderId: meId,
            attachments: {
              create: [
                {
                  url: doc.fileUrl,
                  key: `shared-doc:${doc.id}`,
                  name,
                  size: doc.fileSize,
                  type: attachmentType,
                  mimeType: doc.mimeType,
                },
              ],
            },
          },
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
      console.error("[share document] failed for", userId, e);
      results.push({ userId, ok: false, reason: "error" });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    results,
  });
}