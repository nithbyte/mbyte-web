"use client";

import React, { useState, useEffect } from "react";
import {
  Navigation,
  BookOpen,
  PhoneCall,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Sliders,
  Sparkles,
  Wifi,
  Battery,
  Shield,
  Layers,
  Mic,
  Video,
  MonitorUp,
  Volume2,
  Megaphone,
} from "lucide-react";

export const DeviceStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "gps" | "detailing" | "webrtc" | "multitenant"
  >("gps");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("detailing")) {
        setActiveTab("detailing");
      } else if (hash.includes("telemetry") || hash.includes("gps") || hash.includes("studio")) {
        setActiveTab("gps");
      } else if (hash.includes("webrtc") || hash.includes("call")) {
        setActiveTab("webrtc");
      } else if (hash.includes("tenant") || hash.includes("multitenant")) {
        setActiveTab("multitenant");
      }
    };

    const handleCustomTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && ["gps", "detailing", "webrtc", "multitenant"].includes(detail)) {
        setActiveTab(detail as any);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("mediqbyte-studio-tab", handleCustomTab);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("mediqbyte-studio-tab", handleCustomTab);
    };
  }, []);

  return (
    <section id="telemetry" className="relative py-20 md:py-32 bg-[#06080E] border-t border-b border-white/[0.05] scroll-mt-24">
      {/* Anchors for e-Detailing, WebRTC, and Studio aliases */}
      <div id="studio" className="absolute -top-24 pointer-events-none" />
      <div id="detailing" className="absolute -top-24 pointer-events-none" />
      <div id="webrtc" className="absolute -top-24 pointer-events-none" />
      {/* Background glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF6B00]/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8A34] bg-[#FF6B00]/10 px-3 py-1 rounded-full border border-[#FF6B00]/20">
            Interactive Field Studio
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            Engineered for the Field. <br className="hidden sm:inline" />
            Mastered for Leadership.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Switch between modules below to experience how Mediqbyte transforms everyday field operations into high-precision commercial intelligence.
          </p>
        </div>

        {/* Interactive Segmented Switcher (Apple style) */}
        <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl">
            {[
              {
                id: "gps",
                label: "GPS Route & Geofencing",
                icon: Navigation,
              },
              {
                id: "detailing",
                label: "Visual Aid e-Detailing",
                icon: BookOpen,
              },
              {
                id: "webrtc",
                label: "HD Tele-Detailing & Calls",
                icon: PhoneCall,
              },
              {
                id: "multitenant",
                label: "Multi-Tenant Governance",
                icon: Building2,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-[#FF8A34] to-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/25 scale-[1.02]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Apple-grade Hardware Bezel Frame */}
        <div className="relative mx-auto max-w-5xl rounded-[32px] sm:rounded-[40px] p-3 sm:p-4 bg-gradient-to-b from-slate-700/40 via-slate-800/30 to-slate-950/60 border border-white/15 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          {/* Hardware Camera Notch */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-full bg-black/90 border border-white/10 z-30">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-blue-500/80" />
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Device Screen Canvas */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-[#0A0E17] border border-white/[0.08] min-h-[520px] sm:min-h-[580px] p-6 sm:p-8 flex flex-col justify-between">
            {/* Screen Top Status Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white tracking-wider">MEDIQBYTE FIELDOPS</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  LIVE SESSION
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Offline Synced
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Battery className="w-3.5 h-3.5 text-slate-300" /> 98%
                </span>
              </div>
            </div>

            {/* TAB CONTENT 1: GPS ROUTE & GEOFENCING */}
            {activeTab === "gps" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF8A34]">
                    <Navigation className="w-4 h-4 animate-spin-slow" />
                    <span>Real-Time High-Precision Route Tracking</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                    Sub-Meter Doctor Clinic Geofence Verification.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Eliminates mock reporting and fake attendance. GPS breadcrumbs log accurate travel routes even when device switches to airplane mode or subterranean hospital basement clinics.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-xs text-slate-400">Target Geofence</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">200m Radius</div>
                      <div className="text-[10px] text-slate-500 mt-1">Circular polygon bounding</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-xs text-slate-400">Verification State</div>
                      <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Accuracy: ±2.4 meters</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Visual Interactive Map Card */}
                <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/15 p-5 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF8A34]" />
                      <span className="text-xs font-bold text-white">Route Breadcrumbs</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Active Tour Plan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        doctor: "Dr. Arvind Swaminathan",
                        spec: "Interventional Cardiologist",
                        time: "09:30 AM",
                        status: "Completed (18m)",
                        verified: true,
                      },
                      {
                        doctor: "Dr. Meenakshi Sundaram",
                        spec: "Diabetologist & Endocrinology",
                        time: "11:15 AM",
                        status: "Checked In (Geofenced)",
                        active: true,
                      },
                      {
                        doctor: "Dr. Rajesh K. Varma",
                        spec: "General Medicine",
                        time: "02:00 PM",
                        status: "Next Scheduled",
                        verified: false,
                      },
                    ].map((stop, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border transition-all ${
                          stop.active
                            ? "bg-[#FF6B00]/10 border-[#FF6B00]/40 shadow-lg shadow-[#FF6B00]/10"
                            : "bg-white/[0.02] border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{stop.doctor}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{stop.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{stop.spec}</div>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
                          {stop.active ? (
                            <span className="text-[#FF8A34] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A34] animate-ping" />
                              {stop.status}
                            </span>
                          ) : stop.verified ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {stop.status}
                            </span>
                          ) : (
                            <span className="text-slate-500">{stop.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: VISUAL AID E-DETAILING */}
            {activeTab === "detailing" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF8A34]">
                    <BookOpen className="w-4 h-4" />
                    <span>Next-Gen Visual Aid Detailing Deck</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                    Telemetry-Driven Doctor Detailing Analytics.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Interactive PDF, video, and HTML5 slide detailing tracks precise doctor gaze dwell-time per slide. Automatically correlates product efficacy slides with prescription generation.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-[11px] text-slate-400">Total Slides</div>
                      <div className="text-lg font-bold text-white mt-0.5">14 Decks</div>
                      <div className="text-[10px] text-emerald-400">Auto-cached offline</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-[11px] text-slate-400">Avg Dwell Time</div>
                      <div className="text-lg font-bold text-[#FF8A34] mt-0.5">3m 48s</div>
                      <div className="text-[10px] text-slate-400">+42% retention</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-[11px] text-slate-400">Sample Ledger</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">Audited</div>
                      <div className="text-[10px] text-slate-400">Batch verified</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Visual Aid Slide Display */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/15 p-5 shadow-xl">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 aspect-[4/3] flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        GLYCONOV-M 500/50
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF8A34]" /> 02:44
                      </span>
                    </div>

                    <div className="text-center py-4">
                      <div className="text-base font-bold text-white">Phase III Clinical Efficacy</div>
                      <div className="text-xs text-slate-400 mt-1">Significant HbA1c Reduction (-1.82%)</div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="w-16 h-12 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xs font-bold text-orange-300">
                          -1.82%
                        </span>
                        <span className="w-16 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300">
                          98.4%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-400">
                      <span>Slide 4 of 12</span>
                      <span className="text-emerald-400">Interactive Hotspots Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: WEBRTC CALLING & TELE-DETAILING */}
            {activeTab === "webrtc" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF8A34]">
                    <PhoneCall className="w-4 h-4" />
                    <span>Peer-to-Peer Encrypted Tele-Detailing</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                    Instant Crystal-Clear Audio & Video Calling.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Built-in STUN/TURN WebRTC signaling lets Field Representatives initiate instant consultations with Area Sales Managers, Product Specialists, and Doctors with zero external software.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" /> Dynamic Noise Suppression
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5">
                      <MonitorUp className="w-3.5 h-3.5 text-[#FF8A34]" /> 1080p Screen Sharing
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" /> End-to-End Encrypted
                    </span>
                  </div>
                </div>

                {/* Simulated Call View Screen */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/15 p-5 shadow-xl">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950 p-4 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                          DM
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">durga m</div>
                          <div className="text-[10px] text-emerald-400">Audio Call Active • 04:12</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                        LIVE
                      </span>
                    </div>

                    {/* Waveform Visualization */}
                    <div className="h-16 flex items-center justify-center gap-1 px-4 my-3">
                      {[40, 65, 80, 50, 95, 75, 45, 85, 60, 90, 70, 55, 80, 45, 60].map((h, idx) => (
                        <span
                          key={idx}
                          style={{ height: `${h}%` }}
                          className="w-1.5 rounded-full bg-gradient-to-t from-[#FF6B00] to-[#FF8A34] animate-pulse"
                        />
                      ))}
                    </div>

                    {/* Call Controls */}
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/10">
                      <button className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white">
                        <Mic className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white">
                        <Video className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30">
                        <PhoneCall className="w-4 h-4 rotate-[135deg]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: MULTI-TENANT GOVERNANCE */}
            {activeTab === "multitenant" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FF8A34]">
                    <Building2 className="w-4 h-4" />
                    <span>SaaS Multi-Tenant Architectural Isolation</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                    Dedicated PostgreSQL Tenant Databases.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Zero cross-tenant data leakage. Every pharmaceutical organization receives its own dedicated database connection pool leased on-demand, with Super Admin broadcast capabilities.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-xs text-slate-400">Tenant Isolation</div>
                      <div className="text-lg font-bold text-white mt-0.5">Physical DB Tier</div>
                      <div className="text-[10px] text-emerald-400 mt-1">Zero shared tables</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="text-xs text-slate-400">Broadcast Channel</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">📢 Announcements</div>
                      <div className="text-[10px] text-slate-400 mt-1">Global & Single-Tenant</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Multi-Tenant Console View */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-white/15 p-5 shadow-xl">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#FF8A34]" /> Active Tenant Lease
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">POOL: 1/25</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
                      <div className="text-slate-400 text-[10px]">ORGANIZATION</div>
                      <div className="font-bold text-white mt-0.5">Koveldesigns (KOVEL)</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">mbyte_tenant_kovel_1f9fb704</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                      <div className="text-amber-400 text-[10px] flex items-center gap-1">
                        <Megaphone className="w-3 h-3" /> LATEST BROADCAST
                      </div>
                      <div className="font-bold text-white mt-0.5 text-[11px]">
                        Official Annual Sales Meet 2026 Policy
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Broadcasted to all active field members
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hardware Screen Bottom Bezel */}
            <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Encrypted Connection · TLS 1.3 · Mediqbyte Cloud</span>
              </span>
              <span className="font-mono text-[11px]">v2.4.0-PROD</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
