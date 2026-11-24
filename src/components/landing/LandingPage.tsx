"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { DeviceStudio } from "./DeviceStudio";
import { BentoGrid } from "./BentoGrid";
import { RoiCalculator } from "./RoiCalculator";
import { Architecture } from "./Architecture";
import { Testimonials } from "./Testimonials";
import { CtaSection } from "./CtaSection";
import { Footer } from "./Footer";
import { RequestDemoModal } from "./RequestDemoModal";
import { navigateToSection } from "./navigation";

export function LandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleScrollToDevice = () => {
    navigateToSection("telemetry", "gps");
  };

  return (
    <div className="dark min-h-screen bg-[#05070B] text-slate-100 flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Navbar */}
      <Navbar onOpenDemo={() => setDemoModalOpen(true)} />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onExploreDevice={handleScrollToDevice}
          onRequestDemo={() => setDemoModalOpen(true)}
        />

        {/* Interactive Device Studio Showcase */}
        <DeviceStudio />

        {/* Breakthrough Engineering Bento Grid */}
        <BentoGrid />

        {/* Enterprise Impact ROI Calculator */}
        <RoiCalculator />

        {/* Precision Architecture & Comparison */}
        <Architecture />

        {/* Executive Testimonials */}
        <Testimonials />

        {/* Call to Action Banner */}
        <CtaSection />
      </main>

      {/* Apple-grade Multi-column Footer */}
      <Footer />

      {/* Request Demo Popup Modal */}
      <RequestDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;
