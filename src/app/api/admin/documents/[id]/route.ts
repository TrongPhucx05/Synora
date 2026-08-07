import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import {
  VIOLATION_REASON_LABELS,
  type ViolationReason,
} from "@/lib/admin/moderation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { hidden, reason, note } = await req.json().catch(() => ({}));
  if (typeof hidden !== "boolean") {
    return NextResponse.json(
      { error: "Thiếu trạng thái hidden" },
      { status: 400 },
    );
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json(
      { error: "Không tìm thấy tài liệu" },
      { status: 404 },
    );
  }

  await prisma.document.update({ where: { id }, data: { hidden } });

  if (hidden) {
    const reasonLabel = reason
      ? VIOLATION_REASON_LABELS[reason as ViolationReason]
      : "Vi phạm quy định cộng đồng";
    await prisma.notification.create({
      data: {
        recipientId: doc.uploaderId,
        actorId: session.user.id,
        type: "DOCUMENT_REJECTED",
        documentId: doc.id,
        message: `Tài liệu "${doc.title}" của bạn đã bị ẩn. Lý do: ${reasonLabel}.${
          note ? " Ghi chú: " + note : ""
        }`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { reason, note } = await req.json().catch(() => ({}));

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json(
      { error: "Không tìm thấy tài liệu" },
      { status: 404 },
    );
  }

  const reasonLabel = reason
    ? VIOLATION_REASON_LABELS[reason as ViolationReason]
    : "Vi phạm quy định cộng đồng";

  await prisma.notification.create({
    data: {
      recipientId: doc.uploaderId,
      actorId: session.user.id,
      type: "DOCUMENT_REMOVED",
      message: `Tài liệu "${doc.title}" của bạn đã bị xóa vĩnh viễn. Lý do: ${reasonLabel}.${
        note ? " Ghi chú: " + note : ""
      }`,
    },
  });

  if (doc.fileKey) {
    await utapi.deleteFiles([doc.fileKey]).catch((err) => {
      console.error("[UploadThing] Xóa file thất bại:", err);
    });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
