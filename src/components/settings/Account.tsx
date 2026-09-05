"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

function formatScheduledDate(scheduledDeleteAt: string): string {
  return new Date(scheduledDeleteAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AccountSection() {
  const { data: authSession, update: updateSession } = useSession();
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
        showToast(data.error || "Đổi email thất bại", "error");
        return;
      }
      await updateSession({ email: data.email });
      showToast("Đổi email thành công", "success");
      setEditingEmail(false);
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast("Vui lòng nhập đầy đủ thông tin", "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }
    if (newPw.length < 8) {
      showToast("Mật khẩu mới phải có ít nhất 8 ký tự", "error");
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
        showToast(data.error || "Đổi mật khẩu thất bại", "error");
        return;
      }
      showToast("Đổi mật khẩu thành công", "success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
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
        showToast(data.error || "Không thể gửi yêu cầu", "error");
        return;
      }
      setDeletionRequest({ requestedAt: new Date().toISOString() });
      showToast(
        `Yêu cầu xóa tài khoản đã được ghi nhận. Tài khoản sẽ bị xóa sau ${DELETION_GRACE_DAYS} ngày nếu bạn không hủy.`,
        "success",
      );
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
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
        showToast(data.error || "Không thể hủy yêu cầu", "error");
        return;
      }
      setDeletionRequest(null);
      showToast("Đã hủy yêu cầu xóa tài khoản", "success");
    } catch {
      showToast("Lỗi kết nối, vui lòng thử lại", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        title="Email"
        description="Địa chỉ email dùng để đăng nhập và nhận thông báo quan trọng"
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
              placeholder="email@example.com"
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
                Hủy
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
                  ? "Đang lưu..."
                  : "Lưu thay đổi"
                : "Thay đổi"}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Đổi mật khẩu"
        description="Nên dùng mật khẩu mạnh và không trùng với các dịch vụ khác"
      >
        <div className="flex flex-col gap-3">
          {[
            { label: "Mật khẩu hiện tại", value: currentPw, set: setCurrentPw },
            { label: "Mật khẩu mới", value: newPw, set: setNewPw },
            {
              label: "Xác nhận mật khẩu mới",
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
            {savingPw ? "Đang lưu..." : "Cập nhật mật khẩu"}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Xóa tài khoản"
        description={
          deletionRequest
            ? "Yêu cầu xóa tài khoản của bạn đang chờ xử lý"
            : "Hành động này sẽ xóa vĩnh viễn tài khoản sau thời gian chờ"
        }
      >
        {deletionRequest ? (
          <>
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-100 rounded-xl p-3.5">
              <Clock size={16} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Tài khoản của bạn sẽ bị xóa vĩnh viễn vào ngày{" "}
                <span className="font-semibold">
                  {formatScheduledDate(deletionRequest.requestedAt)}
                </span>
                . Bạn có thể hủy yêu cầu này bất cứ lúc nào trước thời điểm
                trên.
              </p>
            </div>
            <button
              onClick={handleCancelDeleteRequest}
              disabled={cancelLoading}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={13} />
              {cancelLoading ? "Đang hủy..." : "Hủy yêu cầu xóa"}
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
                Sau khi gửi yêu cầu, tài khoản sẽ bị xóa vĩnh viễn sau{" "}
                {DELETION_GRACE_DAYS} ngày. Trong thời gian này bạn vẫn có thể
                đăng nhập và hủy yêu cầu bất cứ lúc nào.
              </p>
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={13} />
              Xóa tài khoản của tôi
            </button>
          </>
        )}
      </SettingsCard>

      {deleteOpen && (
        <ConfirmDialog
          icon={<Trash2 size={20} className="text-red-500 dark:text-red-400" />}
          iconBgClass="bg-red-100 dark:bg-red-500/20"
          title="Gửi yêu cầu xóa tài khoản?"
          description={
            <>
              Tài khoản sẽ bị xóa vĩnh viễn sau{" "}
              <span className="font-medium text-text-secondary">
                {DELETION_GRACE_DAYS} ngày
              </span>
              . Bạn có thể hủy yêu cầu bất cứ lúc nào trong thời gian chờ.
            </>
          }
          confirmLabel="Gửi yêu cầu xóa"
          confirmVariant="danger"
          loading={deleteLoading}
          onConfirm={handleRequestDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
