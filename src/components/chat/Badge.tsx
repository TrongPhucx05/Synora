import { clsx } from "clsx";

type BadgeVariant = "unread" | "pending" | "blocked" | "default";

interface BadgeProps {
  count: number;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ count, size = "md", className }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={clsx(
        "bg-badge text-white font-bold rounded-full flex items-center justify-center leading-none shrink-0",
        size === "sm"
          ? "text-[8px] min-w-[14px] h-[14px] px-0.5"
          : "text-[9px] min-w-[16px] h-4 px-1",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface PillBadgeProps {
  count: number;
  variant?: BadgeVariant;
  className?: string;
}

export function PillBadge({ count, className }: PillBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={clsx(
        "bg-badge text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}