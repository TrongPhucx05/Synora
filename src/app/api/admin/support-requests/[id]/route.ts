import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { supportRequestStatusUpdateEmail } from "@/lib/email/templates/support-request-lifecycle";
import type { SupportRequestStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: SupportRequestStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];
const TERMINAL_STATUSES = new Set<SupportRequestStatus>([
  "RESOLVED",
  "CLOSED",
  "REJECTED",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { reply, status } = await req.json().catch(() => ({}));

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Trạng thái không hợp lệ" },
      { status: 400 },
    );
  }

  const existing = await prisma.supportRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Không tìm thấy yêu cầu" },
      { status: 404 },
    );
  }
  if (TERMINAL_STATUSES.has(existing.status)) {
    return NextResponse.json(
      {
        error: "Yêu cầu này đã ở trạng thái kết thúc, không thể cập nhật thêm",
      },
      { status: 409 },
    );
  }

  const wasResolvedNow =
    existing.status !== "RESOLVED" && status === "RESOLVED";

  const [updated] = await prisma.$transaction([
    prisma.supportRequest.update({
      where: { id },
      data: {
        status,
        resolvedAt: TERMINAL_STATUSES.has(status)
          ? new Date()
          : existing.resolvedAt,
      },
    }),
    prisma.supportRequestReply.create({
      data: {
        supportRequestId: id,
        adminId: session.user.id,
        message: reply?.trim() ?? "",
        statusAtReply: status,
      },
    }),
  ]);

  if (existing.type === "BAN_APPEAL" && wasResolvedNow && existing.userId) {
    await prisma.conversation.updateMany({
      where: {
        isGroup: true,
        members: { some: { userId: existing.userId, isLeader: true } },
      },
      data: { leaderBanDeadline: null },
    });
  }

  const { subject: mailSubject, html } = supportRequestStatusUpdateEmail({
    code: updated.code,
    subject: updated.subject,
    status: updated.status,
    reply: reply?.trim() || undefined,
    updatedAt: updated.updatedAt,
  });
  const emailResult = await emailService.send({
    to: updated.contactEmail,
    subject: mailSubject,
    html,
  });
  if (emailResult.error) {
    console.error(
      "[admin support-requests PATCH] email send failed:",
      emailResult.error,
    );
  }

  if (updated.userId) {
    await prisma.notification.create({
      data: {
        recipientId: updated.userId,
        actorId: session.user.id,
        type: "SYSTEM",
        message: reply?.trim()
          ? `Yêu cầu hỗ trợ ${updated.code} đã được cập nhật: ${reply.trim()}`
          : `Yêu cầu hỗ trợ ${updated.code} đã được cập nhật trạng thái.`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
