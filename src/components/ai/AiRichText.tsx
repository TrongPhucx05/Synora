import { type ReactNode } from "react";
import clsx from "clsx";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`"))
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="px-1 py-0.5 rounded bg-surface-200 text-[0.85em]"
        >
          {p.slice(1, -1)}
        </code>
      );
    return p;
  });
}

export default function AiRichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let code: string[] | null = null;
  let list: { ordered: boolean; items: ReactNode[] } | null = null;
  let k = 0;

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    out.push(
      <Tag
        key={`l${k++}`}
        className={clsx(
          "my-1 pl-5 space-y-0.5",
          list.ordered ? "list-decimal" : "list-disc",
        )}
      >
        {list.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  const pushCode = (lines: string[]) =>
    out.push(
      <pre
        key={`c${k++}`}
        className="my-1 p-2 rounded-lg bg-surface-200 text-xs overflow-x-auto whitespace-pre"
      >
        {lines.join("\n")}
      </pre>,
    );

  text.split("\n").forEach((raw, idx) => {
    const line = raw.replace(/\s+$/, "");

    if (line.trim().startsWith("```")) {
      if (code) {
        pushCode(code);
        code = null;
      } else {
        flushList();
        code = [];
      }
      return;
    }
    if (code) {
      code.push(raw);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) {
      flushList();
      out.push(
        <p key={`h${k++}`} className="mt-2 mb-0.5 font-semibold text-text-primary">
          {renderInline(h[1], `h${idx}`)}
        </p>,
      );
      return;
    }

    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const li = ul ?? ol;
    if (li) {
      const ordered = !ul;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(renderInline(li[1], `i${idx}`));
      return;
    }

    flushList();
    out.push(
      <p key={`p${k++}`} className="my-0.5">
        {renderInline(line, `p${idx}`)}
      </p>,
    );
  });

  if (code) pushCode(code);
  flushList();

  return <>{out}</>;
}