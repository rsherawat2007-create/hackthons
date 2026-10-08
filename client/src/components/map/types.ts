import type { ComponentType } from "react";

export interface MapMarker {
  id: string;
  creatorId: string;
  name: string;
  avatarUrl: string;
  headline: string;
  specialization: string;
  location: string;
  cityName?: string;
  matchScore?: number;
  matchLabel?: string;
  reasons?: string[];
  trustScore: number;
  previewImageUrl?: string;
  lat: number;
  lng: number;
}

export interface MapProviderProps {
  markers: MapMarker[];
  selectedMarkerId?: string | null;
  onSelectMarker: (marker: MapMarker | null) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export type MapProviderComponent = ComponentType<MapProviderProps>;

export type MapProviderKey = "vector" | "leaflet" | "mapbox";
