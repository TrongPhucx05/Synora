import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

function targetTypeOf(
  r: any,
): "USER" | "POST" | "COMMENT" | "MESSAGE" | "DOCUMENT" | "GROUP" {
  if (r.reportedUserId) return "USER";
  if (r.commentId) return "COMMENT";
  if (r.messageId) return "MESSAGE";
  if (r.documentId) return "DOCUMENT";
  if (r.conversationId) return "GROUP";
  return "POST";
}

function personOf(u: any) {
  if (!u) return null;
  return {
    name: u.profile?.displayName ?? u.username,
    username: u.username,
    avatarUrl: u.profile?.avatarUrl ?? null,
  };
}

const TARGET_TYPE_WHERE: Record<string, any> = {
  USER: { reportedUserId: { not: null } },
  POST: { postId: { not: null } },
  COMMENT: { commentId: { not: null } },
  MESSAGE: { messageId: { not: null } },
  DOCUMENT: { documentId: { not: null } },
  GROUP: { conversationId: { not: null } },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const targetType = searchParams.get("targetType");
  const query = searchParams.get("query")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const where: any = {
    ...(status && status !== "ALL" && { status: status as any }),
    ...(reason && reason !== "ALL" && { reason: reason as any }),
    ...(targetType && targetType !== "ALL" && TARGET_TYPE_WHERE[targetType]),
    ...(query && {
      OR: [
        { reporter: { username: { contains: query, mode: "insensitive" } } },
        {
          reporter: {
            profile: { displayName: { contains: query, mode: "insensitive" } },
          },
        },
        {
          reportedUser: { username: { contains: query, mode: "insensitive" } },
        },
        { post: { content: { contains: query, mode: "insensitive" } } },
        { comment: { content: { contains: query, mode: "insensitive" } } },
        { message: { content: { contains: query, mode: "insensitive" } } },
        { document: { title: { contains: query, mode: "insensitive" } } },
        { conversation: { name: { contains: query, mode: "insensitive" } } },
      ],
    }),
  };

  const [totalCount, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reporter: { include: { profile: true } },
        reportedUser: { include: { profile: true } },
        post: {
          select: {
            content: true,
            authorId: true,
            author: { include: { profile: true } },
          },
        },
        comment: {
          select: {
            content: true,
            authorId: true,
            author: { include: { profile: true } },
          },
        },
        message: {
          select: {
            content: true,
            senderId: true,
            sender: { include: { profile: true } },
          },
        },
        document: {
          select: {
            title: true,
            uploaderId: true,
            uploader: { include: { profile: true } },
          },
        },
        conversation: {
          select: {
            name: true,
            isDisabled: true,
            _count: { select: { members: { where: { isAccepted: true } } } },
            members: {
              where: { isLeader: true },
              take: 1,
              select: { user: { include: { profile: true } } },
            },
          },
        },
      },
    }),
  ]);

  const items = reports.map((r) => {
    const type = targetTypeOf(r);
    let targetPreview = "";
    let targetAuthor = null;

    if (type === "USER") {
      targetPreview = r.reportedUser
        ? `Tài khoản @${r.reportedUser.username}`
        : "Người dùng đã bị xóa";
    } else if (type === "POST") {
      targetPreview = r.post?.content ?? "Bài viết đã bị xóa";
      targetAuthor = personOf(r.post?.author);
    } else if (type === "COMMENT") {
      targetPreview = r.comment?.content ?? "Bình luận đã bị xóa";
      targetAuthor = personOf(r.comment?.author);
    } else if (type === "DOCUMENT") {
      targetPreview = r.document?.title ?? "Tài liệu đã bị xóa";
      targetAuthor = personOf(r.document?.uploader);
    } else if (type === "GROUP") {
      const leader = r.conversation?.members[0]?.user;
      targetPreview = r.conversation
        ? `${r.conversation.name ?? "Nhóm chat"} · ${r.conversation._count.members} thành viên${r.conversation.isDisabled ? " · Đã vô hiệu hóa" : ""}`
        : "Nhóm đã bị xóa";
      targetAuthor = personOf(leader);
    } else {
      targetPreview = r.message?.content ?? "Tin nhắn đã bị xóa/thu hồi";
      targetAuthor = personOf(r.message?.sender);
    }

    return {
      id: r.id,
      reporter: personOf(r.reporter),
      targetType: type,
      targetPreview,
      targetAuthor,
      reason: r.reason,
      detail: r.description ?? "",
      status: r.status,
      createdAt: r.createdAt.toLocaleDateString("vi-VN"),
      resolvedAt: r.resolvedAt
        ? r.resolvedAt.toLocaleDateString("vi-VN")
        : undefined,
      resolutionNote: r.resolutionNote ?? undefined,
    };
  });

  return NextResponse.json({
    items,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  });
}
