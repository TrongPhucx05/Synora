import { prisma } from "@/lib/prisma";

export async function getOrCreateDm(meId: string, otherId: string) {
  const dmKey = [meId, otherId].sort().join("_");
  const existing = await prisma.conversation.findUnique({
    where: { dmKey },
    select: { id: true },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        dmKey,
        members: { create: [{ userId: meId }, { userId: otherId }] },
      },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    const again = await prisma.conversation.findUnique({
      where: { dmKey },
      select: { id: true },
    });
    if (again) return again.id;
    throw e;
  }
}