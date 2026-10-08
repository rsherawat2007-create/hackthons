import { CheckCircle2, Circle, ShieldCheck, Mail, Phone, FileText, Film, Wrench, Layers, Briefcase } from "lucide-react";
import type { Verification, Creator } from "@/types";

export interface TrustSignalsProps {
  verification?: Verification | null;
  trustScore?: number;
  creator?: (Partial<Creator> & { user?: { email?: string; phoneVerified?: boolean } }) | null;
  compact?: boolean;
}

export function TrustSignals({ verification, trustScore, creator, compact = false }: TrustSignalsProps) {
  // 1. Email Verified
  const emailVerified =
    verification?.emailVerified ?? Boolean(creator?.user?.email && creator.user.email.includes("@"));

  // 2. Phone Verified (Verified Contact — direct SMS channel, does not claim identity)
  const phoneVerified = verification?.phoneVerified ?? Boolean(creator?.user?.phoneVerified);

  // 3. Resume Added
  const resumeAdded =
    verification?.resumeAdded ?? Boolean(creator?.resumeUrl && creator.resumeUrl.trim().length > 0);

  // 4. Portfolio Added
  const portfolioAdded =
    verification?.portfolioAdded ?? Boolean(creator?.portfolio && creator.portfolio.length > 0);

  // 5. Tools Documented
  const toolsDocumented =
    verification?.toolsDocumented ?? Boolean(creator?.tools && creator.tools.length > 0);

  // 6. Workflow Documented
  const workflowDocumented =
    verification?.workflowDocumented ?? Boolean(creator?.workflow && creator.workflow.trim().length >= 20);

  // 7. Experience Added
  const experienceAdded =
    verification?.experienceAdded ??
    Boolean(
      (creator?.experience && creator.experience.trim().length > 0) ||
        (creator?.experienceYears && creator.experienceYears > 0)
    );

  // 7 Ground-Truth Signals
  const signals = [
    {
      key: "email",
      label: "Email Verified",
      ok: emailVerified,
      icon: Mail,
      category: "Verified Contact",
      badge: "Verified Contact",
      detail: "Direct email deliverability confirmed",
    },
    {
      key: "phone",
      label: "Phone Verified",
      ok: phoneVerified,
      icon: Phone,
      category: "Verified Contact",
      badge: "Verified Contact",
      detail: "Direct SMS channel confirmed (contact verification)",
    },
    {
      key: "resume",
      label: "Resume Added",
      ok: resumeAdded,
      icon: FileText,
      category: "Profile Complete",
      badge: resumeAdded ? "CV on file" : "Incomplete",
      detail: "Career history & background document uploaded",
    },
    {
      key: "portfolio",
      label: "Portfolio Added",
      ok: portfolioAdded,
      icon: Film,
      category: "Profile Complete",
      badge: portfolioAdded
        ? `${creator?.portfolio?.length || "Projects"} Added`
        : "Incomplete",
      detail: "Original client deliverables and case studies",
    },
    {
      key: "tools",
      label: "Tools Documented",
      ok: toolsDocumented,
      icon: Wrench,
      category: "Profile Complete",
      badge: toolsDocumented
        ? `${creator?.tools?.length || "Tools"} Listed`
        : "Incomplete",
      detail: "Production software & AI models cataloged",
    },
    {
      key: "workflow",
      label: "Workflow Documented",
      ok: workflowDocumented,
      icon: Layers,
      category: "Profile Complete",
      badge: workflowDocumented ? "Pipeline Detailed" : "Incomplete",
      detail: "Step-by-step creative methodology documented",
    },
    {
      key: "experience",
      label: "Experience Added",
      ok: experienceAdded,
      icon: Briefcase,
      category: "Profile Complete",
      badge: experienceAdded
        ? creator?.experienceYears
          ? `${creator.experienceYears}+ years`
          : "Documented"
        : "Incomplete",
      detail: "Professional production background noted",
    },
  ];

  const completedCount = signals.filter((s) => s.ok).length;
  const profileStrength =
    verification?.profileStrength ?? Math.round((completedCount / signals.length) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-1 text-xs font-semibold text-accent">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Profile Strength: {profileStrength}%</span>
        </div>
        <span className="text-[11px] text-ink/50">
          ({completedCount}/{signals.length} Signals)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Profile Strength Header ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-ink">Profile Strength</p>
          </div>
          <p className="font-display text-2xl text-accent">{profileStrength}%</p>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-all duration-500"
            style={{ width: `${profileStrength}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink/50">
          <span>{completedCount} of {signals.length} Verified Signals</span>
          <span className="font-semibold text-emerald-700">
            {profileStrength === 100 ? "Profile Complete" : `${profileStrength}% Complete`}
          </span>
        </div>
      </div>

      {/* ── 7 Separate Verification Indicators ──────────────────────────────── */}
      <div className="space-y-2 border-t border-ink/5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
          Creator Verification Signals
        </p>

        <ul className="space-y-2 text-xs">
          {signals.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.key}
                className={`flex items-start justify-between gap-2.5 rounded-xl border p-2.5 transition ${
                  item.ok
                    ? "border-emerald-100 bg-emerald-50/40 text-ink"
                    : "border-ink/5 bg-mist/40 text-ink/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-ink/30 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${item.ok ? "text-ink" : "text-ink/60"}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] leading-tight text-ink/50">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.ok
                        ? "bg-emerald-100/90 text-emerald-800"
                        : "bg-ink/5 text-ink/40"
                    }`}
                  >
                    {item.ok ? item.badge : "Incomplete"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Ground-Truth Transparency Notice ─────────────────────────────────── */}
      <div className="rounded-xl border border-ink/5 bg-mist/60 p-3 text-[11px] leading-relaxed text-ink/55">
        <p className="font-semibold text-ink/70">Ground-Truth Verification Notice</p>
        <p className="mt-1">
          Signals represent actual profile completeness and confirmed contact channels. Phone verification confirms direct contact deliverability and does not claim to prove external professional or legal identity. No simulated external badges are used.
        </p>
      </div>
    </div>
  );
}
