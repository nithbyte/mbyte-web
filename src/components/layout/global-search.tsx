"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Stethoscope,
  Building2,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  MapPin,
  Compass,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  doctorService,
  pharmacyService,
  productService,
  fieldForceService,
  orderService,
  collectionService,
  territoryService,
} from "@/services";
import { cn, formatCurrency } from "@/lib/utils";
import type { CanonicalRole } from "@/types";

interface GlobalSearchResult {
  id: string;
  category:
    | "PAGE"
    | "DOCTOR"
    | "PHARMACY"
    | "PRODUCT"
    | "MR"
    | "ORDER"
    | "COLLECTION"
    | "TERRITORY";
  title: string;
  subtitle?: string;
  href: string;
}

const QUICK_PAGES: Array<{
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
  roles?: CanonicalRole[];
}> = [
  { title: "Company Overview", subtitle: "Dashboard & KPIs", href: "/", keywords: "dashboard home overview kpi" },
  { title: "Field Visits & GPS", subtitle: "Live visit tracking", href: "/visits", keywords: "visits gps calls" },
  { title: "Live MR Tracking", subtitle: "Real-time GPS map & per-MR toggle", href: "/live-tracking", keywords: "live tracking gps radar map location mr route" },
  { title: "Tour Plans (MTP)", subtitle: "Monthly tour schedules", href: "/tour-plans", keywords: "tour plan mtp schedule" },
  { title: "Daily Call Reports (DCR)", subtitle: "Daily call logs & approvals", href: "/dcr", keywords: "dcr daily call report" },
  { title: "MR Team & Coverage", subtitle: "Medical representatives & attendance", href: "/field-force", keywords: "mr rep team field force staff" },
  { title: "Territories & Coverage", subtitle: "Zones, regions & assignments", href: "/territories", keywords: "territory zone region hub" },
  { title: "Doctors & Clinics", subtitle: "Prescriber directory", href: "/doctors", keywords: "doctor clinic physician prescriber" },
  { title: "Purchasing Doctors", subtitle: "Direct-purchasing physicians", href: "/purchasing-doctors", keywords: "purchasing doctor clinic physician" },
  { title: "Pharmacies & Retail", subtitle: "Chemist & retail outlets", href: "/pharmacies", keywords: "pharmacy chemist retail store" },
  { title: "Distributors & Stockists", subtitle: "Stockist network", href: "/distributors", keywords: "distributor stockist agency" },
  { title: "Products & Visual Aids", subtitle: "Formulations & e-detailing", href: "/products", keywords: "product sku medicine visual aid" },
  { title: "Product Presence & Audits", subtitle: "Chemist shelf stock & heatmap", href: "/products/presence", keywords: "presence shelf stock audit heatmap" },
  { title: "Sample Inventory & Gifts", subtitle: "Samples, paperweights & promo inputs", href: "/samples", keywords: "sample gift input paperweight batch dispatch" },
  { title: "Commercial Overview", subtitle: "Revenue intelligence & leaderboard", href: "/commercial", keywords: "commercial revenue intelligence dashboard" },
  { title: "Orders Booking", subtitle: "Secondary sales orders", href: "/orders", keywords: "order sales booking invoice" },
  { title: "Collections & Receipts", subtitle: "Payment receipts & recovery", href: "/collections", keywords: "collection payment receipt cash upi cheque" },
  { title: "Accounts Receivable", subtitle: "Invoices, aging & credit statements", href: "/receivables", keywords: "receivable invoice aging overdue ar credit" },
  { title: "Expense Claims", subtitle: "TA/DA & field expenses", href: "/expenses", keywords: "expense claim travel allowance" },
  { title: "Attendance & Shifts", subtitle: "Daily punch-in & punch-out", href: "/attendance", keywords: "attendance shift punch in out" },
  { title: "Team Chat & Calls", subtitle: "Messaging, audio & video calls", href: "/chat", keywords: "chat message call voice video" },
  { title: "Reports & Analytics", subtitle: "Performance & compliance reports", href: "/reports", keywords: "report analytics export" },
  { title: "Campaigns", subtitle: "Marketing campaigns", href: "/campaigns", keywords: "campaign promotion" },
  { title: "Training & Quizzes", subtitle: "LMS modules & quizzes", href: "/training", keywords: "training quiz lms learning" },
  { title: "Surveys", subtitle: "Doctor & field surveys", href: "/surveys", keywords: "survey feedback questionnaire" },
  { title: "Companies & Tenants", subtitle: "Super admin tenant portal", href: "/companies", keywords: "company tenant org", roles: ["SUPER_ADMIN"] },
  { title: "Settings", subtitle: "Portal configuration", href: "/settings", keywords: "settings profile preferences" },
];

