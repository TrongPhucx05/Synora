import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";
import { HISTORY_RETENTION_DAYS } from "@/lib/ai/config";

export async function GET() {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;

  await prisma.aiConversation.deleteMany({
    where: {
      userId,
      updatedAt: { lt: new Date(Date.now() - HISTORY_RETENTION_DAYS * 86400_000) },
    },
  });

  const conv = await prisma.aiConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, role: true, content: true },
      },
    },
  });

  return NextResponse.json({
    conversationId: conv?.id ?? null,
    messages: conv ? [...conv.messages].reverse() : [],
  });
}

export async function DELETE() {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  await prisma.aiConversation.deleteMany({ where: { userId: session!.user.id } });
  return NextResponse.json({ ok: true });
}