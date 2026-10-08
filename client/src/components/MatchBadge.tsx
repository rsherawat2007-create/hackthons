import { cn } from "@/utils/cn";
import type { MatchBreakdown } from "@/types";

export function MatchBadge({ match, className }: { match?: MatchBreakdown; className?: string }) {
  if (!match) return null;
  const tone =
    match.total >= 90
      ? "bg-emerald-500 text-white"
      : match.total >= 75
        ? "bg-indigo-600 text-white"
        : match.total >= 60
          ? "bg-amber-500 text-white"
          : "bg-slate-500 text-white";
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", tone, className)}>
      {match.total}% Match · {match.label}
    </div>
  );
}
