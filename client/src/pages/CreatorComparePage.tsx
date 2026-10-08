import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Layers,
  Wrench,
  Award,
  Film,
  ExternalLink,
  Plus,
  X,
  RotateCcw,
  Clock,
  FileCheck,
  FileText,
  Bookmark,
  Send,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/MatchBadge";
import { SendBriefModal } from "@/components/SendBriefModal";
import { useCompare } from "@/context/CompareContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import type { Creator } from "@/types";

export function CreatorComparePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { compareList, removeFromCompare, addToCompare, clearCompare } = useCompare();

  const [loading, setLoading] = useState(false);
  const [creators, setCreators] = useState<Creator[]>(compareList);
  const [sendTo, setSendTo] = useState<Creator | null>(null);
  const [shortlistedMap, setShortlistedMap] = useState<Record<string, boolean>>({});

  // Quick-add search modal / dropdown state
  const [searchPickerOpen, setSearchPickerOpen] = useState(false);
  const [availableCreators, setAvailableCreators] = useState<Creator[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");

  // Sync URL ?ids= with compare list
  const idsFromUrl = useMemo(() => {
    const raw = params.get("ids");
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }, [params]);

  // Load creators if URL has ids differing from state
  useEffect(() => {
    if (idsFromUrl.length > 0) {
      setLoading(true);
      api<{ creators: Creator[] }>(`/api/creators/compare?ids=${idsFromUrl.join(",")}`)
        .then((res) => {
          if (res.creators && res.creators.length > 0) {
            setCreators(res.creators);
            // Sync context
            res.creators.forEach((c) => addToCompare(c));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (compareList.length > 0) {
      setCreators(compareList);
      setParams({ ids: compareList.map((c) => c.id).join(",") }, { replace: true });
    } else {
      setCreators([]);
    }
  }, [idsFromUrl.join(","), compareList]);

  // Load available creators for the "+ Add creator" picker
  useEffect(() => {
    if (searchPickerOpen) {
      api<{ results: Creator[] }>("/api/creators/search?limit=12")
        .then((res) => setAvailableCreators(res.results || []))
        .catch(() => {});
    }
  }, [searchPickerOpen]);

  // Handle removing a creator
  function handleRemove(id: string) {
    removeFromCompare(id);
    const updated = creators.filter((c) => c.id !== id);
    setCreators(updated);
    if (updated.length > 0) {
      setParams({ ids: updated.map((c) => c.id).join(",") });
    } else {
      setParams({});
    }
  }

  // Handle adding from picker
  function handleAddCreator(c: Creator) {
    if (creators.length >= 3) {
      toast.error("Maximum 3 creators can be compared side-by-side.");
      return;
    }
    addToCompare(c);
    const updated = [...creators, c];
    setCreators(updated);
    setParams({ ids: updated.map((item) => item.id).join(",") });
    setSearchPickerOpen(false);
  }

  // Handle Shortlist action
  async function handleShortlist(c: Creator) {
    if (user?.role !== "BRAND") {
      return toast.error("Please log in as a Brand to shortlist creators.");
    }
    try {
      if (shortlistedMap[c.id]) {
        toast.info(`${c.user.name} is already shortlisted.`);
        return;
      }
      await api("/api/shortlist", {
        method: "POST",
        body: JSON.stringify({ creatorId: c.id }),
      });
      setShortlistedMap((prev) => ({ ...prev, [c.id]: true }));
      toast.success(`Added ${c.user.name} to shortlist.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to shortlist");
    }
  }

  // Find shared skills across all compared creators
  const sharedSkills = useMemo(() => {
    if (creators.length < 2) return new Set<string>();
    const allSets = creators.map((c) => new Set(c.skills.map((s) => s.toLowerCase())));
    const first = allSets[0];
    const common = new Set<string>();
    first.forEach((s) => {
      if (allSets.every((set) => set.has(s))) {
        common.add(s);
      }
    });
    return common;
  }, [creators]);

  // Highest match score highlight
  const highestMatchScore = useMemo(() => {
    if (creators.length === 0) return 0;
    return Math.max(...creators.map((c) => c.match?.total || 0));
  }, [creators]);

  // Highest profile strength highlight
  const highestStrength = useMemo(() => {
    if (creators.length === 0) return 0;
    return Math.max(
      ...creators.map((c) => c.verification?.profileStrength || c.trustScore || 0)
    );
  }, [creators]);

  // Filtered picker candidates
  const filteredCandidates = useMemo(() => {
    const existingIds = new Set(creators.map((c) => c.id));
    return availableCreators.filter(
      (c) =>
        !existingIds.has(c.id) &&
        (c.user.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(pickerQuery.toLowerCase())) ||
          c.tools.some((t) => t.toLowerCase().includes(pickerQuery.toLowerCase())))
    );
  }, [availableCreators, creators, pickerQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-ink/8 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Side-by-Side Evaluation
            </span>
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-medium text-ink/70">
              {creators.length} of 3 Selected
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Creator Comparison
          </h1>
          <p className="mt-1 text-xs text-ink/60 sm:text-sm">
            Compare skills, verified profile signals, AI tools, match scores, and best work side-by-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" asChild>
            <Link to="/creators">Browse Creators</Link>
          </Button>
          {creators.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearCompare();
                setCreators([]);
                setParams({});
              }}
              className="text-rose-600 hover:text-rose-700"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear Comparison
            </Button>
          )}
        </div>
      </div>

      {/* ── State: Empty or Insufficient Selection ─────────────────── */}
      {creators.length < 2 ? (
        <Card className="flex flex-col items-center justify-center border-dashed border-ink/15 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/10 text-accent shadow-xs">
            <ArrowLeftRight className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold text-ink">
            {creators.length === 1
              ? `Select 1 or 2 more creators to compare with ${creators[0].user.name}`
              : "Select 2 to 3 creators to compare"}
          </h3>
          <p className="mt-2 max-w-md text-xs sm:text-sm text-ink/60">
            Compare match scores, AI tools, verifiable signals, commercial license terms, and portfolio projects in a clean side-by-side view.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="accent" asChild>
              <Link to="/creators">Browse Creator Directory</Link>
            </Button>
            {user?.role === "BRAND" && (
              <Button variant="outline" asChild>
                <Link to="/shortlist">Pick From Shortlist</Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* ── State: Clean Side-by-Side Comparison Table ───────────── */
        <div className="space-y-6">
          {/* Comparison Table Grid */}
          <div className="overflow-x-auto rounded-3xl border border-ink/10 bg-white shadow-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/8 bg-mist/40">
                  <th className="w-1/4 min-w-[200px] p-5 text-xs font-bold uppercase tracking-wider text-ink/50">
                    Criteria / Metric
                  </th>
                  {creators.map((c) => (
                    <th key={c.id} className="min-w-[280px] max-w-[340px] p-5 align-top">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatarUrl}
                            alt={c.user.name}
                            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate font-display text-base font-bold text-ink">
                              {c.user.name}
                            </h3>
                            <p className="truncate text-xs text-ink/60">
                              {c.specializations[0] || c.headline}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(c.id)}
                          className="rounded-lg p-1 text-ink/40 transition hover:bg-rose-100 hover:text-rose-600"
                          title="Remove from comparison"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Column Quick Action Buttons */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5" asChild>
                          <Link to={`/creators/${c.id}`} target="_blank">
                            Profile <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                        {user?.role === "BRAND" && (
                          <Button
                            size="sm"
                            variant={shortlistedMap[c.id] ? "outline" : "outline"}
                            className="h-7 text-[11px] px-2.5"
                            onClick={() => handleShortlist(c)}
                          >
                            <Bookmark className="mr-1 h-3 w-3" />
                            {shortlistedMap[c.id] ? "Saved" : "Shortlist"}
                          </Button>
                        )}
                        {user?.role === "BRAND" && (
                          <Button
                            size="sm"
                            variant="accent"
                            className="h-7 text-[11px] px-2.5 font-bold"
                            onClick={() => setSendTo(c)}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Brief
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Slot for 3rd Creator if only 2 selected */}
                  {creators.length < 3 && (
                    <th className="min-w-[240px] p-5 align-top text-center bg-mist/20">
                      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 p-6 text-center">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink/50">
                          <Plus className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-ink">Add 3rd Creator</p>
                        <p className="mt-0.5 text-[11px] text-ink/40">Compare up to 3 creators</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 h-7 text-xs font-semibold"
                          onClick={() => setSearchPickerOpen(true)}
                        >
                          + Select Creator
                        </Button>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-ink/8 text-xs">
                {/* 1. MATCH SCORE */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>Match Score</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Deterministic algorithm score
                    </p>
                  </td>
                  {creators.map((c) => {
                    const score = c.match?.total || 70;
                    const isTop = score > 0 && score === highestMatchScore;
                    return (
                      <td key={c.id} className="p-5 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-2xl font-bold text-ink">
                            {score}%
                          </span>
                          <MatchBadge match={c.match} />
                          {isTop && creators.length > 1 && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Top Match
                            </span>
                          )}
                        </div>

                        {/* Match Reasons */}
                        {c.match?.reasons && c.match.reasons.length > 0 && (
                          <ul className="mt-2.5 space-y-1 rounded-xl bg-accent/5 p-2.5 text-[11px] text-ink/80">
                            {c.match.reasons.slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 2. SKILLS */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-ink/60" />
                      <span>Skills</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Core technical capabilities
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {c.skills.map((s) => {
                          const isShared = sharedSkills.has(s.toLowerCase());
                          return (
                            <span
                              key={s}
                              className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                                isShared
                                  ? "bg-accent/15 text-accent font-bold border border-accent/20"
                                  : "bg-mist text-ink/80 border border-ink/8"
                              }`}
                            >
                              {s} {isShared && "★"}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 3. SPECIALIZATIONS */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-ink/60" />
                      <span>Specializations</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Industry & creative focus
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {c.specializations.length > 0 ? (
                          c.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="rounded-lg bg-mist/80 border border-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink"
                            >
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink/40 italic">General Creative Direction</span>
                        )}
                      </div>
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 4. AI TOOLS & MODELS */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-ink/60" />
                      <span>AI Tools & Models</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Documented tooling stack
                    </p>
                  </td>
                  {creators.map((c) => {
                    const allTools = Array.from(new Set([...c.tools, ...c.aiModels]));
                    return (
                      <td key={c.id} className="p-5 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {allTools.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/80 border border-ink/8"
                            >
                              <Wrench className="h-2.5 w-2.5 text-accent" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 5. PORTFOLIO COUNT */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-ink/60" />
                      <span>Portfolio Count</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Verified case studies
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      <span className="font-display text-lg font-bold text-ink">
                        {c.portfolio?.length || 0}
                      </span>
                      <span className="ml-1 text-ink/50">
                        {(c.portfolio?.length || 0) === 1 ? "project" : "projects"} published
                      </span>
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 6. BEST WORK (FEATURED PROJECT) */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-ink/60" />
                      <span>Best Work</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Top featured project preview
                    </p>
                  </td>
                  {creators.map((c) => {
                    const best = c.portfolio?.[0];
                    return (
                      <td key={c.id} className="p-5 align-top">
                        {best ? (
                          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-mist/30 transition hover:shadow-xs">
                            <div className="relative aspect-video bg-ink/10">
                              <img
                                src={best.thumbnailUrl || best.mediaUrl}
                                alt={best.title}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                {best.aspectRatio || "16:9"}
                              </span>
                            </div>
                            <div className="p-3">
                              <h4 className="font-bold text-ink text-xs truncate">
                                {best.title}
                              </h4>
                              <p className="text-[11px] text-ink/60 line-clamp-2 mt-0.5">
                                {best.description}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {best.toolsUsed?.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink/70 border border-ink/10"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2.5 pt-2 border-t border-ink/8">
                                <Link
                                  to={`/portfolio/${best.id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                                >
                                  View Case Study <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">No public work published yet</span>
                        )}
                      </td>
                    );
                  })}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 7. EXPERIENCE */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-ink/60" />
                      <span>Experience</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Track record & background
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      <div className="font-display text-base font-bold text-ink">
                        {c.experienceYears ? `${c.experienceYears} Years` : "Established Professional"}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink/60">
                        {c.experience || "Industry experience documented"}
                      </p>
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 8. COMMERCIAL AVAILABILITY */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-ink/60" />
                      <span>Commercial Rights</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      License authorization status
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      {c.commercialUse ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <Check className="h-3 w-3" />
                          Commercial Rights Cleared
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <AlertCircle className="h-3 w-3" />
                          Editorial / Portfolio Only
                        </div>
                      )}
                      {c.commercialNotes && (
                        <p className="mt-1.5 text-[11px] text-ink/60 italic">
                          "{c.commercialNotes}"
                        </p>
                      )}
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 9. VERIFICATION & PROFILE STRENGTH */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-ink/60" />
                      <span>Verification & Signals</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      Profile completeness breakdown
                    </p>
                  </td>
                  {creators.map((c) => {
                    const strength = c.verification?.profileStrength ?? 100;
                    const v = c.verification;
                    const isPhoneVerified = Boolean(v?.phoneVerified || c.user?.phoneVerified);
                    const isEmailVerified = Boolean(v?.emailVerified || c.user?.email);

                    return (
                      <td key={c.id} className="p-5 align-top">
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Profile Strength</span>
                            <span className="font-bold text-accent">{strength}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-mist overflow-hidden">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-accent to-emerald-500 transition-all"
                              style={{ width: `${strength}%` }}
                            />
                          </div>
                        </div>

                        {/* Verification Signals Checklist */}
                        <div className="mt-3 space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-ink/80">
                            {isEmailVerified ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Email Verified</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {isPhoneVerified ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span className="font-medium">
                              {isPhoneVerified ? "Verified Contact" : "Contact Unconfirmed"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {v?.resumeAdded || c.resumeUrl ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Resume Added</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {v?.portfolioAdded || (c.portfolio && c.portfolio.length > 0) ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Portfolio Added</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {v?.toolsDocumented || c.tools.length > 0 ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Tools Documented</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {v?.workflowDocumented || (c.workflow && c.workflow.length > 20) ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Workflow Documented</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-ink/80">
                            {v?.experienceAdded || c.experienceYears ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-ink/30" />
                            )}
                            <span>Experience Added</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>

                {/* 10. LOCATION */}
                <tr>
                  <td className="p-5 font-semibold text-ink bg-mist/10">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-ink/60" />
                      <span>Location</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-normal text-ink/50">
                      City / Regional hub
                    </p>
                  </td>
                  {creators.map((c) => (
                    <td key={c.id} className="p-5 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        <span>{c.location || "Remote / Worldwide"}</span>
                      </div>
                    </td>
                  ))}
                  {creators.length < 3 && <td className="p-5 bg-mist/5" />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Picker Modal (to add 3rd creator) ─────────────── */}
      {searchPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ink/8 pb-3">
              <h3 className="font-display text-lg font-bold text-ink">
                Add Creator to Compare
              </h3>
              <button
                type="button"
                onClick={() => setSearchPickerOpen(false)}
                className="rounded-lg p-1 text-ink/40 hover:bg-mist hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Search by name, skill, or tool…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-ink/15 px-3 text-xs focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCandidates.length === 0 ? (
                <p className="py-6 text-center text-xs text-ink/50">
                  No additional creators found matching "{pickerQuery}".
                </p>
              ) : (
                filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-ink/8 p-3 transition hover:bg-mist/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cand.avatarUrl}
                        alt={cand.user.name}
                        className="h-9 w-9 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-xs text-ink">
                          {cand.user.name}
                        </h4>
                        <p className="truncate text-[11px] text-ink/50">
                          {cand.specializations[0] || cand.headline}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => handleAddCreator(cand)}
                      className="h-7 text-xs font-semibold px-3"
                    >
                      + Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Brief Modal */}
      <SendBriefModal
        open={!!sendTo}
        onClose={() => setSendTo(null)}
        creatorId={sendTo?.id || ""}
        creatorName={sendTo?.user.name || ""}
      />
    </div>
  );
}
