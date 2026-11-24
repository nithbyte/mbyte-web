"use client";

import React from "react";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

export const CtaSection: React.FC = () => {
  const handleLaunchPortal = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF6B00", "#FF8A34", "#FFFFFF"],
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 400);
  };

  return (
    <section id="cta" className="relative py-28 md:py-40 bg-[#05070B] overflow-hidden scroll-mt-24">
      {/* Massive Glowing Centerpiece */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-[#FF6B00]/20 via-[#FF6B00]/5 to-transparent blur-[160px] pointer-events-none rounded-full" />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center">
        {/* Floating Emblem */}
        <div className="mx-auto w-20 h-20 mb-8 rounded-3xl bg-gradient-to-b from-[#FF8A34]/20 to-[#FF6B00]/5 border border-[#FF6B00]/30 p-4 flex items-center justify-center shadow-2xl shadow-[#FF6B00]/20">
          <img
            src="/mbyte-emblem-white.png"
            alt="Mediqbyte Emblem"
            className="w-full h-full object-contain animate-glow-pulse"
          />
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Ready to Empower Your <br />
          Commercial Field Force?
        </h2>
        
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Join leading pharmaceutical brands operating with precision, offline resilience, and dedicated multi-tenant intelligence.
        </p>

        <div className="mt-10 flex items-center justify-center">
          <button
            onClick={handleLaunchPortal}
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-[#FF8A34] via-[#FF6B00] to-[#E05300] text-sm font-bold text-white shadow-2xl shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-orange-200" />
            <span>Launch Mediqbyte FieldOps</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Instant Tenant Onboarding
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Cloud PostgreSQL
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 24/7 Field Mission Support
          </span>
        </div>
      </div>
    </section>
  );
};
