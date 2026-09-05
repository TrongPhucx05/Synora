"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !username || !email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError("Username chỉ gồm chữ thường, số và dấu _");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
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
            Tạo tài khoản
          </h2>
          <p className="text-sm text-text-muted text-center mb-5">
            Bắt đầu hành trình học tập của bạn
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg">
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nguyễn Văn An"
                className="w-full px-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Username{" "}
                <span className="text-text-muted font-normal">
                  (chữ thường, số, _)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="nguyenvanan"
                  className="w-full pl-7 pr-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
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
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  placeholder="Ít nhất 8 ký tự"
                  className="w-full px-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </div>

          <p className="text-center text-sm text-text-muted mt-4">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-blue-500 dark:text-blue-400 font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
