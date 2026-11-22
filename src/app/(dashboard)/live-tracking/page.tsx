"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilterStore } from "@/store";
import { useIsMounted } from "@/hooks";
import {
  routeTrackingService,
  type LiveMrRecord,
  type LiveStreamEvent,
  type StreamConnectionStatus,
} from "@/services/routeTrackingService";
import { formatOperatingDateDisplay, getLocalTodayDate, cn } from "@/lib/utils";
import {
  Radio,
  Navigation,
  MapPin,
  Search,
  RefreshCw,
  Battery,
  Gauge,
  Route,
  Users,
  Crosshair,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Power,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Compass,
  Stethoscope,
  Pill,
  LocateFixed,
  ShieldCheck,
  X,
} from "lucide-react";

const LiveTrackingMap = dynamic(
  () => import("@/features/live-tracking/LiveTrackingMap").then((m) => m.LiveTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[460px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <Compass className="mx-auto h-8 w-8 animate-spin text-[#FF6B00]" />
          <p className="mt-2 text-xs font-medium text-slate-500">Loading high-precision live map...</p>
        </div>
      </div>
    ),
  },
);

function formatRelativeSeconds(iso: string | null, nowMs: number): string {
  if (!iso) return "No GPS fix yet";
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LiveTrackingPage() {
  const isMounted = useIsMounted();
  const { selectedTerritoryId, operatingDate } = useFilterStore();

  const [mrs, setMrs] = useState<LiveMrRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState<StreamConnectionStatus>("CONNECTING");
  const [selectedMrId, setSelectedMrId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "ENABLED" | "LIVE" | "DISABLED">("ALL");

  // Map Controls
  const [followSelected, setFollowSelected] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [showVisits, setShowVisits] = useState(true);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [fitAllSignal, setFitAllSignal] = useState(0);

  // Toggle busy states
  const [togglingMrId, setTogglingMrId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Route Playback State
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5 | 10>(2);

  // Live relative clock (updates every 5s so relative timestamps stay fresh without causing high-frequency layout thrashing)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const isToday = operatingDate === getLocalTodayDate();

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectMr = useCallback((id: string) => {
    setSelectedMrId(id);
    setSelectedVisitId(null);
  }, []);

  const handleSelectVisit = useCallback((id: string) => {
    setSelectedVisitId(id);
    setShowVisits(true);
  }, []);

  // Read optional ?mr=<id> query param
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    const mrParam = new URLSearchParams(window.location.search).get("mr");
    if (mrParam) setSelectedMrId(mrParam);
  }, [isMounted]);

  // Fetch initial fleet snapshot (and re-fetch when territory or date changes)
  const loadSnapshot = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const snap = await routeTrackingService.getLiveSnapshot({
          territoryId: selectedTerritoryId !== "ALL" ? selectedTerritoryId : undefined,
          date: operatingDate,
        });
        setMrs(snap.mrs || []);
        setSelectedMrId((prev) => {
          if (prev && (snap.mrs || []).some((m) => m.mrId === prev)) return prev;
          const firstLive = (snap.mrs || []).find(
            (m) => m.latitude !== null && m.longitude !== null,
          );
          return firstLive?.mrId || snap.mrs?.[0]?.mrId || null;
        });
      } catch (err) {
        console.error("Failed to fetch live tracking snapshot:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTerritoryId, operatingDate],
  );

  useEffect(() => {
    if (isMounted) {
      loadSnapshot();
    }
  }, [isMounted, loadSnapshot]);

  // Subscribe to zero-lag Server-Sent Events (SSE) live stream when viewing Today
  const isTodayRef = useRef(isToday);
  isTodayRef.current = isToday;

  useEffect(() => {
    if (!isMounted) return;

    const unsubscribe = routeTrackingService.subscribeLiveStream(
      (evt: LiveStreamEvent) => {
        if (evt.type === "heartbeat") return;

        if (evt.type === "tracking_toggled" && evt.mrId) {
          setMrs((prev) =>
            prev.map((m) =>
              m.mrId === evt.mrId
                ? {
                    ...m,
                    liveTrackingEnabled: Boolean(evt.liveTrackingEnabled),
                    liveTrackingUpdatedAt: evt.liveTrackingUpdatedAt || new Date().toISOString(),
                    connectionState: evt.liveTrackingEnabled
                      ? m.connectionState === "DISABLED"
                        ? "OFFLINE"
                        : m.connectionState
                      : "DISABLED",
                    movementState: evt.liveTrackingEnabled ? m.movementState : "OFFLINE",
                  }
                : m,
            ),
          );
          return;
        }

        if (evt.type === "location_update" && evt.mrId && isTodayRef.current) {
          setMrs((prev) =>
            prev.map((m) => {
              if (m.mrId !== evt.mrId) return m;
              const nextTrail = evt.breadcrumb
                ? m.trail.some((pt) => pt.id === evt.breadcrumb!.id)
                  ? m.trail
                  : [...m.trail, evt.breadcrumb]
                : m.trail;

              return {
                ...m,
                liveTrackingEnabled: true,
                latitude: evt.latitude ?? m.latitude,
                longitude: evt.longitude ?? m.longitude,
                accuracy: evt.accuracy ?? m.accuracy,
                speedKmh: evt.speedKmh ?? m.speedKmh,
                heading: evt.heading ?? m.heading,
                batteryLevel: evt.batteryLevel ?? m.batteryLevel,
                lastKnownAt: evt.capturedAt || new Date().toISOString(),
                todayDistanceKm: evt.todayDistanceKm ?? m.todayDistanceKm,
                connectionState: "LIVE",
                movementState: (evt.speedKmh ?? 0) >= 2 ? "MOVING" : "STATIONARY",
                activeSessionId: evt.sessionId ?? m.activeSessionId,
                trail: nextTrail,
              };
            }),
          );
        }
      },
      (status) => setStreamStatus(status),
    );

    return () => {
      unsubscribe();
    };
  }, [isMounted, loadSnapshot]);

  // Recompute real-time connection state dynamically from `nowMs` so stale MRs downgrade smoothly
  const hydratedMrs = useMemo(() => {
    return mrs.map((m) => {
      if (!m.liveTrackingEnabled) {
        return { ...m, connectionState: "DISABLED" as const, movementState: "OFFLINE" as const };
      }
      if (!m.lastKnownAt || !isToday) {
        return { ...m, connectionState: "OFFLINE" as const, movementState: "OFFLINE" as const };
      }
      const ageSec = (nowMs - new Date(m.lastKnownAt).getTime()) / 1000;
      if (ageSec <= 35) {
        return {
          ...m,
          connectionState: "LIVE" as const,
          movementState: (m.speedKmh ?? 0) >= 2 ? ("MOVING" as const) : ("STATIONARY" as const),
        };
      }
      if (ageSec <= 300) {
        return {
          ...m,
          connectionState: "RECENT" as const,
          movementState: (m.speedKmh ?? 0) >= 2 ? ("MOVING" as const) : ("STATIONARY" as const),
        };
      }
      if (ageSec <= 1800) {
        return { ...m, connectionState: "STALE" as const, movementState: "STATIONARY" as const };
      }
      return { ...m, connectionState: "OFFLINE" as const, movementState: "OFFLINE" as const };
    });
  }, [mrs, nowMs, isToday]);

  const filteredMrs = useMemo(() => {
    return hydratedMrs.filter((m) => {
      if (filterMode === "ENABLED" && !m.liveTrackingEnabled) return false;
      if (filterMode === "DISABLED" && m.liveTrackingEnabled) return false;
      if (filterMode === "LIVE" && m.connectionState !== "LIVE" && m.connectionState !== "RECENT") {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.employeeCode.toLowerCase().includes(q) ||
          m.territoryName.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hydratedMrs, filterMode, search]);

  const selectedMr = useMemo(
    () => hydratedMrs.find((m) => m.mrId === selectedMrId) || null,
    [hydratedMrs, selectedMrId],
  );

  // Route Playback timer
  useEffect(() => {
    if (!isPlaybackMode || !isPlaying || !selectedMr || selectedMr.trail.length === 0) return;
    const stepMs = Math.max(120, Math.round(1000 / playbackSpeed));
    const timer = setInterval(() => {
      setPlaybackIdx((prev) => {
        if (prev >= selectedMr.trail.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [isPlaybackMode, isPlaying, playbackSpeed, selectedMr]);

  // Reset playback and selected visit when switching MR
  useEffect(() => {
    setIsPlaybackMode(false);
    setIsPlaying(false);
    setPlaybackIdx(0);
    setSelectedVisitId(null);
  }, [selectedMrId, operatingDate]);

  const playbackPoint =
    isPlaybackMode && selectedMr && selectedMr.trail.length > 0
      ? selectedMr.trail[Math.min(playbackIdx, selectedMr.trail.length - 1)]
      : null;

  // Summary metrics
  const summary = useMemo(() => {
    return {
      total: hydratedMrs.length,
      enabled: hydratedMrs.filter((m) => m.liveTrackingEnabled).length,
      live: hydratedMrs.filter((m) => m.connectionState === "LIVE" || m.connectionState === "RECENT").length,
      moving: hydratedMrs.filter((m) => m.movementState === "MOVING").length,
      distanceKm: Math.round(hydratedMrs.reduce((s, m) => s + m.todayDistanceKm, 0) * 10) / 10,
    };
  }, [hydratedMrs]);

  const handleToggleSingleMr = async (mr: LiveMrRecord, nextEnabled: boolean) => {
    setTogglingMrId(mr.mrId);
    // Optimistic update
    setMrs((prev) =>
      prev.map((item) =>
        item.mrId === mr.mrId
          ? {
              ...item,
              liveTrackingEnabled: nextEnabled,
              connectionState: nextEnabled ? "OFFLINE" : "DISABLED",
            }
          : item,
      ),
    );
    try {
      await routeTrackingService.toggleMrTracking(mr.mrId, nextEnabled);
    } catch (err: any) {
      // Revert on failure
      setMrs((prev) =>
        prev.map((item) =>
          item.mrId === mr.mrId ? { ...item, liveTrackingEnabled: !nextEnabled } : item,
        ),
      );
      alert(err?.message || "Failed to update live tracking toggle");
    } finally {
      setTogglingMrId(null);
    }
  };

  const handleBulkToggle = async (enabled: boolean) => {
    setBulkBusy(true);
    try {
      await routeTrackingService.bulkToggleTracking({
        enabled,
        territoryId: selectedTerritoryId !== "ALL" ? selectedTerritoryId : undefined,
      });
      await loadSnapshot(true);
    } catch (err: any) {
      alert(err?.message || "Failed to update fleet tracking");
    } finally {
      setBulkBusy(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live MR GPS Tracking"
        description="Zero-lag real-time field force radar with per-MR admin ON/OFF controls, smooth directional tracking, live route trails, and shift playback."
        badge={
          <div className="flex items-center gap-2">
            <Badge
              variant={streamStatus === "CONNECTED" ? "success" : "warning"}
              className="gap-1.5 text-xs"
            >
              {streamStatus === "CONNECTED" ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  LIVE STREAM
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  {streamStatus}
                </>
              )}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatOperatingDateDisplay(operatingDate)}
            </Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkBusy || hydratedMrs.length === 0}
              onClick={() => handleBulkToggle(true)}
              className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
            >
              <Power className="h-3.5 w-3.5" />
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkBusy || hydratedMrs.length === 0}
              onClick={() => handleBulkToggle(false)}
              className="gap-1.5 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <Power className="h-3.5 w-3.5" />
              Disable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSnapshot()}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Real-Time Fleet KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total MRs</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{summary.total}</p>
            </div>
            <Users className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tracking ON</p>
              <p className="text-xl font-bold text-[#FF6B00] mt-0.5">{summary.enabled}</p>
            </div>
            <Radio className="h-5 w-5 text-[#FF6B00]" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live Online</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{summary.live}</p>
            </div>
            <Wifi className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Moving Now</p>
              <p className="text-xl font-bold text-sky-600 mt-0.5">{summary.moving}</p>
            </div>
            <Navigation className="h-5 w-5 text-sky-500" />
          </CardContent>
        </Card>

        <Card className="shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Distance Covered</p>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">{summary.distanceKm} km</p>
            </div>
            <Route className="h-5 w-5 text-indigo-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Split Command Center: Left MR Controls + Right Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel: MR Roster with Individual ON/OFF Toggle Switches */}
        <Card className="lg:col-span-4 flex flex-col max-h-[680px] overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search MR name, code, territory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { key: "ALL", label: `All (${hydratedMrs.length})` },
                  { key: "ENABLED", label: `ON (${summary.enabled})` },
                  { key: "LIVE", label: `Live (${summary.live})` },
                  { key: "DISABLED", label: `OFF (${hydratedMrs.length - summary.enabled})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(tab.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer",
                    filterMode === tab.key
                      ? "bg-[#FF6B00] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredMrs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No field representatives match the current filters.
              </div>
            ) : (
              filteredMrs.map((mr) => {
                const isSelected = mr.mrId === selectedMrId;
                const isLive = mr.connectionState === "LIVE";
                const isRecent = mr.connectionState === "RECENT";

                return (
                  <div
                    key={mr.mrId}
                    onClick={() => setSelectedMrId(mr.mrId)}
                    className={cn(
                      "p-3 transition-colors cursor-pointer rounded-lg mx-1.5 my-0.5",
                      isSelected
                        ? "bg-orange-50/90 dark:bg-[#FF6B00]/15 border border-orange-200/90"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full shrink-0",
                              !mr.liveTrackingEnabled
                                ? "bg-slate-300 dark:bg-slate-600"
                                : isLive
                                  ? "bg-emerald-500 animate-pulse"
                                  : isRecent
                                    ? "bg-amber-500"
                                    : "bg-slate-400",
                            )}
                          />
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {mr.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {mr.employeeCode} • {mr.territoryName}
                        </p>
                      </div>

                      {/* Per-MR Admin ON/OFF Toggle Switch */}
                      <div
                        className="flex flex-col items-end shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={mr.liveTrackingEnabled}
                          aria-label={`Toggle live tracking for ${mr.name}`}
                          disabled={togglingMrId === mr.mrId}
                          onClick={() => handleToggleSingleMr(mr, !mr.liveTrackingEnabled)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-1 disabled:opacity-50",
                            mr.liveTrackingEnabled
                              ? "bg-emerald-500"
                              : "bg-slate-300 dark:bg-slate-700",
                          )}
                          title={
                            mr.liveTrackingEnabled
                              ? "Live Tracking ON — click to turn OFF"
                              : "Live Tracking OFF — click to turn ON"
                          }
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                              mr.liveTrackingEnabled ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wider mt-0.5",
                            mr.liveTrackingEnabled
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400",
                          )}
                        >
                          {mr.liveTrackingEnabled ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Pills */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {mr.liveTrackingEnabled
                          ? formatRelativeSeconds(mr.lastKnownAt, nowMs)
                          : "Tracking Disabled"}
                      </span>

                      {mr.liveTrackingEnabled && mr.latitude !== null && (
                        <span className="flex items-center gap-1 font-medium">
                          <Gauge className="h-3 w-3 text-sky-500" />
                          {Math.round(mr.speedKmh || 0)} km/h
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Route className="h-3 w-3 text-indigo-500" />
                        {mr.todayDistanceKm} km
                      </span>

                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {mr.todayVisitsCompleted}/{mr.todayVisitsTotal} calls
                      </span>

                      {mr.batteryLevel !== null && (
                        <span className="flex items-center gap-0.5">
                          <Battery
                            className={cn(
                              "h-3 w-3",
                              mr.batteryLevel <= 20 ? "text-rose-500" : "text-emerald-500",
                            )}
                          />
                          {Math.round(mr.batteryLevel)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Panel: Live Map + Selected MR Telemetry & Playback Controls */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Interactive Map Canvas */}
          <div className="h-[520px] w-full">
            <LiveTrackingMap
              mrs={filteredMrs}
              selectedMrId={selectedMrId}
              onSelectMr={handleSelectMr}
              selectedVisitId={selectedVisitId}
              onSelectVisit={handleSelectVisit}
              followSelected={followSelected && !isPlaybackMode}
              showTrail={showTrail}
              showVisits={showVisits}
              playbackPoint={playbackPoint}
              fitAllSignal={fitAllSignal}
            />
          </div>

          {/* Selected MR Telemetry Inspector + Route Playback Bar */}
          {selectedMr && (
            <Card className="shadow-xs">
              <CardContent className="p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0",
                        selectedMr.connectionState === "LIVE"
                          ? "bg-emerald-500"
                          : selectedMr.connectionState === "RECENT"
                            ? "bg-amber-500"
                            : "bg-slate-500",
                      )}
                    >
                      {selectedMr.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedMr.name}
                        </h3>
                        <Badge
                          variant={
                            selectedMr.connectionState === "LIVE"
                              ? "success"
                              : selectedMr.connectionState === "DISABLED"
                                ? "secondary"
                                : "warning"
                          }
                          className="text-[10px]"
                        >
                          {selectedMr.connectionState}
                          {selectedMr.movementState === "MOVING" ? " • MOVING" : ""}
                        </Badge>
                        {selectedMr.accuracy !== null && (
                          <span className="text-[11px] font-mono text-slate-500">
                            GPS ±{Math.round(selectedMr.accuracy)}m
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {selectedMr.territoryName} • {selectedMr.employeeCode}
                        {selectedMr.latitude !== null && selectedMr.longitude !== null
                          ? ` • ${selectedMr.latitude.toFixed(5)}, ${selectedMr.longitude.toFixed(5)}`
                          : " • Awaiting GPS coordinates"}
                      </p>
                    </div>
                  </div>

                  {/* Quick Map Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant={followSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFollowSelected((v) => !v)}
                      className="h-8 text-xs gap-1"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      {followSelected ? "Following" : "Follow"}
                    </Button>
                    <Button
                      variant={showTrail ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTrail((v) => !v)}
                      className="h-8 text-xs gap-1"
                    >
                      <Route className="h-3.5 w-3.5" />
                      Trail ({selectedMr.trail.length})
                    </Button>
                    <Button
                      variant={showVisits ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowVisits((v) => !v)}
                      className="h-8 text-xs gap-1"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      Visits ({selectedMr.visitPins.length})
                    </Button>
                    {selectedMr.latitude !== null && selectedMr.longitude !== null && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedMr.latitude},${selectedMr.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 h-8 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-[#FF6B00]" />
                        Maps
                      </a>
                    )}
                    <Link
                      href={`/field-force/${selectedMr.mrId}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 h-8 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <MapPin className="h-3.5 w-3.5 text-sky-600" />
                      MR Profile
                    </Link>
                  </div>
                </div>

                {/* Route History Playback Bar */}
                {selectedMr.trail.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant={isPlaybackMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (!isPlaybackMode) {
                          setIsPlaybackMode(true);
                          setPlaybackIdx(0);
                          setIsPlaying(true);
                        } else {
                          setIsPlaying((p) => !p);
                        }
                      }}
                      className="h-7 text-xs gap-1"
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {isPlaying ? "Pause" : isPlaybackMode ? "Resume" : "Replay Route"}
                    </Button>

                    {isPlaybackMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsPlaybackMode(false);
                            setIsPlaying(false);
                            setPlaybackIdx(0);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Exit
                        </Button>

                        <input
                          type="range"
                          min={0}
                          max={selectedMr.trail.length - 1}
                          value={playbackIdx}
                          onChange={(e) => {
                            setIsPlaying(false);
                            setPlaybackIdx(Number(e.target.value));
                          }}
                          className="flex-1 min-w-[140px] accent-[#FF6B00] cursor-pointer"
                        />

                        <div className="flex items-center gap-1">
                          {([1, 2, 5, 10] as const).map((spd) => (
                            <button
                              key={spd}
                              type="button"
                              onClick={() => setPlaybackSpeed(spd)}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer",
                                playbackSpeed === spd
                                  ? "bg-[#FF6B00] text-white"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                              )}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>

                        {playbackPoint && (
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            {new Date(playbackPoint.capturedAt).toLocaleTimeString()} •{" "}
                            {Math.round(playbackPoint.speedKmh || 0)} km/h
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's Customer Field Visits & Stops for Selected MR */}
          {selectedMr && (
            <Card className="shadow-xs">
              <CardContent className="p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#FF6B00] dark:bg-orange-950/40">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Today&apos;s Customer Visits &amp; Stops ({selectedMr.visitPins.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedMr.name}&apos;s customer itinerary. Click any stop to spotlight location &amp; 200m geofence on the live map.
                      </p>
                    </div>
                  </div>
                  {selectedVisitId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedVisitId(null)}
                      className="h-7 gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      Clear Spotlight
                    </Button>
                  )}
                </div>

                {selectedMr.visitPins.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                    <Stethoscope className="mx-auto h-6 w-6 text-slate-400 opacity-60 mb-1" />
                    No customer visits recorded for {selectedMr.name} today.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {selectedMr.visitPins.map((pin, idx) => {
                      const isSelected = selectedVisitId === pin.id;
                      const sequence = pin.sequence || idx + 1;
                      const isCompleted = pin.status === "COMPLETED";
                      const isInProgress = pin.status === "IN_PROGRESS";

                      return (
                        <div
                          key={pin.id}
                          onClick={() => {
                            setSelectedVisitId((prev) => (prev === pin.id ? null : pin.id));
                            setShowVisits(true);
                          }}
                          className={cn(
                            "group relative flex flex-col justify-between rounded-lg border p-3 text-xs transition-all cursor-pointer",
                            isSelected
                              ? "border-[#FF6B00] bg-orange-50/70 shadow-xs ring-2 ring-[#FF6B00]/20 dark:bg-orange-950/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black",
                                  isSelected
                                    ? "bg-[#FF6B00] text-white"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                )}
                              >
                                Stop #{sequence}
                              </span>
                              <Badge
                                variant={
                                  isCompleted
                                    ? "success"
                                    : isInProgress
                                      ? "default"
                                      : "warning"
                                }
                                className="text-[9px] px-1.5 py-0 capitalize"
                              >
                                {pin.status.toLowerCase().replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="pt-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                {pin.customerType === "DOCTOR" ? (
                                  <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                ) : (
                                  <Pill className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                                <span className="truncate">{pin.customerName}</span>
                              </div>
                              {pin.clinicName && (
                                <p className="truncate text-[11px] font-medium text-slate-500">
                                  {pin.clinicName}
                                </p>
                              )}
                              {pin.address && (
                                <p className="line-clamp-1 text-[11px] text-slate-400">
                                  {pin.address}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                            {pin.checkInTime && (
                              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  Check-in: {new Date(pin.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {pin.durationMinutes !== null && pin.durationMinutes !== undefined && (
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {pin.durationMinutes} min
                                  </span>
                                )}
                              </div>
                            )}

                            {pin.distanceMeters !== null && pin.distanceMeters !== undefined && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                                <span>
                                  ±{Math.round(pin.distanceMeters)}m ({pin.verificationStatus || "VERIFIED"})
                                </span>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold flex items-center gap-1",
                                  isSelected
                                    ? "text-[#FF6B00]"
                                    : "text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200",
                                )}
                              >
                                <LocateFixed className="h-3 w-3" />
                                {isSelected ? "Spotlight Active" : "Click to Spotlight"}
                              </span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5"
                              >
                                Maps ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
