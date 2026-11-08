import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const like = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

export async function searchUserIds(
  q: string,
  excludeIds: string[],
  take?: number,
) {
  const p = like(q);
  const exclude = excludeIds.length
    ? Prisma.sql`AND u.id NOT IN (${Prisma.join(excludeIds)})`
    : Prisma.empty;
  const limit = take ? Prisma.sql`LIMIT ${take}` : Prisma.empty;

  let rows: { id: string }[];
  try {
    rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT u.id FROM users u
      LEFT JOIN profiles pr ON pr."userId" = u.id
      WHERE u.role <> 'ADMIN'
        ${exclude}
        AND (unaccent(lower(u.username)) LIKE unaccent(lower(${p}))
          OR unaccent(lower(coalesce(pr."displayName", ''))) LIKE unaccent(lower(${p})))
      ${limit}`;
  } catch (e) {
    console.error("[search] unaccent query failed, falling back to ILIKE:", e);
    rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT u.id FROM users u
      LEFT JOIN profiles pr ON pr."userId" = u.id
      WHERE u.role <> 'ADMIN'
        ${exclude}
        AND (u.username ILIKE ${p}
          OR coalesce(pr."displayName", '') ILIKE ${p})
      ${limit}`;
  }
  return rows.map((r) => r.id);
}

export async function searchDocumentIds(
  q: string,
  excludeUploaderIds: string[],
  take?: number,
) {
  const p = like(q);
  const exclude = excludeUploaderIds.length
    ? Prisma.sql`AND "uploaderId" NOT IN (${Prisma.join(excludeUploaderIds)})`
    : Prisma.empty;
  const limit = take ? Prisma.sql`LIMIT ${take}` : Prisma.empty;

  let rows: { id: string }[];
  try {
    rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM documents
      WHERE hidden = false AND "postId" IS NULL
        AND type NOT IN ('IMAGE', 'VIDEO')
        ${exclude}
        AND (unaccent(lower(title)) LIKE unaccent(lower(${p}))
          OR unaccent(lower(coalesce(description, ''))) LIKE unaccent(lower(${p})))
      ORDER BY "createdAt" DESC
      ${limit}`;
  } catch (e) {
    console.error("[search] unaccent query failed, falling back to ILIKE:", e);
    rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM documents
      WHERE hidden = false AND "postId" IS NULL
        AND type NOT IN ('IMAGE', 'VIDEO')
        ${exclude}
        AND (title ILIKE ${p} OR coalesce(description, '') ILIKE ${p})
      ORDER BY "createdAt" DESC
      ${limit}`;
  }
  return rows.map((r) => r.id);
}