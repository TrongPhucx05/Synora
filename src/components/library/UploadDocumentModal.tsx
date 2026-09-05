"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, CheckCircle, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useUploadThing } from "@/lib/uploadthing";
import {
  ACADEMIC_GRADES,
  ACADEMIC_SUBJECTS,
  LEVEL_TABS,
  UNIVERSITY_MAJORS,
} from "@/lib/library/data";
const ACCEPTED_TYPES = ".pdf,.docx,.pptx";
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const FILE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type UploadState = "idle" | "uploading" | "saving" | "success" | "error";

const THPT_ONLY = ["economics"];
const THCS_ONLY = ["civics"];

function getFilteredSubjects(grade: string) {
  const isThcs = ["6", "7", "8", "9"].includes(grade);
  const isThpt = ["10", "11", "12"].includes(grade);
  return ACADEMIC_SUBJECTS.filter((s) => {
    if (THPT_ONLY.includes(s.id)) return isThpt || !grade;
    if (THCS_ONLY.includes(s.id)) return isThcs || !grade;
    return true;
  });
}

export default function UploadDocumentModal({ onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [major, setMajor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { startUpload } = useUploadThing("postDocument");

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleFile = (f: File) => {
    if (!ACCEPTED_MIME.includes(f.type)) {
      setErrors((p) => ({ ...p, file: "Chỉ hỗ trợ PDF, DOCX, PPTX" }));
      return;
    }
    setFile(f);
    setErrors((p) => {
      const n = { ...p };
      delete n.file;
      return n;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Vui lòng nhập tiêu đề";
    if (!file) e.file = "Vui lòng chọn file";
    if (!level) e.level = "Vui lòng chọn cấp học";

    if (level === "academic") {
      if (!grade) e.grade = "Vui lòng chọn lớp";
      if (!subjectId) e.subject = "Vui lòng chọn môn học";
    }

    if (level === "university" && !major) {
      e.major = "Vui lòng chọn khối ngành";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !file) return;
    setUploadState("uploading");
    setErrorMsg("");

    try {
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]) throw new Error("Upload thất bại");

      setUploadState("saving");
      const { ufsUrl, key } = uploaded[0] as any;

      const subjectLabel = ACADEMIC_SUBJECTS.find(
        (s) => s.id === subjectId,
      )?.label;

      const res = await fetch("/api/library/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fileUrl: ufsUrl,
          fileKey: key,
          fileSize: file.size,
          mimeType: file.type,
          level: level || undefined,
          grade: grade || undefined,
          subjectId: subjectId || undefined,
          subject: subjectLabel || undefined,
          major: major || undefined,
        }),
      });

      if (!res.ok) throw new Error("Lưu tài liệu thất bại");

      setUploadState("success");
      setTimeout(onSuccess, 1800);
    } catch (err: any) {
      setUploadState("error");
      setErrorMsg(err.message ?? "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const levelOptions = LEVEL_TABS.filter((l) => l.id !== "all");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tải lên tài liệu"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/35 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col bg-surface shadow-2xl w-full max-w-lg rounded-2xl animate-in fade-in zoom-in-95 duration-200 max-sm:fixed max-sm:inset-0 max-sm:max-w-none max-sm:rounded-none overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">
            Tải lên tài liệu
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {uploadState === "success" ? (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/15 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                Tải lên thành công!
              </p>
              <p className="text-xs text-text-muted">
                Tài liệu đã được thêm vào thư viện.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  Tiêu đề <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.title;
                      return n;
                    });
                  }}
                  placeholder="Nhập tiêu đề tài liệu..."
                  className={clsx(
                    "w-full px-3 py-2.5 bg-surface border rounded-xl text-sm placeholder:text-text-muted focus:outline-none transition-colors",
                    errors.title
                      ? "border-red-400"
                      : "border-surface-200 focus:border-primary",
                  )}
                />
                {errors.title && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  Cấp học
                </label>
                <div className="relative">
                  <select
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value);
                      setGrade("");
                      setSubjectId("");
                      setMajor("");
                    }}
                    className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Chọn cấp học...</option>
                    {levelOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                {errors.level && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">{errors.level}</p>
                )}
              </div>

              {level === "academic" && (
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Lớp
                    </label>
                    <div className="relative">
                      <select
                        value={grade}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          setGrade(newGrade);
                          const filtered = getFilteredSubjects(newGrade);
                          if (
                            subjectId &&
                            !filtered.find((s) => s.id === subjectId)
                          ) {
                            setSubjectId("");
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                      >
                        <option value="">Chọn lớp...</option>
                        {ACADEMIC_GRADES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                      />
                    </div>
                    {errors.grade && (
                      <p className="text-[11px] text-red-500 dark:text-red-400">{errors.grade}</p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      Môn học
                    </label>
                    <div className="relative">
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                      >
                        <option value="">Chọn môn...</option>
                        {getFilteredSubjects(grade).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                      />
                    </div>
                    {errors.subject && (
                      <p className="text-[11px] text-red-500 dark:text-red-400">
                        {errors.subject}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {level === "university" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    Khối ngành
                  </label>
                  <div className="relative">
                    <select
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">Chọn khối ngành...</option>
                      {UNIVERSITY_MAJORS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                  {errors.major && (
                    <p className="text-[11px] text-red-500 dark:text-red-400">{errors.major}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  File <span className="text-red-500 dark:text-red-400">*</span>
                  <span className="text-text-muted font-normal ml-1">
                    (PDF, DOCX, PPTX)
                  </span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-2 py-7 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : errors.file
                        ? "border-red-300 bg-red-50/40"
                        : file
                          ? "border-green-400 dark:border-green-500/60 bg-green-50/40 dark:bg-green-500/10"
                          : "border-surface-200 bg-surface-50 hover:border-primary/50 hover:bg-primary/5",
                  )}
                >
                  {file ? (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                        <FileText size={18} className="text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs font-semibold text-text-primary text-center">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                        {FILE_LABELS[file.type]}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center">
                        <Upload size={16} className="text-text-muted" />
                      </div>
                      <p className="text-xs font-medium text-text-secondary text-center">
                        Kéo thả file vào đây hoặc{" "}
                        <span className="text-primary font-semibold">
                          chọn file
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                {errors.file && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">{errors.file}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  Mô tả{" "}
                  <span className="text-text-muted font-normal">
                    (tùy chọn)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về nội dung tài liệu..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/15 px-3 py-2 rounded-lg">
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-200 shrink-0">
              <button
                onClick={onClose}
                disabled={uploadState !== "idle"}
                className="px-4 py-2 text-sm font-semibold text-text-secondary border border-surface-200 rounded-xl hover:border-surface-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploadState !== "idle"}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
              >
                {uploadState === "uploading" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Đang tải lên...
                  </>
                ) : uploadState === "saving" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Upload size={13} /> Tải lên
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
