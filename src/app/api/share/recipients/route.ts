import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShareRecipients } from "@/lib/chat/share-recipients";

export async function GET() {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id;
  if (!meId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "ADMIN") return NextResponse.json({ users: [] });

  const list = await getShareRecipients(meId);
  return NextResponse.json({
    users: list.map(({ lastMessageAt: _omit, ...u }) => u),
  });
}