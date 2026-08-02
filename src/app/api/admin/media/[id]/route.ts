import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }
  const { id } = await params;
  const { hidden } = await req.json().catch(() => ({}));
  if (typeof hidden !== "boolean") {
    return NextResponse.json(
      { error: "Thiếu trạng thái hidden" },
      { status: 400 },
    );
  }
  const exists = await prisma.document.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json(
      { error: "Không tìm thấy media" },
      { status: 404 },
    );
  }
  await prisma.document.update({ where: { id }, data: { hidden } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { fileKey: true },
  });
  if (!doc) {
    return NextResponse.json(
      { error: "Không tìm thấy media" },
      { status: 404 },
    );
  }

  if (doc.fileKey) {
    await utapi.deleteFiles([doc.fileKey]).catch((err) => {
      console.error("[UploadThing] Xóa file thất bại:", err);
    });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
