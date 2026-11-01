import { prisma } from "@/lib/prisma";

export const MAX_MEMORY_NOTES = 8;
export const MAX_MEMORY_NOTE_CHARS = 160;
export const MEMORY_MARKER = "[[MEMORY:";
export const MEMORY_PATTERN = /\[\[MEMORY:\s*([^\]]{3,160})\]\]/;

export const MEMORY_INSTRUCTION = [
  "GHI NHỚ: chỉ khi người dùng nêu yêu cầu hoặc sở thích LÂU DÀI (thường có các dấu hiệu như " +
    '"mỗi khi", "mỗi lần", "từ giờ", "lần sau", "luôn", "hãy nhớ", "mặc định", "đừng bao giờ", ' +
    '"I prefer", "whenever", "from now on") về: cách bạn trả lời, cách xử lý tài liệu, ngôn ngữ, ' +
    "mức độ chi tiết, hoặc trình độ/ngành học của họ, hãy trả lời bình thường rồi thêm ĐÚNG MỘT dòng " +
    "cuối cùng có dạng [[MEMORY: ghi chú ngắn dưới 120 ký tự]].",
  'Ví dụ: "Mỗi khi tôi gửi tài liệu thì tóm tắt ngắn gọn" -> [[MEMORY: Khi nhận tài liệu, tóm tắt ngắn gọn nội dung]]. ' +
    '"Tôi là sinh viên năm 2 CNTT, hãy giải thích dễ hiểu" -> [[MEMORY: Sinh viên năm 2 CNTT, thích giải thích dễ hiểu]].',
  'Yêu cầu chỉ một lần (ví dụ "Tóm tắt chương 2 giúp tôi") thì KHÔNG thêm dòng này.',
  "Không ghi thông tin nhạy cảm (sức khỏe, tài chính, chính trị, tôn giáo, địa chỉ, số điện thoại...).",
].join("\n");

export function parseMemory(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_MEMORY_NOTES);
}

export async function addMemoryNote(
  userId: string,
  note: string,
): Promise<boolean> {
  const clean = note.replace(/\s+/g, " ").trim().slice(0, MAX_MEMORY_NOTE_CHARS);
  if (clean.length < 3) return false;

  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { aiMemory: true },
  });
  if (!p) return false;

  const lines = parseMemory(p.aiMemory);
  if (lines.some((l) => l.toLowerCase() === clean.toLowerCase())) return false;

  const next = [...lines, clean].slice(-MAX_MEMORY_NOTES).join("\n");
  await prisma.profile.update({ where: { userId }, data: { aiMemory: next } });
  return true;
}