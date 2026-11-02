import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc)
    return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
  if (doc.uploaderId !== session.user.id)
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      level,
      grade,
      major,
      subject,
      subjectId,
      fileUrl,
      fileKey,
      fileSize,
      mimeType,
    } = body;

    const getDocType = (mime: string) => {
      if (mime.includes("pdf")) return "PDF";
      if (mime.includes("wordprocessing")) return "DOCX";
      if (mime.includes("presentation")) return "PPTX";
      return "OTHER";
    };

    if (fileUrl !== undefined) {
      await prisma.$transaction([
        prisma.aiExtractedText.deleteMany({
          where: { sourceType: "DOCUMENT", sourceId: id },
        }),
        prisma.aiDocumentSummary.deleteMany({ where: { documentId: id } }),
      ]);
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(level !== undefined && { level: level || null }),
        ...(grade !== undefined && { grade: grade || null }),
        ...(major !== undefined && { major: major || null }),
        ...(subject !== undefined && { subject: subject || null }),
        ...(subjectId !== undefined && { subjectId: subjectId || null }),
        ...(fileUrl !== undefined && {
          fileUrl,
          fileKey,
          fileSize: fileSize ?? 0,
          mimeType,
          type: getDocType(mimeType) as any,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc)
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (doc.uploaderId !== session.user.id)
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  await prisma.document.delete({ where: { id } });
  await prisma.aiExtractedText.deleteMany({
    where: { sourceType: "DOCUMENT", sourceId: id },
  });
  return NextResponse.json({ ok: true });
}