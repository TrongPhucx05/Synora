import type {
  SupportRequestStatus,
  SupportRequestType,
} from "@/generated/prisma/enums";

export const TYPE_LABELS: Record<SupportRequestType, string> = {
  ACCOUNT_SUPPORT: "Hỗ trợ tài khoản",
  BUG_REPORT: "Báo cáo lỗi",
  FEEDBACK: "Góp ý / Đề xuất",
  BAN_APPEAL: "Khiếu nại tài khoản bị khóa",
  ACCOUNT_DELETION: "Yêu cầu xóa tài khoản",
  OTHER: "Khác",
};

export const STATUS_LABELS: Record<SupportRequestStatus, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  WAITING_FOR_USER: "Chờ bạn cung cấp thêm thông tin",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
  REJECTED: "Từ chối",
};
