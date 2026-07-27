import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  colorClass = "bg-blue-50 text-blue-600",
  comingSoon = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  colorClass?: string;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={clsx(
        "bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 transition-opacity",
        comingSoon && "opacity-70",
      )}
    >
      <div
        className={clsx(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          colorClass,
        )}
      >
        <Icon size={19} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xl font-bold text-slate-900 leading-none truncate">
            {value}
          </p>
          {trend && (
            <span
              className={clsx(
                "text-[10px] font-semibold shrink-0",
                trend.positive ? "text-emerald-600" : "text-red-500",
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          {comingSoon && (
            <span className="shrink-0 text-[9px] font-medium text-slate-400 bg-slate-100 rounded-full px-1.5 py-[1px]">
              Sắp có
            </span>
          )}
        </div>
      </div>
    </div>
  );
}