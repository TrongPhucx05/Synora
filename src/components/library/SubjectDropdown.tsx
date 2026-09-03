"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface Option { id: string; label: string; }

interface SubjectDropdownProps {
  label:    string;
  options:  Option[];
  value:    string;
  onChange: (id: string) => void;
}

export default function SubjectDropdown({ label, options, value, onChange }: SubjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeLabel = options.find((o) => o.id === value)?.label;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
          value
            ? "bg-primary text-white shadow-sm"
            : "bg-surface border border-surface-200 text-text-secondary hover:border-primary hover:text-primary",
        )}
      >
        {value ? activeLabel : label}
        <ChevronDown size={13} className={clsx("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-2 z-30 w-56 bg-surface border border-surface-200 rounded-xl shadow-lg py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
        >
          {value && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-sm text-text-muted hover:bg-surface-50 border-b border-surface-100 mb-1"
            >
              Bỏ chọn
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              role="option"
              aria-selected={value === opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={clsx(
                "w-full text-left px-3.5 py-2 text-sm transition-colors",
                value === opt.id
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}