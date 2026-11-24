"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  User,
  Users,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import confetti from "canvas-confetti";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeamSize?: number;
  initialCallsPerDay?: number;
  estimatedAnnualValue?: number;
}

const AVAILABLE_MODULES = [
  "Offline DCR & SQLite Sync",
  "GPS Polygon Geofencing",
  "Visual Aid e-Detailing & CLM",
  "HD WebRTC Calling",
  "Chemist RCPA & Orders",
  "Multi-Tenant PostgreSQL",
];

export const RequestDemoModal: React.FC<RequestDemoModalProps> = ({
  isOpen,
  onClose,
  initialTeamSize = 120,
  initialCallsPerDay = 7,
  estimatedAnnualValue,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState<number>(initialTeamSize);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "Offline DCR & SQLite Sync",
    "GPS Polygon Geofencing",
    "Visual Aid e-Detailing & CLM",
  ]);
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync team size when prop updates
  useEffect(() => {
    if (initialTeamSize) {
      setTeamSize(initialTeamSize);
    }
  }, [initialTeamSize]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleModule = (module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const constructEmailBody = () => {
    return `MEDIQBYTE ENTERPRISE DEMO REQUEST
--------------------------------------------------
Contact Information:
• Name: ${name}
• Work Email: ${email}
• Phone / WhatsApp: ${phone}
• Pharmaceutical Company: ${company}

Field Operations Scope:
• Field Force Size: ~${teamSize} Medical Representatives
• Avg Calls Per Rep: ~${initialCallsPerDay} calls/day
${
  estimatedAnnualValue
    ? `• Projected Capacity Value: ₹${estimatedAnnualValue.toLocaleString("en-IN")}/year`
    : ""
}

Modules of Interest:
${selectedModules.map((m) => `• ${m}`).join("\n")}

Additional Notes / Requirements:
${notes.trim() ? notes.trim() : "None provided."}

--------------------------------------------------
Recipient: nithbyte@gmail.com
Source: Mediqbyte Landing Page (ROI Calculator Demo Request)
Timestamp: ${new Date().toLocaleString()}`;
  };

  const mailSubject = encodeURIComponent(
    `[Mediqbyte Demo Request] ${company || "Pharma Enterprise"} - ${name || "Lead"} (~${teamSize} MRs)`
  );

  const mailBody = encodeURIComponent(constructEmailBody());
  const mailtoLink = `mailto:nithbyte@gmail.com?subject=${mailSubject}&body=${mailBody}`;
  const gmailWebLink = `https://mail.google.com/mail/?view=cm&fs=1&to=nithbyte@gmail.com&su=${mailSubject}&body=${mailBody}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !company.trim()) {
      setErrorMsg("Please fill in your name, work email, phone number, and company.");
      return;
    }
    setErrorMsg("");

    // Trigger celebration
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#FF6B00", "#FF8A34", "#10B981", "#FFFFFF"],
    });

    setIsSubmitted(true);

    // Automatically trigger mailto
    try {
      window.location.href = mailtoLink;
    } catch {
      // Fallback handled by the UI
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(constructEmailBody());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setErrorMsg("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#090D14] border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80 text-left my-8">
        {/* Close Button */}
        <button
          onClick={handleReset}
          aria-label="Close demo request modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 p-2.5 flex items-center justify-center shadow-lg shadow-[#FF6B00]/15">
                <img
                  src="/mbyte-emblem-white.png"
                  alt="Mediqbyte"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Request Enterprise Demo
                  </h3>
                  <span className="text-[10px] font-bold text-[#FF8A34] uppercase tracking-wider bg-[#FF6B00]/10 border border-[#FF6B00]/25 px-2 py-0.5 rounded-full">
                    FieldOps 2.0
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Tailored commercial walkthrough delivered to{" "}
                  <span className="text-[#FF8A34] font-semibold">nithbyte@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Context Pill from ROI Calculator */}
            <div className="mb-6 p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF8A34]" />
                <span>
                  Configured for:{" "}
                  <strong className="text-white font-semibold">{teamSize} Field MRs</strong> &bull;{" "}
                  <strong className="text-white font-semibold">
                    {initialCallsPerDay} calls/day
                  </strong>
                </span>
              </div>
              {estimatedAnnualValue && (
                <span className="hidden sm:inline-block font-mono font-bold text-emerald-400">
                  ₹{estimatedAnnualValue.toLocaleString("en-IN")}/yr Value
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-medium">
                {errorMsg}
              </div>
            )}

            {/* The Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Work Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone / WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pharmaceutical Company *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Life Sciences Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                  />
                </div>
              </div>

              {/* Team Size Slider / Quick Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Field Force Size (MRs)</span>
                  </span>
                  <span className="font-mono text-[#FF8A34] font-bold">
                    {teamSize} Representatives
                  </span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
              </div>

              {/* Modules of Interest */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Key Capabilities Required:
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = selectedModules.includes(mod);
                    return (
                      <button
                        type="button"
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FF6B00]/15 border-[#FF6B00] text-[#FF8A34]"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {mod}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Requirements / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Specific Requirements / Timeline (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Looking for Tier-2 offline deployment, integration with SAP/ERP, sample drug inventory ledger..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF8A34] via-[#FF6B00] to-[#E05300] text-sm font-bold text-white shadow-xl shadow-[#FF6B00]/25 hover:shadow-[#FF6B00]/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span>Submit Demo Request to nithbyte@gmail.com</span>
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Strict multi-tenant security &bull; No spam &bull; Direct executive response
                </p>
              </div>
            </form>
          </div>
        ) : (
          /* Submission Confirmation Screen */
          <div className="text-center py-6 sm:py-8 space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">
                Demo Request Prepared!
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{name}</strong> from{" "}
                <strong className="text-white">{company}</strong>. Your request for{" "}
                <strong className="text-[#FF8A34]">{teamSize} MRs</strong> has been addressed to{" "}
                <strong className="text-white">nithbyte@gmail.com</strong>.
              </p>
            </div>

            {/* Quick Email Client Links */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-md mx-auto space-y-3">
              <p className="text-xs text-slate-400">
                Click below if your default email client did not automatically launch:
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <a
                  href={gmailWebLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF8A34] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Gmail</span>
                </a>
                <a
                  href={mailtoLink}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#FF8A34]" />
                  <span>Default Email App</span>
                </a>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Done / Back to Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
