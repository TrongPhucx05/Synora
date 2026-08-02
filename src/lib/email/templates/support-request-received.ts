export function supportRequestReceivedEmail(subject: string) {
  return {
    subject: "Đã nhận yêu cầu khiếu nại tài khoản - Synora",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Đã nhận khiếu nại của bạn</h2>
        <p>Chúng tôi đã nhận được khiếu nại: <strong>${subject}</strong></p>
        <p>Đội ngũ quản trị viên sẽ xem xét và phản hồi qua email này trong thời gian sớm nhất.</p>
      </div>
    `,
  };
}

export function supportRequestResolvedEmail(subject: string, reply?: string) {
  return {
    subject: "Phản hồi khiếu nại tài khoản - Synora",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Khiếu nại của bạn đã được xử lý</h2>
        <p>Về yêu cầu: <strong>${subject}</strong></p>
        ${reply ? `<p>Phản hồi từ quản trị viên: ${reply}</p>` : ""}
      </div>
    `,
  };
}