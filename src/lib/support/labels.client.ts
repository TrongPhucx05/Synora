"use client";
import { useTranslations } from "next-intl";
import type {
  SupportRequestStatus,
  SupportRequestType,
} from "@/generated/prisma/enums";

export function useSupportLabels() {
  const t = useTranslations("support");
  return {
    typeLabel: (type: SupportRequestType) => t(`types.${type}` as any),
    statusLabel: (status: SupportRequestStatus) => t(`status.${status}` as any),
  };
}