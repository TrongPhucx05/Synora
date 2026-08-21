import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

export async function sweepScheduledDeletions() {
  const now = new Date();

  const duePosts = await prisma.post.findMany({
    where: { scheduledDeleteAt: { lte: now } },
    select: {
      id: true,
      authorId: true,
      documents: { select: { fileKey: true } },
    },
  });
  for (const post of duePosts) {
    const keys = post.documents.map((d) => d.fileKey).filter(Boolean);
    if (keys.length) await utapi.deleteFiles(keys).catch(() => {});
    await prisma.document.deleteMany({ where: { postId: post.id } });
    await prisma.post.delete({ where: { id: post.id } });
  }

  const dueDocs = await prisma.document.findMany({
    where: { scheduledDeleteAt: { lte: now }, postId: null },
    select: { id: true, fileKey: true },
  });
  for (const doc of dueDocs) {
    if (doc.fileKey) await utapi.deleteFiles([doc.fileKey]).catch(() => {});
    await prisma.document.delete({ where: { id: doc.id } });
  }
}

export async function sweepAutoDisbandGroups() {
  const now = new Date();

  const dueGroups = await prisma.conversation.findMany({
    where: { isGroup: true, leaderBanDeadline: { lte: now } },
    select: {
      id: true,
      name: true,
      avatarKey: true,
      members: { select: { userId: true, isLeader: true } },
      messages: { select: { attachments: { select: { key: true } } } },
    },
  });

  for (const g of dueGroups) {
    const leaderId = g.members.find((m) => m.isLeader)?.userId;
    if (leaderId) {
      const user = await prisma.user.findUnique({
        where: { id: leaderId },
        select: { status: true },
      });
      if (user?.status !== "BANNED") {
        await prisma.conversation.update({
          where: { id: g.id },
          data: { leaderBanDeadline: null },
        });
        continue;
      }
    }

    const memberIds = g.members.map((m) => m.userId);
    const attachmentKeys = g.messages.flatMap((m) =>
      m.attachments.map((a) => a.key),
    );
    const allKeys = [...attachmentKeys, ...(g.avatarKey ? [g.avatarKey] : [])];

    await prisma.notification.createMany({
      data: memberIds.map((uid) => ({
        recipientId: uid,
        type: "GROUP_AUTO_DISBANDED",
        message: `Nhóm "${g.name}" đã tự động giải tán do trưởng nhóm bị khóa tài khoản vĩnh viễn và không giải quyết yêu cầu hỗ trợ trong 7 ngày.`,
      })),
    });
    await prisma.conversation.delete({ where: { id: g.id } });

    if (allKeys.length > 0) {
      await utapi.deleteFiles(allKeys).catch(() => {});
    }
  }
}

export async function sweepAccountDeletions() {
  const now = new Date();

  const dueUsers = await prisma.user.findMany({
    where: { scheduledDeleteAt: { lte: now } },
    select: {
      id: true,
      documents: { select: { fileKey: true } },
    },
  });

  for (const user of dueUsers) {
    const docKeys = user.documents.map((d) => d.fileKey).filter(Boolean);
    if (docKeys.length) {
      await utapi.deleteFiles(docKeys).catch(() => {});
    }

    await prisma.user.delete({ where: { id: user.id } });
  }
}
