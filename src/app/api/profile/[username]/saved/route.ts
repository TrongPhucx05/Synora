import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PUBLIC_USER_INCLUDE } from "@/lib/privacy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  const owner = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!owner)
    return NextResponse.json({ posts: [], nextCursor: null });

  if (session?.user?.id !== owner.id)
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 10;

  const acceptedFriends = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: owner.id }, { receiverId: owner.id }],
    },
    select: { senderId: true, receiverId: true },
  });
  const friendIds = acceptedFriends.map((r) =>
    r.senderId === owner.id ? r.receiverId : r.senderId,
  );

  const saves = await prisma.save.findMany({
    where: { userId: owner.id },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      post: {
        include: {
          author: PUBLIC_USER_INCLUDE,
          tags: { include: { tag: true } },
          documents: true,
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId: owner.id }, select: { id: true } },
        },
      },
    },
  });

  const nextCursor = saves.length === take ? saves[saves.length - 1].id : null;

  const posts = saves
    .map((s) => s.post)
    .filter((post): post is NonNullable<typeof post> => {
      if (!post) return false;
      if (post.visibility === "PUBLIC") return true;
      if (post.authorId === owner.id) return true;
      if (
        post.visibility === "FRIENDS_ONLY" &&
        friendIds.includes(post.authorId)
      )
        return true;
      return false;
    });

  return NextResponse.json({ posts, nextCursor });
}