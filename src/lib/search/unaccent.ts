import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const like = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

export async function searchUserIds(
  q: string,
  excludeIds: string[],
  take?: number,
) {
  const p = like(q);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT u.id FROM users u
    LEFT JOIN profiles pr ON pr."userId" = u.id
    WHERE u.role <> 'ADMIN'
      AND u.id <> ALL(${excludeIds}::text[])
      AND (unaccent(lower(u.username)) LIKE unaccent(lower(${p}))
        OR unaccent(lower(coalesce(pr."displayName", ''))) LIKE unaccent(lower(${p})))
    ${take ? Prisma.sql`LIMIT ${take}` : Prisma.empty}`;
  return rows.map((r) => r.id);
}

export async function searchDocumentIds(
  q: string,
  excludeUploaderIds: string[],
  take?: number,
) {
  const p = like(q);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM documents
    WHERE hidden = false AND "postId" IS NULL
      AND type NOT IN ('IMAGE', 'VIDEO')
      AND "uploaderId" <> ALL(${excludeUploaderIds}::text[])
      AND (unaccent(lower(title)) LIKE unaccent(lower(${p}))
        OR unaccent(lower(coalesce(description, ''))) LIKE unaccent(lower(${p})))
    ORDER BY "createdAt" DESC
    ${take ? Prisma.sql`LIMIT ${take}` : Prisma.empty}`;
  return rows.map((r) => r.id);
}