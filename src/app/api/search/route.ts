import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedIds } from "@/lib/block/server";
import { getFriendRequestEligibility } from "@/lib/chat/friends";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  const rawQ = (searchParams.get("q") ?? "").trim();
  const isHashtag = rawQ.startsWith("#");
  const q = isHashtag ? rawQ.slice(1) : rawQ;
  const tab = searchParams.get("tab") ?? "all";
  const sort = searchParams.get("sort") ?? "relevant";
  const countOnly = searchParams.get("countOnly") === "1";
  const strictTag = searchParams.get("strictTag") === "1";

  if (!q)
    return NextResponse.json({
      posts: [],
      documents: [],
      people: [],
      groups: [],
      topics: [],
    });

  const friendIds: string[] = [];
  if (session?.user?.id) {
    const accepted = await prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      select: { senderId: true, receiverId: true },
    });
    for (const r of accepted) {
      friendIds.push(
        r.senderId === session.user.id ? r.receiverId : r.senderId,
      );
    }
  }

  const blockedIds = session?.user?.id
    ? await getBlockedIds(session.user.id)
    : [];

  const postVisibilityFilter = session?.user?.id
    ? {
        OR: [
          { visibility: "PUBLIC" as const },
          { authorId: session.user.id },
          { visibility: "FRIENDS_ONLY" as const, authorId: { in: friendIds } },
        ],
      }
    : { visibility: "PUBLIC" as const };

  const tagVisibilityFilter = session?.user?.id
    ? {
        OR: [
          { post: { visibility: "PUBLIC" as const } },
          { post: { authorId: session.user.id } },
          {
            post: {
              visibility: "FRIENDS_ONLY" as const,
              authorId: { in: friendIds },
            },
          },
        ],
      }
    : { post: { visibility: "PUBLIC" as const } };

  const postOrderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : sort === "popular"
        ? [{ likeCount: "desc" as const }, { commentCount: "desc" as const }]
        : [
            { likeCount: "desc" as const },
            { commentCount: "desc" as const },
            { createdAt: "desc" as const },
          ];

  const docOrderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : { downloadCount: "desc" as const };

  const postWhereBase = strictTag
    ? {
        AND: [
          postVisibilityFilter,
          {
            tags: {
              some: {
                tag: { name: { equals: q, mode: "insensitive" as const } },
              },
            },
          },
        ],
      }
    : isHashtag
      ? {
          AND: [
            postVisibilityFilter,
            {
              OR: [
                {
                  tags: {
                    some: {
                      tag: {
                        name: { equals: q, mode: "insensitive" as const },
                      },
                    },
                  },
                },
                { content: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ],
        }
      : {
          AND: [
            postVisibilityFilter,
            {
              OR: [
                { content: { contains: q, mode: "insensitive" as const } },
                {
                  tags: {
                    some: {
                      tag: {
                        name: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                },
              ],
            },
          ],
        };

  const postWhere =
    blockedIds.length > 0
      ? { AND: [postWhereBase, { authorId: { notIn: blockedIds } }] }
      : postWhereBase;

  const topicWhere = {
    name: { contains: q, mode: "insensitive" as const },
    posts: { some: tagVisibilityFilter },
  };

  if (countOnly) {
    const [postCount, docCount, peopleCount, groupCount, topicCount] =
      await Promise.all([
        prisma.post.count({ where: postWhere }),
        !isHashtag
          ? prisma.document.count({
              where: {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
        !isHashtag
          ? prisma.user.count({
              where: {
                ...(blockedIds.length > 0 ? { id: { notIn: blockedIds } } : {}),
                OR: [
                  { username: { contains: q, mode: "insensitive" } },
                  {
                    profile: {
                      displayName: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              },
            })
          : Promise.resolve(0),
        !isHashtag
          ? prisma.community.count({
              where: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              },
            })
          : Promise.resolve(0),
        prisma.tag.count({ where: topicWhere }),
      ]);
    return NextResponse.json({
      posts: postCount,
      documents: docCount,
      people: peopleCount,
      groups: groupCount,
      topics: topicCount,
    });
  }

  const rawTags =
    tab === "all" || tab === "topics"
      ? await prisma.tag.findMany({
          where: topicWhere,
          take: tab === "all" ? 5 : 20,
          include: { _count: { select: { posts: true } } },
          orderBy: { posts: { _count: "desc" } },
        })
      : [];

  const tagsWithCorrectCount = await Promise.all(
    rawTags.map(async (tag) => {
      const count = await prisma.tagsOnPosts.count({
        where: { tagId: tag.id, ...tagVisibilityFilter },
      });
      return { ...tag, _count: { posts: count } };
    }),
  );

  const [posts, documents, people, groups] = await Promise.all([
    tab === "all" || tab === "posts"
      ? prisma.post.findMany({
          where: postWhere,
          take: tab === "all" ? 6 : 20,
          orderBy: postOrderBy,
          include: {
            author: { include: { profile: true } },
            tags: { include: { tag: true } },
            documents: true,
            _count: { select: { likes: true, comments: true } },
            likes: session?.user?.id
              ? { where: { userId: session.user.id }, select: { id: true } }
              : false,
          },
        })
      : [],

    !isHashtag && (tab === "all" || tab === "documents")
      ? prisma.document.findMany({
          where: {
            ...(blockedIds.length > 0
              ? { uploaderId: { notIn: blockedIds } }
              : {}),
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: tab === "all" ? 3 : 20,
          orderBy: docOrderBy,
          include: { uploader: { include: { profile: true } } },
        })
      : [],

    !isHashtag && (tab === "all" || tab === "people")
      ? prisma.user.findMany({
          where: {
            ...(blockedIds.length > 0 ? { id: { notIn: blockedIds } } : {}),
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              {
                profile: {
                  displayName: { contains: q, mode: "insensitive" },
                },
              },
            ],
          },
          take: tab === "all" ? 3 : 20,
          include: {
            profile: true,
            _count: { select: { followers: true, documents: true } },
          },
        })
      : [],

    !isHashtag && (tab === "all" || tab === "groups")
      ? prisma.community.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: tab === "all" ? 3 : 20,
          include: { _count: { select: { members: true } } },
        })
      : [],
  ]);

  let peopleWithStatus = people;
  if (session?.user?.id && (people as any[]).length > 0) {
    const peopleIds = (people as any[]).map((u: any) => u.id);
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        status: { in: ["ACCEPTED", "PENDING"] },
        OR: [
          { senderId: session.user.id, receiverId: { in: peopleIds } },
          { senderId: { in: peopleIds }, receiverId: session.user.id },
        ],
      },
      select: { id: true, senderId: true, receiverId: true, status: true },
    });

    peopleWithStatus = await Promise.all(
      (people as any[]).map(async (u: any) => {
        const req = friendRequests.find(
          (r) =>
            (r.senderId === session.user.id && r.receiverId === u.id) ||
            (r.senderId === u.id && r.receiverId === session.user.id),
        );
        let friendStatus: "none" | "pending" | "friends" = "none";
        let incomingRequestId: string | null = null;

        if (req?.status === "ACCEPTED") {
          friendStatus = "friends";
        } else if (
          req?.status === "PENDING" &&
          req.senderId === session.user.id
        ) {
          friendStatus = "pending";
        } else if (
          req?.status === "PENDING" &&
          req.receiverId === session.user.id
        ) {
          incomingRequestId = req.id;
        }

        let canSendFriendRequest = false;
        let friendRequestBlockReason: "NOBODY" | "NO_MUTUAL_FRIEND" | null =
          null;
        if (friendStatus === "none") {
          const eligibility = await getFriendRequestEligibility(
            session.user.id,
            u.id,
          );
          canSendFriendRequest = eligibility.canSendFriendRequest;
          friendRequestBlockReason = eligibility.friendRequestBlockReason;
        }

        let canMessage = true;
        if (friendStatus !== "friends") {
          const targetMessageFriendsOnly =
            u.profile?.messageFromFriendsOnly ?? false;
          if (targetMessageFriendsOnly) {
            const dmKey = [session.user.id, u.id].sort().join("_");
            const existingConv = await prisma.conversation.findUnique({
              where: { dmKey },
              select: { id: true },
            });
            canMessage = !!existingConv;
          }
        }

        return {
          ...u,
          friendStatus,
          incomingRequestId,
          canSendFriendRequest,
          friendRequestBlockReason,
          canMessage,
        };
      }),
    );
  }

  return NextResponse.json({
    posts,
    documents,
    people: peopleWithStatus,
    groups,
    topics: tagsWithCorrectCount,
  });
}
