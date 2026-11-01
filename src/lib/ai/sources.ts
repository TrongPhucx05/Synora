import { prisma } from "@/lib/prisma";
import { isBlockedEitherWay } from "@/lib/block/server";
import { MAX_DOC_CHARS_STORED } from "./config";
import {
  detectKind,
  downloadFile,
  extractFromBuffer,
  ExtractError,
} from "./extract";

export { ExtractError };

export type AiSourceRef = {
  type: "DOCUMENT" | "ATTACHMENT" | "UPLOAD";
  id: string;
  title?: string;
};
export type ResolvedSource = {
  title: string;
  fileUrl: string;
  mimeType: string;
  name: string;
};
type Resolved =
  | { ok: true; data: ResolvedSource }
  | { ok: false; status: number; error: string };

const NOT_FOUND: Resolved = {
  ok: false,
  status: 404,
  error: "Không tìm thấy tài liệu",
};

async function areFriends(a: string, b: string) {
  const r = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ],
    },
    select: { id: true },
  });
  return !!r;
}

export async function resolveSource(
  userId: string,
  src: AiSourceRef,
): Promise<Resolved> {
  if (src.type === "UPLOAD") {
    if (!src.id.startsWith(`${userId}.`)) return NOT_FOUND;
    const title = (src.title ?? "Tệp tải lên").slice(0, 120);
    return {
      ok: true,
      data: { title, fileUrl: "", mimeType: "", name: title },
    };
  }

  if (src.type === "DOCUMENT") {
    const doc = await prisma.document.findUnique({
      where: { id: src.id },
      select: {
        title: true,
        fileUrl: true,
        mimeType: true,
        uploaderId: true,
        hidden: true,
        post: { select: { authorId: true, visibility: true, hidden: true } },
      },
    });
    if (!doc) return NOT_FOUND;

    if (doc.uploaderId !== userId) {
      if (doc.hidden) return NOT_FOUND;
      if (await isBlockedEitherWay(userId, doc.uploaderId)) return NOT_FOUND;
      const p = doc.post;
      if (p && p.authorId !== userId) {
        if (p.hidden || p.visibility === "PRIVATE") return NOT_FOUND;
        if (p.visibility === "FRIENDS_ONLY" && !(await areFriends(userId, p.authorId)))
          return NOT_FOUND;
      }
    }
    return {
      ok: true,
      data: {
        title: doc.title,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        name: doc.title,
      },
    };
  }

  const att = await prisma.messageAttachment.findUnique({
    where: { id: src.id },
    select: {
      name: true,
      url: true,
      mimeType: true,
      type: true,
      message: { select: { conversationId: true, deletedAt: true } },
    },
  });
  if (!att || att.type !== "DOCUMENT" || att.message.deletedAt) return NOT_FOUND;

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: att.message.conversationId,
        userId,
      },
    },
    select: { isAccepted: true },
  });
  if (!member) return NOT_FOUND;
  if (!member.isAccepted)
    return {
      ok: false,
      status: 403,
      error: "Hãy chấp nhận cuộc trò chuyện trước khi dùng AI với tệp này",
    };

  return {
    ok: true,
    data: {
      title: att.name,
      fileUrl: att.url,
      mimeType: att.mimeType ?? "",
      name: att.name,
    },
  };
}

export async function getSourceText(
  src: AiSourceRef,
  r: ResolvedSource,
): Promise<string> {
  const key = { sourceType_sourceId: { sourceType: src.type, sourceId: src.id } };
  const cached = await prisma.aiExtractedText.findUnique({
    where: key,
    select: { text: true },
  });
  if (cached) return cached.text;
  if (src.type === "UPLOAD")
    throw new ExtractError("Tệp tải lên đã hết hạn, hãy chọn lại tệp");

  const kind = detectKind(r.mimeType, r.name);
  if (!kind) throw new ExtractError("Chỉ hỗ trợ tài liệu PDF, DOCX, PPTX");

  let raw: string;
  try {
    raw = await extractFromBuffer(await downloadFile(r.fileUrl), kind);
  } catch (e) {
    if (e instanceof ExtractError) throw e;
    console.error("[ai] extract failed", e);
    throw new ExtractError("Không đọc được nội dung tài liệu");
  }

  const text = raw.replace(/\u0000/g, "").trim().slice(0, MAX_DOC_CHARS_STORED);
  if (text.length < 30)
    throw new ExtractError("Tài liệu không có văn bản (có thể là file scan/ảnh)");

  await prisma.aiExtractedText.upsert({
    where: key,
    create: { sourceType: src.type, sourceId: src.id, text },
    update: { text },
  });
  return text;
}