import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await params;

  const request = await prisma.supportRequest.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });

  if (!request || request.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Không tìm thấy yêu cầu" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    code: request.code,
    type: request.type,
    subject: request.subject,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    replies: request.replies.map((r) => ({
      message: r.message,
      statusAtReply: r.statusAtReply,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
