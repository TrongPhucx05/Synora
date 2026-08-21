"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SupportRequestDetail } from "./SupportRequestDetail";
import type { TrackedSupportRequest } from "@/lib/support/types";

export function TrackRequestPanel({
  initialCode,
  initialToken,
}: {
  initialCode?: string;
  initialToken?: string;
}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedSupportRequest | null>(null);

  useEffect(() => {
    if (!initialCode || !initialToken) return;
    setLoading(true);
    fetch(
      `/api/support/track?code=${encodeURIComponent(initialCode)}&token=${encodeURIComponent(initialToken)}`,
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Không tìm thấy yêu cầu");
          return;
        }
        setResult(data);
      })
      .catch(() => setError("Không thể tra cứu, vui lòng thử lại"))
      .finally(() => setLoading(false));
  }, [initialCode, initialToken]);

  const handleSearch = async () => {
    setError(null);
    if (!code.trim() || !email.trim()) {
      setError("Vui lòng nhập mã yêu cầu và email liên hệ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/support/track?code=${encodeURIComponent(code.trim())}&email=${encodeURIComponent(email.trim())}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Không tìm thấy yêu cầu");
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError("Không thể tra cứu, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <SupportRequestDetail request={result} />
        <button
          onClick={() => setResult(null)}
          className="mt-4 text-xs font-semibold text-primary hover:underline"
        >
          Tra cứu yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Theo dõi yêu cầu</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập mã yêu cầu và email liên hệ đã dùng khi gửi yêu cầu để xem trạng
          thái.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1 block">
          Mã yêu cầu
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SUP-20260819-000123"
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-700 mb-1 block">
          Email liên hệ
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@example.com"
          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <button
        onClick={handleSearch}
        disabled={loading}
        className="self-end flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Search size={14} /> {loading ? "Đang tra cứu..." : "Tra cứu"}
      </button>
    </div>
  );
}
