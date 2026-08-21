import { prisma } from "@/lib/prisma";

function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

export async function generateSupportRequestCode(): Promise<string> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `SUP-${datePart}-${randomDigits(6)}`;
    const existing = await prisma.supportRequest.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Không thể tạo mã yêu cầu duy nhất, vui lòng thử lại");
}
