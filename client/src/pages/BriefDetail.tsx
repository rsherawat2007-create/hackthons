import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Layers,
  Sparkles,
  Edit3,
  Trash2,
  Users,
  MapPin,
  CheckCircle2,
  Bookmark,
  Send,
  ShieldCheck,
  Film,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchBadge } from "@/components/MatchBadge";
import { SendBriefModal } from "@/components/SendBriefModal";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { Brief, Creator } from "@/types";

export function BriefDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [brief, setBrief] = useState<Brief | null>(null);
  const [matches, setMatches] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Modal & shortlist action states
  const [sendTarget, setSendTarget] = useState<Creator | null>(null);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api<{ brief: Brief; matches?: Creator[] }>(`/api/briefs/${id}`)
      .then((d) => {
        setBrief(d.brief);
        if (d.matches) setMatches(d.matches);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load brief");
        toast.error("Could not load brief");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this creative brief? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api(`/api/briefs/${id}`, { method: "DELETE" });
      toast.success("Brief deleted successfully");
      navigate("/briefs");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete brief");
      setDeleting(false);
    }
  }

  async function handleShortlist(creatorId: string) {
    if (user?.role !== "BRAND") return toast.error("Log in as a Brand to shortlist");
    try {
      if (shortlisted.has(creatorId)) {
        await api(`/api/shortlist/${creatorId}`, { method: "DELETE" });
        setShortlisted((prev) => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
        toast.success("Removed from shortlist");
      } else {
        await api("/api/shortlist", {
          method: "POST",
          body: JSON.stringify({ creatorId }),
        });
        setShortlisted((prev) => new Set(prev).add(creatorId));
        toast.success("Added to shortlist");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update shortlist");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12 animate-pulse">
        <div className="h-6 w-32 rounded-xl bg-violet-100" />
        <div className="h-12 w-2/3 rounded-2xl bg-violet-100" />
        <div className="h-48 rounded-3xl bg-violet-50" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-ink/60">{error || "Brief not found"}</p>
        <Button className="mt-4" asChild variant="outline">
          <Link to="/briefs">Back to briefs</Link>
        </Button>
      </div>
    );
  }

  const matchSearchUrl =
    `/creators?keyword=${encodeURIComponent(`${brief.title} ${brief.contentType} ${brief.style}`)}` +
    (brief.requiredTools[0] ? `&tool=${encodeURIComponent(brief.requiredTools[0])}` : "") +
    (brief.requiredSkills[0] ? `&skill=${encodeURIComponent(brief.requiredSkills[0])}` : "") +
    (brief.contentType ? `&contentType=${encodeURIComponent(brief.contentType)}` : "") +
    `&commercialUse=${brief.commercialUse}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* ── Top Header & Actions ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            to="/briefs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Creative Briefs
          </Link>

          {user?.role === "BRAND" && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild className="h-8 gap-1.5 text-xs">
                <Link to={`/briefs/${id}/edit`}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Brief
                </Link>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 gap-1.5 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="rounded-full bg-accent/10 border border-accent/20 px-3 py-0.5 text-xs font-bold text-accent">
            {brief.contentType || "Creative Brief"}
          </span>
          <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink/70">
            {brief.platform} · {brief.aspectRatio}
          </span>
          {brief.duration && (
            <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink/70">
              {brief.duration}
            </span>
          )}
          {brief.commercialUse && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Commercial Rights Cleared
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-ink">{brief.title}</h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink/75 whitespace-pre-line">
          {brief.description}
        </p>
      </div>

      {/* ── Brief Specifications Grid ─────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Creative Direction & Deliverables */}
        <div className="md:col-span-2 space-y-6">
          {brief.creativeDirection && (
            <Card className="p-6">
              <h3 className="font-semibold text-sm text-ink mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Creative Direction & Aesthetic
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-ink/70 whitespace-pre-wrap">
                {brief.creativeDirection}
              </p>
            </Card>
          )}

          {brief.deliverables && brief.deliverables.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-sm text-ink mb-3 flex items-center gap-2">
                <Film className="h-4 w-4 text-accent" />
                Required Deliverables ({brief.deliverables.length})
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-ink/80">
                {brief.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Tools & Skills */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-xs text-ink/50 uppercase tracking-wider mb-2">
                Required AI Tools & Models
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {brief.requiredTools && brief.requiredTools.length > 0 ? (
                  brief.requiredTools.map((t) => (
                    <span
                      key={t}
                      className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink/40">Open to any AI generative tool</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-xs text-ink/50 uppercase tracking-wider mb-2">
                Required Creator Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {brief.requiredSkills && brief.requiredSkills.length > 0 ? (
                  brief.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-xl border border-ink/10 bg-mist px-3 py-1 text-xs font-medium text-ink/80"
                    >
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink/40">General AI creative direction</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Parameters & Metadata Sidebar */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3.5 text-xs">
            <h3 className="font-bold text-sm text-ink border-b border-ink/8 pb-2">
              Campaign Specifications
            </h3>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Style</span>
              <span className="font-semibold text-ink">{brief.style || "Commercial"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Target Audience</span>
              <span className="font-semibold text-ink">{brief.targetAudience || "Broad"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Platform</span>
              <span className="font-semibold text-ink">{brief.platform || "Instagram"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Aspect Ratio</span>
              <span className="font-semibold text-ink">{brief.aspectRatio || "9:16"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Duration</span>
              <span className="font-semibold text-ink">{brief.duration || "30s"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink/60">Budget</span>
              <span className="font-bold text-ink">{brief.budget || "Negotiable"}</span>
            </div>

            {brief.deadline && (
              <div className="flex justify-between items-center">
                <span className="text-ink/60">Deadline</span>
                <span className="font-semibold text-ink flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-ink/40" />
                  {new Date(brief.deadline).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-ink/8 pt-2">
              <span className="text-ink/60">Commercial Rights</span>
              <span className="font-bold text-emerald-700">
                {brief.commercialUse ? "Cleared Required" : "Standard"}
              </span>
            </div>
          </Card>

          {/* Quick Find More Creators in Directory Button */}
          <Button variant="outline" className="w-full text-xs font-semibold h-10 gap-1.5" asChild>
            <Link to={matchSearchUrl}>
              <Users className="h-4 w-4 text-accent" />
              <span>Open in Creator Directory</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Connected Creator Matching Section ────────────────────────────── */}
      <div className="border-t border-ink/8 pt-8 space-y-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                <Sparkles className="h-3 w-3" />
                Deterministic Matching
              </span>
              <span className="text-xs font-semibold text-ink/50">
                Connected Creator Matching System
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Matched Creators for this Brief
            </h2>
            <p className="text-xs text-ink/60">
              Ranked in real time based on required tools, skills, content format, commercial-use clearance, and portfolio relevance.
            </p>
          </div>

          <Button variant="accent" size="sm" asChild className="h-9 gap-1.5 text-xs font-bold">
            <Link to={matchSearchUrl}>
              <Users className="h-3.5 w-3.5" />
              View All Matching Creators
            </Link>
          </Button>
        </div>

        {/* Creator Results Cards */}
        {matches.length === 0 ? (
          <Card className="p-8 text-center text-xs text-ink/50">
            Scanning creator network for this brief's specific stack...
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((creator) => (
              <Card
                key={creator.id}
                className="flex flex-col justify-between overflow-hidden border border-ink/10 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  {/* Top: Avatar, Name, Specialization & Trust */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <img
                        src={creator.avatarUrl}
                        alt={creator.user?.name}
                        className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-ink/5"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/creators/${creator.id}`}
                          className="truncate font-bold text-sm text-ink hover:text-accent flex items-center gap-1"
                        >
                          <span className="truncate">{creator.user?.name}</span>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        </Link>
                        <p className="truncate text-xs text-ink/65 font-medium">
                          {creator.specializations?.[0] || creator.headline}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{creator.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-ink/40 block">Trust</span>
                      <span className="font-display text-base text-ink">{creator.trustScore}</span>
                    </div>
                  </div>

                  {/* Match Badge */}
                  <div>
                    <MatchBadge match={creator.match} />
                  </div>

                  {/* "Why they match" Card */}
                  {creator.match?.reasons && creator.match.reasons.length > 0 && (
                    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-xs">
                      <div className="mb-1.5 flex items-center justify-between border-b border-accent/10 pb-1">
                        <span className="font-bold text-[11px] text-ink flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-accent" />
                          Why this creator matches:
                        </span>
                        <span className="text-[10px] font-bold text-accent">
                          {creator.match.total}%
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {creator.match.reasons.slice(0, 4).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-ink/85">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                            <span className="leading-snug">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions: View Profile, Shortlist, Send Brief */}
                <div className="mt-4 pt-3 border-t border-ink/6 grid grid-cols-3 gap-1.5 text-xs">
                  <Button size="sm" variant="outline" className="h-8 px-2 text-[11px] font-medium" asChild>
                    <Link to={`/creators/${creator.id}`}>
                      View Profile
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShortlist(creator.id)}
                    className={`h-8 px-2 text-[11px] font-medium transition ${
                      shortlisted.has(creator.id) ? "border-accent text-accent bg-accent/5" : ""
                    }`}
                  >
                    <Bookmark
                      className={`h-3 w-3 mr-1 ${shortlisted.has(creator.id) ? "fill-accent text-accent" : ""}`}
                    />
                    {shortlisted.has(creator.id) ? "Saved" : "Shortlist"}
                  </Button>

                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => setSendTarget(creator)}
                    className="h-8 px-2 text-[11px] font-bold"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Brief
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Brief Modal */}
      {sendTarget && (
        <SendBriefModal
          open={!!sendTarget}
          onClose={() => setSendTarget(null)}
          creatorId={sendTarget.id}
          creatorName={sendTarget.user?.name || "Creator"}
        />
      )}
    </div>
  );
}
