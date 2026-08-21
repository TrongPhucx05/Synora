import { clsx } from "clsx";
import { STATUS_LABELS } from "@/lib/support/labels";
import type { SupportRequestStatus } from "@/lib/support/types";

const STATUS_CLASSES: Record<SupportRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  WAITING_FOR_USER: "bg-violet-50 text-violet-600",
  RESOLVED: "bg-emerald-50 text-emerald-600",
  CLOSED: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
  return (
    <span
      className={clsx(
        "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
