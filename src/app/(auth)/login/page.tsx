"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email hoặc mật khẩu không đúng");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;

    setLoading(false);

    if (role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/feed");
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
          <p className="text-sm text-text-muted mt-0.5">
            Nền tảng học tập cộng đồng
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-200 shadow-sm p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 11L5 7L9 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Về trang chủ
          </Link>
          <h2 className="text-base font-bold text-text-primary text-center mb-1">
            Đăng nhập
          </h2>
          <p className="text-sm text-text-muted text-center mb-5">
            Chào mừng bạn trở lại!
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email / Tên người dùng
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email hoặc tên người dùng"
                className="w-full px-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input type="checkbox" className="accent-blue-500" /> Ghi nhớ
                đăng nhập
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>

          <p className="text-center text-sm text-text-muted mt-4">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-blue-500 dark:text-blue-400 font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
