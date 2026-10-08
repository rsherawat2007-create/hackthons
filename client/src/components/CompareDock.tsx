import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, X, Trash2, Sparkles } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";

export function CompareDock() {
  const { compareList, removeFromCompare, clearCompare, compareCount, maxSlots } = useCompare();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide the dock when already on the comparison page
  if (compareCount === 0 || location.pathname === "/compare") {
    return null;
  }

  const ids = compareList.map((c) => c.id).join(",");
  const canCompare = compareCount >= 2;

  function handleCompareClick() {
    navigate(`/compare?ids=${ids}`);
  }

  return (
    <aside
      aria-label="Creator comparison dock"
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 w-[92%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5">
        {/* Left: Indicator & Creator Chips */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-white shadow-2xs">
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">Compare</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              {compareCount}/{maxSlots}
            </span>
          </div>

          {/* Selected Creator Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {compareList.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-1.5 rounded-xl border border-ink/10 bg-mist/60 py-1 pl-1 pr-2 text-xs font-semibold text-ink transition hover:border-ink/20"
              >
                <img
                  src={c.avatarUrl}
                  alt={c.user.name}
                  className="h-6 w-6 rounded-lg object-cover"
                />
                <span className="max-w-[80px] sm:max-w-[110px] truncate">{c.user.name}</span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(c.id)}
                  className="rounded-md p-0.5 text-ink/40 transition hover:bg-rose-100 hover:text-rose-600"
                  title="Remove from comparison"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Empty slots preview */}
            {Array.from({ length: maxSlots - compareCount }).map((_, idx) => (
              <div
                key={idx}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-dashed border-ink/20 px-2 py-1 text-[11px] font-medium text-ink/40"
              >
                <span>+ Slot {compareCount + idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink/40 hover:text-rose-600 transition"
            title="Clear all"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <Button
            size="sm"
            variant="accent"
            disabled={!canCompare}
            onClick={handleCompareClick}
            className="h-8 px-3.5 text-xs font-bold shadow-xs"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {canCompare ? `Compare (${compareCount})` : "Select 2 to Compare"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
