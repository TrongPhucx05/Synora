import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "HATE_SPEECH",
  "SPAM",
  "SEXUAL_CONTENT",
  "VIOLENCE",
  "SCAM",
  "HARASSMENT",
  "OTHER",
];
const VALID_TARGETS = ["USER", "POST", "COMMENT", "MESSAGE"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { targetType, targetId, reason, detail } = await req
    .json()
    .catch(() => ({}));

  if (!VALID_TARGETS.includes(targetType)) {
    return NextResponse.json(
      { error: "Loại đối tượng không hợp lệ" },
      { status: 400 },
    );
  }
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json(
      { error: "Vui lòng chọn lý do báo cáo" },
      { status: 400 },
    );
  }
  if (!targetId) {
    return NextResponse.json(
      { error: "Thiếu đối tượng báo cáo" },
      { status: 400 },
    );
  }

  if (targetType === "USER") {
    if (targetId === session.user.id)
      return NextResponse.json(
        { error: "Không thể tự báo cáo chính mình" },
        { status: 400 },
      );
    const exists = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!exists)
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      );
  } else if (targetType === "POST") {
    const exists = await prisma.post.findUnique({
      where: { id: targetId },
      select: { authorId: true },
    });
    if (!exists)
      return NextResponse.json(
        { error: "Không tìm thấy bài viết" },
        { status: 404 },
      );
    if (exists.authorId === session.user.id)
      return NextResponse.json(
        { error: "Không thể tự báo cáo bài viết của mình" },
        { status: 400 },
      );
  } else if (targetType === "COMMENT") {
    const exists = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { authorId: true },
    });
    if (!exists)
      return NextResponse.json(
        { error: "Không tìm thấy bình luận" },
        { status: 404 },
      );
    if (exists.authorId === session.user.id)
      return NextResponse.json(
        { error: "Không thể tự báo cáo bình luận của mình" },
        { status: 400 },
      );
  } else if (targetType === "MESSAGE") {
    const exists = await prisma.message.findUnique({
      where: { id: targetId },
      select: { senderId: true },
    });
    if (!exists)
      return NextResponse.json(
        { error: "Không tìm thấy tin nhắn" },
        { status: 404 },
      );
    if (exists.senderId === session.user.id)
      return NextResponse.json(
        { error: "Không thể tự báo cáo tin nhắn của mình" },
        { status: 400 },
      );
  }

  const dup = await prisma.report.findFirst({
    where: {
      reporterId: session.user.id,
      status: "PENDING",
      ...(targetType === "USER" && { reportedUserId: targetId }),
      ...(targetType === "POST" && { postId: targetId }),
      ...(targetType === "COMMENT" && { commentId: targetId }),
      ...(targetType === "MESSAGE" && { messageId: targetId }),
    },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json(
      { error: "Bạn đã báo cáo đối tượng này, đang chờ xử lý" },
      { status: 409 },
    );
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      reason,
      description: detail?.trim() || undefined,
      ...(targetType === "USER" && { reportedUserId: targetId }),
      ...(targetType === "POST" && { postId: targetId }),
      ...(targetType === "COMMENT" && { commentId: targetId }),
      ...(targetType === "MESSAGE" && { messageId: targetId }),
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: session.user.id,
      type: "REPORT_SUBMITTED",
      message: "Báo cáo của bạn đã được gửi và đang chờ quản trị viên xem xét.",
    },
  });

  return NextResponse.json({ ok: true });
}
