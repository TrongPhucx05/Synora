import JSZip from "jszip";
import { extractText, getDocumentProxy } from "unpdf";

export class ExtractError extends Error {}

export type DocKind = "PDF" | "DOCX" | "PPTX";

export function detectKind(mimeType: string, name: string): DocKind | null {
  const m = mimeType.toLowerCase();
  const n = name.toLowerCase();
  if (m.includes("pdf") || n.endsWith(".pdf")) return "PDF";
  if (m.includes("wordprocessingml") || n.endsWith(".docx")) return "DOCX";
  if (m.includes("presentationml") || n.endsWith(".pptx")) return "PPTX";
  return null;
}

const ALLOWED_HOST = /(^|\.)ufs\.sh$|^utfs\.io$/i;

export async function downloadFile(url: string): Promise<ArrayBuffer> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new ExtractError("Đường dẫn file không hợp lệ");
  }
  if (u.protocol !== "https:" || !ALLOWED_HOST.test(u.hostname))
    throw new ExtractError("Nguồn file không hợp lệ");

  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new ExtractError("Không tải được file");
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > 35 * 1024 * 1024) throw new ExtractError("File quá lớn");
  return res.arrayBuffer();
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

export async function extractFromBuffer(
  buf: ArrayBuffer,
  kind: DocKind,
): Promise<string> {
  if (kind === "PDF") {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  const zip = await JSZip.loadAsync(buf);

  if (kind === "DOCX") {
    const xml = await zip.file("word/document.xml")?.async("string");
    if (!xml) return "";
    return decodeXml(
      xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, ""),
    ).replace(/\n{3,}/g, "\n\n");
  }

  const num = (n: string) => Number(n.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
  const names = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => num(a) - num(b));
  const parts: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const xml = await zip.file(names[i])!.async("string");
    const text = decodeXml(
      xml.replace(/<\/a:p>/g, "\n").replace(/<[^>]+>/g, ""),
    ).trim();
    parts.push(`--- Slide ${i + 1} ---\n${text}`);
  }
  return parts.join("\n\n");
}