import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;

  const actions = await prisma.moderationAction.findMany({
    where: {
      targetUserId: id,
      type: { in: ["POST_REMOVED", "ACCOUNT_SUSPENDED", "ACCOUNT_BANNED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { admin: { select: { username: true } } },
  });

  const LABEL: Record<string, string> = {
    POST_REMOVED: "Gỡ bài viết",
    ACCOUNT_SUSPENDED: "Tạm khóa tài khoản",
    ACCOUNT_BANNED: "Khóa vĩnh viễn",
  };

  const result = actions.map((a) => ({
    id: a.id,
    action: LABEL[a.type] ?? a.type,
    reason: a.reason ?? "—",
    note: a.note,
    adminUsername: a.admin.username,
    date: a.createdAt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }));

  return NextResponse.json(result);
}