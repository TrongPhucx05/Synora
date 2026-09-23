"use client";
import { MapPin, School, Globe, Calendar } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface ProfileInfoProps {
  displayName: string;
  username: string;
  bio?: string | null;
  school?: string | null;
  location?: string | null;
  website?: string | null;
  joinedAt?: string;
}

export function ProfileInfo({
  displayName,
  username,
  bio,
  school,
  location,
  website,
  joinedAt,
}: ProfileInfoProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  const joinDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="px-1 mb-4">
      <div className="flex items-center gap-2 mb-0.5">
        <h1 className="text-lg font-bold text-text-primary">{displayName}</h1>
      </div>
      <p className="text-xs text-text-muted mb-2">@{username}</p>
      {bio && (
        <p className="text-sm text-text-primary max-w-[540px] leading-relaxed mb-3">{bio}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
        {school && (
          <span className="flex items-center gap-1.5">
            <School size={12} />
            {school}
          </span>
        )}
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} />
            {location}
          </span>
        )}
        {joinDate && (
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {t("joinedOn", { date: joinDate })}
          </span>
        )}
        {website && (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <Globe size={12} />
            {website}
          </a>
        )}
      </div>
    </div>
  );
}