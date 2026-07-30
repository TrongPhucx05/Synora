import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          status: "ACTIVE",
          suspendedUntil: null,
          suspensionReason: null,
          suspensionNote: null,
        },
      });

      await tx.moderationAction.create({
        data: {
          type: "ACCOUNT_UNLOCKED",
          adminId: session.user.id,
          targetUserId: id,
          notifiedUser: true,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: id,
          actorId: session.user.id,
          type: "ACCOUNT_UNLOCKED",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/admin/users/[id]/unlock]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}