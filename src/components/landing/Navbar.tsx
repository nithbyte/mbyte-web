"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  Navigation,
  BookOpen,
  Layers,
  Calculator,
  Cpu,
  Star,
} from "lucide-react";
import { navigateToSection } from "./navigation";

interface NavbarProps {
  onOpenDemo?: () => void;
}

interface NavItem {
  label: string;
  targetId: string;
  studioTab?: "gps" | "detailing" | "webrtc" | "multitenant";
  icon?: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Telemetry & GPS",
    targetId: "telemetry",
    studioTab: "gps",
    icon: Navigation,
  },
  {
    label: "e-Detailing",
    targetId: "telemetry",
    studioTab: "detailing",
    icon: BookOpen,
  },
  {
    label: "Platform",
    targetId: "platform",
    icon: Layers,
  },
  {
    label: "Impact ROI",
    targetId: "calculator",
    icon: Calculator,
  },
  {
    label: "Architecture",
    targetId: "architecture",
    icon: Cpu,
  },
  {
    label: "Reviews",
    targetId: "testimonials",
    icon: Star,
  },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Scroll spy logic
      const sections = ["telemetry", "platform", "calculator", "architecture", "testimonials"];
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          return;
        }
      }
      if (window.scrollY < 300) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLinkClick = (
    e: React.MouseEvent,
    targetId: string,
    studioTab?: "gps" | "detailing" | "webrtc" | "multitenant"
  ) => {
    setMobileMenuOpen(false);
    navigateToSection(targetId, studioTab, e);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full max-w-[100vw] z-50 transition-all duration-300 overflow-x-hidden ${isScrolled
        ? "!bg-[#05070B]/85 backdrop-blur-2xl !border-b !border-white/[0.08] py-2.5 sm:py-3 shadow-2xl shadow-black/60"
        : "!bg-[#05070B]/40 lg:!bg-transparent backdrop-blur-md lg:backdrop-blur-none !border-b !border-white/[0.04] lg:!border-b-0 py-3 sm:py-5"
        }`}
      style={{
        backgroundColor: isScrolled ? "rgba(5, 7, 11, 0.85)" : undefined,
        borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.08)" : undefined,
        boxShadow: isScrolled ? "0 25px 50px -12px rgba(0, 0, 0, 0.6)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, "top")}
          className="flex items-center group cursor-pointer shrink-0"
        >
          <div className="relative flex items-center justify-center">
            <img
              src="/logo-dark.png"
              alt="Mediqbyte Logo"
              className="h-9 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full backdrop-blur-xl shadow-inner shadow-white/[0.02]">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeSection === item.targetId ||
              (item.studioTab === "detailing" && typeof window !== "undefined" && window.location.hash.includes("detailing"));

            return (
              <a
                key={item.label}
                href={`#${item.targetId}`}
                onClick={(e) => handleLinkClick(e, item.targetId, item.studioTab)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${isActive
                  ? "text-[#FF8A34] bg-white/[0.08] shadow-sm shadow-[#FF6B00]/20"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right Actions & Kovelbyte Brand */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Desktop CTA Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="text-xs font-bold text-slate-200 hover:text-white px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/12 hover:border-[#FF6B00]/40 transition-all cursor-pointer"
              >
                Request Demo
              </button>
            )}
            <a
              href="/login"
              className="relative group overflow-hidden rounded-full p-[1px] focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF8A34] via-[#FF6B00] to-[#E05300] rounded-full animated-border group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#070A0F] text-xs font-bold text-white transition-all group-hover:bg-[#070A0F]/80">
                <span>Launch Mediqbyte</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </span>
            </a>
          </div>

          {/* Kovelbyte Logo (Right End - Dark Theme) */}
          <a
            href="https://kovelbyte.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center pl-1.5 sm:pl-3.5 border-l border-white/10 group cursor-pointer"
            title="Kövelbyte"
          >
            <img
              src="/brand/kovelbyte-logo-dark.png"
              alt="Kövelbyte"
              className="h-5 sm:h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/kovelbyte-logo-dark.png";
              }}
            />
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070A0F]/98 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-3 shadow-2xl animate-fade-in">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={`#${item.targetId}`}
                  onClick={(e) => handleLinkClick(e, item.targetId, item.studioTab)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-[#FF8A34] hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF8A34] via-[#FF6B00] to-[#E05300] text-sm font-bold text-white shadow-lg shadow-[#FF6B00]/25 text-center flex items-center justify-center gap-2"
            >
              <span>Launch Mediqbyte</span>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </a>

            {onOpenDemo && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                className="w-full py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Choose Destination Portal
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
