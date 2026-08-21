import { prisma } from "@/lib/prisma";

const WINDOW_7D_MS = 7 * 24 * 60 * 60 * 1000;
const WINDOW_5M_MS = 5 * 60 * 1000;
const MAX_PER_7D = 5;

export type RateLimitIdentity = {
  userId?: string | null;
  contactEmail?: string | null;
  ipHash?: string | null;
};

export type RateLimitStatus =
  | { allowed: true; remaining: number; limit: number }
  | {
      allowed: false;
      remaining: number;
      limit: number;
      reason: "COOLDOWN" | "DAILY_LIMIT";
      retryAfterSeconds?: number;
      nextResetAt?: Date;
    };

function buildIdentityOr({ userId, contactEmail, ipHash }: RateLimitIdentity) {
  const or: Record<string, unknown>[] = [];
  if (userId) or.push({ userId });
  if (contactEmail)
    or.push({ contactEmail: contactEmail.toLowerCase(), userId: null });
  if (ipHash) or.push({ ipHash, userId: null });
  return or;
}

export async function getSupportRequestRateLimitStatus(
  identity: RateLimitIdentity,
): Promise<RateLimitStatus> {
  const or = buildIdentityOr(identity);
  if (or.length === 0) {
    return {
      allowed: false,
      remaining: 0,
      limit: MAX_PER_7D,
      reason: "DAILY_LIMIT",
    };
  }

  const now = Date.now();

  const [lastOne, windowRows] = await Promise.all([
    prisma.supportRequest.findFirst({
      where: { OR: or, createdAt: { gte: new Date(now - WINDOW_5M_MS) } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.supportRequest.findMany({
      where: { OR: or, createdAt: { gte: new Date(now - WINDOW_7D_MS) } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const remaining = Math.max(0, MAX_PER_7D - windowRows.length);

  if (lastOne) {
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((lastOne.createdAt.getTime() + WINDOW_5M_MS - now) / 1000),
    );
    return {
      allowed: false,
      remaining,
      limit: MAX_PER_7D,
      reason: "COOLDOWN",
      retryAfterSeconds,
    };
  }

  if (windowRows.length >= MAX_PER_7D) {
    const oldest = windowRows[0].createdAt;
    return {
      allowed: false,
      remaining: 0,
      limit: MAX_PER_7D,
      reason: "DAILY_LIMIT",
      nextResetAt: new Date(oldest.getTime() + WINDOW_7D_MS),
    };
  }

  return { allowed: true, remaining, limit: MAX_PER_7D };
}

export function hashIp(ip: string): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? ""))
    .digest("hex");
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}
