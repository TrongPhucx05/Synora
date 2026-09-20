import { getTranslations } from "next-intl/server";
import { TrackRequestPanel } from "@/components/support/TrackRequestPanel";

export default async function TrackSupportRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token?: string }>;
}) {
  const { code, token } = await searchParams;
  const t = await getTranslations("support.track");

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-text-primary mb-1">
        {t("pageTitle")}
      </h1>
      <p className="text-sm text-text-muted mb-6">{t("pageSubtitle")}</p>
      <TrackRequestPanel initialCode={code} initialToken={token} />
    </div>
  );
}