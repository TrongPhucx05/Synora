import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";
import { HISTORY_RETENTION_DAYS } from "@/lib/ai/config";

function makeSnippet(content: string, q: string) {
  const i = content.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, i - 30);
  const text = content.slice(start, start + 110).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + text + (start + 110 < content.length ? "…" : "");
}

export async function GET(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);

  await prisma.aiConversation.deleteMany({
    where: {
      userId,
      updatedAt: { lt: new Date(Date.now() - HISTORY_RETENTION_DAYS * 86400_000) },
    },
  });

  if (!q) {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, updatedAt: true },
    });
    return NextResponse.json({
      conversations: conversations.map((c) => ({ ...c, snippet: null })),
    });
  }

  const convs = await prisma.aiConversation.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { messages: { some: { content: { contains: q, mode: "insensitive" } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, updatedAt: true },
  });

  const hits = convs.length
    ? await prisma.aiMessage.findMany({
        where: {
          conversationId: { in: convs.map((c) => c.id) },
          content: { contains: q, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { conversationId: true, content: true },
      })
    : [];

  const snippets = new Map<string, string>();
  for (const h of hits) {
    if (!snippets.has(h.conversationId))
      snippets.set(h.conversationId, makeSnippet(h.content, q));
  }

  return NextResponse.json({
    conversations: convs.map((c) => ({ ...c, snippet: snippets.get(c.id) ?? null })),
  });
}