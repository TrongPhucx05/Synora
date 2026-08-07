export type ReportTargetType =
  | "USER"
  | "POST"
  | "COMMENT"
  | "MESSAGE"
  | "DOCUMENT";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export type ReportReasonKey =
  | "HATE_SPEECH"
  | "SPAM"
  | "SEXUAL_CONTENT"
  | "VIOLENCE"
  | "SCAM"
  | "HARASSMENT"
  | "OTHER";

export const REASON_LABELS: Record<ReportReasonKey, string> = {
  HATE_SPEECH: "Ngôn từ thù ghét",
  SPAM: "Spam / Quảng cáo",
  SEXUAL_CONTENT: "Nội dung khiêu dâm",
  VIOLENCE: "Bạo lực / Đe dọa",
  SCAM: "Lừa đảo",
  HARASSMENT: "Quấy rối",
  OTHER: "Khác",
};

export type ReportPerson = {
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type AdminReportRow = {
  id: string;
  reporter: ReportPerson;
  targetType: ReportTargetType;
  targetPreview: string;
  targetAuthor: ReportPerson | null;
  reason: ReportReasonKey;
  detail: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
};
