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
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 10;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }

    const isOwner = session?.user?.id === user.id;

    const posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
        visibility: isOwner ? undefined : "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        author: PUBLIC_USER_INCLUDE,
        tags: { include: { tag: true } },
        documents: true,
        _count: { select: { likes: true, comments: true } },
        likes: session?.user?.id
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
      },
    });

    const nextCursor =
      posts.length === take ? posts[posts.length - 1].id : null;

    return NextResponse.json({ posts, nextCursor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
