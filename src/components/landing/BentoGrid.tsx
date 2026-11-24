"use client";

import React from "react";
import {
  Database,
  Camera,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Smartphone,
  Cpu,
  BarChart3,
  Server,
  Fingerprint,
  RefreshCw,
  Award,
  ClipboardCheck,
  Store,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

export const BentoGrid: React.FC = () => {
  return (
    <section id="platform" className="relative py-24 md:py-36 bg-[#05070B] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8A34] bg-[#FF6B00]/10 px-3.5 py-1 rounded-full border border-[#FF6B00]/20">
            Architectural Excellence
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            Breakthrough Engineering. <br />
            Built into Every Layer.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Every component of Mediqbyte has been crafted from first principles to solve the real, grueling challenges of pharmaceutical commercial execution.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Card 1: Offline-First SQLite Engine (Spans 2 cols, 2 rows) */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl p-8 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950 border border-white/[0.08] hover:border-[#FF6B00]/40 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00]/10 blur-[120px] pointer-events-none rounded-full" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF8A34]">
                  <Database className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Zero Data Loss
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-[#FF8A34] transition-colors">
                Offline-First SQLite Engine with Seamless Cloud Sync.
              </h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Medical representatives routinely work in subterranean hospital wings and remote clinics without cellular reception. Mediqbyte operates 100% offline using a local SQLite transaction log and safely synchronizes all DCR visits, chemist orders, and GPS coordinates the instant signal returns.
              </p>
            </div>

            {/* Visual Micro-Graphic */}
            <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span>Deterministic Conflict Resolution</span>
              </div>
              <span className="font-mono text-[11px] text-[#FF8A34]">ACID Compliant</span>
            </div>
          </div>

          {/* Card 2: Biometric Facial Attendance */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Biometric Geofenced Attendance.
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Anti-spoofing camera selfies combined with polygon geofence validation eliminate proxy punch-ins and enforce authentic field presence.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Real-time Liveness Detection
            </div>
          </div>

          {/* Card 3: Multi-Tenant Dedicated DBs */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Physical Tenant Database Isolation.
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Unlike primitive row-level multitenancy, each pharmaceutical client gets an isolated PostgreSQL database connection leased on demand.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-purple-300 font-semibold flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Zero Cross-Tenant Leakage
            </div>
          </div>

          {/* Card 4: WebRTC HD Calling */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                In-App WebRTC Calling & Detailing.
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Connect field managers with representatives via encrypted peer-to-peer audio and video calling with 1080p visual aid sharing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-amber-400 font-semibold">
              Ultra Low-Latency (&lt; 120ms)
            </div>
          </div>

          {/* Card 5: Sample & Inventory Ledger (Spans 2 cols on lg) */}
          <div className="md:col-span-2 rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-md">
                  Cryptographic Ledger
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Audited Drug Sample & Promotional Inventory Tracking.
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Track batch numbers, expiration dates, and physical doctor handovers with dual acknowledgment. Full compliance with pharmaceutical marketing codes and regulatory audit trails.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span>Automatic Batch Re-order Alerts</span>
              <span className="text-emerald-400 font-semibold">100% Traceability</span>
            </div>
          </div>

          {/* Card 6: Native Cross-Platform Performance */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Fluid Native Touch.
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Optimized for iPad Pro detailing, Android tablets, and smartphones with 60fps gesture navigation and instantaneous search.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-rose-400 font-semibold">
              iOS · iPadOS · Android · Web
            </div>
          </div>

          {/* Card 7: Smart DCR & ASM/RSM Joint Fieldwork (Spans 2 cols) */}
          <div className="md:col-span-2 rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-slate-950 border border-white/[0.08] hover:border-[#FF6B00]/40 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF8A34]">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                  Core Field Operations
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#FF8A34] transition-colors">
                OmniChannel Daily Call Reports (DCR) & Joint Working.
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Log single and joint calls with Area and Regional Sales Managers with zero friction. Capture digital physician signatures, detailed feedback, detailing slide interest, and schedule recurring follow-up visits with automated territory frequency compliance.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Joint ASM/RSM Tagging
              </span>
              <span className="text-[#FF8A34] font-semibold text-[11px]">Instant Offline Log</span>
            </div>
          </div>

          {/* Card 8: RCPA & Secondary Chemist Order Booking */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Chemist RCPA & Secondary Orders.
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Audit chemist prescription market share against competitor brands. Instantly book in-clinic orders directly to authorized stockists and track payment collections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-cyan-400 font-semibold">
              Prescription Share Intelligence
            </div>
          </div>

          {/* Card 9: Monthly Tour Plans (MTP) & Approvals */}
          <div className="rounded-3xl p-7 bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/[0.08] hover:border-white/[0.2] transition-all group relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Monthly Tour Plans (MTP).
              </h3>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Pre-plan doctor visit itineraries with automated multi-tier manager approval hierarchies. Track deviations and optimize territory visit frequencies automatically.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-indigo-400 font-semibold">
              Multi-Level Hierarchy Approval
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
