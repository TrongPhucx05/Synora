export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export type UploadKind = "PDF" | "DOCX" | "PPTX";

export function detectUploadKind(file: File): UploadKind | null {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || file.type === "application/pdf") return "PDF";
  if (n.endsWith(".docx")) return "DOCX";
  if (n.endsWith(".pptx")) return "PPTX";
  return null;
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

export async function extractTextInBrowser(
  file: File,
  kind: UploadKind,
): Promise<string> {
  const buf = await file.arrayBuffer();

  if (kind === "PDF") {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  const { default: JSZip } = await import("jszip");
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