import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { scheduledDeleteAt: true },
  });
  if (!target?.scheduledDeleteAt) {
    return NextResponse.json(
      { error: "Tài khoản này không có lịch xóa nào" },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { scheduledDeleteAt: null },
      });

      const pendingRequest = await tx.supportRequest.findFirst({
        where: {
          userId: id,
          type: "ACCOUNT_DELETION",
          status: { not: "CLOSED" },
        },
        orderBy: { createdAt: "desc" },
      });
      if (pendingRequest) {
        await tx.supportRequest.update({
          where: { id: pendingRequest.id },
          data: { status: "CLOSED", resolvedAt: new Date() },
        });
        await tx.supportRequestReply.create({
          data: {
            supportRequestId: pendingRequest.id,
            adminId: session.user.id,
            message: "Quản trị viên đã hủy lịch xóa tài khoản.",
            statusAtReply: "CLOSED",
          },
        });
      }

      await tx.moderationAction.create({
        data: {
          type: "ACCOUNT_DELETION_CANCELLED",
          adminId: session.user.id,
          targetUserId: id,
          notifiedUser: true,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: id,
          actorId: session.user.id,
          type: "ACCOUNT_DELETION_CANCELLED",
          message: "Quản trị viên đã hủy lịch xóa tài khoản của bạn.",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/users/[id]/cancel-delete-request]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
