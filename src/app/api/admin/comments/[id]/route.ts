import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { hidden } = await req.json().catch(() => ({}));
  if (typeof hidden !== "boolean") {
    return NextResponse.json(
      { error: "Thiếu trạng thái hidden" },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!comment) {
    return NextResponse.json(
      { error: "Không tìm thấy bình luận" },
      { status: 404 },
    );
  }

  await prisma.comment.update({ where: { id }, data: { hidden } });

  if (hidden) {
    await prisma.notification.create({
      data: {
        recipientId: comment.authorId,
        actorId: session.user.id,
        type: "SYSTEM",
        message:
          "Bình luận của bạn đã bị quản trị viên ẩn do vi phạm quy định.",
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
  const exists = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json(
      { error: "Không tìm thấy bình luận" },
      { status: 404 },
    );
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
