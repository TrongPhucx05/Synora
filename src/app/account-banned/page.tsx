import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Ban } from "lucide-react";
import { LOCK_REASON_LABELS, type LockReason } from "@/lib/admin/account-lock";
import { AccountLockedActions } from "@/components/account/AccountLockedActions";

export default async function AccountBannedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, suspensionReason: true, suspensionNote: true },
  });

  if (!user || user.status === "ACTIVE") redirect("/feed");
  if (user.status === "SUSPENDED") redirect("/account-suspended");

  const reasonLabel = user.suspensionReason
    ? LOCK_REASON_LABELS[user.suspensionReason as LockReason]
    : "Vi phạm nghiêm trọng quy định cộng đồng";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <Ban size={26} />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">
          Tài khoản của bạn đã bị khóa vĩnh viễn
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Chỉ quản trị viên mới có thể mở lại tài khoản này.
        </p>

        <div className="text-left flex flex-col gap-3 mb-6">
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-[11px] font-medium text-slate-400 mb-0.5">
              Lý do
            </p>
            <p className="text-sm text-slate-800">{reasonLabel}</p>
          </div>
          {user.suspensionNote && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">
                Ghi chú từ quản trị viên
              </p>
              <p className="text-sm text-slate-800">{user.suspensionNote}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mb-5">
          Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên qua{" "}
          <a
            href="mailto:trongphuc221205@gmail.com"
            className="text-primary hover:underline"
          >
            trongphuc221205@gmail.com
          </a>{" "}
          hoặc gửi yêu cầu hỗ trợ bên dưới.
        </p>

        <AccountLockedActions defaultSubject="Khiếu nại về việc khóa vĩnh viễn tài khoản" />
      </div>
    </div>
  );
}
