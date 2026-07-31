"use client";
import { X, Send } from "lucide-react";
import { useState } from "react";
import type { AdminSupportRequestRow } from "@/lib/support/types";

export function SupportRequestDetailModal({
  request,
  onClose,
  onResolve,
}: {
  request: AdminSupportRequestRow;
  onClose: () => void;
  onResolve: (reply: string) => void;
}) {
  const [reply, setReply] = useState("");

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Chi tiết yêu cầu hỗ trợ
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-slate-400 mb-1">Người gửi</p>
            <p className="text-sm font-medium text-slate-700">
              {request.user.name}
            </p>
            <p className="text-xs text-slate-400">@{request.user.username}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Tiêu đề</p>
            <p className="text-sm font-medium text-slate-700">
              {request.subject}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Nội dung</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
              {request.message}
            </p>
          </div>

          {request.status === "PENDING" ? (
            <div>
              <p className="text-xs text-slate-400 mb-1">
                Phản hồi cho người dùng (sẽ gửi qua thông báo)
              </p>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Vd: Chúng tôi đã xem xét và mở lại tài khoản của bạn..."
                className="w-full text-sm border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Đã xử lý lúc {request.resolvedAt}
            </div>
          )}
        </div>

        {request.status === "PENDING" && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              onClick={() => onResolve(reply)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600"
            >
              <Send size={15} /> Gửi phản hồi & Đánh dấu đã xử lý
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
