import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import type { Brief } from "@/types";

export function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBriefs();
  }, []);

  function loadBriefs() {
    setLoading(true);
    api<{ briefs: Brief[] }>("/api/briefs")
      .then((d) => setBriefs(d.briefs))
      .catch(() => toast.error("Could not load creative briefs"))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this creative brief?")) return;

    setDeletingId(id);
    try {
      await api(`/api/briefs/${id}`, { method: "DELETE" });
      setBriefs((prev) => prev.filter((b) => b.id !== id));
      toast.success("Brief deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete brief");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-ink/8 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent mb-2">
            <Sparkles className="h-3 w-3" />
            Brand Workspace
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">Creative Briefs</h1>
          <p className="mt-1 text-xs text-ink/65 sm:text-sm">
            Manage your campaign briefs and discover creators matched to your exact creative requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs font-semibold">
            <Link to="/ai-brief-builder">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              AI Brief Builder
            </Link>
          </Button>

          <Button variant="accent" size="sm" asChild className="h-9 gap-1.5 text-xs font-bold">
            <Link to="/briefs/new">
              <Plus className="h-3.5 w-3.5" />
              New Brief
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Briefs List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 rounded-2xl bg-violet-50" />
          <div className="h-28 rounded-2xl bg-violet-50" />
        </div>
      ) : briefs.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <p className="font-medium text-ink">No creative briefs created yet</p>
          <p className="text-xs text-ink/50 max-w-sm mx-auto">
            Create a campaign brief manually or generate one in seconds using the AI Brief Builder.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" variant="accent" asChild>
              <Link to="/briefs/new">Create Manual Brief</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/ai-brief-builder">Use AI Generator</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefs.map((b) => (
            <Card
              key={b.id}
              className="p-5 transition hover:shadow-md hover:-translate-y-0.5 border border-ink/10"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                      {b.contentType || "AI Campaign"}
                    </span>
                    <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/70">
                      {b.platform} · {b.aspectRatio}
                    </span>
                    {b.commercialUse && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Commercial Cleared
                      </span>
                    )}
                    {b.budget && (
                      <span className="text-[11px] font-bold text-ink/75">
                        Budget: {b.budget}
                      </span>
                    )}
                  </div>

                  <Link to={`/briefs/${b.id}`} className="block group">
                    <h3 className="font-bold text-base text-ink group-hover:text-accent transition truncate">
                      {b.title}
                    </h3>
                  </Link>

                  <p className="line-clamp-2 text-xs text-ink/65 leading-relaxed">
                    {b.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-ink/50">
                    {b.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(b.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {b.requiredTools && b.requiredTools.length > 0 && (
                      <span>Tools: {b.requiredTools.slice(0, 3).join(", ")}</span>
                    )}
                    {b.requiredSkills && b.requiredSkills.length > 0 && (
                      <span>Skills: {b.requiredSkills.slice(0, 2).join(", ")}</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button size="sm" variant="accent" asChild className="h-8 gap-1 text-xs font-bold">
                    <Link to={`/briefs/${b.id}`}>
                      <span>View & Match</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" asChild className="h-8 px-2 text-xs">
                    <Link to={`/briefs/${b.id}/edit`}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleDelete(b.id, e)}
                    disabled={deletingId === b.id}
                    className="h-8 px-2 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
