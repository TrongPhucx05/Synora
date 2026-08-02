import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { supportRequestReceivedEmail, supportRequestResolvedEmail } from "@/lib/email/templates/support-request-received";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;
  const { reply } = await req.json().catch(() => ({}));

  const request = await prisma.supportRequest.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!request)
    return NextResponse.json(
      { error: "Không tìm thấy yêu cầu" },
      { status: 404 },
    );
  if (request.status === "RESOLVED")
    return NextResponse.json(
      { error: "Yêu cầu này đã được xử lý" },
      { status: 409 },
    );

  await prisma.supportRequest.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  if (request.type === "BAN_APPEAL") {
    const { subject, html } = supportRequestResolvedEmail(
      request.subject,
      reply?.trim(),
    );
    await emailService.send({ to: request.user.email, subject, html });
  } else {
    await prisma.notification.create({
      data: {
        recipientId: request.userId,
        actorId: session.user.id,
        type: "SYSTEM",
        message: reply?.trim()
          ? `Yêu cầu hỗ trợ "${request.subject}" của bạn đã được xử lý: ${reply.trim()}`
          : `Yêu cầu hỗ trợ "${request.subject}" của bạn đã được xử lý.`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
