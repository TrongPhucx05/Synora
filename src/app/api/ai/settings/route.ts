import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertActiveSession } from "@/lib/auth/assert-active";
import { parseAiSettings, type AiSettings } from "@/lib/ai/types";
import { USER_DAILY_LIMIT } from "@/lib/ai/config";
import { getRemaining } from "@/lib/ai/usage";
import {
  MAX_MEMORY_NOTES,
  MAX_MEMORY_NOTE_CHARS,
  parseMemory,
} from "@/lib/ai/memory";

export async function GET() {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { aiSettings: true, aiMemory: true },
  });
  return NextResponse.json({
    settings: parseAiSettings(profile?.aiSettings),
    memory: parseMemory(profile?.aiMemory),
    remaining: await getRemaining(userId),
    limit: USER_DAILY_LIMIT,
  });
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;
  const userId = session!.user.id;
  const body = await req.json().catch(() => ({}));

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { aiSettings: true, aiMemory: true },
  });
  const next = parseAiSettings({
    ...parseAiSettings(profile?.aiSettings),
    ...body,
  });

  const data: { aiSettings: AiSettings; aiMemory?: string | null } = {
    aiSettings: next,
  };
  let memory = parseMemory(profile?.aiMemory);
  if (Array.isArray(body.memory)) {
    memory = body.memory
      .filter((n: unknown): n is string => typeof n === "string")
      .map((n: string) => n.replace(/\s+/g, " ").trim().slice(0, MAX_MEMORY_NOTE_CHARS))
      .filter(Boolean)
      .slice(0, MAX_MEMORY_NOTES);
    data.aiMemory = memory.length ? memory.join("\n") : null;
  }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return NextResponse.json({ settings: next, memory });
}