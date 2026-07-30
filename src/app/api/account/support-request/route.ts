import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { subject, message } = await req.json().catch(() => ({}));

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin" },
      { status: 400 },
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { error: "Nội dung quá dài (tối đa 2000 ký tự)" },
      { status: 400 },
    );
  }

  try {
    const recentCount = await prisma.supportRequest.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
      },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Bạn đã gửi quá nhiều yêu cầu trong 24 giờ qua" },
        { status: 429 },
      );
    }

    await prisma.supportRequest.create({
      data: {
        userId: session.user.id,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/account/support-request]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
