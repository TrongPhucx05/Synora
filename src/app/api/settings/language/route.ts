import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_LOCALES = ["VI", "EN"] as const;
type LocaleValue = (typeof VALID_LOCALES)[number];

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { language: true },
  });

  return NextResponse.json({
    language: (profile?.language ?? "VI").toLowerCase(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const raw =
    typeof body?.language === "string" ? body.language.toUpperCase() : null;

  if (!raw || !VALID_LOCALES.includes(raw as LocaleValue)) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { language: raw as LocaleValue },
    create: { userId: session.user.id, language: raw as LocaleValue },
  });

  return NextResponse.json({ language: raw.toLowerCase() });
}
