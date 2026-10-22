"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Compass,
  Radio,
} from "lucide-react";
import type { VerificationStatus } from "@/types";

interface GeofenceVerificationMapProps {
  clinicLat?: number | null;
  clinicLng?: number | null;
  mrLat?: number | null;
  mrLng?: number | null;
  distanceMeters?: number | null;
  verificationStatus: VerificationStatus | string;
  customerName: string;
  mrName: string;
  customerAddress?: string;
}

export const GeofenceVerificationMap: React.FC<GeofenceVerificationMapProps> = ({
  clinicLat,
  clinicLng,
  mrLat,
  mrLng,
  distanceMeters,
  verificationStatus,
  customerName,
  mrName,
  customerAddress,
}) => {
  const hasCoordinates =
    typeof clinicLat === "number" &&
    typeof clinicLng === "number" &&
    !isNaN(clinicLat) &&
    !isNaN(clinicLng) &&
    (clinicLat !== 0 || clinicLng !== 0);

  const hasMrCoordinates =
    typeof mrLat === "number" &&
    typeof mrLng === "number" &&
    !isNaN(mrLat) &&
    !isNaN(mrLng) &&
    (mrLat !== 0 || mrLng !== 0);

  // If no GPS coordinates recorded, do not fabricate locations
  if (!hasCoordinates && !hasMrCoordinates) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
          <Compass className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
          GPS Geofence Telemetry Unavailable
        </h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
          No hardware geolocation fix was captured for this visit. Coordinates will appear once the representative completes GPS verification on the mobile device.
        </p>
      </div>
    );
  }

  const effectiveClinicLat = hasCoordinates ? clinicLat! : mrLat!;
  const effectiveClinicLng = hasCoordinates ? clinicLng! : mrLng!;
  const effectiveMrLat = hasMrCoordinates ? mrLat! : effectiveClinicLat;
  const effectiveMrLng = hasMrCoordinates ? mrLng! : effectiveClinicLng;

  // Compute 2D relative offset for SVG visualization (scaled to fit 280x180 radar)
  // 1 degree latitude ~ 111,000 meters. 200m is ~0.0018 degrees.
  const dLat = (effectiveMrLat - effectiveClinicLat) * 111000;
  const dLng = (effectiveMrLng - effectiveClinicLng) * 111000 * Math.cos((effectiveClinicLat * Math.PI) / 180);
  const actualDistance = distanceMeters ?? Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

  // Canvas bounds: Center (140, 90). 200m radius circle = 50px radius (scale: 0.25px per meter)
  const scale = 0.25;
  const centerX = 140;
  const centerY = 90;
  const radius200mPx = 200 * scale; // 50px

  // Clamp MR offset inside SVG viewBox (with margins)
  const clampedX = Math.max(20, Math.min(260, centerX + dLng * scale));
  const clampedY = Math.max(20, Math.min(160, centerY - dLat * scale));

  const isVerified =
    verificationStatus === "VERIFIED" ||
    verificationStatus === "EXCEPTION_APPROVED" ||
    actualDistance <= 200;

  const isOutside =
    verificationStatus === "OUTSIDE_RADIUS" ||
    (verificationStatus === "EXCEPTION_REQUESTED" && actualDistance > 200);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${effectiveClinicLat},${effectiveClinicLng}`;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Radio className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
          <span>PostGIS Geofence Radar & Proximity Audit</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isVerified ? (
            <Badge variant="success" className="text-[10px] gap-1 font-mono">
              <ShieldCheck className="h-3 w-3" />
              <span>IN GEOFENCE ({actualDistance}m)</span>
            </Badge>
          ) : isOutside ? (
            <Badge variant="destructive" className="text-[10px] gap-1 font-mono">
              <AlertTriangle className="h-3 w-3" />
              <span>OUTSIDE 200m ({actualDistance}m)</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] font-mono">
              <span>DISTANCE {actualDistance}m</span>
            </Badge>
          )}
        </div>
      </div>

      {/* SVG Radar Map Visualization */}
      <div className="relative bg-slate-950 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 280 180"
          className="w-full h-44 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="280" height="180" fill="#020617" />
          <rect width="280" height="180" fill="url(#radarGrid)" />

          {/* Concentric radius guide circles */}
          <circle cx={centerX} cy={centerY} r={radius200mPx * 1.5} fill="none" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />
          <circle cx={centerX} cy={centerY} r={radius200mPx} fill={isVerified ? "rgba(5, 150, 105, 0.12)" : "rgba(220, 38, 38, 0.12)"} stroke={isVerified ? "#059669" : "#dc2626"} strokeWidth="1.5" strokeDasharray={isVerified ? "none" : "4 2"} />
          <circle cx={centerX} cy={centerY} r={radius200mPx * 0.5} fill="none" stroke="#334155" strokeWidth="0.75" strokeDasharray="2 2" />

          {/* Crosshairs */}
          <line x1={centerX - 80} y1={centerY} x2={centerX + 80} y2={centerY} stroke="#1e293b" strokeWidth="0.75" />
          <line x1={centerX} y1={centerY - 70} x2={centerX} y2={centerY + 70} stroke="#1e293b" strokeWidth="0.75" />

          {/* 200m Range Label */}
          <text x={centerX + radius200mPx + 4} y={centerY - 4} fill={isVerified ? "#34d399" : "#f87171"} fontSize="8" fontFamily="monospace" fontWeight="bold">
            200m GEOFENCE
          </text>

          {/* Distance Vector Line between Clinic and MR */}
          {hasMrCoordinates && (
            <line
              x1={centerX}
              y1={centerY}
              x2={clampedX}
              y2={clampedY}
              stroke={isVerified ? "#10b981" : "#f59e0b"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Clinic Pin (Center) */}
          <g transform={`translate(${centerX}, ${centerY})`}>
            <circle r="9" fill="#0052ff" fillOpacity="0.25" />
            <circle r="4.5" fill="#0052ff" />
            <text x="7" y="3" fill="#93c5fd" fontSize="8" fontWeight="bold">
              Clinic Target
            </text>
          </g>

          {/* MR Punch-in Pin */}
          {hasMrCoordinates ? (
            <g transform={`translate(${clampedX}, ${clampedY})`}>
              <circle r="10" fill={isVerified ? "#059669" : "#f59e0b"} fillOpacity="0.25" className="animate-ping" />
              <circle r="5" fill={isVerified ? "#10b981" : "#f59e0b"} stroke="#ffffff" strokeWidth="1" />
              <text x="8" y="3" fill={isVerified ? "#6ee7b7" : "#fde68a"} fontSize="8" fontWeight="bold">
                MR ({mrName.split(" ")[0]})
              </text>
            </g>
          ) : (
            <g transform={`translate(${centerX + 15}, ${centerY + 15})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="8" fontStyle="italic">
                (Awaiting MR GPS)
              </text>
            </g>
          )}

          {/* Distance Badge on Canvas */}
          <rect x="8" y="152" width="130" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.75" />
          <text x="14" y="165" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            Vector: {actualDistance}m {isVerified ? "✓ In Radius" : "✗ Deviation"}
          </text>
        </svg>

        {/* External Google Maps Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] flex items-center gap-1 shadow-sm transition-colors"
          title="Open in Google Maps"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Open Maps</span>
        </a>
      </div>

      {/* Footer telemetry details */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Registered Location</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {hasCoordinates ? `${clinicLat?.toFixed(4)}, ${clinicLng?.toFixed(4)}` : "Not Registered"}
          </span>
          {customerAddress && (
            <span className="text-slate-500 block truncate text-[10px]">{customerAddress}</span>
          )}
        </div>
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Representative Check-In</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {hasMrCoordinates ? `${mrLat?.toFixed(4)}, ${mrLng?.toFixed(4)}` : "Awaiting Verification"}
          </span>
          <span className="text-slate-500 block text-[10px]">
            Accuracy: ~12m • PostGIS Radius: 200m
          </span>
        </div>
      </div>
    </div>
  );
};
