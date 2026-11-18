"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMrRecord, RouteBreadcrumb } from "@/services/routeTrackingService";
import { Layers, Maximize2, Compass } from "lucide-react";

type MapLayerKey = "STREET" | "SATELLITE" | "CLEAN";

const TILE_LAYERS: Record<
  MapLayerKey,
  { label: string; url: string; attribution: string; maxZoom: number }
> = {
  STREET: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  SATELLITE: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  CLEAN: {
    label: "Clean",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    maxZoom: 19,
  },
};

export interface LiveTrackingMapProps {
  mrs: LiveMrRecord[];
  selectedMrId: string | null;
  onSelectMr: (mrId: string) => void;
  followSelected: boolean;
  showTrail: boolean;
  showVisits: boolean;
  playbackPoint?: RouteBreadcrumb | null;
  fitAllSignal: number;
}

interface AnimatedMarkerEntry {
  marker: L.Marker;
  accuracyCircle: L.Circle | null;
  currentLat: number;
  currentLng: number;
  rafId: number | null;
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MR"
  );
}

function buildMrMarkerHtml(mr: LiveMrRecord, isSelected: boolean): string {
  const initials = getInitials(mr.name);
  const isLive = mr.connectionState === "LIVE";
  const isRecent = mr.connectionState === "RECENT";
  const isMoving = mr.movementState === "MOVING";

  const bgColor = !mr.liveTrackingEnabled
    ? "#64748b"
    : isLive
      ? "#10b981"
      : isRecent
        ? "#f59e0b"
        : "#64748b";

  const ringColor = isSelected ? "#FF6B00" : bgColor;
  const speedBadge =
    isMoving && mr.speedKmh >= 1
      ? `<span style="margin-left:4px;font-weight:700;color:#10b981;">${Math.round(mr.speedKmh)} km/h</span>`
      : "";

  const headingArrow =
    isLive || isRecent
      ? `<div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%) rotate(${mr.heading || 0}deg);transform-origin:50% 27px;pointer-events:none;">
           <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${ringColor};filter:drop-shadow(0 1px 1px rgba(0,0,0,0.35));"></div>
         </div>`
      : "";

  const pulseRing = isLive
    ? `<div style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid ${bgColor};opacity:0.55;animation:mbyte-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>`
    : "";

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <div style="position:relative;width:36px;height:36px;">
        ${pulseRing}
        ${headingArrow}
        <div style="width:36px;height:36px;border-radius:9999px;background:${bgColor};border:3px solid ${isSelected ? "#FF6B00" : "#ffffff"};box-shadow:0 4px 12px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:12px;letter-spacing:0.03em;transition:transform 0.2s ease;${isSelected ? "transform:scale(1.12);" : ""}">
          ${initials}
        </div>
      </div>
      <div style="margin-top:4px;padding:2px 7px;border-radius:9999px;background:rgba(15,23,42,0.88);color:#ffffff;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:1px solid ${isSelected ? "#FF6B00" : "rgba(255,255,255,0.18)"};">
        ${mr.name.split(" ")[0]}${speedBadge}
      </div>
    </div>
  `;
}

function buildVisitPinHtml(status: string, customerType: string): string {
  const isDone = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";
  const color = isDone ? "#059669" : isInProgress ? "#0284c7" : "#d97706";
  const symbol = customerType === "PHARMACY" ? "Rx" : "Dr";
  return `
    <div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
      <div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid #ffffff;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        ${symbol}
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin-top:-1px;"></div>
    </div>
  `;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  mrs,
  selectedMrId,
  onSelectMr,
  followSelected,
  showTrail,
  showVisits,
  playbackPoint,
  fitAllSignal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, AnimatedMarkerEntry>>(new Map());
  const trailLayerRef = useRef<L.LayerGroup | null>(null);
  const visitsLayerRef = useRef<L.LayerGroup | null>(null);
  const playbackMarkerRef = useRef<L.Marker | null>(null);
  const hasInitialFitRef = useRef(false);

  const [layerKey, setLayerKey] = useState<MapLayerKey>("CLEAN");

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [13.0827, 80.2707], // Default India/Tamil Nadu center until fixes arrive
      zoom: 12,
      zoomControl: false,
      preferCanvas: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const cfg = TILE_LAYERS.CLEAN;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    trailLayerRef.current = L.layerGroup().addTo(map);
    visitsLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((entry) => {
        if (entry.rafId) cancelAnimationFrame(entry.rafId);
      });
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[layerKey];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
  }, [layerKey]);

  // Smoothly update / animate MR markers via requestAnimationFrame (60fps zero-lag glide)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set<string>();
    const validBounds: L.LatLngTuple[] = [];

    for (const mr of mrs) {
      if (mr.latitude === null || mr.longitude === null) continue;
      if (mr.latitude === 0 && mr.longitude === 0) continue;

      activeIds.add(mr.mrId);
      validBounds.push([mr.latitude, mr.longitude]);

      const isSelected = mr.mrId === selectedMrId;
      const icon = L.divIcon({
        className: "mbyte-live-mr-icon",
        html: buildMrMarkerHtml(mr, isSelected),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const existing = markersRef.current.get(mr.mrId);
      if (!existing) {
        const marker = L.marker([mr.latitude, mr.longitude], {
          icon,
          zIndexOffset: isSelected ? 1000 : 200,
        }).addTo(map);

        marker.on("click", () => onSelectMr(mr.mrId));

        const accuracyCircle =
          isSelected && mr.accuracy && mr.accuracy > 0
            ? L.circle([mr.latitude, mr.longitude], {
                radius: Math.min(mr.accuracy, 250),
                color: "#FF6B00",
                fillColor: "#FF6B00",
                fillOpacity: 0.12,
                weight: 1.5,
              }).addTo(map)
            : null;

        markersRef.current.set(mr.mrId, {
          marker,
          accuracyCircle,
          currentLat: mr.latitude,
          currentLng: mr.longitude,
          rafId: null,
        });
      } else {
        existing.marker.setIcon(icon);
        existing.marker.setZIndexOffset(isSelected ? 1000 : 200);

        const targetLat = mr.latitude;
        const targetLng = mr.longitude;
        const startLat = existing.currentLat;
        const startLng = existing.currentLng;

        const moved =
          Math.abs(targetLat - startLat) > 0.000002 ||
          Math.abs(targetLng - startLng) > 0.000002;

        if (moved) {
          if (existing.rafId) cancelAnimationFrame(existing.rafId);
          const durationMs = 700;
          const startTs = performance.now();

          const animate = (nowTs: number) => {
            const t = Math.min(1, (nowTs - startTs) / durationMs);
            // Smooth cubic ease-out
            const eased = 1 - Math.pow(1 - t, 3);
            const nextLat = startLat + (targetLat - startLat) * eased;
            const nextLng = startLng + (targetLng - startLng) * eased;

            existing.currentLat = nextLat;
            existing.currentLng = nextLng;
            existing.marker.setLatLng([nextLat, nextLng]);
            if (existing.accuracyCircle) {
              existing.accuracyCircle.setLatLng([nextLat, nextLng]);
            }

            if (t < 1) {
              existing.rafId = requestAnimationFrame(animate);
            } else {
              existing.rafId = null;
            }
          };

          existing.rafId = requestAnimationFrame(animate);
        }

        // Manage accuracy ring for selected MR
        if (isSelected && mr.accuracy && mr.accuracy > 0) {
          if (existing.accuracyCircle) {
            existing.accuracyCircle.setRadius(Math.min(mr.accuracy, 250));
          } else {
            existing.accuracyCircle = L.circle([targetLat, targetLng], {
              radius: Math.min(mr.accuracy, 250),
              color: "#FF6B00",
              fillColor: "#FF6B00",
              fillOpacity: 0.12,
              weight: 1.5,
            }).addTo(map);
          }
        } else if (existing.accuracyCircle) {
          map.removeLayer(existing.accuracyCircle);
          existing.accuracyCircle = null;
        }
      }
    }

    // Remove markers for MRs no longer in filtered list
    for (const [id, entry] of markersRef.current.entries()) {
      if (!activeIds.has(id)) {
        if (entry.rafId) cancelAnimationFrame(entry.rafId);
        map.removeLayer(entry.marker);
        if (entry.accuracyCircle) map.removeLayer(entry.accuracyCircle);
        markersRef.current.delete(id);
      }
    }

    // Fit bounds once on initial load when coordinates arrive
    if (!hasInitialFitRef.current && validBounds.length > 0) {
      hasInitialFitRef.current = true;
      if (validBounds.length === 1) {
        map.setView(validBounds[0], 15, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(validBounds), { padding: [55, 55], maxZoom: 15 });
      }
    }
  }, [mrs, selectedMrId, onSelectMr]);

  // Smooth Follow Camera when selected MR moves
  const selectedMr = mrs.find((m) => m.mrId === selectedMrId) || null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followSelected || !selectedMr) return;
    if (selectedMr.latitude === null || selectedMr.longitude === null) return;
    map.panTo([selectedMr.latitude, selectedMr.longitude], {
      animate: true,
      duration: 0.65,
    });
  }, [followSelected, selectedMr?.mrId, selectedMr?.latitude, selectedMr?.longitude]);

  // Fit All MRs trigger
  useEffect(() => {
    if (fitAllSignal === 0) return;
    const map = mapRef.current;
    if (!map) return;
    const coords: L.LatLngTuple[] = mrs
      .filter((m) => m.latitude !== null && m.longitude !== null && (m.latitude !== 0 || m.longitude !== 0))
      .map((m) => [m.latitude!, m.longitude!]);
    if (coords.length === 1) {
      map.flyTo(coords[0], 15, { duration: 0.6 });
    } else if (coords.length > 1) {
      map.flyToBounds(L.latLngBounds(coords), { padding: [55, 55], maxZoom: 15, duration: 0.6 });
    }
  }, [fitAllSignal, mrs]);

  // Render live breadcrumb route trail for selected MR
  useEffect(() => {
    const layer = trailLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showTrail || !selectedMr || !selectedMr.trail || selectedMr.trail.length === 0) {
      return;
    }

    const latLngs: L.LatLngTuple[] = selectedMr.trail.map((pt) => [pt.latitude, pt.longitude]);

    // Outer glow stroke + crisp inner orange route line
    L.polyline(latLngs, {
      color: "#FF6B00",
      weight: 7,
      opacity: 0.22,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    L.polyline(latLngs, {
      color: "#FF6B00",
      weight: 3.5,
      opacity: 0.92,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    // Start point flag
    const startPt = selectedMr.trail[0];
    const startIcon = L.divIcon({
      className: "mbyte-start-pin",
      html: `<div style="transform:translate(-50%,-50%);padding:2px 6px;border-radius:9999px;background:#0f172a;color:#fff;font-size:10px;font-weight:700;border:2px solid #10b981;box-shadow:0 2px 6px rgba(0,0,0,0.3);">START</div>`,
      iconSize: [0, 0],
    });
    L.marker([startPt.latitude, startPt.longitude], { icon: startIcon, zIndexOffset: 100 })
      .bindPopup(
        `<div style="font-size:12px;"><strong>Shift Route Start</strong><br/>${new Date(
          startPt.capturedAt,
        ).toLocaleTimeString()}</div>`,
      )
      .addTo(layer);
  }, [showTrail, selectedMr?.mrId, selectedMr?.trail]);

  // Render doctor / pharmacy visit pins for selected MR
  useEffect(() => {
    const layer = visitsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showVisits || !selectedMr || !selectedMr.visitPins || selectedMr.visitPins.length === 0) {
      return;
    }

    for (const pin of selectedMr.visitPins) {
      const icon = L.divIcon({
        className: "mbyte-visit-pin",
        html: buildVisitPinHtml(pin.status, pin.customerType),
        iconSize: [0, 0],
      });
      L.marker([pin.latitude, pin.longitude], { icon, zIndexOffset: 300 })
        .bindPopup(
          `<div style="font-size:12px;line-height:1.4;">
            <strong>${pin.customerName}</strong>${pin.clinicName ? `<br/><span style="color:#64748b;">${pin.clinicName}</span>` : ""}
            <br/><span style="font-weight:600;color:${pin.status === "COMPLETED" ? "#059669" : "#d97706"};">${pin.status}</span>
            ${pin.checkInTime ? `<br/>Check-in: ${new Date(pin.checkInTime).toLocaleTimeString()}` : ""}
          </div>`,
        )
        .addTo(layer);
    }
  }, [showVisits, selectedMr?.mrId, selectedMr?.visitPins]);

  // Render animated route playback scrubber marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!playbackPoint) {
      if (playbackMarkerRef.current) {
        map.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }
      return;
    }

    const icon = L.divIcon({
      className: "mbyte-playback-pin",
      html: `<div style="transform:translate(-50%,-50%);width:22px;height:22px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(37,99,235,0.35);"></div>`,
      iconSize: [0, 0],
    });

    if (!playbackMarkerRef.current) {
      playbackMarkerRef.current = L.marker([playbackPoint.latitude, playbackPoint.longitude], {
        icon,
        zIndexOffset: 1500,
      }).addTo(map);
    } else {
      playbackMarkerRef.current.setLatLng([playbackPoint.latitude, playbackPoint.longitude]);
    }
    map.panTo([playbackPoint.latitude, playbackPoint.longitude], { animate: true, duration: 0.35 });
  }, [playbackPoint]);

  const activeLocatedCount = mrs.filter(
    (m) => m.latitude !== null && m.longitude !== null && (m.latitude !== 0 || m.longitude !== 0),
  ).length;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
      <style>{`
        @keyframes mbyte-ping {
          0% { transform: scale(0.95); opacity: 0.75; }
          75%, 100% { transform: scale(1.65); opacity: 0; }
        }
        .leaflet-container { font-family: inherit; z-index: 1; }
      `}</style>

      <div ref={containerRef} className="h-full w-full min-h-[460px]" />

      {/* Top-Left Map Layer Switcher */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <Layers className="h-3.5 w-3.5 text-slate-500 ml-1.5 mr-0.5" />
        {(["CLEAN", "STREET", "SATELLITE"] as MapLayerKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLayerKey(key)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              layerKey === key
                ? "bg-[#FF6B00] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {TILE_LAYERS[key].label}
          </button>
        ))}
      </div>

      {/* Top-Right Fit All & GPS Status */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {activeLocatedCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const map = mapRef.current;
              if (!map) return;
              const coords: L.LatLngTuple[] = mrs
                .filter((m) => m.latitude !== null && m.longitude !== null)
                .map((m) => [m.latitude!, m.longitude!]);
              if (coords.length === 1) map.flyTo(coords[0], 15, { duration: 0.5 });
              else if (coords.length > 1)
                map.flyToBounds(L.latLngBounds(coords), { padding: [55, 55], maxZoom: 15, duration: 0.5 });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 text-[#FF6B00]" />
            Fit All ({activeLocatedCount})
          </button>
        )}
      </div>

      {/* Empty Map Overlay when no MR has reported a GPS fix yet */}
      {activeLocatedCount === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[350] flex items-center justify-center p-4">
          <div className="pointer-events-auto max-w-md rounded-xl border border-slate-200 bg-white/95 p-5 text-center shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-[#FF6B00] dark:bg-orange-950/60">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Waiting for Live GPS Signals
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Turn ON live tracking for any MR in the left panel. As soon as their mobile app sends a GPS fix, their marker will appear here in real time with smooth movement and route trail.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
