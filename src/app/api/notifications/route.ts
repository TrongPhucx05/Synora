import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialsFor } from "@/lib/avatar";

function formatActorName(actor: any) {
  return actor?.profile?.displayName ?? actor?.username ?? "Người dùng";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 30;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const notifs = await prisma.notification.findMany({
    where: {
      recipientId: session.user.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      actor: { include: { profile: true } },
    },
  });

  let incomingRequestMap: Record<string, string> = {};
  const friendRequestActorIds = notifs
    .filter((n) => n.type === "FRIEND_REQUEST" && n.actorId)
    .map((n) => n.actorId as string);

  if (friendRequestActorIds.length > 0) {
    const pending = await prisma.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        senderId: { in: friendRequestActorIds },
        status: "PENDING",
      },
      select: { id: true, senderId: true },
    });
    for (const p of pending) incomingRequestMap[p.senderId] = p.id;
  }

  const items = notifs.map((n) => {
    const actorName = formatActorName(n.actor);
    const avatarUrl = n.actor?.profile?.avatarUrl ?? null;

    let text = "";
    let href = "/feed";
    let action: { accept: string; decline: string } | null = null;
    let requestId: string | undefined;

    switch (n.type) {
      case "LIKE":
        text = n.commentId
          ? `${actorName} đã thích bình luận của bạn`
          : `${actorName} đã thích bài viết của bạn`;
        href = n.postId
          ? `${n.commentId ? `/feed?post=${n.postId}&comment=${n.commentId}` : `/feed?post=${n.postId}`}`
          : "/feed";
        break;
      case "COMMENT":
        text = `${actorName} đã bình luận về bài viết của bạn`;
        href = n.postId
          ? `/feed?post=${n.postId}${n.commentId ? `&comment=${n.commentId}` : ""}`
          : "/feed";
        break;
      case "REPLY":
        text = `${actorName} đã trả lời bình luận của bạn`;
        href = n.postId
          ? `/feed?post=${n.postId}${n.commentId ? `&comment=${n.commentId}` : ""}`
          : "/feed";
        break;
      case "MENTION":
        text = `${actorName} đã nhắc đến bạn trong một bình luận`;
        href = n.postId
          ? `/feed?post=${n.postId}${n.commentId ? `&comment=${n.commentId}` : ""}`
          : "/feed";
        break;
      case "FRIEND_REQUEST":
        text = `${actorName} đã gửi cho bạn lời mời kết bạn`;
        href = n.actor ? `/profile/${n.actor.username}` : "/feed";
        action = { accept: "Chấp nhận", decline: "Từ chối" };
        requestId = n.actorId ? incomingRequestMap[n.actorId] : undefined;
        break;
      case "FRIEND_ACCEPT":
        text = `${actorName} đã chấp nhận lời mời kết bạn của bạn`;
        href = n.actor ? `/profile/${n.actor.username}` : "/feed";
        break;
      case "DOCUMENT_APPROVED":
        text = `Tài liệu của bạn đã được duyệt`;
        href = n.documentId ? `/library/${n.documentId}` : "/library";
        break;
      case "DOCUMENT_REJECTED":
        text = `Tài liệu của bạn đã bị từ chối`;
        href = "/library";
        break;
      case "DOCUMENT_REMOVED":
        text = `Tài liệu của bạn đã bị gỡ`;
        href = "/library";
        break;
      case "DOCUMENT_REPORTED":
        text = `Tài liệu của bạn đã bị báo cáo`;
        href = n.documentId ? `/library/${n.documentId}` : "/library";
        break;
      case "POST_REMOVED":
        text = `Bài viết của bạn đã bị gỡ do vi phạm quy định`;
        href = "/feed";
        break;
      case "ACCOUNT_SUSPENDED":
        text = `Tài khoản của bạn đã bị tạm khóa`;
        href = "/account-suspended";
        break;
      case "ACCOUNT_BANNED":
        text = `Tài khoản của bạn đã bị khóa vĩnh viễn`;
        href = "/account-banned";
        break;
      case "ACCOUNT_UNLOCKED":
        text = `Tài khoản của bạn đã được mở khóa`;
        href = "/feed";
        break;
      case "REPORT_SUBMITTED":
        text = `Báo cáo của bạn đã được gửi`;
        href = "/notifications";
        break;
      case "REPORT_RESOLVED":
        text = `Báo cáo của bạn đã được xử lý`;
        href = "/notifications";
        break;
      case "REPORT_DISMISSED":
        text = `Báo cáo của bạn đã được xem xét`;
        href = "/notifications";
        break;
      case "SUPPORT_REQUEST_SUBMITTED":
        text = `Yêu cầu hỗ trợ của bạn đã được gửi`;
        href = "/notifications";
        break;
      default:
        text = n.message ?? "Bạn có thông báo mới";
    }

    return {
      id: n.id,
      type: n.type,
      text,
      sub: n.message ?? undefined,
      href,
      createdAt: n.createdAt.toISOString(),
      unread: !n.isRead,
      avatars: n.actor ? [initialsFor(actorName)] : [],
      avatarColors: n.actor ? ["bg-primary"] : [],
      avatarUrls: n.actor ? [avatarUrl] : [],
      action,
      requestId,
    };
  });

  const nextCursor =
    notifs.length === take ? notifs[notifs.length - 1].id : null;
  const totalUnread = await prisma.notification.count({
    where: { recipientId: session.user.id, isRead: false },
  });

  return NextResponse.json({ items, nextCursor, totalUnread });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json();
  const { id, all } = body;

  if (all) {
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id, recipientId: session.user.id },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
