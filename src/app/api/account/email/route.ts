import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/email/validate";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (currentUser?.email === email) {
    return NextResponse.json(
      { error: "Email mới trùng với email hiện tại" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "Email này đã được sử dụng bởi tài khoản khác" },
      { status: 409 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      email,
      emailVerified: null,
    },
    select: { email: true },
  });

  return NextResponse.json({ email: updated.email });
}