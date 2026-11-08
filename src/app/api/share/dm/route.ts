import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShareRecipients } from "@/lib/chat/share-recipients";
import { getOrCreateDm } from "@/lib/chat/share-message";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : null;
  if (!userId || userId === meId)
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: { role: true, status: true },
  });
  if (!me || me.role === "ADMIN" || me.status !== "ACTIVE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const eligible = (await getShareRecipients(meId)).some((r) => r.id === userId);
  if (!eligible)
    return NextResponse.json(
      { error: "Không thể gửi tin nhắn cho người này" },
      { status: 403 },
    );

  const conversationId = await getOrCreateDm(meId, userId);
  await prisma.conversationMember.updateMany({
    where: { conversationId },
    data: { hiddenAt: null },
  });
  return NextResponse.json({ conversationId });
}