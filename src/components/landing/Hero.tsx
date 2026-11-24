"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe2,
  Activity,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { navigateToSection } from "./navigation";
import { ShatterType } from "./ShatterType";
import { ShaderBackground } from "./ShaderBackground";

interface HeroProps {
  onExploreDevice?: () => void;
  onRequestDemo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreDevice, onRequestDemo }) => {
  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF6B00", "#FF8A34", "#FFFFFF", "#0A1526"],
    });
  };

  return (
    <div className="relative bg-[#050608] overflow-hidden">
      {/* Primary Hero Viewport */}
      <section className="relative min-h-[720px] lg:h-screen flex flex-col justify-center pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
        {/* WebGL Mesh Drift Shader Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <ShaderBackground className="w-full h-full opacity-40" />
        </div>

        {/* Ambient Dark Center Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#050608]/60 to-[#050608] pointer-events-none z-0" />

        {/* LEFT FLANKING GLOWING ARC */}
        <div className="absolute left-0 top-0 bottom-0 w-[35vw] max-w-[500px] min-w-[260px] pointer-events-none z-10 flex items-center select-none">
          {/* Diffuse Atmospheric Back-Glow */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] h-[500px] sm:h-[700px] bg-gradient-to-r from-[#FF5500]/30 via-[#FF6B00]/15 to-transparent blur-[80px] rounded-full" />
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 360 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="leftFilamentGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#FF4500" stopOpacity="0.2" />
                <stop offset="25%" stopColor="#FF6B00" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#FFF2E5" stopOpacity="1" />
                <stop offset="75%" stopColor="#FF7A00" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FF4500" stopOpacity="0.2" />
              </linearGradient>
              <filter id="leftArcBloom" x="-50%" y="-30%" width="250%" height="160%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
              <filter id="leftArcGlow" x="-30%" y="-20%" width="200%" height="140%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            {/* Wide Outer Atmospheric Bloom */}
            <path
              d="M -60 20 Q 320 400 -60 780"
              stroke="#FF6B00"
              strokeWidth="24"
              opacity="0.35"
              filter="url(#leftArcBloom)"
            />
            {/* Mid Corona Glow */}
            <path
              d="M -60 20 Q 320 400 -60 780"
              stroke="#FF8A34"
              strokeWidth="8"
              opacity="0.85"
              filter="url(#leftArcGlow)"
            />
            {/* Crisp Hot Solar Filament */}
            <path
              d="M -60 20 Q 320 400 -60 780"
              stroke="url(#leftFilamentGrad)"
              strokeWidth="2.8"
              opacity="1"
            />
          </svg>
        </div>

        {/* RIGHT FLANKING GLOWING ARC */}
        <div className="absolute right-0 top-0 bottom-0 w-[35vw] max-w-[500px] min-w-[260px] pointer-events-none z-10 flex items-center justify-end select-none">
          {/* Diffuse Atmospheric Back-Glow */}
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] h-[500px] sm:h-[700px] bg-gradient-to-l from-[#FF5500]/30 via-[#FF6B00]/15 to-transparent blur-[80px] rounded-full" />
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 360 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="rightFilamentGrad" x1="100%" y1="0%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#FF4500" stopOpacity="0.2" />
                <stop offset="25%" stopColor="#FF6B00" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#FFF2E5" stopOpacity="1" />
                <stop offset="75%" stopColor="#FF7A00" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FF4500" stopOpacity="0.2" />
              </linearGradient>
              <filter id="rightArcBloom" x="-100%" y="-30%" width="250%" height="160%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
              <filter id="rightArcGlow" x="-70%" y="-20%" width="200%" height="140%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            {/* Wide Outer Atmospheric Bloom */}
            <path
              d="M 420 20 Q 40 400 420 780"
              stroke="#FF6B00"
              strokeWidth="24"
              opacity="0.35"
              filter="url(#rightArcBloom)"
            />
            {/* Mid Corona Glow */}
            <path
              d="M 420 20 Q 40 400 420 780"
              stroke="#FF8A34"
              strokeWidth="8"
              opacity="0.85"
              filter="url(#rightArcGlow)"
            />
            {/* Crisp Hot Solar Filament */}
            <path
              d="M 420 20 Q 40 400 420 780"
              stroke="url(#rightFilamentGrad)"
              strokeWidth="2.8"
              opacity="1"
            />
          </svg>
        </div>

        {/* Hero Central Content */}
        <div className="relative z-20 w-full max-w-5xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center justify-center my-auto">
          {/* Eyebrow Kicker */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <span className="w-8 sm:w-12 h-px bg-slate-600/70" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.26em] text-slate-400 uppercase select-none">
              PHARMA SFA PLATFORM
            </span>
            <span className="w-8 sm:w-12 h-px bg-slate-600/70" />
          </div>

          {/* Master Headline - Solid Crisp High-End Typography */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.08] select-none text-center">
            <span className="block text-white">Powering Pharma.</span>
            <span className="block text-[#FF6B00]">Connecting People.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 sm:mt-7 text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed text-center px-4">
            A unified Pharma SFA platform to empower Medical Representatives, streamline field operations, and deliver real-time visibility.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                triggerCelebration();
                onExploreDevice?.();
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF7A00] via-[#FF6B00] to-[#E05300] text-sm font-bold text-white shadow-[0_0_35px_rgba(255,107,0,0.5)] hover:shadow-[0_0_50px_rgba(255,107,0,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Explore Interactive Experience</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onRequestDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-[#FF6B00]/40 text-sm font-semibold text-slate-200 hover:text-white transition-all backdrop-blur-xl flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF8A34] group-hover:scale-110 transition-transform" />
              <span>Request Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Spec Ribbon (Smooth transition section below horizon) */}
      <section className="relative z-10 pt-8 pb-16 px-6 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
        {/* Trust & Spec Micro-Tags */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Offline-First SQLite Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF8A34]" />
            <span>Dedicated Tenant PostgreSQL DBs</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>WebRTC Audio & Video Calling</span>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {[
            {
              metric: "100%",
              label: "Offline Support",
              badge: "Offline-Ready",
            },
            {
              metric: "99.99%",
              label: "Offline-to-Cloud Sync Uptime",
              badge: "Fail-Safe",
            },
            {
              metric: "< 120ms",
              label: "WebRTC Audio/Video Latency",
              badge: "Ultra Low-Lag",
            },
            {
              metric: "0 Data Leak",
              label: "Complete Tenant Isolation",
              badge: "Enterprise Ready",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl hover:border-white/[0.15] transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A34] bg-[#FF6B00]/10 px-2 py-0.5 rounded-md border border-[#FF6B00]/20">
                  {item.badge}
                </span>
                <Activity className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#FF8A34] transition-colors" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {item.metric}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
