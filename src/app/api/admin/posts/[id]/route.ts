import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIOLATION_REASONS } from "@/lib/admin/moderation";

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
    reason,
    note,
    notifyUser = false,
    flagUser = false,
  }: {
    reason?: string;
    note?: string;
    notifyUser?: boolean;
    flagUser?: boolean;
  } = body ?? {};

  if ((notifyUser || flagUser) && !VIOLATION_REASONS.includes(reason as any)) {
    return NextResponse.json(
      { error: "Vui lòng chọn lý do vi phạm" },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, content: true },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  }

  const excerpt =
    post.content.length > 200 ? post.content.slice(0, 200) + "…" : post.content;
  const trimmedNote = note?.trim() || undefined;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.post.delete({ where: { id } });

      await tx.moderationAction.create({
        data: {
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
