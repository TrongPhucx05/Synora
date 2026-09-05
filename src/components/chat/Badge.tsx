import { clsx } from "clsx";

type BadgeVariant = "unread" | "pending" | "blocked" | "default";

interface BadgeProps {
  count: number;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  unread:  "bg-primary text-white",
  pending: "bg-amber-500 text-white",
  blocked: "bg-red-400 text-white",
  default: "bg-primary text-white",
};

export function Badge({ count, variant = "default", size = "md", className }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={clsx(
        "font-bold rounded-full flex items-center justify-center leading-none shrink-0",
        variantClasses[variant],
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

const pillClasses: Record<BadgeVariant, string> = {
  unread:  "bg-primary/10 text-primary",
  pending: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  blocked: "bg-red-50 dark:bg-red-500/15 text-red-400",
  default: "bg-primary/10 text-primary",
};

export function PillBadge({ count, variant = "default", className }: PillBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={clsx(
        "text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none",
        pillClasses[variant],
        className,
      )}
    >
      {count}
    </span>
  );
}