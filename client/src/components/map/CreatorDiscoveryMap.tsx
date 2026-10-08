import { useMemo, useState } from "react";
import type { Creator } from "@/types";
import { resolveCityCoordinates } from "@/utils/geo";
import type { MapMarker, MapProviderComponent } from "./types";
import { InteractiveVectorMap } from "./providers/InteractiveVectorMap";
import { CreatorMapPreviewCard } from "./CreatorMapPreviewCard";
import { MapErrorBoundary } from "./MapErrorBoundary";

export interface CreatorDiscoveryMapProps {
  creators: Creator[];
  selectedCreatorId?: string | null;
  onSelectCreator?: (creatorId: string | null) => void;
  className?: string;
  // Provider abstraction: plug in an alternative map provider (e.g. Leaflet, Mapbox, Google Maps)
  customProvider?: MapProviderComponent;
}

export function CreatorDiscoveryMap({
  creators,
  selectedCreatorId,
  onSelectCreator,
  className = "",
  customProvider,
}: CreatorDiscoveryMapProps) {
  // Map Provider Abstraction: defaults to InteractiveVectorMap
  const ProviderComponent = customProvider || InteractiveVectorMap;

  // Selected marker state
  const [internalSelectedMarker, setInternalSelectedMarker] = useState<MapMarker | null>(null);

  // Convert Creator[] into MapMarker[] with city/region centroid geocoding
  const markers: MapMarker[] = useMemo(() => {
    return creators.map((c) => {
      const geo = resolveCityCoordinates(c.location, c.id);
      const preview = c.portfolio?.[0]?.thumbnailUrl || c.portfolio?.[0]?.mediaUrl;

      return {
        id: c.id,
        creatorId: c.id,
        name: c.user?.name || "AI Creator",
        avatarUrl: c.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        headline: c.headline,
        specialization: c.specializations?.[0] || "Generative AI",
        location: c.location,
        cityName: geo.cityName,
        matchScore: c.match?.total,
        matchLabel: c.match?.label,
        reasons: c.match?.reasons,
        trustScore: c.trustScore,
        previewImageUrl: preview,
        lat: geo.lat,
        lng: geo.lng,
      };
    });
  }, [creators]);

  // Determine active marker from external selectedCreatorId or internal selection
  const activeMarker = useMemo(() => {
    if (selectedCreatorId) {
      return markers.find((m) => m.creatorId === selectedCreatorId) || null;
    }
    return internalSelectedMarker;
  }, [selectedCreatorId, internalSelectedMarker, markers]);

  const handleSelectMarker = (marker: MapMarker | null) => {
    setInternalSelectedMarker(marker);
    onSelectCreator?.(marker ? marker.creatorId : null);
  };

  return (
    <div className={`relative h-full w-full min-h-[520px] ${className}`}>
      {/* Error boundary wraps map provider */}
      <MapErrorBoundary
        fallbackMessage="Map rendering failed. Creator search results and filters continue working as expected."
        onRetry={() => setInternalSelectedMarker(null)}
      >
        <ProviderComponent
          markers={markers}
          selectedMarkerId={activeMarker?.id || null}
          onSelectMarker={handleSelectMarker}
          className="h-full w-full"
        />
      </MapErrorBoundary>

      {/* Floating Creator Preview Popup on marker click */}
      {activeMarker && (
        <div className="absolute left-4 top-4 z-30 w-72 animate-in fade-in-50 zoom-in-95 duration-200">
          <CreatorMapPreviewCard
            marker={activeMarker}
            onClose={() => handleSelectMarker(null)}
          />
        </div>
      )}
    </div>
  );
}
