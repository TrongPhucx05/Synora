import { TYPE_LABELS, STATUS_LABELS } from "@/lib/support/labels";
import type { SupportRequestStatus, SupportRequestType } from "@/generated/prisma/enums";

function wrap(title: string, bodyHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="margin-bottom:4px;">${title}</h2>
      ${bodyHtml}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Synora - Hệ thống hỗ trợ</p>
    </div>
  `;
}

export function supportRequestCreatedEmail(params: {
  code: string;
  type: SupportRequestType;
  subject: string;
  message: string;
  createdAt: Date;
  trackingUrl?: string;
}) {
  const { code, type, subject, message, createdAt, trackingUrl } = params;
  return {
    subject: `Đã nhận yêu cầu hỗ trợ ${code} - Synora`,
    html: wrap(
      "Yêu cầu của bạn đã được ghi nhận",
      `
        <p>Mã yêu cầu: <strong>${code}</strong></p>
        <p>Loại yêu cầu: ${TYPE_LABELS[type]}</p>
        <p>Tiêu đề: <strong>${subject}</strong></p>
        <p>Nội dung: ${message.slice(0, 300)}${message.length > 300 ? "..." : ""}</p>
        <p>Thời gian gửi: ${createdAt.toLocaleString("vi-VN")}</p>
        <p>Trạng thái hiện tại: ${STATUS_LABELS.PENDING}</p>
        ${
          trackingUrl
            ? `<p><a href="${trackingUrl}" style="color:#3b82f6;">Theo dõi yêu cầu của bạn tại đây</a></p>`
            : `<p>Đăng nhập vào tài khoản để theo dõi yêu cầu trong mục "Trợ giúp".</p>`
        }
      `,
    ),
  };
}

export function supportRequestStatusUpdateEmail(params: {
  code: string;
  subject: string;
  status: SupportRequestStatus;
  reply?: string;
  updatedAt: Date;
}) {
  const { code, subject, status, reply, updatedAt } = params;
  return {
    subject: `Cập nhật yêu cầu hỗ trợ ${code} - Synora`,
    html: wrap(
      "Yêu cầu của bạn vừa được cập nhật",
      `
        <p>Mã yêu cầu: <strong>${code}</strong></p>
        <p>Về yêu cầu: <strong>${subject}</strong></p>
        <p>Trạng thái mới: <strong>${STATUS_LABELS[status]}</strong></p>
        ${reply ? `<p>Phản hồi từ quản trị viên:</p><p style="background:#f8fafc;padding:12px;border-radius:8px;">${reply}</p>` : ""}
        <p>Thời gian cập nhật: ${updatedAt.toLocaleString("vi-VN")}</p>
      `,
    ),
  };
}