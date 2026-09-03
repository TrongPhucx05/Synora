import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_THEMES = ["LIGHT", "DARK", "SYSTEM"] as const;
type ThemeValue = (typeof VALID_THEMES)[number];

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { theme: true },
  });

  return NextResponse.json({
    theme: (profile?.theme ?? "SYSTEM").toLowerCase(),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const raw =
    typeof body?.theme === "string" ? body.theme.toUpperCase() : null;

  if (!raw || !VALID_THEMES.includes(raw as ThemeValue)) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { theme: raw as ThemeValue },
    create: { userId: session.user.id, theme: raw as ThemeValue },
  });

  return NextResponse.json({ theme: raw.toLowerCase() });
}