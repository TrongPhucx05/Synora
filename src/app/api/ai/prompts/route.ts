import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";
import { getGemini } from "@/lib/ai/gemini";
import { AI_MODEL, MAX_SAVED_PROMPTS } from "@/lib/ai/config";
import { consumeQuota, refundQuota } from "@/lib/ai/usage";

const REFINE_SYSTEM =
  "Viết lại yêu cầu của người dùng thành một chỉ dẫn rõ ràng, ngắn gọn bằng tiếng Việt, " +
  "có thể dùng lại cho nhiều tài liệu khác nhau (không nhắc tên tài liệu cụ thể). " +
  "Chỉ trả về chỉ dẫn, không giải thích.";

export async function GET() {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const prompts = await prisma.aiSavedPrompt.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, template: true, useCount: true },
  });
  return NextResponse.json({ prompts });
}

export async function POST(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
  let template =
    typeof body.template === "string" ? body.template.trim().slice(0, 600) : "";
  if (!name || !template)
    return NextResponse.json({ error: "Thiếu tên hoặc nội dung" }, { status: 400 });

  const count = await prisma.aiSavedPrompt.count({ where: { userId } });
  if (count >= MAX_SAVED_PROMPTS)
    return NextResponse.json(
      { error: `Tối đa ${MAX_SAVED_PROMPTS} prompt đã lưu` },
      { status: 400 },
    );

  let refined = false;
  if (body.refine === true && (await consumeQuota(userId)).ok) {
    try {
      const r = await getGemini().models.generateContent({
        model: AI_MODEL,
        contents: [{ role: "user", parts: [{ text: template }] }],
        config: { systemInstruction: REFINE_SYSTEM, maxOutputTokens: 1024 },
      });
      const t = r.text?.trim();
      if (t) {
        template = t.slice(0, 600);
        refined = true;
      } else await refundQuota(userId);
    } catch {
      await refundQuota(userId).catch(() => {});
    }
  }

  const prompt = await prisma.aiSavedPrompt.create({
    data: { userId, name, template },
    select: { id: true, name: true, template: true, useCount: true },
  });
  return NextResponse.json({ prompt, refined }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== "string")
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  await prisma.aiSavedPrompt.updateMany({
    where: { id: body.id, userId: session!.user.id },
    data: { useCount: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  await prisma.aiSavedPrompt.deleteMany({
    where: { id, userId: session!.user.id },
  });
  return NextResponse.json({ ok: true });
}