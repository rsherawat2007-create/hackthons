import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Bookmark,
  Send,
  Eye,
  Layers,
  Star,
  Download,
  Lock,
  ArrowLeftRight,
} from "lucide-react";
import { MatchBadge } from "@/components/MatchBadge";
import { SendBriefModal } from "@/components/SendBriefModal";
import { TrustSignals } from "@/components/TrustSignals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useCompare } from "@/context/CompareContext";
import type { Creator } from "@/types";

export function CreatorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const { isInCompare, toggleCompare } = useCompare();

  useEffect(() => {
    api<{ creator: Creator }>(
      `/api/creators/${id}?keyword=AI%20product%20video&tool=Runway&specialization=Product%20Advertisement&contentType=AI%20Video`
    )
      .then((d) => setCreator(d.creator))
      .catch((e) => toast.error(e.message));
  }, [id]);

  if (!creator) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-ink/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm">Loading professional profile…</p>
        </div>
      </div>
    );
  }

  // Check if current logged-in user is the owner of this profile
  const isOwner = user?.role === "CREATOR" && (user.id === creator.user?.id || user.creatorProfile?.id === creator.id);

  // Best work: explicitly featured items sorted by featuredOrder
  const bestWork = (creator.portfolio || [])
    .filter((p) => p.isFeatured)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
  const normalPortfolio = (creator.portfolio || []).filter((p) => !p.isFeatured);

  async function handleShortlist() {
    if (!creator) return;
    try {
      await api("/api/shortlist", { method: "POST", body: JSON.stringify({ creatorId: creator.id }) });
      setShortlisted(true);
      toast.success("Added to your shortlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not shortlist");
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* ── 1. LinkedIn-style Hero Banner & Header Card ──────────────────────── */}
      <div className="relative border-b border-ink/5 bg-white">
        {/* Decorative Top Banner */}
        <div className="h-44 w-full bg-gradient-to-r from-ink via-[#182038] to-accent/90 sm:h-52">
          <div className="h-full w-full bg-aurora opacity-40" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative -mt-16 pb-8 sm:-mt-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              {/* Photo & Identity */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative">
                  <img
                    src={
                      creator.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={creator.user?.name}
                    className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-card sm:h-40 sm:w-40"
                  />
                  {creator.commercialUse && (
                    <span
                      title="Verified for Commercial Use"
                      className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl text-ink sm:text-4xl">{creator.user?.name}</h1>
                    <span className="rounded-full bg-violet-100/70 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      AI Creator
                    </span>
                  </div>

                  <p className="text-base font-medium text-ink/80 sm:text-lg">
                    {creator.headline || "AI Content Producer & Creative Director"}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-ink/50 sm:text-sm">
                    {creator.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-ink/40" />
                        {creator.location}
                      </span>
                    )}
                    {creator.experienceYears ? (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-ink/40" />
                        {creator.experienceYears}+ years experience
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <Clock className="h-3.5 w-3.5" />
                      {creator.availability || "Available for projects"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {isOwner ? (
                  <Button variant="accent" size="default" asChild>
                    <Link to="/creator/profile" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                ) : (
                  <>
                    {user?.role === "BRAND" && (
                      <>
                        <Button
                          variant={shortlisted ? "outline" : "outline"}
                          size="default"
                          onClick={handleShortlist}
                          className="flex items-center gap-2"
                        >
                          <Bookmark className="h-4 w-4" />
                          {shortlisted ? "Shortlisted" : "Shortlist"}
                        </Button>
                        <Button
                          variant="accent"
                          size="default"
                          onClick={() => setSendOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Send Brief
                        </Button>
                      </>
                    )}
                    <Button
                      variant={isInCompare(creator.id) ? "accent" : "outline"}
                      size="default"
                      onClick={() => toggleCompare(creator)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      {isInCompare(creator.id) ? "Comparing" : "+ Compare"}
                    </Button>
                    {creator.resumeUrl && (creator.resumePublic !== false || isOwner || user?.role === "BRAND") && (
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="default" asChild>
                          <a href={creator.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            Resume
                            <ExternalLink className="h-3 w-3 text-ink/40" />
                          </a>
                        </Button>
                        <Button variant="outline" size="default" asChild title="Download Resume">
                          <a href={`${creator.resumeUrl}?download=true`} download className="flex items-center px-3">
                            <Download className="h-4 w-4 text-ink/60" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Badges Row */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-2">
              <MatchBadge match={creator.match} />
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-accent">
                Profile Strength {creator.verification?.profileStrength ?? 100}%
              </span>
              {creator.user?.phoneVerified && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800" title="Direct contact channel verified">
                  ✓ Verified Contact
                </span>
              )}
              <span className="rounded-full border border-ink/10 bg-mist px-3 py-1 text-xs font-medium text-ink/70">
                Trust Score {creator.trustScore}/100
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                {creator.commercialUse ? "✓ Commercial Licensing Available" : "Personal Licensing Only"}
              </span>
              {creator.specializations.map((spec) => (
                <span key={spec} className="chip">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Profile Sections */}
        <div className="space-y-6">
          {/* Section: Bio / About */}
          <Card className="p-6">
            <h2 className="font-display text-2xl text-ink">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
              {creator.bio ||
                "Generative AI director and digital artist specializing in cinematic product films, high-fidelity generative visual effects, and commercial brand storytelling."}
            </p>
          </Card>

          {/* Section: Best Work (Featured Highlights) */}
          {bestWork.length > 0 ? (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                  <h2 className="font-display text-2xl text-ink">Best Work</h2>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {bestWork.length} Featured
                  </span>
                </div>
                {isOwner ? (
                  <Button size="sm" variant="outline" asChild className="text-xs">
                    <Link to="/creator/portfolio">Manage Best Work</Link>
                  </Button>
                ) : (
                  <span className="text-xs text-ink/40">Featured Commercial Highlights</span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {bestWork.map((item, idx) => (
                  <Link
                    key={item.id}
                    to={`/portfolio/${item.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-mist transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-violet-100">
                      <img
                        src={item.thumbnailUrl || item.mediaUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        #{idx + 1} Best Work
                      </span>
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/75 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {item.contentType}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-ink group-hover:text-accent">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-ink/60">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.toolsUsed?.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-ink/70">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : isOwner ? (
            <Card className="border-dashed border-amber-200 bg-amber-50/30 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <Star className="h-5 w-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink">Spotlight your Best Work</h3>
                    <p className="text-xs text-ink/60">
                      Select up to 6 key projects to feature prominently at the top of your public profile.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="accent" asChild>
                  <Link to="/creator/portfolio">Choose Featured Projects</Link>
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Section: AI Tools & Models */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-display text-2xl text-ink">AI Tools & Foundation Models</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Production Software & Tools</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.tools.map((t) => (
                    <span
                      key={t}
                      className="rounded-xl border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {creator.aiModels && creator.aiModels.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">AI Generative Models</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {creator.aiModels.map((m) => (
                      <span
                        key={m}
                        className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-1 text-xs font-medium text-violet-800"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Section: Skills & Specializations */}
          <Card className="p-6">
            <h2 className="font-display text-2xl text-ink">Skills & Specializations</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Core Creative Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.skills.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Industry Specializations</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.specializations.map((spec) => (
                    <span key={spec} className="rounded-full border border-ink/10 bg-mist px-3 py-1 text-xs font-medium text-ink">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section: Experience & Production Workflow */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              <h2 className="font-display text-2xl text-ink">Production Pipeline & Workflow</h2>
            </div>
            <p className="mt-1 text-xs text-ink/50">Standard creative methodology from brief to master deliverable</p>
            <div className="mt-4 rounded-2xl border border-ink/5 bg-mist/60 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                {creator.workflow ||
                  "1. Concept Look-Dev & Prompt Strategy\n2. Motion Generation in Runway Gen-3 / Sora\n3. High-resolution Upscaling & Detail Retouching\n4. Editorial Assembly, Sound Design & Color Grading in DaVinci Resolve"}
              </p>
            </div>
          </Card>

          {/* Section: Education, Certificates & Resume */}
          <Card className="p-6">
            <h2 className="font-display text-2xl text-ink">Education & Certifications</h2>
            <div className="mt-5 space-y-5">
              {/* Education */}
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-50 text-accent">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Education</p>
                  <p className="mt-0.5 font-medium text-ink">
                    {creator.education || "B.Des in Digital Media & Computational Arts"}
                  </p>
                </div>
              </div>

              {/* Structured Certificates List */}
              <div className="flex items-start gap-3.5 border-t border-ink/5 pt-4">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-50 text-accent">
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Certificates & Accreditations</p>
                    {isOwner && (
                      <Link to="/creator/profile" className="text-xs font-semibold text-accent hover:underline">
                        + Manage Certificates
                      </Link>
                    )}
                  </div>

                  {creator.certificatesList && creator.certificatesList.length > 0 ? (
                    <div className="space-y-2.5">
                      {creator.certificatesList.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex flex-col justify-between gap-2 rounded-xl border border-ink/8 bg-mist/50 p-3 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-semibold text-ink">{cert.name}</p>
                            <p className="text-xs text-ink/60">
                              {cert.issuingOrganization}
                              {cert.issueDate ? ` · Issued ${cert.issueDate}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {cert.credentialUrl && (
                              <a
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                              >
                                Credential
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {cert.fileUrl && (
                              <a
                                href={`${cert.fileUrl}?download=true`}
                                download
                                className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-medium text-ink/80 hover:bg-violet-50"
                              >
                                <Download className="h-3 w-3" />
                                File
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : creator.certificates && creator.certificates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {creator.certificates.map((cert) => (
                        <span key={cert} className="rounded-lg border border-ink/10 bg-white px-2.5 py-1 text-xs font-medium text-ink/80">
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-ink/60">Runway Certified AI Filmmaker · Midjourney LookDev Specialist</span>
                  )}
                </div>
              </div>

              {/* Resume Card with View & Download */}
              {creator.resumeUrl && (
                <div className="flex items-start gap-3.5 border-t border-ink/5 pt-4">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-50 text-accent">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Verified Resume / CV</p>
                      {creator.resumePublic === false && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-700">
                          <Lock className="h-3 w-3" />
                          Private (Visible to Verified Brands)
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-mist/60 p-3">
                      <div>
                        <p className="text-xs font-medium text-ink">
                          {creator.resumeFileName || `${creator.user?.name}_Resume.pdf`}
                        </p>
                        <p className="text-[11px] text-ink/50">Verified Creator Credential</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={creator.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="accent" asChild>
                          <a href={`${creator.resumeUrl}?download=true`} download className="flex items-center gap-1.5 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Section: Commercial-Use & Licensing Policy */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="font-display text-2xl text-ink">Commercial-Use Information</h2>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{creator.commercialUse ? "Available for full commercial campaigns" : "Restricted commercial use"}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
                {creator.commercialNotes ||
                  "Full intellectual property transfer upon project completion. Commercial-use rights include paid media, social ad campaigns, out-of-home (OOH), and brand broadcast rights."}
              </p>
            </div>
          </Card>

          {/* Section: Full Portfolio Library */}
          <Card className="p-6" id="portfolio">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-ink">Portfolio Library</h2>
                <p className="text-xs text-ink/50">
                  {normalPortfolio.length} {normalPortfolio.length === 1 ? "project" : "projects"}
                  {bestWork.length > 0 ? ` · ${bestWork.length} featured in Best Work above` : ""}
                </p>
              </div>
              {isOwner && (
                <Button size="sm" variant="outline" asChild>
                  <Link to="/creator/portfolio">+ Add Project</Link>
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {normalPortfolio.length > 0 ? (
                normalPortfolio.map((p) => (
                  <Link
                    key={p.id}
                    to={`/portfolio/${p.id}`}
                    className="group overflow-hidden rounded-2xl border border-ink/10 bg-mist transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-violet-100">
                      <img
                        src={p.thumbnailUrl || p.mediaUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-ink/75 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {p.contentType}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="font-semibold text-ink group-hover:text-accent">{p.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">{p.category || p.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-ink/40">
                        <span>{p.aspectRatio || "16:9"}</span>
                        <span className="flex items-center gap-1 font-medium text-accent">
                          <Eye className="h-3 w-3" />
                          View Project
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-ink/10 p-8 text-center text-xs text-ink/50">
                  {bestWork.length > 0
                    ? `All ${bestWork.length} portfolio works are currently spotlighted in your Best Work section above.`
                    : "No portfolio items uploaded yet."}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Trust Signals & Matching Details */}
        <div className="space-y-6">
          {/* Quick Contact / Engage Card (for Brands) */}
          {user?.role === "BRAND" && (
            <Card className="p-5">
              <h3 className="font-semibold text-ink">Work with {creator.user?.name}</h3>
              <p className="mt-1 text-xs text-ink/60">
                Send a creative brief directly or add this creator to your campaign shortlist.
              </p>
              <div className="mt-4 space-y-2">
                <Button variant="accent" className="w-full" onClick={() => setSendOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Brief
                </Button>
                <Button variant="outline" className="w-full" onClick={handleShortlist}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  {shortlisted ? "In Your Shortlist" : "Add to Shortlist"}
                </Button>
              </div>
            </Card>
          )}

          {/* Availability Box */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Current Availability</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-ink">{creator.availability || "Available for projects"}</span>
            </div>
            <p className="mt-1 text-xs text-ink/50">Responds within 24 hours</p>
          </Card>

          {/* Trust Signals */}
          <Card className="p-5">
            <TrustSignals verification={creator.verification} trustScore={creator.trustScore} creator={creator} />
          </Card>

          {/* Match Breakdown Card */}
          {creator.match && (
            <Card className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between border-b border-ink/8 pb-2">
                <div>
                  <p className="font-semibold text-ink">Match Breakdown</p>
                  <p className="text-[11px] text-ink/50">Deterministic algorithm score</p>
                </div>
                <MatchBadge match={creator.match} />
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  ["Skill Match", creator.match.skill, 30],
                  ["Specialization Match", creator.match.specialization, 20],
                  ["Tool Match", creator.match.tool, 15],
                  ["Content Type Match", creator.match.contentType, 15],
                  ["Portfolio Relevance", creator.match.portfolio, 10],
                  ["Location Match", creator.match.location ?? 0, 5],
                  ["Trust / Verification", creator.match.verification, 5],
                ].map(([label, got, max]) => (
                  <div key={String(label)} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink/65">{label}</span>
                      <span className="font-medium text-ink">
                        {got}/{max} ({Math.round(((got as number) / (max as number)) * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round(((got as number) / (max as number)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-ink/8 pt-3">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>Total Match Score</span>
                  <div className="text-right">
                    <span className="text-accent text-base">{creator.match.total}%</span>
                    <span className="ml-2 text-xs font-semibold text-ink/70">· {creator.match.label}</span>
                  </div>
                </div>
              </div>

              {creator.match.reasons && creator.match.reasons.length > 0 && (
                <div className="border-t border-ink/8 pt-3">
                  <p className="font-semibold text-xs text-ink mb-2">Why this creator?</p>
                  <ul className="space-y-1.5">
                    {creator.match.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-ink/75">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <SendBriefModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        creatorId={creator.id}
        creatorName={creator.user?.name || "Creator"}
      />
    </div>
  );
}
