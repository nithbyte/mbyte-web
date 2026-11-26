"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMrRecord, RouteBreadcrumb, LiveMrVisitPin } from "@/services/routeTrackingService";
import { Layers, Maximize2, Compass } from "lucide-react";

type MapLayerKey = "STREET" | "GOOGLE" | "SATELLITE";

const TILE_LAYERS: Record<
  MapLayerKey,
  {
    label: string;
    url: string;
    attribution: string;
    maxZoom: number;
    maxNativeZoom?: number;
    subdomains?: string[];
  }
> = {
  STREET: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
  GOOGLE: {
    label: "Google Road",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
  },
  SATELLITE: {
    label: "Satellite",
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
  },
};

export interface LiveTrackingMapProps {
  mrs: LiveMrRecord[];
  selectedMrId: string | null;
  onSelectMr: (mrId: string) => void;
  followSelected: boolean;
  showTrail: boolean;
  showVisits: boolean;
  selectedVisitId?: string | null;
  onSelectVisit?: (visitId: string) => void;
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

function buildVisitPinHtml(pin: LiveMrVisitPin, isSelected: boolean, sequence: number): string {
  const isDone = pin.status === "COMPLETED";
  const isInProgress = pin.status === "IN_PROGRESS";
  const color = isDone ? "#059669" : isInProgress ? "#0284c7" : "#d97706";
  const typeBadge = pin.customerType === "PHARMACY" ? "Rx" : "Dr";

  const halo = isSelected
    ? `<div style="position:absolute;inset:-7px;border-radius:9999px;border:3px solid #FF6B00;animation:mbyte-ping 1.5s infinite;opacity:0.85;"></div>`
    : isInProgress
      ? `<div style="position:absolute;inset:-5px;border-radius:9999px;border:2px solid ${color};animation:mbyte-ping 2s infinite;opacity:0.6;"></div>`
      : "";

  return `
    <div style="position:relative;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      ${halo}
      <div style="display:flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 6px;border-radius:9999px;background:${color};border:${isSelected ? "3px solid #FF6B00" : "2px solid #ffffff"};color:#ffffff;font-size:11px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,0.35);gap:3px;${isSelected ? "transform:scale(1.15);" : ""}">
        <span>#${sequence}</span>
        <span style="font-size:9px;opacity:0.9;">${typeBadge}</span>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${isSelected ? "#FF6B00" : color};margin-top:-1px;"></div>
      <div style="margin-top:2px;padding:1px 6px;border-radius:4px;background:rgba(15,23,42,0.88);color:#ffffff;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.25);border:1px solid ${isSelected ? "#FF6B00" : "rgba(255,255,255,0.15)"};">
        ${pin.customerName}
      </div>
    </div>
  `;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function chaikinSmooth(points: L.LatLngTuple[], iterations = 1): L.LatLngTuple[] {
  if (points.length <= 2) return points;
  let current = points;
  for (let it = 0; it < iterations; it++) {
    const smoothed: L.LatLngTuple[] = [];
    smoothed.push(current[0]);
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      const q: L.LatLngTuple = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
      const r: L.LatLngTuple = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];
      smoothed.push(q);
      smoothed.push(r);
    }
    smoothed.push(current[current.length - 1]);
    current = smoothed;
  }
  return current;
}

/**
 * Intelligent Trajectory Filter & Route Smoother:
 * 1. Filters out indoor GPS multipath reflections & Wi-Fi triangulation bounce spikes (the "spiderweb")
 * 2. Collapses stationary dwell clusters inside clinics/hospitals (< 22m radius) into clean dwell anchors
 * 3. Applies Chaikin curve smoothing so road routes follow streets cleanly without jagged stair-steps
 */
