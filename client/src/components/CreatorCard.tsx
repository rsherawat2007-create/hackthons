import { Link } from "react-router-dom";
import type { Creator } from "@/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { MatchBadge } from "./MatchBadge";
import { MapPin, CheckCircle2, ShieldCheck, Sparkles, ArrowLeftRight } from "lucide-react";
import { useCompare } from "@/context/CompareContext";

export function CreatorCard({
  creator,
  onShortlist,
  onSend,
  shortlisted,
}: {
  creator: Creator;
  onShortlist?: () => void;
  onSend?: () => void;
  shortlisted?: boolean;
}) {
  const { isInCompare, toggleCompare } = useCompare();
  const preview = creator.portfolio?.[0];
  const strength = creator.verification?.profileStrength ?? 100;
  const isPhoneVerified = creator.verification?.phoneVerified || creator.user?.phoneVerified;
  const comparing = isInCompare(creator.id);

  return (
    <Card className={`overflow-hidden transition hover:-translate-y-0.5 ${comparing ? "ring-2 ring-accent" : ""}`}>
      <div className="relative h-40 bg-violet-100">
        {preview ? (
          <img src={preview.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink/40">No portfolio yet</div>
        )}
        <div className="absolute left-3 top-3">
          <MatchBadge match={creator.match} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(creator);
          }}
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-md backdrop-blur-md transition ${
            comparing
              ? "bg-accent text-white"
              : "bg-white/85 text-ink hover:bg-white hover:text-accent"
          }`}
          title={comparing ? "Remove from comparison" : "Add to comparison"}
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>{comparing ? "Comparing" : "+ Compare"}</span>
        </button>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <img src={creator.avatarUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{creator.user.name}</h3>
            <p className="truncate text-sm text-ink/60">{creator.specializations[0] || creator.headline}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
              <MapPin className="h-3 w-3" /> {creator.location}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] uppercase tracking-wide text-ink/40">Trust</p>
            <p className="font-display text-xl">{creator.trustScore}</p>
          </div>
        </div>

        {/* Verification & Strength Signals */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Profile {strength}%
          </span>
          {isPhoneVerified && (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              <ShieldCheck className="h-3 w-3 text-sky-600" />
              Verified Contact
            </span>
          )}
          {creator.portfolio && creator.portfolio.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-mist px-2 py-0.5 text-[11px] font-medium text-ink/70">
              Portfolio Added
            </span>
          )}
        </div>

        {/* Why this creator? (3-5 reasons generated from actual matching data) */}
        {creator.match?.reasons && creator.match.reasons.length > 0 && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between border-b border-accent/10 pb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Why this creator?
              </span>
              <span className="text-[11px] font-bold text-accent">
                {creator.match.total}% Match
              </span>
            </div>
            <ul className="space-y-1.5">
              {creator.match.reasons.slice(0, 5).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-ink/85">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {creator.skills.slice(0, 3).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] text-ink/50">
          {creator.tools.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-ink/5 px-2 py-1">
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" asChild>
            <Link to={`/creators/${creator.id}`}>View Profile</Link>
          </Button>
          <Button
            size="sm"
            variant={comparing ? "accent" : "outline"}
            onClick={() => toggleCompare(creator)}
            className="text-xs"
          >
            <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
            {comparing ? "Comparing" : "Compare"}
          </Button>
          {onShortlist && (
            <Button size="sm" variant="outline" onClick={onShortlist}>
              {shortlisted ? "Shortlisted" : "Shortlist"}
            </Button>
          )}
          {onSend && (
            <Button size="sm" variant="accent" onClick={onSend}>
              Send Brief
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
