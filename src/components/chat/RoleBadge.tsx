import { Crown } from "lucide-react";

export function RoleBadge({ isLeader }: { isLeader: boolean }) {
  if (!isLeader) return null;
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 px-1.5 py-0.5 rounded-full leading-none">
      <Crown size={10} />
    </span>
  );
}