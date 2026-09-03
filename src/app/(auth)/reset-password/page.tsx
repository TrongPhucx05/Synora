"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const invalid = !token;

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-200 shadow-sm p-6">
      <h2 className="text-base font-bold text-text-primary text-center mb-1">
        Đặt lại mật khẩu
      </h2>
      <p className="text-sm text-text-muted text-center mb-5">
        Nhập mật khẩu mới cho tài khoản của bạn
      </p>

      {invalid ? (
        <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-500">
            Link không hợp lệ. Vui lòng yêu cầu lại từ trang{" "}
            <Link href="/forgot-password" className="underline font-medium">
              Quên mật khẩu
            </Link>
            .
          </p>
        </div>
      ) : success ? (
        <div className="px-3 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Đặt lại mật khẩu thành công! Đang chuyển tới trang đăng nhập...
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự"
                  className="w-full pl-10 pr-10 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
