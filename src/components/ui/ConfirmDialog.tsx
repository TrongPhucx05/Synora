import { ReactNode } from "react";
import { UserMinus } from "lucide-react";
import { clsx } from "clsx";

interface ConfirmDialogProps {
  displayName?: string;
  icon?: ReactNode;
  iconBgClass?: string;
  iconColorClass?: string;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  displayName,
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  confirmLabel,
  cancelLabel = "Hủy",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const resolvedIcon = icon ?? (
    <UserMinus size={20} className={iconColorClass ?? "text-red-500 dark:text-red-400"} />
  );
  const resolvedIconBg = iconBgClass ?? "bg-red-100 dark:bg-red-500/20";
  const resolvedTitle = title ?? "Hủy kết bạn?";
  const resolvedDescription = description ?? (
    <>
      Bạn sẽ không còn là bạn bè với{" "}
      <span className="font-medium text-text-secondary">{displayName}</span>{" "}
      nữa.
    </>
  );
  const resolvedConfirmLabel = confirmLabel ?? "Hủy kết bạn";

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-primary hover:bg-primary-700";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 dark:bg-black/25 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 w-80 mx-4 animate-in fade-in zoom-in-95 duration-150">
        <div
          className={clsx(
            "flex items-center justify-center w-11 h-11 rounded-full mx-auto mb-4",
            resolvedIconBg,
          )}
        >
          {resolvedIcon}
        </div>
        <h3 className="text-sm font-semibold text-text-primary text-center mb-1">
          {resolvedTitle}
        </h3>
        <p className="text-xs text-text-muted text-center mb-5 leading-relaxed">
          {resolvedDescription}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "flex-1 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              confirmClasses,
            )}
          >
            {loading ? "Đang xử lý..." : resolvedConfirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
