"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import {
  Mail,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DELETION_GRACE_DAYS = 7;

function formatScheduledDate(
  scheduledDeleteAt: string,
  locale: string,
): string {
  return new Date(scheduledDeleteAt).toLocaleDateString(
    locale === "en" ? "en-US" : "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

export function AccountSection() {
  const { data: authSession, update: updateSession } = useSession();
  const t = useTranslations("settings.account");
  const locale = useLocale();
  const { showToast } = useToast();

  const currentEmail = authSession?.user?.email ?? "";

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!editingEmail) setNewEmail(currentEmail);
  }, [currentEmail, editingEmail]);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<{
    requestedAt: string;
  } | null>(null);

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === currentEmail) {
      setEditingEmail(false);
      setNewEmail(currentEmail);
      return;
    }
    setSavingEmail(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || t("email.changeFailed"), "error");
        return;
      }
      await updateSession({ email: data.email });
      showToast(t("email.changeSuccess"), "success");
      setEditingEmail(false);
    } catch {
      showToast(t("email.connectionError"), "error");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast(t("password.missingFields"), "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast(t("password.mismatch"), "error");
      return;
    }
    if (newPw.length < 8) {
      showToast(t("password.tooShort"), "error");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || t("password.changeFailed"), "error");
        return;
      }
      showToast(t("password.changeSuccess"), "success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      showToast(t("password.connectionError"), "error");
    } finally {
      setSavingPw(false);
    }
  };

  useEffect(() => {
    fetch("/api/account/delete-request")
      .then((r) => r.json())
      .then((data) => {
        if (data.scheduledDeleteAt) {
          setDeletionRequest({ requestedAt: data.scheduledDeleteAt });
        }
      })
      .catch(() => {});
  }, []);

  const handleRequestDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || t("deletion.requestFailed"), "error");
        return;
      }
      setDeletionRequest({ requestedAt: new Date().toISOString() });
      showToast(
        t("deletion.requestSuccess", { days: DELETION_GRACE_DAYS }),
        "success",
      );
    } catch {
      showToast(t("deletion.connectionError"), "error");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleCancelDeleteRequest = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/account/delete-request", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || t("deletion.cancelFailed"), "error");
        return;
      }
      setDeletionRequest(null);
      showToast(t("deletion.cancelSuccess"), "success");
    } catch {
      showToast(t("deletion.connectionError"), "error");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        title={t("email.title")}
        description={t("email.description")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2.5">
            <Mail size={15} className="text-text-muted shrink-0" />
            <input
              type="email"
              value={editingEmail ? newEmail : currentEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={!editingEmail}
              className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none disabled:text-text-muted disabled:cursor-not-allowed"
              placeholder={t("email.placeholder")}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {editingEmail && (
              <button
                onClick={() => {
                  setEditingEmail(false);
                  setNewEmail(currentEmail);
                }}
                disabled={savingEmail}
                className="px-4 py-2 rounded-full text-xs font-semibold text-text-secondary hover:bg-surface-100 transition-colors disabled:opacity-50"
              >
                {t("email.cancel")}
              </button>
            )}
            <button
              onClick={() =>
                editingEmail ? handleSaveEmail() : setEditingEmail(true)
              }
              disabled={savingEmail}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {editingEmail
                ? savingEmail
                  ? t("email.saving")
                  : t("email.save")
                : t("email.change")}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("password.title")}
        description={t("password.description")}
      >
        <div className="flex flex-col gap-3">
          {[
            {
              label: t("password.currentLabel"),
              value: currentPw,
              set: setCurrentPw,
            },
            { label: t("password.newLabel"), value: newPw, set: setNewPw },
            {
              label: t("password.confirmLabel"),
              value: confirmPw,
              set: setConfirmPw,
            },
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">
                {f.label}
              </label>
              <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3.5 py-2.5">
                <Lock size={15} className="text-text-muted shrink-0" />
                <input
                  type={showPw ? "text" : "password"}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none"
                  placeholder="••••••••"
                />
                {i === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-text-muted shrink-0"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={handleChangePassword}
            disabled={savingPw}
            className="self-end mt-1 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {savingPw ? t("password.updating") : t("password.updateBtn")}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("deletion.title")}
        description={
          deletionRequest
            ? t("deletion.descPending")
            : t("deletion.descDefault")
        }
      >
        {deletionRequest ? (
          <>
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-100 rounded-xl p-3.5">
              <Clock
                size={16}
                className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <p className="text-xs text-amber-700 leading-relaxed">
                {t.rich("deletion.pendingNotice", {
                  date: formatScheduledDate(
                    deletionRequest.requestedAt,
                    locale,
                  ),
                  b: (chunks) => (
                    <span className="font-semibold">{chunks}</span>
                  ),
                })}
              </p>
            </div>
            <button
              onClick={handleCancelDeleteRequest}
              disabled={cancelLoading}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={13} />
              {cancelLoading
                ? t("deletion.cancelling")
                : t("deletion.cancelBtn")}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/15 border border-red-100 rounded-xl p-3.5">
              <AlertTriangle
                size={16}
                className="text-red-500 dark:text-red-400 shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                {t("deletion.warningNotice", { days: DELETION_GRACE_DAYS })}
              </p>
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={13} />
              {t("deletion.deleteBtn")}
            </button>
          </>
        )}
      </SettingsCard>

      {deleteOpen && (
        <ConfirmDialog
          icon={<Trash2 size={20} className="text-red-500 dark:text-red-400" />}
          iconBgClass="bg-red-100 dark:bg-red-500/20"
          title={t("deletion.confirmTitle")}
          description={t.rich("deletion.confirmDesc", {
            days: DELETION_GRACE_DAYS,
            b: (chunks) => (
              <span className="font-medium text-text-secondary">{chunks}</span>
            ),
          })}
          confirmLabel={t("deletion.confirmBtn")}
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={handleRequestDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
