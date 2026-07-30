import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedIds } from "@/lib/block/server";
import { assertActiveSession } from "@/lib/auth/assert-active";

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    const friendIds: string[] = [];
    let blockedIds: string[] = [];

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
      blockedIds = await getBlockedIds(session.user.id);
    }

    const posts = await prisma.post.findMany({
      where: {
        ...(blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {}),
        OR: [
          { visibility: "PUBLIC" },
          ...(session?.user?.id
            ? [
                { authorId: session.user.id },
                {
                  visibility: "FRIENDS_ONLY" as const,
                  authorId: { in: friendIds },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { include: { profile: true } },
        tags: { include: { tag: true } },
        documents: true,
        _count: { select: { likes: true, comments: true } },
        likes: session?.user?.id
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
      },
    });
    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, response } = await assertActiveSession();
  if (response) return response;

  try {
    const {
      content,
      visibility = "PUBLIC",
      tags = [],
      uploadedMedia = [],
      uploadedDocs = [],
    } = await req.json();

    if (!content?.trim())
      return NextResponse.json(
        { error: "Nội dung không được trống" },
        { status: 400 },
      );

    const VALID_VISIBILITY = ["PUBLIC", "FRIENDS_ONLY", "PRIVATE"];
    const visibilityMap: Record<string, "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE"> =
      {
        public: "PUBLIC",
        friends: "FRIENDS_ONLY",
        private: "PRIVATE",
        PUBLIC: "PUBLIC",
        FRIENDS_ONLY: "FRIENDS_ONLY",
        PRIVATE: "PRIVATE",
      };
    const normalizedVisibility = visibilityMap[visibility] ?? "PUBLIC";

    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "JPG",
      "image/png": "PNG",
      "image/gif": "GIF",
      "image/webp": "WEBP",
      "image/bmp": "BMP",
      "image/svg+xml": "SVG",
      "video/mp4": "MP4",
      "video/quicktime": "MOV",
      "video/x-msvideo": "AVI",
      "video/webm": "WEBM",
      "video/x-matroska": "MKV",
      "application/pdf": "PDF",
    };

    const getDocType = (type: string) => {
      const ext = (MIME_TO_EXT[type.toLowerCase()] ?? type).toUpperCase();
      if (["JPG", "JPEG", "PNG", "GIF", "WEBP", "BMP", "SVG"].includes(ext))
        return "IMAGE";
      if (["MP4", "MOV", "AVI", "WEBM", "MKV"].includes(ext)) return "VIDEO";
      if (ext === "PDF") return "PDF";
      return "OTHER";
    };

    const allFiles = [
      ...uploadedMedia.map((f: any) => ({ ...f, docType: getDocType(f.type) })),
      ...uploadedDocs.map((f: any) => ({ ...f, docType: getDocType(f.type) })),
    ];

    const post = await prisma.post.create({
      data: {
        content,
        visibility: normalizedVisibility,
        authorId: session!.user.id,
        tags: {
          create: await Promise.all(
            tags.map(async (tagName: string) => {
              const slug = tagName.replace(/^#/, "").toLowerCase();
              const tag = await prisma.tag.upsert({
                where: { slug },
                update: {},
                create: { name: slug, slug },
              });
              return { tagId: tag.id };
            }),
          ),
        },
        documents:
          allFiles.length > 0
            ? {
                create: allFiles.map((f: any) => ({
                  title: f.name,
                  fileUrl: f.url,
                  fileKey: f.key,
                  fileSize: typeof f.size === "number" ? f.size : 0,
                  mimeType: f.type,
                  type: f.docType,
                  uploaderId: session!.user.id,
                })),
              }
            : undefined,
      },
      include: {
        author: { include: { profile: true } },
        tags: { include: { tag: true } },
        documents: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}