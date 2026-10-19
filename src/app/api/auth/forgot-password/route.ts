import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password";
import { generateResetToken } from "@/lib/email/token";
import { isValidEmail } from "@/lib/email/validate";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Vui lòng nhập email" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email không đúng định dạng" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const { rawToken, hashedToken } = generateResetToken();
    const expires = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    await prisma.verificationToken.create({
      data: { identifier: email, token: hashedToken, expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

    const { error: sendError } = await emailService.send({
      to: email,
      subject: "Đặt lại mật khẩu Synora",
      html: resetPasswordTemplate(resetUrl, RESET_TOKEN_EXPIRY_MINUTES),
    });

    if (sendError) {
      console.error("FORGOT_PASSWORD_SEND_ERROR:", sendError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
