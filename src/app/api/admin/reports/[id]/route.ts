import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { action, note } = await req.json().catch(() => ({}));

  if (action !== "resolve" && action !== "dismiss") {
    return NextResponse.json(
      { error: "Hành động không hợp lệ" },
      { status: 400 },
    );
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json(
      { error: "Không tìm thấy báo cáo" },
      { status: 404 },
    );
  }

  const trimmedNote = note?.trim() || undefined;

  await prisma.$transaction([
    prisma.report.update({
      where: { id },
      data: {
        status: action === "resolve" ? "RESOLVED" : "DISMISSED",
        resolvedById: session.user.id,
        resolutionNote: trimmedNote,
        resolvedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        recipientId: report.reporterId,
        actorId: session.user.id,
        type: action === "resolve" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
        message:
          action === "resolve"
            ? `Báo cáo của bạn đã được xử lý.${trimmedNote ? " Ghi chú: " + trimmedNote : ""}`
            : `Báo cáo của bạn đã được xem xét nhưng không phát hiện vi phạm.${trimmedNote ? " Ghi chú: " + trimmedNote : ""}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
