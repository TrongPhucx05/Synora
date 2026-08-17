import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { action, note }: { action?: "disable" | "enable"; note?: string } =
    await req.json().catch(() => ({}));

  if (action !== "disable" && action !== "enable") {
    return NextResponse.json(
      { error: "Hành động không hợp lệ" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      isGroup: true,
      name: true,
      members: { where: { isLeader: true }, take: 1, select: { userId: true } },
    },
  });
  if (!conversation || !conversation.isGroup) {
    return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
  }

  const leaderId = conversation.members[0]?.userId;
  const trimmedNote = note?.trim() || undefined;
  const disabling = action === "disable";

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id },
      data: {
        isDisabled: disabling,
        disabledAt: disabling ? new Date() : null,
      },
    }),
    prisma.moderationAction.create({
      data: {
        type: disabling ? "GROUP_DISABLED" : "GROUP_ENABLED",
        adminId: session.user.id,
        targetUserId: leaderId ?? session.user.id,
        targetConversationId: id,
        note: trimmedNote,
        notifiedUser: !!leaderId,
      },
    }),
    ...(leaderId
      ? [
          prisma.notification.create({
            data: {
              recipientId: leaderId,
              actorId: session.user.id,
              type: disabling ? "GROUP_DISABLED" : "GROUP_ENABLED",
              message: disabling
                ? `Nhóm "${conversation.name}" đã bị quản trị viên vô hiệu hóa.${trimmedNote ? " Lý do: " + trimmedNote : ""}`
                : `Nhóm "${conversation.name}" đã được quản trị viên mở lại hoạt động.`,
              conversationId: id,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      isGroup: true,
      name: true,
      avatarKey: true,
      members: { select: { userId: true, isLeader: true } },
      messages: { select: { attachments: { select: { key: true } } } },
    },
  });
  if (!conversation || !conversation.isGroup) {
    return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
  }

  const leaderId = conversation.members.find((m) => m.isLeader)?.userId;
  const memberIds = conversation.members.map((m) => m.userId);
  const attachmentKeys = conversation.messages.flatMap((m) =>
    m.attachments.map((a) => a.key),
  );
  const allKeys = [
    ...attachmentKeys,
    ...(conversation.avatarKey ? [conversation.avatarKey] : []),
  ];

  await prisma.$transaction([
    prisma.moderationAction.create({
      data: {
        type: "GROUP_DELETED",
        adminId: session.user.id,
        targetUserId: leaderId ?? session.user.id,
        notifiedUser: memberIds.length > 0,
      },
    }),
    prisma.notification.createMany({
      data: memberIds.map((uid) => ({
        recipientId: uid,
        actorId: session.user.id,
        type: "GROUP_DELETED",
        message: `Nhóm "${conversation.name}" đã bị quản trị viên xóa do vi phạm quy định.`,
      })),
    }),
    prisma.conversation.delete({ where: { id } }),
  ]);

  if (allKeys.length > 0) {
    try {
      await utapi.deleteFiles(allKeys);
    } catch (err) {
      console.error("Xóa file khi admin xóa nhóm thất bại:", err);
    }
  }

  return NextResponse.json({ deleted: true });
}
