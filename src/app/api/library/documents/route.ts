import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  const level = searchParams.get("level");
  const grade = searchParams.get("grade");
  const major = searchParams.get("major");
  const subjectId = searchParams.get("subjectId");
  const type = searchParams.get("type");
  const sort = searchParams.get("sort") ?? "newest";
  const query = searchParams.get("query") ?? "";
  const cursor = searchParams.get("cursor");
  const mineOnly = searchParams.get("mine") === "1";
  const savedOnly = searchParams.get("saved") === "1";
  const take = 12;

  try {
    const where: any = {
      postId: null,
      type: { notIn: ["IMAGE", "VIDEO"] },
      ...(!mineOnly && { hidden: false }),
    };

    if (level && level !== "all") where.level = level;
    if (grade) where.grade = grade;
    if (major) where.major = major;
    if (subjectId) where.subjectId = subjectId;
    if (type && type !== "Tất cả") {
      const mimeMap: Record<string, string> = {
        PDF: "application/pdf",
        DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml",
        PPTX: "application/vnd.openxmlformats-officedocument.presentationml",
      };
      if (mimeMap[type]) where.mimeType = { startsWith: mimeMap[type] };
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { subject: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          uploader: {
            profile: { displayName: { contains: query, mode: "insensitive" } },
          },
        },
      ];
    }

    if (mineOnly && session?.user?.id) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { id: true },
      });
      if (user) where.uploaderId = user.id;
    }

    if (savedOnly && (session?.user?.id || session?.user?.email)) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { id: true },
      });
      if (user) where.savedBy = { some: { userId: user.id } };
    }

    const orderBy: any =
      sort === "mostDownloaded"
        ? { downloadCount: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : { createdAt: "desc" };

    const docs = await prisma.document.findMany({
      where,
      orderBy,
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        ...(session?.user?.id && {
          savedBy: { where: { userId: session.user.id }, select: { id: true } },
        }),
      },
    });

    const result = docs.map((d) => ({
      ...d,
      isSaved: Array.isArray(d.savedBy) && d.savedBy.length > 0,
      savedBy: undefined,
    }));

    const nextCursor = docs.length === take ? docs[docs.length - 1].id : null;
    return NextResponse.json({ docs: result, nextCursor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(session.user.id ? [{ id: session.user.id }] : []),
        ...(session.user.email ? [{ email: session.user.email }] : []),
      ],
    },
    select: { id: true },
  });

  if (!user)
    return NextResponse.json(
      { error: "Phiên đăng nhập không hợp lệ" },
      { status: 401 },
    );

  try {
    const body = await req.json();
    const {
      title,
      description,
      fileUrl,
      fileKey,
      fileSize,
      mimeType,
      level,
      grade,
      major,
      subject,
      subjectId,
      tags = [],
    } = body;

    if (!title || !fileUrl || !fileKey || !mimeType)
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 },
      );

    const getDocType = (mime: string) => {
      if (mime.includes("pdf")) return "PDF";
      if (mime.includes("wordprocessing")) return "DOCX";
      if (mime.includes("presentation")) return "PPTX";
      return "OTHER";
    };

    const doc = await prisma.document.create({
      data: {
        uploaderId: user.id,
        title,
        description,
        fileUrl,
        fileKey,
        fileSize: fileSize ?? 0,
        mimeType,
        type: getDocType(mimeType),
        level,
        grade,
        major,
        subject,
        subjectId,
        tags,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
