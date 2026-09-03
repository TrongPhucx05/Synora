"use client";
import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { clsx } from "clsx";

export type DeleteAccountPayload = { note?: string; notifyUser: boolean };

export function DeleteAccountModal({
  userName,
  loading,
  onConfirm,
  onCancel,
}: {
  userName: string;
  loading?: boolean;
  onConfirm: (payload: DeleteAccountPayload) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
            <Trash2 size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Xóa tài khoản {userName}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Tài khoản sẽ bị xóa vĩnh viễn sau 7 ngày. Có thể hủy lịch xóa bất
              cứ lúc nào trước thời điểm đó.
            </p>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-4">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <AlertTriangle
              size={15}
              className="text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Toàn bộ bài viết, tài liệu, bình luận và tin nhắn của người dùng
              sẽ bị xóa vĩnh viễn cùng tài khoản khi hết hạn.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              Ghi chú (hiển thị cho người dùng)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: vi phạm nghiêm trọng quy định cộng đồng"
              className="w-full text-xs border border-surface-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4"
            />
            <span className="text-xs text-text-secondary">
              Gửi thông báo cho người dùng
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-3 bg-surface-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-text-secondary rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() =>
              onConfirm({ note: note.trim() || undefined, notifyUser })
            }
            disabled={loading}
            className={clsx(
              "px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors",
              loading && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? "Đang xử lý..." : "Xác nhận xóa sau 7 ngày"}
          </button>
        </div>
      </div>
    </div>
  );
}
