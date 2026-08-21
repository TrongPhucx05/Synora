import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSupportRequestRateLimitStatus,
  getClientIp,
  hashIp,
} from "@/lib/support/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase() || null;

  const ip = getClientIp(req);
  const ipHash = ip ? hashIp(ip) : null;

  const status = await getSupportRequestRateLimitStatus({
    userId: session?.user?.id ?? null,
    contactEmail: session?.user?.id ? null : email,
    ipHash: session?.user?.id ? null : ipHash,
  });

  return NextResponse.json(status);
}
