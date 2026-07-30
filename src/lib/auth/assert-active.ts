import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const LOCKED_MESSAGE: Record<"SUSPENDED" | "BANNED", string> = {
  SUSPENDED: "Tài khoản của bạn đang bị tạm khóa",
  BANNED: "Tài khoản của bạn đã bị khóa vĩnh viễn",
};

export async function assertActiveSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }),
    };
  }

  const status = session.user.status as "ACTIVE" | "SUSPENDED" | "BANNED";
  if (status === "SUSPENDED" || status === "BANNED") {
    return {
      session,
      response: NextResponse.json(
        { error: LOCKED_MESSAGE[status], code: "ACCOUNT_LOCKED", status },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}
