import { TYPE_LABELS } from "@/lib/support/labels";
import { StatusBadge } from "./StatusBadge";
import type { TrackedSupportRequest } from "@/lib/support/types";

export function SupportRequestDetail({
  request,
}: {
  request: TrackedSupportRequest;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-slate-400">Mã yêu cầu</p>
          <p className="text-sm font-mono font-semibold text-slate-700">
            {request.code}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-1">Loại yêu cầu</p>
        <p className="text-sm text-slate-700">{TYPE_LABELS[request.type]}</p>
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-1">Tiêu đề</p>
        <p className="text-sm font-medium text-slate-700">{request.subject}</p>
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-1">Nội dung</p>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
          {request.message}
        </p>
      </div>

      <div className="text-xs text-slate-400">
        Gửi lúc {new Date(request.createdAt).toLocaleString("vi-VN")}
      </div>

      {request.replies.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Lịch sử cập nhật</p>
          <div className="flex flex-col gap-3">
            {request.replies.map((r, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={r.statusAtReply} />
                  <span className="text-[11px] text-slate-400">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                {r.message && (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {r.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