export function GlobalSearch({ role }: { role: CanonicalRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [apiResults, setApiResults] = useState<GlobalSearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K focuses global search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Instant page matches
  const pageResults: GlobalSearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = QUICK_PAGES.filter((p) => {
      if (role === "SUPER_ADMIN") {
        return ["/companies", "/field-force", "/chat", "/settings"].includes(p.href);
      }
      if (p.roles && !p.roles.includes(role)) return false;
      return true;
    });

    if (!q) {
      return allowed.slice(0, 5).map((p) => ({
        id: `page_${p.href}`,
        category: "PAGE",
        title: p.title,
        subtitle: p.subtitle,
        href: p.href,
      }));
    }

    return allowed
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.keywords.includes(q)
      )
      .slice(0, 4)
      .map((p) => ({
        id: `page_${p.href}`,
        category: "PAGE",
        title: p.title,
        subtitle: p.subtitle,
        href: p.href,
      }));
  }, [query, role]);

  // Debounced live API search across doctors, pharmacies, products, MRs, orders, collections, territories
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || role === "SUPER_ADMIN") {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const lower = q.toLowerCase();
      try {
        const [doctors, pharmacies, products, mrs, orders, collections, territories] =
          await Promise.all([
            doctorService.getDoctors({ search: q }).catch(() => []),
            pharmacyService.getPharmacies({ search: q }).catch(() => []),
            productService.getProducts({ search: q }).catch(() => []),
            fieldForceService.getMRList({ search: q }).catch(() => []),
            orderService.getOrders({ search: q, limit: 5 }).catch(() => []),
            collectionService.getCollections({ search: q, limit: 5 }).catch(() => []),
            territoryService.getTerritories().catch(() => []),
          ]);

        if (cancelled) return;

        const next: GlobalSearchResult[] = [];

        (Array.isArray(doctors) ? doctors : [])
          .filter(
            (d: any) =>
              (d.name || "").toLowerCase().includes(lower) ||
              (d.clinicName || "").toLowerCase().includes(lower) ||
              (d.specialty || "").toLowerCase().includes(lower)
          )
          .slice(0, 4)
          .forEach((d: any) => {
            next.push({
              id: `doc_${d.id}`,
              category: "DOCTOR",
              title: d.name || "Doctor",
              subtitle: [d.specialty, d.clinicName].filter(Boolean).join(" • "),
              href: `/doctors/${d.id}`,
            });
          });

        (Array.isArray(pharmacies) ? pharmacies : [])
          .filter(
            (p: any) =>
              (p.name || "").toLowerCase().includes(lower) ||
              (p.address || "").toLowerCase().includes(lower)
          )
          .slice(0, 4)
          .forEach((p: any) => {
            next.push({
              id: `phm_${p.id}`,
              category: "PHARMACY",
              title: p.name || "Pharmacy",
              subtitle: p.address || p.territoryName || "Retail Chemist",
              href: `/pharmacies?search=${encodeURIComponent(p.name || q)}`,
            });
          });

        (Array.isArray(products) ? products : [])
          .filter(
            (p: any) =>
              (p.brandName || p.name || "").toLowerCase().includes(lower) ||
              (p.genericName || "").toLowerCase().includes(lower) ||
              (p.sku || "").toLowerCase().includes(lower)
          )
          .slice(0, 4)
          .forEach((p: any) => {
            next.push({
              id: `prod_${p.id}`,
              category: "PRODUCT",
              title: p.brandName || p.name || "Product",
              subtitle: [p.sku, p.genericName].filter(Boolean).join(" • "),
              href: `/products?search=${encodeURIComponent(p.brandName || p.name || q)}`,
            });
          });

        (Array.isArray(mrs) ? mrs : [])
          .filter(
            (m: any) =>
              (m.name || "").toLowerCase().includes(lower) ||
              (m.employeeCode || "").toLowerCase().includes(lower) ||
              (m.email || "").toLowerCase().includes(lower) ||
              (m.territoryName || "").toLowerCase().includes(lower)
          )
          .slice(0, 4)
          .forEach((m: any) => {
            next.push({
              id: `mr_${m.id}`,
              category: "MR",
              title: m.name || m.employeeCode || "Medical Representative",
              subtitle: [m.territoryName, m.employeeCode].filter(Boolean).join(" • "),
              href: `/field-force/${m.id}`,
            });
          });

        (Array.isArray(orders) ? orders : [])
          .slice(0, 4)
          .forEach((o: any) => {
            next.push({
              id: `ord_${o.id}`,
              category: "ORDER",
              title: `${o.orderNumber || "Order"} — ${o.pharmacyName || "Pharmacy"}`,
              subtitle: `${formatCurrency(o.totalAmount || 0)} • ${o.status || ""}`,
              href: `/orders?search=${encodeURIComponent(o.orderNumber || q)}`,
            });
          });

        (Array.isArray(collections) ? collections : [])
          .slice(0, 4)
          .forEach((c: any) => {
            next.push({
              id: `col_${c.id}`,
              category: "COLLECTION",
              title: `${c.receiptNumber || "Receipt"} — ${c.pharmacyName || "Pharmacy"}`,
              subtitle: `${formatCurrency(c.amount || 0)} • ${c.paymentMode || ""}`,
              href: `/collections?search=${encodeURIComponent(c.receiptNumber || q)}`,
            });
          });

        (Array.isArray(territories) ? territories : [])
          .filter(
            (t: any) =>
              (t.name || "").toLowerCase().includes(lower) ||
              (t.code || "").toLowerCase().includes(lower) ||
              (t.region || "").toLowerCase().includes(lower)
          )
          .slice(0, 3)
          .forEach((t: any) => {
            next.push({
              id: `ter_${t.id}`,
              category: "TERRITORY",
              title: `${t.name} (${t.code})`,
              subtitle: [t.region, t.zone].filter(Boolean).join(" • "),
              href: `/territories?territory=${encodeURIComponent(t.id)}`,
            });
          });

        setApiResults(next);
      } catch {
        if (!cancelled) setApiResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, role]);

  const combinedResults = useMemo(() => {
    return [...apiResults, ...pageResults];
  }, [apiResults, pageResults]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [combinedResults.length, query]);

  const handleSelect = (item: GlobalSearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        combinedResults.length > 0 ? (prev + 1) % combinedResults.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        combinedResults.length > 0
          ? (prev - 1 + combinedResults.length) % combinedResults.length
          : 0
      );
    } else if (e.key === "Enter" && combinedResults[highlightedIndex]) {
      e.preventDefault();
      handleSelect(combinedResults[highlightedIndex]);
    }
  };

  const getCategoryMeta = (cat: GlobalSearchResult["category"]) => {
    switch (cat) {
      case "DOCTOR":
        return { label: "Doctor", icon: Stethoscope, badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" };
      case "PHARMACY":
        return { label: "Chemist", icon: Building2, badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" };
      case "PRODUCT":
        return { label: "Product", icon: Package, badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" };
      case "MR":
        return { label: "MR Team", icon: Users, badge: "bg-orange-50 text-[#FF6B00] dark:bg-orange-950/50 dark:text-orange-300" };
      case "ORDER":
        return { label: "Order", icon: ShoppingCart, badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" };
      case "COLLECTION":
        return { label: "Receipt", icon: Receipt, badge: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300" };
      case "TERRITORY":
        return { label: "Territory", icon: MapPin, badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" };
      default:
        return { label: "Page", icon: Compass, badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        aria-label="Search portal records"
        placeholder="Search records, doctors, orders..."
        className="h-8.5 w-full rounded-lg border border-[#E5E1D9] bg-[#F5F3EE]/60 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#FF6B00] focus:bg-white focus:outline-none dark:border-[#333333] dark:bg-[#242424] dark:text-slate-100 dark:focus:bg-[#2C2C2C] shadow-2xs"
      />

      {isSearching ? (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[#FF6B00]" />
      ) : query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setApiResults([]);
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#E5E1D9] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#1E1E1E] overflow-hidden max-h-[420px] flex flex-col">
          <div className="px-3.5 py-2 border-b border-[#E5E1D9]/70 dark:border-[#333333] flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>
              {query.trim().length >= 2
                ? `Search Results (${combinedResults.length})`
                : "Quick Jump — Type 2+ chars to search records"}
            </span>
            <span className="hidden sm:inline font-mono">ESC</span>
          </div>

          <div className="overflow-y-auto divide-y divide-[#E5E1D9]/40 dark:divide-[#333333]/50">
            {combinedResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {isSearching
                  ? "Searching doctors, chemists, products, MRs & orders..."
                  : `No matching records found for "${query.trim()}".`}
              </div>
            ) : (
              combinedResults.map((item, idx) => {
                const meta = getCategoryMeta(item.category);
                const Icon = meta.icon;
                const isActive = idx === highlightedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer",
                      isActive
                        ? "bg-orange-50/80 dark:bg-[#FF6B00]/15"
                        : "hover:bg-slate-50 dark:hover:bg-[#2A2A2A]"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg shrink-0", meta.badge)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0",
                        meta.badge
                      )}
                    >
                      {meta.label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
