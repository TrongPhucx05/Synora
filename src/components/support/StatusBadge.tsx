import { clsx } from "clsx";
import { STATUS_LABELS } from "@/lib/support/labels";
import type { SupportRequestStatus } from "@/lib/support/types";

const STATUS_CLASSES: Record<SupportRequestStatus, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  WAITING_FOR_USER: "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
  RESOLVED: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CLOSED: "bg-surface-100 text-text-muted",
  REJECTED: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
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
