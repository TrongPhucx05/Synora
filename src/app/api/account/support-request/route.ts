import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { supportRequestReceivedEmail } from "@/lib/email/templates/support-request-received";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { subject, message, type } = await req.json().catch(() => ({}));
  const requestType = type === "BAN_APPEAL" ? "BAN_APPEAL" : "GENERAL";

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin" },
      { status: 400 },
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { error: "Nội dung quá dài (tối đa 2000 ký tự)" },
      { status: 400 },
    );
  }

  const recentCount = await prisma.supportRequest.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
    },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Bạn đã gửi quá nhiều yêu cầu trong 24 giờ qua" },
      { status: 429 },
    );
  }

  const created = await prisma.supportRequest.create({
    data: {
      userId: session.user.id,
      subject: subject.trim(),
      message: message.trim(),
      type: requestType,
    },
  });

  if (requestType === "GENERAL") {
    await prisma.notification.create({
      data: {
        recipientId: session.user.id,
        type: "SUPPORT_REQUEST_SUBMITTED",
        message: "Yêu cầu hỗ trợ của bạn đã được gửi và đang chờ xử lý.",
      },
    });
  } else {
    if (!session.user.email) {
      return NextResponse.json(
        { error: "Tài khoản của bạn chưa có email để gửi xác nhận" },
        { status: 400 },
      );
    }
    const { subject: mailSubject, html } = supportRequestReceivedEmail(
      created.subject,
    );
    await emailService.send({
      to: session.user.email,
      subject: mailSubject,
      html,
    });
  }

  return NextResponse.json({ ok: true });
}
