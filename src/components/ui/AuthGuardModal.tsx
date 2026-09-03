"use client";

import { X } from "lucide-react";
import Link from "next/link";

interface AuthGuardModalProps {
  onClose: () => void;
  action?: string;
}

export default function AuthGuardModal({
  onClose,
  action = "thực hiện chức năng này",
}: AuthGuardModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-text-secondary hover:bg-surface-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 2L14 5.5V12.5L9 16L4 12.5V5.5L9 2Z"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="9" cy="9" r="2" fill="white" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-1">
            Bạn chưa đăng nhập
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Vui lòng đăng nhập để{" "}
            <span className="font-medium text-text-primary">{action}</span> trên
            Synora.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-surface-200 text-text-primary text-sm font-medium rounded-xl hover:bg-surface-50 transition-colors"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}