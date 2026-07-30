import {
  VIOLATION_REASONS,
  VIOLATION_REASON_LABELS,
  type ViolationReason,
} from "@/lib/admin/moderation";

export type LockType = "SUSPEND" | "BAN";
export type LockReason = ViolationReason;

export const LOCK_REASONS = VIOLATION_REASONS;
export const LOCK_REASON_LABELS = VIOLATION_REASON_LABELS;

export const SUSPEND_DURATION_PRESETS: { label: string; hours: number }[] = [
  { label: "24 giờ", hours: 24 },
  { label: "3 ngày", hours: 72 },
  { label: "7 ngày", hours: 168 },
  { label: "30 ngày", hours: 720 },
];

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}