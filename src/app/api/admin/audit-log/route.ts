import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIOLATION_REASON_LABELS } from "@/lib/admin/moderation";
import { formatDateTime } from "@/lib/admin/account-lock";
import type { AuditActionType } from "@/lib/audit-log/types";

const TYPES_BY_GROUP: Record<string, AuditActionType[]> = {
  USER: ["ACCOUNT_SUSPENDED", "ACCOUNT_BANNED", "ACCOUNT_UNLOCKED"],
  GROUP: ["GROUP_DISABLED", "GROUP_ENABLED", "GROUP_DELETED"],
  CONTENT: ["POST_REMOVED"],
};

const DEFAULT_RANGE_DAYS = 30;
const PAGE_SIZE = 20;

function personOf(
  u:
    | {
        username: string;
        profile: {
          displayName: string | null;
          avatarUrl: string | null;
        } | null;
      }
    | null
    | undefined,
) {
  if (!u) return null;
  return {
    name: u.profile?.displayName ?? u.username,
    username: u.username,
    avatarUrl: u.profile?.avatarUrl ?? null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const query = searchParams.get("query")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const hasCustomRange = !!(dateFrom || dateTo);
  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) {
    createdAtFilter.gte = new Date(`${dateFrom}T00:00:00`);
  } else if (!hasCustomRange) {
    createdAtFilter.gte = new Date(
      Date.now() - DEFAULT_RANGE_DAYS * 24 * 3600_000,
    );
  }
  if (dateTo) createdAtFilter.lte = new Date(`${dateTo}T23:59:59.999`);

  const where = {
    ...(group && group !== "ALL" && TYPES_BY_GROUP[group]
      ? { type: { in: TYPES_BY_GROUP[group] } }
      : {}),
    ...(Object.keys(createdAtFilter).length > 0 && {
      createdAt: createdAtFilter,
    }),
    ...(query && {
      OR: [
        {
          admin: {
            username: { contains: query, mode: "insensitive" as const },
          },
        },
        {
          admin: {
            profile: {
              displayName: { contains: query, mode: "insensitive" as const },
            },
          },
        },
        {
          targetUser: {
            username: { contains: query, mode: "insensitive" as const },
          },
        },
        {
          targetUser: {
            profile: {
              displayName: { contains: query, mode: "insensitive" as const },
            },
          },
        },
      ],
    }),
  };

  const [totalCount, actions] = await Promise.all([
    prisma.moderationAction.count({ where }),
    prisma.moderationAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        admin: { include: { profile: true } },
        targetUser: { include: { profile: true } },
        targetConversation: { select: { name: true } },
      },
    }),
  ]);

  const entries = actions.map((a) => {
    const admin = personOf(a.admin);
    let targetType: "USER" | "GROUP" | "POST" = "USER";
    let targetLabel = "";
    let detail: string | undefined;

    if (a.type === "POST_REMOVED") {
      targetType = "POST";
      const authorName = personOf(a.targetUser)?.name ?? "Người dùng đã bị xóa";
      targetLabel = `Bài viết của ${authorName}`;
      detail = a.postExcerpt ?? undefined;
    } else if (a.type === "GROUP_DISABLED" || a.type === "GROUP_ENABLED") {
      targetType = "GROUP";
      targetLabel = a.targetConversation?.name ?? "Nhóm chat";
      detail = a.note ?? undefined;
    } else if (a.type === "GROUP_DELETED") {
      targetType = "GROUP";
      const leaderName = personOf(a.targetUser)?.name ?? "không xác định";
      targetLabel = `Nhóm đã xóa · Trưởng nhóm: ${leaderName}`;
      detail =
        "Nhóm và toàn bộ tin nhắn, thành viên bên trong đã bị xóa vĩnh viễn.";
    } else {
      targetType = "USER";
      targetLabel = personOf(a.targetUser)?.name ?? "Người dùng đã bị xóa";
      detail = a.note ?? undefined;
    }

    return {
      id: a.id,
      actor: admin ?? { name: "Quản trị viên", username: "", avatarUrl: null },
      action: a.type as AuditActionType,
      targetType,
      targetLabel,
      detail,
      reasonLabel: a.reason ? VIOLATION_REASON_LABELS[a.reason] : undefined,
      notifiedUser: a.notifiedUser,
      flaggedUser: a.flaggedUser,
      suspendedUntil:
        a.type === "ACCOUNT_SUSPENDED" && a.suspendedUntil
          ? formatDateTime(a.suspendedUntil.toISOString())
          : undefined,
      createdAt: a.createdAt.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  return NextResponse.json({
    entries,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    rangeDays: hasCustomRange ? null : DEFAULT_RANGE_DAYS,
  });
}
