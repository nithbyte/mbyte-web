"use client";

import React from "react";
import { Check, X, Shield, Cpu, Lock, Sparkles, Layers } from "lucide-react";

export const Architecture: React.FC = () => {
  return (
    <section id="architecture" className="relative py-24 md:py-36 bg-[#05070B] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8A34] bg-[#FF6B00]/10 px-3.5 py-1 rounded-full border border-[#FF6B00]/20">
            Precision Comparison
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            Why Enterprise Pharma <br />
            Upgrades to Mediqbyte.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Legacy sales force automation tools were built for the desktop era. Mediqbyte was architected from the ground up for modern high-velocity life sciences execution.
          </p>
        </div>

        {/* Apple-style Comparison Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px] rounded-3xl border border-white/[0.08] bg-white/[0.01] backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-12 p-6 border-b border-white/[0.08] bg-white/[0.02] text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Architectural Capability</div>
              <div className="col-span-4 text-[#FF8A34] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Mediqbyte FieldOps 2.0
              </div>
              <div className="col-span-3 text-slate-500">Legacy SFA / CRM Systems</div>
            </div>

            {[
              {
                title: "Offline-First Data Architecture",
                desc: "Full SQLite local replica with automatic atomic cloud sync upon network recovery.",
                mbyte: "Native SQLite Engine (100% Offline)",
                legacy: "Webview cache; fails without signal",
                superior: true,
              },
              {
                title: "Multi-Tenant Cloud Isolation",
                desc: "Dedicated physical PostgreSQL schema and connection pools per tenant.",
                mbyte: "Physical Database Isolation",
                legacy: "Shared noisy-neighbor tables",
                superior: true,
              },
              {
                title: "Doctor Clinic Geofencing",
                desc: "Sub-meter polygon boundary check preventing fake attendance and mock reports.",
                mbyte: "Real-Time Polygon Geofencing",
                legacy: "Loose cell-tower estimation",
                superior: true,
              },
              {
                title: "In-App Tele-Detailing & WebRTC",
                desc: "Direct peer-to-peer audio and video calling with clinical slide sharing HUD.",
                mbyte: "Integrated WebRTC Engine",
                legacy: "External video links or none",
                superior: true,
              },
              {
                title: "Biometric Field Attendance",
                desc: "Anti-spoofing camera liveness verification preventing proxy punch-ins.",
                mbyte: "Selfie Liveness Verification",
                legacy: "Unverified checkbox click",
                superior: true,
              },
              {
                title: "Global Policy Broadcasts",
                desc: "Super Admin cross-tenant broadcast channels with priority push notifications.",
                mbyte: "Targeted In-App Channel Alerts",
                legacy: "Unopened mass emails",
                superior: true,
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-6 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors items-center text-sm"
              >
                <div className="col-span-5 pr-4">
                  <div className="font-bold text-white text-sm">{row.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{row.desc}</div>
                </div>

                <div className="col-span-4 pr-4">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>{row.mbyte}</span>
                  </div>
                </div>

                <div className="col-span-3 text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <span>{row.legacy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
