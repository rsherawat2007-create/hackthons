import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  Share2,
  Ratio,
  Building,
  Film,
  User,
  Eye,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { AIWorkflowSection } from "@/components/AIWorkflowSection";
import type { PortfolioItem } from "@/types";

export function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<
    | (PortfolioItem & {
        creator: {
          id: string;
          userId: string;
          avatarUrl: string;
          headline: string;
          trustScore: number;
          user: { id: string; name: string };
          workflow?: string;
        };
      })
    | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<{ item: typeof item }>(`/api/portfolio/item/${id}`)
      .then((d) => setItem(d.item))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load project"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-ink/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm">Loading project showcase…</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl text-ink">Project not found</h2>
        <p className="mt-2 text-sm text-ink/60">This portfolio work may have been moved or deleted.</p>
        <Button variant="accent" className="mt-6" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const isOwner = user?.role === "CREATOR" && (user.id === item.creator?.userId || user.creatorProfile?.id === item.creatorId);

  async function handleToggleFeature() {
    if (!item) return;
    try {
      const res = await api<{ item: PortfolioItem }>(`/api/portfolio/${item.id}/feature`, {
        method: "PUT",
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      setItem({ ...item, isFeatured: res.item.isFeatured, featuredOrder: res.item.featuredOrder });
      toast.success(
        res.item.isFeatured
          ? `Marked "${item.title}" as Best Work!`
          : `Removed "${item.title}" from Best Work`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update Best Work status");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this portfolio project?")) return;
    try {
      await api(`/api/portfolio/${item!.id}`, { method: "DELETE" });
      toast.success("Project deleted from portfolio");
      navigate(item?.creatorId ? `/creators/${item.creatorId}` : "/creator/portfolio");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Project link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Format date nicely
  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen pb-20">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="border-b border-ink/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to={item.creatorId ? `/creators/${item.creatorId}` : "/creators"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {item.creator?.user?.name ? `${item.creator.user.name}'s Profile` : "Profile"}
          </Link>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="flex items-center gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share Project"}
            </Button>

            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleFeature}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    item.isFeatured && "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  )}
                >
                  <Star className={cn("h-3.5 w-3.5", item.isFeatured ? "fill-amber-500 text-amber-500" : "text-ink/60")} />
                  {item.isFeatured ? "Featured as Best Work" : "Feature as Best Work"}
                </Button>

                <Button size="sm" variant="outline" asChild>
                  <Link to={`/creator/portfolio?edit=${item.id}`} className="flex items-center gap-1.5 text-xs">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Project
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {/* ── Media Player / Showcase Hero ─────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-black shadow-card">
          <div className="relative flex aspect-video max-h-[580px] w-full items-center justify-center bg-ink">
            {/* If media is video or ends with mp4/webm, render video player; else image */}
            {item.mediaUrl?.match(/\.(mp4|webm|mov)($|\?)/i) ? (
              <video
                src={item.mediaUrl}
                poster={item.thumbnailUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={item.mediaUrl || item.thumbnailUrl}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            )}

            {/* Quick badge overlays */}
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
              {item.isFeatured && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                  <Star className="h-3 w-3 fill-white" />
                  Best Work {item.featuredOrder ? `· #${item.featuredOrder}` : ""}
                </span>
              )}
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                {item.contentType || "AI Video"}
              </span>
              {item.aspectRatio && (
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                  {item.aspectRatio}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Details Grid ────────────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Left Column: Title, Narrative, Workflow, Commercial info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                {item.category && <span>{item.category}</span>}
                {item.industry && <span>· {item.industry}</span>}
                {formattedDate && <span>· {formattedDate}</span>}
              </div>

              <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{item.title}</h1>
            </div>

            <Card className="p-6">
              <h2 className="font-display text-2xl text-ink">Project Overview</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{item.description}</p>
            </Card>

            {/* Visible AI Production Workflow Section */}
            <AIWorkflowSection
              workflowText={item.workflow || item.creator?.workflow}
              toolsUsed={item.toolsUsed}
              aiModelsUsed={item.aiModelsUsed}
              skills={item.skills}
              commercialUse={item.commercialUse}
              commercialNotes={item.commercialNotes}
              projectId={item.id}
              isOwner={isOwner}
            />
          </div>

          {/* Right Column: Spec Sheet, AI Tech Stack & Creator Card */}
          <div className="space-y-6">
            {/* Creator Author Card */}
            {item.creator && (
              <Card className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Created By</p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={
                      item.creator.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={item.creator.user?.name}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg text-ink truncate">{item.creator.user?.name}</p>
                    <p className="text-xs text-ink/60 truncate">{item.creator.headline}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="accent" size="sm" className="w-full" asChild>
                    <Link to={`/creators/${item.creator.id}`}>View Creator Profile</Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* AI Stack & Production Specifications */}
            <Card className="space-y-5 p-6">
              <h3 className="font-display text-xl text-ink">Project Specifications</h3>

              {/* AI Tools */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">AI Tools Used</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.toolsUsed && item.toolsUsed.length > 0 ? (
                    item.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-xl border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-sm"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/50">Runway, Midjourney</span>
                  )}
                </div>
              </div>

              {/* AI Models */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Generative AI Models</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.aiModelsUsed && item.aiModelsUsed.length > 0 ? (
                    item.aiModelsUsed.map((model) => (
                      <span
                        key={model}
                        className="rounded-xl border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800"
                      >
                        {model}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/50">Runway Gen-3, Midjourney v6</span>
                  )}
                </div>
              </div>

              {/* Core Creative Skills */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Applied Skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.skills && item.skills.length > 0 ? (
                    item.skills.map((skill) => (
                      <span key={skill} className="chip">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/50">AI Video Direction, Prompt Art Direction</span>
                  )}
                </div>
              </div>

              {/* Metadata specs */}
              <div className="border-t border-ink/5 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink/50">Content Type</span>
                  <span className="font-semibold text-ink">{item.contentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Aspect Ratio</span>
                  <span className="font-mono font-semibold text-ink">{item.aspectRatio}</span>
                </div>
                {item.industry && (
                  <div className="flex justify-between">
                    <span className="text-ink/50">Industry</span>
                    <span className="font-semibold text-ink">{item.industry}</span>
                  </div>
                )}
                {item.category && (
                  <div className="flex justify-between">
                    <span className="text-ink/50">Category</span>
                    <span className="font-semibold text-ink">{item.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink/50">Commercial Rights</span>
                  <span className="font-semibold text-emerald-600">
                    {item.commercialUse ? "✓ Available" : "Personal Only"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
