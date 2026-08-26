import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSupportRequestCode } from "@/lib/support/code-generator";

const GRACE_DAYS = 7;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { note, notifyUser = true }: { note?: string; notifyUser?: boolean } =
    await req.json().catch(() => ({}));

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Không thể tự xóa chính mình" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true, scheduledDeleteAt: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );
  }
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Không thể xóa tài khoản quản trị viên" },
      { status: 400 },
    );
  }
  if (target.scheduledDeleteAt) {
    return NextResponse.json(
      { error: "Tài khoản này đã được lên lịch xóa" },
      { status: 409 },
    );
  }

  const trimmedNote = note?.trim() || undefined;
  const scheduledDeleteAt = new Date(Date.now() + GRACE_DAYS * 24 * 3600_000);
  const code = await generateSupportRequestCode();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { scheduledDeleteAt } });

      await tx.supportRequest.create({
        data: {
          code,
          userId: id,
          contactEmail: target.email.toLowerCase(),
          type: "ACCOUNT_DELETION",
          subject: "Tài khoản bị lên lịch xóa bởi quản trị viên",
          message:
            trimmedNote ??
            `Quản trị viên đã lên lịch xóa tài khoản này vào ${scheduledDeleteAt.toLocaleString("vi-VN")}.`,
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      });

      await tx.moderationAction.create({
        data: {
          type: "ACCOUNT_DELETION_SCHEDULED",
          adminId: session.user.id,
          targetUserId: id,
          note: trimmedNote,
          notifiedUser: notifyUser,
          flaggedUser: true,
        },
      });

      if (notifyUser) {
        await tx.notification.create({
          data: {
            recipientId: id,
            actorId: session.user.id,
            type: "ACCOUNT_DELETION_SCHEDULED",
            message: `Tài khoản của bạn sẽ bị xóa vĩnh viễn vào ${scheduledDeleteAt.toLocaleDateString("vi-VN")} theo quyết định của quản trị viên.${trimmedNote ? " Lý do: " + trimmedNote : ""}`,
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      scheduledDeleteAt: scheduledDeleteAt.toISOString(),
    });
  } catch (err) {
    console.error("[/api/admin/users/[id]/delete-request]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
