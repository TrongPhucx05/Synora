"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LifeBuoy } from "lucide-react";
import { SupportRequestModal } from "./SupportRequestModal";

export function AccountLockedActions({
  defaultSubject,
}: {
  defaultSubject?: string;
}) {
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowSupportModal(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
        >
          Gửi yêu cầu hỗ trợ
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
        >
          Đăng xuất
        </button>
      </div>

      {showSupportModal && (
        <SupportRequestModal
          defaultSubject={defaultSubject}
          type="BAN_APPEAL"
          onClose={() => setShowSupportModal(false)}
        />
      )}
    </>
  );
}
