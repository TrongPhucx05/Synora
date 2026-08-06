import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCK_REASONS } from "@/lib/admin/account-lock";
import type { ViolationReason } from "@/lib/admin/moderation";

export async function POST(
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
    type,
    reason,
    note,
    suspendedUntil,
    notifyUser = true,
  }: {
    type?: "SUSPEND" | "BAN";
    reason?: ViolationReason;
    note?: string;
    suspendedUntil?: string;
    notifyUser?: boolean;
  } = body ?? {};

  if (type !== "SUSPEND" && type !== "BAN") {
    return NextResponse.json(
      { error: "Loại khóa không hợp lệ" },
      { status: 400 },
    );
  }
  if (!reason || !LOCK_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Vui lòng chọn lý do" }, { status: 400 });
  }
  if (type === "SUSPEND" && !suspendedUntil) {
    return NextResponse.json(
      { error: "Vui lòng chọn thời gian mở khóa" },
      { status: 400 },
    );
  }
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Không thể tự khóa chính mình" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );
  }
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Không thể khóa tài khoản quản trị viên" },
      { status: 400 },
    );
  }

  const trimmedNote = note?.trim() || undefined;
  const until = type === "SUSPEND" ? new Date(suspendedUntil!) : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          status: type === "SUSPEND" ? "SUSPENDED" : "BANNED",
          suspendedUntil: until,
          suspensionReason: reason,
          suspensionNote: trimmedNote,
          violationCount: { increment: 1 },
          lastViolationAt: new Date(),
        },
      });

      await tx.moderationAction.create({
        data: {
          type: type === "SUSPEND" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_BANNED",
          adminId: session.user.id,
          targetUserId: id,
          reason: reason,
          note: trimmedNote,
          notifiedUser: notifyUser,
          flaggedUser: true,
          suspendedUntil: until,
        },
      });

      if (notifyUser) {
        await tx.notification.create({
          data: {
            recipientId: id,
            actorId: session.user.id,
            type: type === "SUSPEND" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_BANNED",
            message: trimmedNote,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/users/[id]/lock]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
