import { useState, useRef, useEffect, useCallback, type MouseEvent, type WheelEvent } from "react";
import { Plus, Minus, RotateCcw, MapPin, Sparkles, Navigation } from "lucide-react";
import type { MapProviderProps, MapMarker } from "../types";

// Standard geographic landmass outlines (SVG paths for world continents)
const WORLD_CONTINENTS_SVG = [
  // North America
  "M 140 85 L 180 80 L 220 90 L 245 130 L 210 170 L 165 190 L 140 160 L 120 120 Z",
  // South America
  "M 210 210 L 250 230 L 260 280 L 230 350 L 210 330 L 200 250 Z",
  // Europe
  "M 370 95 L 420 90 L 440 125 L 410 145 L 360 140 L 355 110 Z",
  // Africa
  "M 360 160 L 430 165 L 450 230 L 430 310 L 390 320 L 350 240 L 340 180 Z",
  // Asia
  "M 450 80 L 580 85 L 620 140 L 590 200 L 520 220 L 460 170 L 445 120 Z",
  // Australia
  "M 560 270 L 630 275 L 640 330 L 570 335 Z",
  // Japan / East Asia Islands
  "M 625 125 L 635 120 L 640 145 L 630 150 Z",
  // UK & Ireland
  "M 345 98 L 358 95 L 355 115 L 342 112 Z",
];

export function InteractiveVectorMap({
  markers,
  selectedMarkerId,
  onSelectMarker,
  className = "",
}: MapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom state
  const [zoom, setZoom] = useState(1.15);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);

  // SVG Base Viewport Dimensions
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 440;

  // Convert (lat, lng) to SVG (x, y) coordinates
  const project = useCallback((lat: number, lng: number) => {
    // Equirectangular projection with standard offset
    const x = ((lng + 180) / 360) * BASE_WIDTH;
    const y = ((90 - lat) / 180) * BASE_HEIGHT;
    return { x, y };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(4.5, Number((z * 1.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.9, Number((z / 1.25).toFixed(2))));
  const handleReset = () => {
    setZoom(1.15);
    setPan({ x: 0, y: 0 });
    onSelectMarker(null);
  };

  // Center on selected marker if one is active
  useEffect(() => {
    if (!selectedMarkerId) return;
    const marker = markers.find((m) => m.id === selectedMarkerId || m.creatorId === selectedMarkerId);
    if (!marker) return;

    const { x, y } = project(marker.lat, marker.lng);
    const targetPanX = (BASE_WIDTH / 2 - x) * zoom;
    const targetPanY = (BASE_HEIGHT / 2 - y) * zoom;
    setPan({ x: targetPanX, y: targetPanY });
    if (zoom < 1.8) setZoom(2.0);
  }, [selectedMarkerId, markers, project, zoom]);

  // Mouse drag handlers for panning
  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom handler
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4.5, Number((z * 1.1).toFixed(2))));
    } else {
      setZoom((z) => Math.max(0.9, Number((z / 1.1).toFixed(2))));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden select-none bg-slate-950 rounded-3xl border border-ink/15 shadow-inner ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Background Grids & Coordinate Lines */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Interactive SVG Projection Layer */}
      <svg
        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
        className="h-full w-full transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <defs>
          {/* Subtle continent gradient */}
          <linearGradient id="continentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Marker Glow Filter */}
          <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Latitude & Longitude Reference Arcs */}
        <g stroke="#334155" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4">
          <line x1="0" y1={BASE_HEIGHT * 0.25} x2={BASE_WIDTH} y2={BASE_HEIGHT * 0.25} />
          <line x1="0" y1={BASE_HEIGHT * 0.5} x2={BASE_WIDTH} y2={BASE_HEIGHT * 0.5} />
          <line x1="0" y1={BASE_HEIGHT * 0.75} x2={BASE_WIDTH} y2={BASE_HEIGHT * 0.75} />
          <line x1={BASE_WIDTH * 0.25} y1="0" x2={BASE_WIDTH * 0.25} y2={BASE_HEIGHT} />
          <line x1={BASE_WIDTH * 0.5} y1="0" x2={BASE_WIDTH * 0.5} y2={BASE_HEIGHT} />
          <line x1={BASE_WIDTH * 0.75} y1="0" x2={BASE_WIDTH * 0.75} y2={BASE_HEIGHT} />
        </g>

        {/* World Landmasses */}
        <g fill="url(#continentGrad)" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3">
          {WORLD_CONTINENTS_SVG.map((d, idx) => (
            <path key={idx} d={d} />
          ))}
        </g>

        {/* Creator Location Markers */}
        {markers.map((marker) => {
          const { x, y } = project(marker.lat, marker.lng);
          const isSelected =
            selectedMarkerId === marker.id || selectedMarkerId === marker.creatorId;
          const isHovered = hoveredMarker?.id === marker.id;

          return (
            <g
              key={marker.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMarker(marker);
              }}
              onMouseEnter={() => setHoveredMarker(marker)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              {/* Outer pulsing ring for selected pin */}
              {isSelected && (
                <circle
                  r="16"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Pin Base Circle */}
              <circle
                r={isSelected ? "11" : isHovered ? "10" : "8"}
                fill={isSelected ? "#38bdf8" : "#818cf8"}
                stroke="#ffffff"
                strokeWidth="2"
                filter={isSelected ? "url(#markerGlow)" : undefined}
                className="transition-all duration-200"
              />

              {/* Inner Dot */}
              <circle r="3" fill="#ffffff" />

              {/* Hover / Active Marker Pill */}
              {(isSelected || isHovered) && (
                <g transform="translate(0, -18)" className="pointer-events-none">
                  {/* Tooltip Background Card */}
                  <rect
                    x="-60"
                    y="-22"
                    width="120"
                    height="20"
                    rx="10"
                    fill="#090d16"
                    stroke={isSelected ? "#38bdf8" : "#818cf8"}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  {/* Tooltip Text */}
                  <text
                    x="0"
                    y="-9"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="600"
                    letterSpacing="0.02em"
                  >
                    {marker.name.split(" ")[0]} · {marker.matchScore ?? marker.trustScore}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Control Buttons */}
      <div className="absolute right-4 top-4 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900/90 text-white shadow-md border border-slate-700/60 transition hover:bg-slate-800"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900/90 text-white shadow-md border border-slate-700/60 transition hover:bg-slate-800"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900/90 text-white shadow-md border border-slate-700/60 transition hover:bg-slate-800"
          title="Reset map view"
          aria-label="Reset map view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Map Legend & Privacy Notice */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-[11px] text-slate-300 border border-slate-800/80 backdrop-blur-sm z-10 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Navigation className="h-3 w-3 text-sky-400" />
          <span className="font-semibold text-white">{markers.length} Creators on Map</span>
          <span className="hidden sm:inline text-slate-400">· Click any pin to inspect profile</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          City-Level Centroids (Privacy Protected)
        </div>
      </div>
    </div>
  );
}
