import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashTrackingToken } from "@/lib/support/tracking-token";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();
  const token = searchParams.get("token")?.trim();

  if (!code || (!email && !token)) {
    return NextResponse.json(
      { error: "Thiếu thông tin tra cứu" },
      { status: 400 },
    );
  }

  const notFound = () =>
    NextResponse.json(
      { error: "Không tìm thấy yêu cầu hoặc thông tin không khớp" },
      { status: 404 },
    );

  const request = await prisma.supportRequest.findUnique({
    where: { code },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!request) return notFound();

  if (token) {
    if (
      !request.trackingTokenHash ||
      !safeEqual(hashTrackingToken(token), request.trackingTokenHash)
    ) {
      return notFound();
    }
  } else if (email) {
    if (request.contactEmail.toLowerCase() !== email) return notFound();
  } else {
    return notFound();
  }

  return NextResponse.json({
    code: request.code,
    type: request.type,
    subject: request.subject,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    replies: request.replies.map((r) => ({
      message: r.message,
      statusAtReply: r.statusAtReply,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
