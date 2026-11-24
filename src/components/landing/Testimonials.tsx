"use client";

import React from "react";
import { Star, Quote, Building, Award } from "lucide-react";

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="relative py-24 md:py-36 bg-[#06080E] border-t border-white/[0.06] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8A34] bg-[#FF6B00]/10 px-3.5 py-1 rounded-full border border-[#FF6B00]/20">
            Field Endorsements
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            Validated by Commercial <br />
            Pharma Leaders.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                "Mediqbyte's offline SQLite sync solved the single biggest pain point for our 450 representatives in Tier-2 and Tier-3 territories. Zero lost DCR records, zero excuses.",
              name: "Dr. Rajesh Sharma",
              title: "Senior VP of Commercial Strategy",
              company: "Apex Healthcare Ltd",
              tag: "450 Field MRs",
            },
            {
              quote:
                "The dedicated tenant PostgreSQL isolation gave our legal and compliance committee complete confidence. Each company’s data is strictly partitioned with zero noisy neighbors.",
              name: "Siddharth Venkat",
              title: "Chief Information Officer",
              company: "Novis Pharmaceuticals",
              tag: "Pan-India Deployment",
            },
            {
              quote:
                "Having in-app WebRTC calling and visual aid detailing in one unified interface eliminated three separate disjointed apps. Our doctor engagement time jumped by 38% in 60 days.",
              name: "Priya Patel",
              title: "Head of Digital Detailing & CLM",
              company: "Zenith Lifesciences",
              tag: "18 Product Lines",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.2] transition-all flex flex-col justify-between group backdrop-blur-xl"
            >
              <div>
                <div className="flex items-center gap-1 text-[#FF8A34] mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.title}</div>
                  <div className="text-[11px] text-[#FF8A34] font-medium mt-0.5">
                    {item.company}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
