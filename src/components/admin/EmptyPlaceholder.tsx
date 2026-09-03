import { LucideIcon, Inbox } from "lucide-react";

export function EmptyPlaceholder({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-surface border border-surface-200 rounded-2xl py-16 flex flex-col items-center justify-center gap-3">
      <div className="w-11 h-11 rounded-full bg-surface-50 flex items-center justify-center">
        <Icon size={18} className="text-text-muted" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}