export type ViolationReason =
  | "SPAM"
  | "INAPPROPRIATE"
  | "COPYRIGHT"
  | "MISINFORMATION"
  | "OTHER";

export const VIOLATION_REASON_LABELS: Record<ViolationReason, string> = {
  SPAM: "Spam / quảng cáo",
  INAPPROPRIATE: "Nội dung không phù hợp",
  COPYRIGHT: "Vi phạm bản quyền",
  MISINFORMATION: "Thông tin sai lệch",
  OTHER: "Lý do khác",
};

export const VIOLATION_REASONS = Object.keys(
  VIOLATION_REASON_LABELS,
) as ViolationReason[];