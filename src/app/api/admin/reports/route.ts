import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function targetTypeOf(r: any): "USER" | "POST" | "COMMENT" | "MESSAGE" | "DOCUMENT" {
  if (r.reportedUserId) return "USER";
  if (r.commentId) return "COMMENT";
  if (r.messageId) return "MESSAGE";
  if (r.documentId) return "DOCUMENT";
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");

  const reports = await prisma.report.findMany({
    where: {
      ...(status && status !== "ALL" && { status: status as any }),
      ...(reason && reason !== "ALL" && { reason: reason as any }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
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
    },
  });

  const result = reports.map((r) => {
    const targetType = targetTypeOf(r);
    let targetPreview = "";
    let targetAuthor = null;

    if (targetType === "USER") {
      targetPreview = r.reportedUser
        ? `Tài khoản @${r.reportedUser.username}`
        : "Người dùng đã bị xóa";
    } else if (targetType === "POST") {
      targetPreview = r.post?.content ?? "Bài viết đã bị xóa";
      targetAuthor = personOf(r.post?.author);
    } else if (targetType === "COMMENT") {
      targetPreview = r.comment?.content ?? "Bình luận đã bị xóa";
      targetAuthor = personOf(r.comment?.author);
    } else if (targetType === "DOCUMENT") {
      targetPreview = r.document?.title ?? "Tài liệu đã bị xóa";
      targetAuthor = personOf(r.document?.uploader);
    } else {
      targetPreview = r.message?.content ?? "Tin nhắn đã bị xóa/thu hồi";
      targetAuthor = personOf(r.message?.sender);
    }

    return {
      id: r.id,
      reporter: personOf(r.reporter),
      targetType,
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

  return NextResponse.json(result);
}