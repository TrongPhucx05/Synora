import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";
import { MAX_DOC_CHARS_STORED } from "@/lib/ai/config";

const MAX_UPLOADS_PER_USER = 10;
const UPLOAD_TTL_MS = 7 * 86400_000;

export async function POST(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 150) : "";
  const text =
    typeof body?.text === "string"
      ? body.text.replace(/\u0000/g, "").trim().slice(0, MAX_DOC_CHARS_STORED)
      : "";
  if (!name || text.length < 30)
    return NextResponse.json({ error: "Không đọc được nội dung tệp" }, { status: 400 });

  await prisma.aiExtractedText.deleteMany({
    where: {
      sourceType: "UPLOAD",
      createdAt: { lt: new Date(Date.now() - UPLOAD_TTL_MS) },
    },
  });

  const mine = await prisma.aiExtractedText.findMany({
    where: { sourceType: "UPLOAD", sourceId: { startsWith: `${userId}.` } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (mine.length >= MAX_UPLOADS_PER_USER) {
    await prisma.aiExtractedText.deleteMany({
      where: {
        id: { in: mine.slice(0, mine.length - MAX_UPLOADS_PER_USER + 1).map((r) => r.id) },
      },
    });
  }

  const id = `${userId}.${crypto.randomUUID()}`;
  await prisma.aiExtractedText.create({
    data: { sourceType: "UPLOAD", sourceId: id, text },
  });
  return NextResponse.json({ id });
}