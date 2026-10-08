import { Link } from "react-router-dom";
import { X, ExternalLink, MapPin, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MapMarker } from "./types";

interface CreatorMapPreviewCardProps {
  marker: MapMarker;
  onClose: () => void;
}

export function CreatorMapPreviewCard({ marker, onClose }: CreatorMapPreviewCardProps) {
  return (
    <Card className="relative overflow-hidden border border-ink/10 bg-white/95 p-0 shadow-xl backdrop-blur-md transition-all sm:max-w-xs">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink/60 text-white transition hover:bg-ink"
        aria-label="Close preview"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Profile & Portfolio Media Preview Banner */}
      <Link to={`/creators/${marker.creatorId}`} className="group block relative h-28 w-full overflow-hidden bg-mist">
        {marker.previewImageUrl ? (
          <img
            src={marker.previewImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink/40">Portfolio preview</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

        {/* Match score badge overlay */}
        {typeof marker.matchScore === "number" && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-accent/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
            {marker.matchScore}% Match {marker.matchLabel ? `· ${marker.matchLabel}` : ""}
          </div>
        )}

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
          <span className="flex items-center gap-1 text-[11px] font-medium opacity-90">
            <MapPin className="h-3 w-3" />
            {marker.cityName || marker.location}
          </span>
          <span className="text-[10px] uppercase tracking-wider opacity-75">Trust: {marker.trustScore}</span>
        </div>
      </Link>

      {/* Creator Details */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-start gap-2.5">
          <img
            src={marker.avatarUrl}
            alt={marker.name}
            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-white shadow-xs"
          />
          <div className="min-w-0 flex-1">
            <Link
              to={`/creators/${marker.creatorId}`}
              className="group flex items-center gap-1 hover:text-accent"
            >
              <h4 className="truncate text-sm font-bold text-ink group-hover:text-accent">{marker.name}</h4>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            </Link>
            <p className="truncate text-xs font-medium text-accent">{marker.specialization}</p>
          </div>
        </div>

        <p className="line-clamp-2 text-[11px] leading-relaxed text-ink/65">{marker.headline}</p>

        {marker.reasons && marker.reasons.length > 0 && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-2.5 text-xs">
            <div className="mb-1.5 flex items-center justify-between border-b border-accent/10 pb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider text-accent">
                Why this creator?
              </span>
              {typeof marker.matchScore === "number" && (
                <span className="text-[10px] font-bold text-accent">{marker.matchScore}%</span>
              )}
            </div>
            <ul className="space-y-1">
              {marker.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-ink/85">
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="line-clamp-1">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View Profile Action */}
        <div className="pt-1">
          <Button size="sm" variant="accent" className="w-full text-xs font-semibold h-8" asChild>
            <Link to={`/creators/${marker.creatorId}`} className="flex items-center justify-center gap-1.5">
              <span>View Full Profile</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
