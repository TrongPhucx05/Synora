import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { generateSupportRequestCode } from "@/lib/support/code-generator";
import {
  supportRequestCreatedEmail,
  supportRequestStatusUpdateEmail,
} from "@/lib/email/templates/support-request-lifecycle";

const GRACE_DAYS = 7;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { scheduledDeleteAt: true },
  });
  return NextResponse.json({
    scheduledDeleteAt: user?.scheduledDeleteAt?.toISOString() ?? null,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { scheduledDeleteAt: true, email: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Không tìm thấy tài khoản" },
      { status: 404 },
    );
  }
  if (user.scheduledDeleteAt) {
    return NextResponse.json(
      { error: "Bạn đã có một yêu cầu xóa tài khoản đang chờ xử lý" },
      { status: 409 },
    );
  }

  const scheduledDeleteAt = new Date(Date.now() + GRACE_DAYS * 24 * 3600_000);
  const code = await generateSupportRequestCode();

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.supportRequest.create({
      data: {
        code,
        userId: session.user.id,
        contactEmail: user.email.toLowerCase(),
        type: "ACCOUNT_DELETION",
        subject: "Yêu cầu xóa tài khoản",
        message: `Người dùng yêu cầu xóa tài khoản. Tài khoản sẽ bị xóa vĩnh viễn vào ${scheduledDeleteAt.toLocaleString("vi-VN")} nếu không hủy.`,
      },
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { scheduledDeleteAt },
    });
    await tx.notification.create({
      data: {
        recipientId: session.user.id,
        type: "ACCOUNT_DELETION_SCHEDULED",
        message: `Tài khoản của bạn sẽ bị xóa vĩnh viễn vào ${scheduledDeleteAt.toLocaleDateString("vi-VN")} nếu bạn không hủy yêu cầu.`,
      },
    });
    return request;
  });

  const { subject, html } = supportRequestCreatedEmail({
    code: created.code,
    type: created.type,
    subject: created.subject,
    message: created.message,
    createdAt: created.createdAt,
  });
  const emailResult = await emailService.send({
    to: user.email,
    subject,
    html,
  });
  if (emailResult.error) {
    console.error("[account/delete-request POST]", emailResult.error);
  }

  return NextResponse.json({
    ok: true,
    scheduledDeleteAt: scheduledDeleteAt.toISOString(),
    code: created.code,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { scheduledDeleteAt: true, email: true },
  });
  if (!user?.scheduledDeleteAt) {
    return NextResponse.json(
      { error: "Không có yêu cầu xóa tài khoản nào đang chờ" },
      { status: 409 },
    );
  }

  const pendingRequest = await prisma.supportRequest.findFirst({
    where: {
      userId: session.user.id,
      type: "ACCOUNT_DELETION",
      status: { not: "CLOSED" },
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { scheduledDeleteAt: null },
    });
    if (pendingRequest) {
      await tx.supportRequest.update({
        where: { id: pendingRequest.id },
        data: { status: "CLOSED", resolvedAt: new Date() },
      });
      await tx.supportRequestReply.create({
        data: {
          supportRequestId: pendingRequest.id,
          message: "Người dùng đã tự hủy yêu cầu xóa tài khoản.",
          statusAtReply: "CLOSED",
        },
      });
    }
    await tx.notification.create({
      data: {
        recipientId: session.user.id,
        type: "ACCOUNT_DELETION_CANCELLED",
        message: "Bạn đã hủy yêu cầu xóa tài khoản.",
      },
    });
  });

  if (pendingRequest) {
    const { subject, html } = supportRequestStatusUpdateEmail({
      code: pendingRequest.code,
      subject: pendingRequest.subject,
      status: "CLOSED",
      reply: "Bạn đã hủy yêu cầu xóa tài khoản.",
      updatedAt: new Date(),
    });
    const emailResult = await emailService.send({
      to: user.email,
      subject,
      html,
    });
    if (emailResult.error) {
      console.error("[account/delete-request DELETE]", emailResult.error);
    }
  }

  return NextResponse.json({ ok: true });
}
