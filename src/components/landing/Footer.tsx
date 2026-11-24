"use client";

import React from "react";
import { Globe, Shield, Terminal, ArrowUpRight } from "lucide-react";
import { navigateToSection } from "./navigation";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#030508] text-slate-400 text-xs py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Footnote / Legal Microcopy (Apple-style) */}
        <div className="border-b border-white/[0.06] pb-8 mb-12 space-y-3 text-[11px] text-slate-500 leading-relaxed">
          <p>
            1. Mediqbyte FieldOps 2.0 provides offline-first transactional replication with local SQLite caching. Synchronization is deterministic and automatically resolves upon network telemetry connection.
          </p>
          <p>
            2. Multi-tenant database isolation ensures each enterprise client operates on a physically distinct PostgreSQL database connection pool. No cross-tenant access is permitted under any user privilege level.
          </p>
          <p>
            3. WebRTC audio and video calling relies on direct peer-to-peer media streams with encrypted STUN/TURN server signaling. Call logs and signaling events are cryptographically recorded in the tenant database.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Col 1 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              FieldOps Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#platform"
                  onClick={(e) => navigateToSection("platform", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  OmniChannel DCR
                </a>
              </li>
              <li>
                <a
                  href="#telemetry"
                  onClick={(e) => navigateToSection("telemetry", "gps", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Polygon GPS Geofencing
                </a>
              </li>
              <li>
                <a
                  href="#detailing"
                  onClick={(e) => navigateToSection("telemetry", "detailing", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Visual Aid e-Detailing
                </a>
              </li>
              <li>
                <a
                  href="#detailing"
                  onClick={(e) => navigateToSection("telemetry", "detailing", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  CLM Slide Analytics
                </a>
              </li>
              <li>
                <a
                  href="#platform"
                  onClick={(e) => navigateToSection("platform", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Biometric Attendance
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Real-Time Calling
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#webrtc"
                  onClick={(e) => navigateToSection("telemetry", "webrtc", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  HD WebRTC Video
                </a>
              </li>
              <li>
                <a
                  href="#webrtc"
                  onClick={(e) => navigateToSection("telemetry", "webrtc", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Peer Audio Signaling
                </a>
              </li>
              <li>
                <a
                  href="#webrtc"
                  onClick={(e) => navigateToSection("telemetry", "webrtc", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Clinical Screen Share
                </a>
              </li>
              <li>
                <a
                  href="#webrtc"
                  onClick={(e) => navigateToSection("telemetry", "webrtc", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Call Audit Telemetry
                </a>
              </li>
              <li>
                <a
                  href="#webrtc"
                  onClick={(e) => navigateToSection("telemetry", "webrtc", e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  STUN/TURN Fallback
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Enterprise Cloud
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dedicated PostgreSQL
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tenant Isolation
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Super Admin Control
                </a>
              </li>
              <li>
                <a
                  href="#platform"
                  onClick={(e) => navigateToSection("platform", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Broadcast Circulars
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  REST & Webhook APIs
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Compliance & Safety
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  HIPAA Standards
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  21 CFR Part 11
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  ISO 27001 Security
                </a>
              </li>
              <li>
                <a
                  href="#platform"
                  onClick={(e) => navigateToSection("platform", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sample Drug Ledger
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => navigateToSection("architecture", undefined, e)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Role-Based Access
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Brand Emblem */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <a
              href="#"
              onClick={(e) => navigateToSection("top", undefined, e)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <img
                src="/mbyte-emblem-white.png"
                alt="Mediqbyte Emblem"
                className="w-7 h-7 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-white tracking-wider">MEDIQBYTE</span>
            </a>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pharmaceutical intelligence engineered for maximum field velocity and strict multi-tenant governance.
            </p>
          </div>
        </div>

        {/* Bottom Bar (Apple style) */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col items-center gap-5 text-[11px]">
          {/* Mobile login-style brand credits row */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-slate-500">
            <span className="font-semibold text-slate-400">Mediqbyte</span>
            <span>&bull;</span>
            <span>A Product of <span className="font-bold text-slate-200">Kövelbyte</span></span>
            <span>&bull;</span>
            <span>Powered by{" "}
              <a href="https://nithbyte.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-400 hover:text-[#FF8A34] transition-colors">Nithbyte</a>
            </span>
            <span>&bull;</span>
            <span>Enterprise Multi-Tenant Release v1.0.0</span>
          </div>

          {/* Copyright + links */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.04] pt-5">
            <div className="text-slate-500">
              Copyright &copy; {new Date().getFullYear()} Mediqbyte Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="/login" className="hover:text-white transition-colors">
                FieldOps Portal
              </a>

              <span className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3 h-3 text-[#FF8A34]" /> Global Edition (India &amp; APAC)
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
