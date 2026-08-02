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
