"use client";

import { useState, useRef, useEffect } from "react";
import { X, FileText, CheckCircle, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
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

interface DocToEdit {
  id: string;
  title: string;
  description?: string | null;
  level?: string | null;
  grade?: string | null;
  major?: string | null;
  subject?: string | null;
  subjectId?: string | null;
  fileUrl: string;
  mimeType?: string;
  type?: string;
  fileSize?: number | null;
}

interface Props {
  doc: DocToEdit;
  onClose: () => void;
  onSuccess: (updated: DocToEdit) => void;
}

type SaveState = "idle" | "uploading" | "saving" | "success" | "error";

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

export default function EditDocumentModal({ doc, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [level, setLevel] = useState(doc.level ?? "");
  const [grade, setGrade] = useState(doc.grade ?? "");
  const [subjectId, setSubjectId] = useState(doc.subjectId ?? "");
  const [major, setMajor] = useState(doc.major ?? "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { startUpload } = useUploadThing("postDocument");
  const t = useTranslations("library.modal");
  const td = useTranslations("library.data");
  const tc = useTranslations("common");

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
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleFile = (f: File) => {
    if (!ACCEPTED_MIME.includes(f.type)) {
      setErrors((p) => ({ ...p, file: t("errors.onlyPdfDocxPptx") }));
      return;
    }
    setNewFile(f);
    setErrors((p) => {
      const n = { ...p };
      delete n.file;
      return n;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = t("errors.titleRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaveState("idle");
    setErrorMsg("");

    try {
      let filePayload: Record<string, any> = {};

      if (newFile) {
        setSaveState("uploading");
        const uploaded = await startUpload([newFile]);
        if (!uploaded?.[0]) throw new Error(t("errors.uploadFailed"));
        const { ufsUrl, key } = uploaded[0] as any;
        filePayload = {
          fileUrl: ufsUrl,
          fileKey: key,
          fileSize: newFile.size,
          mimeType: newFile.type,
        };
      }

      setSaveState("saving");

      const subjectData = ACADEMIC_SUBJECTS.find((s) => s.id === subjectId);
      const subjectLabel = subjectData ? td(subjectData.labelKey) : undefined;

      const res = await fetch(`/api/library/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          level: level || null,
          grade: grade || null,
          major: major || null,
          subject: subjectLabel || null,
          subjectId: subjectId || null,
          ...filePayload,
        }),
      });

      if (!res.ok) throw new Error(t("errors.saveFailed"));
      const updated = await res.json();
      setSaveState("success");
      setTimeout(() => onSuccess(updated), 1200);
    } catch (err: any) {
      setSaveState("error");
      setErrorMsg(err.message ?? t("errors.generic"));
    }
  };

  const levelOptions = LEVEL_TABS.filter((l) => l.id !== "all");
  const currentFileName =
    newFile?.name ?? doc.fileUrl.split("/").pop() ?? t("currentFile");
  const currentFileLabel = newFile
    ? (FILE_LABELS[newFile.type] ?? "")
    : (doc.type ?? doc.mimeType?.split("/").pop()?.toUpperCase() ?? "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/35 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col bg-surface shadow-2xl w-full max-w-lg rounded-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">
            {t("editTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {saveState === "success" ? (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/15 flex items-center justify-center">
              <CheckCircle
                size={28}
                className="text-green-500 dark:text-green-400"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                {t("updateSuccessTitle")}
              </p>
              <p className="text-xs text-text-muted">
                {t("updateSuccessDesc")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {t("titleLabel")}{" "}
                  <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
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
                  placeholder={t("titlePlaceholder")}
                  className={clsx(
                    "w-full px-3 py-2.5 bg-surface border rounded-xl text-sm placeholder:text-text-muted focus:outline-none transition-colors",
                    errors.title
                      ? "border-red-400"
                      : "border-surface-200 focus:border-primary",
                  )}
                />
                {errors.title && (
                  <p className="text-[11px] text-red-500 dark:text-red-400">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {t("levelLabel")}
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
                    <option value="">{t("chooseLevelPlaceholder")}</option>
                    {levelOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {td(l.labelKey)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
              </div>

              {level === "academic" && (
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      {t("gradeLabel")}
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
                          )
                            setSubjectId("");
                        }}
                        className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                      >
                        <option value="">{t("chooseGradePlaceholder")}</option>
                        {ACADEMIC_GRADES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {td(g.labelKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                      {t("subjectLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                      >
                        <option value="">
                          {t("chooseSubjectPlaceholder")}
                        </option>
                        {getFilteredSubjects(grade).map((s) => (
                          <option key={s.id} value={s.id}>
                            {td(s.labelKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {level === "university" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    {t("majorLabel")}
                  </label>
                  <div className="relative">
                    <select
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-primary"
                    >
                      <option value="">{t("chooseMajorPlaceholder")}</option>
                      {UNIVERSITY_MAJORS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {td(m.labelKey)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {t("replaceFileLabel")}{" "}
                  <span className="text-text-muted font-normal">
                    {t("replaceFileHint")}
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
                    "flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : errors.file
                        ? "border-red-300 bg-red-50/40"
                        : newFile
                          ? "border-green-400 dark:border-green-500/60 bg-green-50/40 dark:bg-green-500/10"
                          : "border-surface-200 bg-surface-50 hover:border-primary/50 hover:bg-primary/5",
                  )}
                >
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      newFile
                        ? "bg-green-100 dark:bg-green-500/20"
                        : "bg-surface-100",
                    )}
                  >
                    <FileText
                      size={18}
                      className={
                        newFile
                          ? "text-green-600 dark:text-green-400"
                          : "text-text-muted"
                      }
                    />
                  </div>
                  <p className="text-xs font-semibold text-text-primary text-center">
                    {currentFileName}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {newFile
                      ? `${(newFile.size / 1024 / 1024).toFixed(1)} MB · ${currentFileLabel}`
                      : `${t("currentFile")} · ${currentFileLabel}`}
                  </p>
                  {!newFile && (
                    <p className="text-[11px] text-primary font-medium">
                      {t("clickToChangeFile")}
                    </p>
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
                  <p className="text-[11px] text-red-500 dark:text-red-400">
                    {errors.file}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">
                  {t("descriptionLabel")}{" "}
                  <span className="text-text-muted font-normal">
                    {t("optionalHint")}
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
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
                disabled={saveState === "uploading" || saveState === "saving"}
                className="px-4 py-2 text-sm font-semibold text-text-secondary border border-surface-200 rounded-xl hover:border-surface-300 transition-colors disabled:opacity-50"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveState === "uploading" || saveState === "saving"}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
              >
                {saveState === "uploading" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    {t("uploading")}
                  </>
                ) : saveState === "saving" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    {tc("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
