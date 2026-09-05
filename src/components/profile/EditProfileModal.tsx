"use client";

import { useState, useRef } from "react";
import {
  X,
  Camera,
  User,
  BookOpen,
  MapPin,
  Globe,
  GraduationCap,
  AlignLeft,
  Loader2,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { useSession } from "next-auth/react";

interface EditProfileModalProps {
  username: string;
  initial: {
    displayName?: string | null;
    bio?: string | null;
    school?: string | null;
    location?: string | null;
    website?: string | null;
    grade?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  username,
  initial,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const { update } = useSession();

  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [school, setSchool] = useState(initial.school ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [grade, setGrade] = useState(initial.grade ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("postMedia");

  const ini = (displayName || initial.displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const displayAvatar = avatarPreview ?? initial.avatarUrl;
  const displayCover = coverPreview ?? initial.coverUrl;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let uploadedAvatarUrl: string | undefined;
      let uploadedCoverUrl: string | undefined;

      const filesToUpload: File[] = [];
      if (avatarFile) filesToUpload.push(avatarFile);
      if (coverFile) filesToUpload.push(coverFile);

      if (filesToUpload.length > 0) {
        const results = await startUpload(filesToUpload);
        if (results) {
          let idx = 0;
          if (avatarFile)
            uploadedAvatarUrl = results[idx++]?.ufsUrl ?? results[idx - 1]?.url;
          if (coverFile)
            uploadedCoverUrl = results[idx++]?.ufsUrl ?? results[idx - 1]?.url;
        }
      }

      const res = await fetch(`/api/profile/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
          school: school.trim() || undefined,
          location: location.trim() || undefined,
          website: website.trim() || undefined,
          grade: grade.trim() || undefined,
          ...(uploadedAvatarUrl && { avatarUrl: uploadedAvatarUrl }),
          ...(uploadedCoverUrl && { coverUrl: uploadedCoverUrl }),
        }),
      });

      if (!res.ok) throw new Error("Lưu thất bại");

      await update({
        name: displayName.trim() || initial.displayName,
        image: uploadedAvatarUrl ?? initial.avatarUrl,
      });

      window.dispatchEvent(
        new CustomEvent("profile:updated", {
          detail: { avatarUrl: uploadedAvatarUrl ?? initial.avatarUrl },
        }),
      );

      onSaved();
    } catch {
      setError("Có lỗi xảy ra, thử lại nhé.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/35 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <h2 className="text-sm font-bold text-text-primary">
            Chỉnh sửa trang cá nhân
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-text-secondary hover:bg-surface-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="relative h-28 bg-surface-100 shrink-0">
            {displayCover ? (
              <img
                src={displayCover}
                alt="cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#e2e5ec,#e2e5ec_10px,#eaecf2_10px,#eaecf2_20px)]" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-1.5 bg-black/40 dark:bg-black/25 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={12} /> Đổi ảnh bìa
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </label>

            <div className="absolute -bottom-10 left-5">
              <div className="relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="avatar"
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {ini}
                  </div>
                )}
                <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/40 dark:bg-black/25 transition-colors cursor-pointer opacity-0 hover:opacity-100">
                  <Camera size={16} className="text-white" />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="px-5 pt-14 pb-5 flex flex-col gap-4">
            <Field
              icon={<User size={14} />}
              label="Tên hiển thị"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Tên của bạn"
              maxLength={50}
            />
            <TextareaField
              icon={<AlignLeft size={14} />}
              label="Giới thiệu"
              value={bio}
              onChange={setBio}
              placeholder="Viết vài dòng về bản thân..."
              maxLength={200}
            />
            <Field
              icon={<GraduationCap size={14} />}
              label="Trường học"
              value={school}
              onChange={setSchool}
              placeholder="Trường bạn đang học"
            />
            <Field
              icon={<BookOpen size={14} />}
              label="Lớp / Khoá"
              value={grade}
              onChange={setGrade}
              placeholder="VD: 12A1, K66, ..."
            />
            <Field
              icon={<MapPin size={14} />}
              label="Địa điểm"
              value={location}
              onChange={setLocation}
              placeholder="Thành phố, tỉnh..."
            />
            <Field
              icon={<Globe size={14} />}
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-surface-100 shrink-0 flex items-center justify-between gap-3">
          {error && <p className="text-xs text-red-500 dark:text-red-400 flex-1">{error}</p>}
          {!error && <div className="flex-1" />}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>Lưu</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        {icon} {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 text-sm text-text-primary bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-primary focus:bg-surface transition-colors placeholder:text-text-muted"
      />
      {maxLength && value.length > maxLength * 0.8 && (
        <p
          className={`text-[11px] text-right ${value.length >= maxLength ? "text-red-500 dark:text-red-400" : "text-text-muted"}`}
        >
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function TextareaField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
        {icon} {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full px-3 py-2 text-sm text-text-primary bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-primary focus:bg-surface transition-colors resize-none placeholder:text-text-muted"
      />
      {maxLength && value.length > maxLength * 0.8 && (
        <p
          className={`text-[11px] text-right ${value.length >= maxLength ? "text-red-500 dark:text-red-400" : "text-text-muted"}`}
        >
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
