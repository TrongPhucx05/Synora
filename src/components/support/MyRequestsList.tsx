"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { X, LifeBuoy } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "./StatusBadge";
import { SupportRequestDetail } from "./SupportRequestDetail";
import { useSupportLabels } from "@/lib/support/labels.client";
import type {
  MySupportRequestRow,
  TrackedSupportRequest,
} from "@/lib/support/types";

export function MyRequestsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("support.myRequests");
  const tCommon = useTranslations("common");
  const { typeLabel } = useSupportLabels();
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "vi-VN";

  const [items, setItems] = useState<MySupportRequestRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TrackedSupportRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch(`/api/support/requests?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openDetail = useCallback(async (id: string) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/support/requests/${id}`);
      if (!res.ok) return;
      setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (!requestId) return;
    openDetail(requestId);
    router.replace("/support?tab=mine");
  }, [searchParams, openDetail, router]);

  if (loading) {
    return (
      <div className="text-center text-sm text-text-muted py-10">
        {t("loading")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-10 text-center text-sm text-text-muted">
        <LifeBuoy size={22} className="mx-auto mb-2 opacity-40" />
        {t("empty")}
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-surface-200 rounded-2xl overflow-hidden">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => openDetail(r.id)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-100 last:border-0 hover:bg-surface-50 text-left"
          >
            <div className="min-w-0">
              <p className="text-xs font-mono text-text-muted">{r.code}</p>
              <p className="text-sm font-medium text-text-secondary truncate">
                {r.subject}
              </p>
              <p className="text-[11px] text-text-muted">
                {typeLabel(r.type)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <StatusBadge status={r.status} />
              <span className="text-[11px] text-text-muted">
                {new Date(r.createdAt).toLocaleDateString(dateLocale)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/25 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-text-primary">
                {t("detailTitle")}
              </h2>
              <button
                onClick={() => setDetail(null)}
                className="p-1 rounded-lg hover:bg-surface-100 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {detailLoading && !detail ? (
                <p className="text-sm text-text-muted text-center py-6">
                  {tCommon("loading")}
                </p>
              ) : detail ? (
                <SupportRequestDetail request={detail} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}