"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  IndianRupee,
  Users,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { RequestDemoModal } from "./RequestDemoModal";

export const RoiCalculator: React.FC = () => {
  const [teamSize, setTeamSize] = useState<number>(120);
  const [callsPerDay, setCallsPerDay] = useState<number>(7);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);

  // Dynamic calculations
  const totalMonthlyVisits = teamSize * callsPerDay * 24;
  const hoursSavedPerMonth = Math.round(teamSize * 1.5 * 24); // 1.5 hrs saved per MR per day on manual paperwork
  const estimatedAnnualValue = Math.round(teamSize * 150000); // ₹1,50,000 avg net productivity return per rep/year

  const handleCalculateImpact = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#FF6B00", "#FF8A34", "#10B981"],
    });
  };

  return (
    <section id="calculator" className="relative py-24 md:py-36 bg-[#06080E] border-t border-b border-white/[0.06] overflow-hidden scroll-mt-24">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF8A34] bg-[#FF6B00]/10 px-3.5 py-1 rounded-full border border-[#FF6B00]/20">
                Commercial Efficiency Engine
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
                Calculate the True Impact <br />
                on Your Field Operations.
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
                By automating offline DCR reconciliation, geofencing doctor clinic calls, and eliminating paper reporting, commercial pharmaceutical teams unlock tremendous capacity.
              </p>
            </div>

            {/* Slider 1: Field Force Team Size */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF8A34]" />
                  <span>Field Force Size (Medical Representatives)</span>
                </label>
                <span className="text-lg font-extrabold text-[#FF8A34] font-mono">
                  {teamSize} Reps
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>10 MRs (Single Region)</span>
                <span>500 MRs</span>
                <span>1,000+ MRs (Pan-Enterprise)</span>
              </div>
            </div>

            {/* Slider 2: Target Calls Per Day */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Average Doctor Calls Target / Day</span>
                </label>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {callsPerDay} Calls
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="1"
                value={callsPerDay}
                onChange={(e) => setCallsPerDay(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>4 Calls/day</span>
                <span>8 Calls/day (Industry Avg)</span>
                <span>14 Calls/day</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Results Bento Display */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl p-8 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-white/[0.12] shadow-2xl backdrop-blur-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Projected Operational Uplift
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> High Precision
                </span>
              </div>

              {/* Metric 1 */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Verified Monthly Calls</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
                    {totalMonthlyVisits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    100% Geofence & DCR validated
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Monthly Admin Time Recovered</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#FF8A34] mt-1 font-mono">
                    {hoursSavedPerMonth.toLocaleString()} Hours
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Redirected directly to HCP detailing
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF8A34]">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300">Estimated Annual Capacity Value</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-mono">
                    ₹{estimatedAnnualValue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Based on recovered detailing time and inventory auditability
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF8A34] via-[#FF6B00] to-[#E05300] text-sm font-bold text-white shadow-xl shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Request Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Demo Popup Modal */}
      <RequestDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        initialTeamSize={teamSize}
        initialCallsPerDay={callsPerDay}
        estimatedAnnualValue={estimatedAnnualValue}
      />
    </section>
  );
};
