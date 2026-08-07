import type { ReportTargetType } from "@/lib/reports/types";

export async function submitReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  detail?: string,
) {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetType, targetId, reason, detail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Không thể gửi báo cáo");
  return data;
}
