import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { generateSupportRequestCode } from "@/lib/support/code-generator";
import { generateTrackingToken } from "@/lib/support/tracking-token";
import {
  getSupportRequestRateLimitStatus,
  getClientIp,
  hashIp,
} from "@/lib/support/rate-limit";
import { supportRequestCreatedEmail } from "@/lib/email/templates/support-request-lifecycle";
import type { SupportRequestType } from "@/generated/prisma/enums";

const VALID_TYPES: SupportRequestType[] = [
  "ACCOUNT_SUPPORT",
  "BUG_REPORT",
  "FEEDBACK",
  "BAN_APPEAL",
  "ACCOUNT_DELETION",
  "OTHER",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 10;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const {
    subject,
    message,
    type,
    contactEmail: contactEmailInput,
    guestName,
  } = body;

  const requestType: SupportRequestType = VALID_TYPES.includes(type)
    ? type
    : "ACCOUNT_SUPPORT";

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin" },
      { status: 400 },
    );
  }
  if (subject.trim().length > 200) {
    return NextResponse.json(
      { error: "Tiêu đề quá dài (tối đa 200 ký tự)" },
      { status: 400 },
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { error: "Nội dung quá dài (tối đa 2000 ký tự)" },
      { status: 400 },
    );
  }

  let userId: string | null = null;
  let contactEmail: string;

  if (session?.user?.id) {
    userId = session.user.id;
    const trimmed = contactEmailInput?.trim();
    if (trimmed) {
      if (!EMAIL_RE.test(trimmed)) {
        return NextResponse.json(
          { error: "Email liên hệ không hợp lệ" },
          { status: 400 },
        );
      }
      contactEmail = trimmed.toLowerCase();
    } else if (session.user.email) {
      contactEmail = session.user.email.toLowerCase();
    } else {
      return NextResponse.json(
        { error: "Tài khoản chưa có email, vui lòng nhập email liên hệ" },
        { status: 400 },
      );
    }
  } else {
    const trimmed = contactEmailInput?.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      return NextResponse.json(
        { error: "Vui lòng nhập email liên hệ hợp lệ" },
        { status: 400 },
      );
    }
    contactEmail = trimmed.toLowerCase();
  }

  const ip = getClientIp(req);
  const ipHash = ip ? hashIp(ip) : null;

  const rateStatus = await getSupportRequestRateLimitStatus({
    userId,
    contactEmail: userId ? null : contactEmail,
    ipHash: userId ? null : ipHash,
  });

  if (!rateStatus.allowed) {
    if (rateStatus.reason === "COOLDOWN") {
      const mins = Math.max(
        1,
        Math.ceil((rateStatus.retryAfterSeconds ?? 0) / 60),
      );
      return NextResponse.json(
        {
          error: `Bạn vừa gửi một yêu cầu. Vui lòng đợi khoảng ${mins} phút trước khi gửi yêu cầu tiếp theo.`,
          reason: rateStatus.reason,
          retryAfterSeconds: rateStatus.retryAfterSeconds,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Bạn đã sử dụng hết 5 lượt yêu cầu trong 7 ngày. Vui lòng quay lại sau.",
        reason: rateStatus.reason,
        nextResetAt: rateStatus.nextResetAt,
      },
      { status: 429 },
    );
  }

  const code = await generateSupportRequestCode();

  let trackingTokenHash: string | undefined;
  let rawTrackingToken: string | undefined;
  if (!userId) {
    const { rawToken, hashedToken } = generateTrackingToken();
    trackingTokenHash = hashedToken;
    rawTrackingToken = rawToken;
  }

  const created = await prisma.supportRequest.create({
    data: {
      userId,
      contactEmail,
      guestName: userId ? undefined : guestName?.trim() || undefined,
      type: requestType,
      subject: subject.trim(),
      message: message.trim(),
      trackingTokenHash,
      ipHash,
    },
  });

  if (userId) {
    await prisma.notification.create({
      data: {
        recipientId: userId,
        type: "SUPPORT_REQUEST_SUBMITTED",
        message: `Yêu cầu hỗ trợ ${created.code} của bạn đã được gửi và đang chờ xử lý.`,
      },
    });
  }

  const trackingUrl = rawTrackingToken
    ? `${process.env.NEXTAUTH_URL}/support/track?code=${created.code}&token=${rawTrackingToken}`
    : undefined;

  const { subject: mailSubject, html } = supportRequestCreatedEmail({
    code: created.code,
    type: created.type,
    subject: created.subject,
    message: created.message,
    createdAt: created.createdAt,
    trackingUrl,
  });

  const emailResult = await emailService.send({
    to: contactEmail,
    subject: mailSubject,
    html,
  });
  if (emailResult.error) {
    console.error(
      "[support/requests POST] email send failed:",
      emailResult.error,
    );
  }

  return NextResponse.json({
    ok: true,
    code: created.code,
    status: created.status,
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [totalCount, items] = await Promise.all([
    prisma.supportRequest.count({ where: { userId: session.user.id } }),
    prisma.supportRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      subject: r.subject,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  });
}
