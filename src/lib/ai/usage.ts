import { prisma } from "@/lib/prisma";
import { GLOBAL_DAILY_LIMIT, USER_DAILY_LIMIT } from "./config";

function today() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

async function bump(scope: string) {
  const day = today();
  const row = await prisma.aiUsage.upsert({
    where: { scope_day: { scope, day } },
    create: { scope, day, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return row.count;
}

export async function consumeQuota(
  userId: string,
): Promise<
  { ok: true; remaining: number } | { ok: false; reason: "GLOBAL" | "USER" }
> {
  if ((await bump("global")) > GLOBAL_DAILY_LIMIT)
    return { ok: false, reason: "GLOBAL" };
  const used = await bump(`u:${userId}`);
  if (used > USER_DAILY_LIMIT) return { ok: false, reason: "USER" };
  return { ok: true, remaining: USER_DAILY_LIMIT - used };
}

export async function refundQuota(userId: string) {
  await prisma.aiUsage.updateMany({
    where: { scope: { in: ["global", `u:${userId}`] }, day: today(), count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

export async function getRemaining(userId: string) {
  const row = await prisma.aiUsage.findUnique({
    where: { scope_day: { scope: `u:${userId}`, day: today() } },
    select: { count: true },
  });
  return Math.max(0, USER_DAILY_LIMIT - (row?.count ?? 0));
}