function cleanAndSmoothRouteTrail(rawTrail: RouteBreadcrumb[]): L.LatLngTuple[] {
  if (!rawTrail || rawTrail.length === 0) return [];

  // 1. Filter out invalid/zero coordinates and sort chronologically
  const valid = rawTrail
    .filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        (p.latitude !== 0 || p.longitude !== 0),
    )
    .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

  if (valid.length <= 1) {
    return valid.map((p) => [p.latitude, p.longitude]);
  }

  // 2. Filter out poor accuracy fixes (> 45m) when good fixes exist
  const hasGood = valid.some((p) => p.accuracy && p.accuracy <= 35);
  const accuracyFiltered = hasGood
    ? valid.filter((p) => !p.accuracy || p.accuracy <= 45)
    : valid;

  const basePoints = accuracyFiltered.length >= 2 ? accuracyFiltered : valid;

  // 3. Remove Multipath Rebound Spikes (The Spiderweb Killer)
  // If point i jumps out and next point (or i+2) returns close to previous point:
  const noSpikes: RouteBreadcrumb[] = [];
  noSpikes.push(basePoints[0]);

  for (let i = 1; i < basePoints.length - 1; i++) {
    const prev = noSpikes[noSpikes.length - 1];
    const curr = basePoints[i];
    const next = basePoints[i + 1];

    const dPrevCurr = haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const dCurrNext = haversineMeters(curr.latitude, curr.longitude, next.latitude, next.longitude);
    const dPrevNext = haversineMeters(prev.latitude, prev.longitude, next.latitude, next.longitude);

    // If current point jumped out >= 28m and next point snaps back close to prev:
    const isSingleSpike =
      dPrevCurr >= 28 &&
      dCurrNext >= 28 &&
      dPrevNext <= Math.max(dPrevCurr * 0.45, 25);

    if (isSingleSpike) {
      continue;
    }

    // Check two-point spike
    if (i < basePoints.length - 2) {
      const nextNext = basePoints[i + 2];
      const dPrevNextNext = haversineMeters(prev.latitude, prev.longitude, nextNext.latitude, nextNext.longitude);
      const isDoubleSpike =
        dPrevCurr >= 28 &&
        dPrevNextNext <= Math.max(dPrevCurr * 0.45, 25);
      if (isDoubleSpike) {
        continue;
      }
    }

    noSpikes.push(curr);
  }

  noSpikes.push(basePoints[basePoints.length - 1]);

  // 4. Stationary Dwell Clustering
  // Collapse stationary jitter inside clinics (< 22m radius) into clean dwell anchors
  const clustered: L.LatLngTuple[] = [];
  let clusterAnchor = noSpikes[0];
  clustered.push([clusterAnchor.latitude, clusterAnchor.longitude]);

  for (let i = 1; i < noSpikes.length; i++) {
    const pt = noSpikes[i];
    const distFromAnchor = haversineMeters(
      clusterAnchor.latitude,
      clusterAnchor.longitude,
      pt.latitude,
      pt.longitude,
    );

    if (i === noSpikes.length - 1) {
      clustered.push([pt.latitude, pt.longitude]);
      break;
    }

    if (distFromAnchor >= 22) {
      clustered.push([pt.latitude, pt.longitude]);
      clusterAnchor = pt;
    }
  }

  // 5. Road-curve smoothing
  return chaikinSmooth(clustered, 1);
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  mrs,
  selectedMrId,
  onSelectMr,
  followSelected,
  showTrail,
  showVisits,
  selectedVisitId,
  onSelectVisit,
  playbackPoint,
  fitAllSignal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, AnimatedMarkerEntry>>(new Map());
  const trailLayerRef = useRef<L.LayerGroup | null>(null);
  const visitsLayerRef = useRef<L.LayerGroup | null>(null);
  const visitMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const playbackMarkerRef = useRef<L.Marker | null>(null);
  const hasInitialFitRef = useRef(false);
  const lastCenteredVisitIdRef = useRef<string | null>(null);

  const onSelectMrRef = useRef(onSelectMr);
  onSelectMrRef.current = onSelectMr;
  const onSelectVisitRef = useRef(onSelectVisit);
  onSelectVisitRef.current = onSelectVisit;

  // Default to GOOGLE (Google Road) as the primary map layer
  const [layerKey, setLayerKey] = useState<MapLayerKey>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mbyte_map_layer") as MapLayerKey | null;
        if (saved && TILE_LAYERS[saved]) {
          return saved;
        }
      } catch {}
    }
    return "GOOGLE";
  });

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [13.0827, 80.2707], // Default Tamil Nadu center until fixes arrive
      zoom: 12,
      zoomControl: false,
      preferCanvas: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const initialKey: MapLayerKey =
      (typeof window !== "undefined"
        ? (localStorage.getItem("mbyte_map_layer") as MapLayerKey | null)
        : null) || "GOOGLE";
    const cfg = TILE_LAYERS[initialKey] || TILE_LAYERS.GOOGLE;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom,
      subdomains: cfg.subdomains || ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    trailLayerRef.current = L.layerGroup().addTo(map);
    visitsLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((entry) => {
        if (entry.rafId) cancelAnimationFrame(entry.rafId);
      });
      markersRef.current.clear();
      visitMarkersMapRef.current.clear();
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.remove();
        geofenceCircleRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch tile layer and persist preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("mbyte_map_layer", layerKey);
      } catch {}
    }
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[layerKey] || TILE_LAYERS.GOOGLE;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom,
      subdomains: cfg.subdomains || ["mt0", "mt1", "mt2", "mt3"],
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

        marker.on("click", () => onSelectMrRef.current(mr.mrId));

        const accuracyCircle =
          isSelected && mr.accuracy && mr.accuracy > 0
            ? L.circle([mr.latitude, mr.longitude], {
                radius: Math.min(mr.accuracy, 120),
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
          const durationMs = 950;
          const startTs = performance.now();

          const animate = (nowTs: number) => {
            const t = Math.min(1, (nowTs - startTs) / durationMs);
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
            existing.accuracyCircle.setRadius(Math.min(mr.accuracy, 120));
          } else {
            existing.accuracyCircle = L.circle([targetLat, targetLng], {
              radius: Math.min(mr.accuracy, 120),
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
  }, [mrs, selectedMrId]);

  // Smooth Follow Camera when selected MR moves (pause follow if user is spotlighting a specific doctor stop)
  const selectedMr = mrs.find((m) => m.mrId === selectedMrId) || null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followSelected || !selectedMr || Boolean(selectedVisitId)) return;
    if (selectedMr.latitude === null || selectedMr.longitude === null) return;
    map.panTo([selectedMr.latitude, selectedMr.longitude], {
      animate: true,
      duration: 0.65,
    });
  }, [followSelected, selectedMr?.mrId, selectedMr?.latitude, selectedMr?.longitude, selectedVisitId]);

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

  // Render live breadcrumb route trail for selected MR (filtered & smoothed)
  useEffect(() => {
    const layer = trailLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showTrail || !selectedMr || !selectedMr.trail || selectedMr.trail.length === 0) {
      return;
    }

    // Filter out indoor GPS multipath rebounds, collapse clinic dwell jitter, and smooth curve
    const cleanCoords = cleanAndSmoothRouteTrail(selectedMr.trail);
    if (cleanCoords.length === 0) return;

    // Outer glow stroke + crisp inner orange route line
    L.polyline(cleanCoords, {
      color: "#FF6B00",
      weight: 7,
      opacity: 0.22,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    L.polyline(cleanCoords, {
      color: "#FF6B00",
      weight: 3.5,
      opacity: 0.92,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    // Start point flag
    const startPt = cleanCoords[0];
    const startIcon = L.divIcon({
      className: "mbyte-start-pin",
      html: `<div style="transform:translate(-50%,-50%);padding:2px 6px;border-radius:9999px;background:#0f172a;color:#fff;font-size:10px;font-weight:700;border:2px solid #10b981;box-shadow:0 2px 6px rgba(0,0,0,0.3);">START</div>`,
      iconSize: [0, 0],
    });
    L.marker([startPt[0], startPt[1]], { icon: startIcon, zIndexOffset: 100 })
      .bindPopup(
        `<div style="font-size:12px;"><strong>Shift Route Start</strong><br/>${new Date(
          selectedMr.trail[0].capturedAt,
        ).toLocaleTimeString()}</div>`,
      )
      .addTo(layer);
  }, [showTrail, selectedMr?.mrId, selectedMr?.trail]);

  // Render doctor / pharmacy visit pins & sequence trail for selected MR
  useEffect(() => {
    const layer = visitsLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    visitMarkersMapRef.current.clear();
    lastCenteredVisitIdRef.current = null;

    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.remove();
      geofenceCircleRef.current = null;
    }

    if (!showVisits || !selectedMr || !selectedMr.visitPins || selectedMr.visitPins.length === 0) {
      return;
    }

    // Connect visits with a dashed sequence route line
    const visitCoords: L.LatLngTuple[] = selectedMr.visitPins.map((p) => [p.latitude, p.longitude]);
    if (visitCoords.length > 1) {
      L.polyline(visitCoords, {
        color: "#0284c7",
        weight: 2.5,
        dashArray: "6, 6",
        opacity: 0.65,
      }).addTo(layer);
    }

    // Render individual visit pins
    selectedMr.visitPins.forEach((pin, idx) => {
      const isSelected = selectedVisitId === pin.id;
      const sequence = pin.sequence || idx + 1;

      const icon = L.divIcon({
        className: "mbyte-visit-pin",
        html: buildVisitPinHtml(pin, isSelected, sequence),
        iconSize: [0, 0],
      });

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon,
        zIndexOffset: isSelected ? 800 : 350,
      }).addTo(layer);

      const statusColor = pin.status === "COMPLETED" ? "#059669" : pin.status === "IN_PROGRESS" ? "#0284c7" : "#d97706";

      marker.bindPopup(
        `<div style="font-size:12px;min-width:210px;line-height:1.45;padding:2px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
            <span style="font-weight:800;color:${statusColor};font-size:13px;">Stop #${sequence}: ${pin.customerName}</span>
            <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:${statusColor}20;color:${statusColor};">${pin.status}</span>
          </div>
          ${pin.clinicName ? `<div style="font-size:11px;color:#64748b;font-weight:600;">Clinic: ${pin.clinicName}</div>` : ""}
          ${pin.address ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${pin.address}</div>` : ""}
          ${pin.checkInTime ? `<div style="font-size:11px;margin-top:4px;color:#0f172a;"><strong>Check-in:</strong> ${new Date(pin.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${pin.durationMinutes ? `(${pin.durationMinutes}m)` : ""}</div>` : ""}
          ${pin.distanceMeters !== null && pin.distanceMeters !== undefined ? `<div style="font-size:11px;color:#059669;margin-top:2px;"><strong>Geofence Check:</strong> ${pin.distanceMeters}m from target (${pin.verificationStatus || "VERIFIED"})</div>` : ""}
          <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
            <a href="https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}" target="_blank" rel="noopener noreferrer" style="color:#0284c7;font-weight:600;font-size:11px;text-decoration:none;">Open in Google Maps ↗</a>
          </div>
        </div>`,
      );

      marker.on("click", () => {
        onSelectVisitRef.current?.(pin.id);
      });

      visitMarkersMapRef.current.set(pin.id, marker);
    });
  }, [showVisits, selectedMr?.mrId, selectedMr?.visitPins]);

  // Spotlight selected visit stop with 200m geofence circle & single smooth camera focus
  useEffect(() => {
    const map = mapRef.current;
    const layer = visitsLayerRef.current;
    if (!map || !layer) return;

    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.remove();
      geofenceCircleRef.current = null;
    }

    if (!selectedVisitId || !selectedMr || !selectedMr.visitPins) {
      lastCenteredVisitIdRef.current = null;
      return;
    }

    const activePin = selectedMr.visitPins.find((p) => p.id === selectedVisitId);
    if (!activePin) {
      lastCenteredVisitIdRef.current = null;
      return;
    }

    // Update pin icon highlights without tearing down the layer
    selectedMr.visitPins.forEach((pin, idx) => {
      const marker = visitMarkersMapRef.current.get(pin.id);
      if (marker) {
        const isSel = pin.id === selectedVisitId;
        const seq = pin.sequence || idx + 1;
        marker.setIcon(
          L.divIcon({
            className: "mbyte-visit-pin",
            html: buildVisitPinHtml(pin, isSel, seq),
            iconSize: [0, 0],
          }),
        );
        marker.setZIndexOffset(isSel ? 800 : 350);
      }
    });

    // Draw 200m geofence circle
    const clinicLat = activePin.clinicLatitude ?? activePin.latitude;
    const clinicLng = activePin.clinicLongitude ?? activePin.longitude;

    geofenceCircleRef.current = L.circle([clinicLat, clinicLng], {
      radius: 200,
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 0.16,
      weight: 2,
      dashArray: "4, 4",
    }).addTo(layer);

    // Open popup if not already opened
    const activeMarker = visitMarkersMapRef.current.get(activePin.id);
    if (activeMarker && !activeMarker.isPopupOpen()) {
      activeMarker.openPopup();
    }

    // Fly to active pin ONLY ONCE when selection changes to this pin
    if (lastCenteredVisitIdRef.current !== selectedVisitId) {
      lastCenteredVisitIdRef.current = selectedVisitId;
      map.flyTo([activePin.latitude, activePin.longitude], 16, {
        animate: true,
        duration: 0.65,
      });
    }
  }, [selectedVisitId, selectedMr?.mrId, selectedMr?.visitPins]);

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

      {/* Top-Left Map Layer Switcher (Street, Detailed, Satellite) */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <Layers className="h-3.5 w-3.5 text-slate-500 ml-1.5 mr-0.5" />
        {(["GOOGLE", "STREET", "SATELLITE"] as MapLayerKey[]).map((key) => (
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
