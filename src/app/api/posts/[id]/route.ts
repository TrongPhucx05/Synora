import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_VISIBILITY = ["PUBLIC", "FRIENDS_ONLY", "PRIVATE"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const {
    content,
    visibility,
    removedDocIds = [],
    uploadedMedia = [],
    uploadedDocs = [],
  } = body;

  if (!content?.trim())
    return NextResponse.json(
      { error: "Nội dung không được trống" },
      { status: 400 },
    );

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  if (post.authorId !== session.user.id)
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const tags: string[] = Array.from(
    new Set<string>(
      ((content.match(/#[\wÀ-ỹ]+/gu) ?? []) as string[]).map((t: string) =>
        t.replace(/^#/, "").toLowerCase(),
      ),
    ),
  );

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

  const normalizeExt = (type: string) =>
    (MIME_TO_EXT[type.toLowerCase()] ?? type).toUpperCase();

  const getDocType = (type: string) => {
    const ext = normalizeExt(type);
    if (["JPG", "JPEG", "PNG", "GIF", "WEBP", "BMP", "SVG"].includes(ext))
      return "IMAGE";
    if (["MP4", "MOV", "AVI", "WEBM", "MKV"].includes(ext)) return "VIDEO";
    if (ext === "PDF") return "PDF";
    return "OTHER";
  };

  const allNewFiles = [
    ...uploadedMedia.map((f: any) => ({ ...f, docType: getDocType(f.type) })),
    ...uploadedDocs.map((f: any) => ({ ...f, docType: getDocType(f.type) })),
  ];

  const visibilityMap: Record<string, "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE"> = {
    public: "PUBLIC",
    friends: "FRIENDS_ONLY",
    private: "PRIVATE",
    PUBLIC: "PUBLIC",
    FRIENDS_ONLY: "FRIENDS_ONLY",
    PRIVATE: "PRIVATE",
  };
  const normalizedVisibility = visibility
    ? (visibilityMap[visibility] ?? undefined)
    : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tagsOnPosts.deleteMany({ where: { postId: id } });

    await Promise.all(
      tags.map(async (slug: string) => {
        const tag = await tx.tag.upsert({
          where: { slug },
          update: {},
          create: { name: slug, slug },
        });
        await tx.tagsOnPosts.create({ data: { postId: id, tagId: tag.id } });
      }),
    );

    if (removedDocIds.length > 0) {
      await tx.document.deleteMany({
        where: { id: { in: removedDocIds }, postId: id },
      });
    }

    if (allNewFiles.length > 0) {
      await tx.document.createMany({
        data: allNewFiles.map((f: any) => ({
          title: f.name,
          fileUrl: f.url,
          fileKey: f.key,
          fileSize: typeof f.size === "number" ? f.size : 0,
          mimeType: normalizeExt(f.type),
          type: f.docType,
          uploaderId: session.user.id,
          postId: id,
        })),
      });
    }

    return tx.post.update({
      where: { id },
      data: {
        content: content.trim(),
        ...(normalizedVisibility && { visibility: normalizedVisibility }),
        updatedAt: new Date(),
        editedAt: new Date(),
      },
      include: {
        author: { include: { profile: true } },
        tags: { include: { tag: true } },
        documents: true,
      },
    });
  });

  return NextResponse.json(updated);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  try {
    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post)
      return NextResponse.json(
        { error: "Không tìm thấy bài viết" },
        { status: 404 },
      );

    const isOwner = session?.user?.id === post.authorId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (post.hidden && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết" },
        { status: 404 },
      );
    }

    return NextResponse.json(post);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 },
    );
  if (post.authorId !== session.user.id)
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
