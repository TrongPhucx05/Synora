import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIOLATION_REASONS } from "@/lib/admin/moderation";
import { utapi } from "@/lib/uploadthing-server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const {
    mode = "delete-now",
    reason,
    note,
    notifyUser = false,
    flagUser = false,
  } = body ?? {};

  if ((notifyUser || flagUser) && !VIOLATION_REASONS.includes(reason as any)) {
    return NextResponse.json(
      { error: "Vui lòng chọn lý do vi phạm" },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      authorId: true,
      content: true,
      documents: { select: { id: true, fileKey: true } },
    },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  }

  const trimmedNote = note?.trim() || undefined;

  if (mode === "schedule-7d") {
    await prisma.post.update({
      where: { id },
      data: {
        hidden: true,
        scheduledDeleteAt: new Date(Date.now() + 7 * 24 * 3600_000),
      },
    });

    if (notifyUser) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: session.user.id,
          type: "POST_REMOVED",
          message:
            trimmedNote ??
            "Bài viết của bạn vi phạm quy định và sẽ bị xóa sau 7 ngày. Bạn có thể tự gỡ bài trước thời hạn này.",
        },
      });
    }
    if (flagUser) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: { violationCount: { increment: 1 }, lastViolationAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, scheduled: true });
  }

  const excerpt =
    post.content.length > 200 ? post.content.slice(0, 200) + "…" : post.content;
  const fileKeys = post.documents.map((d) => d.fileKey).filter(Boolean);

  try {
    if (fileKeys.length > 0) {
      await utapi.deleteFiles(fileKeys).catch((err) => {
        console.error("[UploadThing] Xóa file thất bại, tiếp tục xóa DB:", err);
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.document.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });

      await tx.moderationAction.create({
        data: {
          type: "POST_REMOVED",
          adminId: session.user.id,
          targetUserId: post.authorId,
          reason: notifyUser || flagUser ? (reason as any) : undefined,
          note: trimmedNote,
          notifiedUser: notifyUser,
          flaggedUser: flagUser,
          postExcerpt: excerpt,
        },
      });

      if (notifyUser) {
        await tx.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: session.user.id,
            type: "POST_REMOVED",
            message: trimmedNote,
          },
        });
      }

      if (flagUser) {
        await tx.user.update({
          where: { id: post.authorId },
          data: {
            violationCount: { increment: 1 },
            lastViolationAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/posts/[id] DELETE]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

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

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  }

  await prisma.post.update({
    where: { id },
    data: {
      hidden,
      ...(hidden === false && { scheduledDeleteAt: null }),
    },
  });

  if (hidden) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: session.user.id,
        type: "POST_REMOVED",
        message: "Bài viết của bạn đã bị quản trị viên ẩn do vi phạm quy định.",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
