import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlockedEitherWay } from "@/lib/block/server";
import { getFriendRequestEligibility } from "@/lib/chat/friends";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        _count: {
          select: {
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      );
    }

    if (session?.user?.id && session.user.id !== user.id) {
      const blocked = await isBlockedEitherWay(session.user.id, user.id);
      if (blocked) {
        return NextResponse.json(
          { error: "Không thể xem trang cá nhân này", isBlocked: true },
          { status: 403 },
        );
      }
    }

    const followerCount = await prisma.follow.count({
      where: { followingId: user.id },
    });
    const docsWithDownloads = await prisma.document.aggregate({
      where: { uploaderId: user.id },
      _sum: { downloadCount: true },
    });

    const docCount = await prisma.document.count({
      where: {
        uploaderId: user.id,
        type: { notIn: ["IMAGE", "VIDEO"] },
      },
    });

    const recentDocs = await prisma.document.findMany({
      where: { uploaderId: user.id, type: "PDF" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        pageCount: true,
        downloadCount: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    let isFollowing = false;
    let friendStatus: "none" | "pending" | "friends" = "none";
    let incomingRequestId: string | null = null;
    if (session?.user?.id && session.user.id !== user.id) {
      const friendReq = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: user.id },
            { senderId: user.id, receiverId: session.user.id },
          ],
          status: { in: ["ACCEPTED", "PENDING"] },
        },
        select: { status: true, senderId: true },
      });

      if (friendReq?.status === "ACCEPTED") {
        friendStatus = "friends";
      } else if (
        friendReq?.status === "PENDING" &&
        friendReq.senderId === session.user.id
      ) {
        friendStatus = "pending";
      }
    }
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }
    if (session?.user?.id && session.user.id !== user.id) {
      const incomingReq = await prisma.friendRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: user.id,
            receiverId: session.user.id,
          },
        },
        select: { id: true, status: true },
      });
      if (incomingReq?.status === "PENDING") {
        incomingRequestId = incomingReq.id;
      }
    }

    let canSendFriendRequest = false;
    let friendRequestBlockReason: "NOBODY" | "NO_MUTUAL_FRIEND" | null = null;
    if (
      session?.user?.id &&
      session.user.id !== user.id &&
      friendStatus === "none"
    ) {
      const eligibility = await getFriendRequestEligibility(
        session.user.id,
        user.id,
      );
      canSendFriendRequest = eligibility.canSendFriendRequest;
      friendRequestBlockReason = eligibility.friendRequestBlockReason;
    }

    let canMessage = true;
    if (
      session?.user?.id &&
      session.user.id !== user.id &&
      friendStatus !== "friends"
    ) {
      const targetMessageFriendsOnly =
        user.profile?.messageFromFriendsOnly ?? false;
      if (targetMessageFriendsOnly) {
        const dmKey = [session.user.id, user.id].sort().join("_");
        const existingConv = await prisma.conversation.findUnique({
          where: { dmKey },
          select: { lastMessageAt: true },
        });
        canMessage = !!existingConv?.lastMessageAt;
      }
    }

    const postCategories = await prisma.post.findMany({
      where: { authorId: user.id, categoryId: { not: null } },
      select: { category: { select: { name: true } } },
      distinct: ["categoryId"],
      take: 8,
    });
    const subjects = postCategories
      .map((p) => p.category?.name)
      .filter(Boolean) as string[];

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.profile,
      isFollowing,
      friendStatus,
      incomingRequestId,
      canSendFriendRequest,
      friendRequestBlockReason,
      canMessage,
      subjects,
      stats: {
        followers: followerCount,
        following: user._count.following,
        documents: docCount,
        downloads: docsWithDownloads._sum.downloadCount ?? 0,
      },
      recentDocs,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  if (session.user.username !== username) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      displayName,
      bio,
      school,
      location,
      website,
      avatarUrl,
      coverUrl,
      grade,
    } = body;

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(school !== undefined && { school }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(grade !== undefined && { grade }),
      },
      create: {
        userId: session.user.id,
        displayName,
        bio,
        school,
        location,
        website,
        avatarUrl,
        coverUrl,
        grade,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
