import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const { id } = await params;

  const conv = await prisma.aiConversation.findFirst({
    where: { id, userId: session!.user.id },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 60,
        select: { id: true, role: true, content: true },
      },
    },
  });
  if (!conv)
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json({
    conversationId: conv.id,
    messages: [...conv.messages].reverse(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const { id } = await params;
  await prisma.aiConversation.deleteMany({
    where: { id, userId: session!.user.id },
  });
  return NextResponse.json({ ok: true });
}