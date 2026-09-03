"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Có lỗi xảy ra, vui lòng thử lại");
        return;
      }
      setSent(true);
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-surface dark:via-surface to-indigo-50 dark:to-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L14 5.5V12.5L9 16L4 12.5V5.5L9 2Z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="9" cy="9" r="2" fill="white" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Synora</h1>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-text-primary text-center mb-1">
            Quên mật khẩu
          </h2>
          <p className="text-sm text-text-muted text-center mb-5">
            Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          {sent ? (
            <div className="px-3 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Nếu email này tồn tại trong hệ thống, một link đặt lại mật khẩu
                đã được gửi tới hộp thư của bạn. Vui lòng kiểm tra cả mục Spam.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-text-muted mt-4">
            <Link
              href="/login"
              className="text-blue-500 font-semibold hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
