"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Search,
  Check,
  X,
} from "lucide-react";
import { useLogin, useSelectCompany, usePublicOrganizations } from "@/hooks";
import { normalizeRole } from "@/types";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getTenantSubdomain } from "@/lib/subdomain";
import { cn } from "@/lib/utils";

interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  code: string;
  logoUrl?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const selectCompanyMutation = useSelectCompany();

  // Fetch active tenant companies for the selection dropdown
  const { data: publicOrganizations, isLoading: isOrgsLoading } = usePublicOrganizations();

  // Selected Tenant Organization
  const [selectedOrg, setSelectedOrg] = useState<PublicOrganization | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-Company Selection State (if user account has access to multiple tenants)
  const [multiCompanyData, setMultiCompanyData] = useState<{
    selectionToken: string;
    availableCompanies: Array<{
      id: string;
      name: string;
      slug: string;
      code: string;
      logoUrl?: string;
      role?: string;
    }>;
  } | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-detect or pre-select organization from URL query param, subdomain, or default if only 1 exists
  useEffect(() => {
    // If accessed via a tenant subdomain on production, immediately redirect to https://mediqbyte.com
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.startsWith("127.") &&
      window.location.hostname !== "mediqbyte.com" &&
      window.location.hostname !== "www.mediqbyte.com" &&
      window.location.hostname.endsWith("mediqbyte.com")
    ) {
      const sub = getTenantSubdomain();
      const target = new URL(window.location.pathname, "https://mediqbyte.com");
      if (sub) target.searchParams.set("tenant", sub);
      window.location.href = target.toString();
      return;
    }

    if (!publicOrganizations || publicOrganizations.length === 0) return;
    if (selectedOrg) return;

    // Check query param e.g. /login?tenant=kovelbyte or /login?org=kovelbyte
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetParam = (params.get("tenant") || params.get("org") || params.get("company") || "").trim().toLowerCase();
      if (targetParam) {
        const match = publicOrganizations.find(
          (o) =>
            o.slug.toLowerCase() === targetParam ||
            o.code.toLowerCase() === targetParam ||
            o.id === targetParam
        );
        if (match) {
          setSelectedOrg(match);
          return;
        }
      }
    }

    // Check subdomain if on a tenant subdomain
    const sub = getTenantSubdomain();
    if (sub) {
      const match = publicOrganizations.find(
        (o) => o.slug.toLowerCase() === sub.toLowerCase() || o.code.toLowerCase() === sub.toLowerCase()
      );
      if (match) {
        setSelectedOrg(match);
        return;
      }
    }

    // If only 1 tenant organization exists in the system, pre-select it for convenience
    if (publicOrganizations.length === 1) {
      setSelectedOrg(publicOrganizations[0]);
    }
  }, [publicOrganizations, selectedOrg]);

  const filteredOrgs = (publicOrganizations || []).filter((org) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      org.name.toLowerCase().includes(q) ||
      org.code.toLowerCase().includes(q) ||
      org.slug.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isPlatformAdmin = email.trim().toLowerCase().includes("superadmin");

    if (!selectedOrg && !isPlatformAdmin) {
      setErrorMsg("Please choose your Tenant Company from the dropdown to continue.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter your work email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        tenantSlug: selectedOrg?.slug,
        companyCode: selectedOrg?.code,
        organizationId: selectedOrg?.id,
      });

      if (result.requiresCompanySelection && result.selectionToken && result.availableCompanies) {
        setMultiCompanyData({
          selectionToken: result.selectionToken,
          availableCompanies: result.availableCompanies,
        });
        return;
      }

      if (result.user) {
        const canonicalRole = normalizeRole(result.user.role);
        let targetPath = "/";
        if (canonicalRole === "SUPER_ADMIN") {
          targetPath = "/companies";
        } else if (canonicalRole === "MR") {
          targetPath = "/visits";
        } else if (canonicalRole === "ADMIN" || canonicalRole === "TERRITORY_MANAGER") {
          targetPath = "/field-force";
        }

        // Navigate directly on mediqbyte.com without subdomain redirects
        router.push(targetPath);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "Authentication failed. Please verify your credentials."
      );
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    if (!multiCompanyData) return;
    setErrorMsg(null);

    try {
      const { user } = await selectCompanyMutation.mutateAsync({
        organizationId: companyId,
        selectionToken: multiCompanyData.selectionToken,
      });

      const canonicalRole = normalizeRole(user.role);
      let targetPath = "/";
      if (canonicalRole === "SUPER_ADMIN") {
        targetPath = "/companies";
      } else if (canonicalRole === "MR") {
        targetPath = "/visits";
      } else if (canonicalRole === "ADMIN" || canonicalRole === "TERRITORY_MANAGER") {
        targetPath = "/field-force";
      }

      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to establish tenant session.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {selectedOrg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40 shadow-xs">
              <Building className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span>{selectedOrg.name}</span>
            </span>
          )}
        </div>
        <ThemeToggle className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs backdrop-blur-xs" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <MByteLogo variant="full" width={220} height={60} priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {selectedOrg ? `Sign in to ${selectedOrg.name}` : "Sign in to your account"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {selectedOrg
                ? `Enter your corporate credentials to access the ${selectedOrg.name} portal`
                : "Welcome back! Choose your company and enter your credentials"}
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Multi-Company Selection Mode (if user has access to multiple tenants) */}
            {multiCompanyData ? (
              <div className="space-y-4">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select Your Organization
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your account has access to multiple pharmaceutical workspaces:
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {multiCompanyData.availableCompanies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectCompany(comp.id)}
                      disabled={selectCompanyMutation.isPending}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-orange-50/50 dark:hover:bg-slate-800/70 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-orange-600 font-bold text-xs uppercase shadow-xs">
                          {comp.code?.slice(0, 3) || "ORG"}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {comp.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {comp.code} {comp.slug ? `· ${comp.slug}` : ""}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMultiCompanyData(null)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 pt-2 transition-colors cursor-pointer"
                >
                  &larr; Back to login
                </button>
              </div>
            ) : (
              /* Standard Credentials Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. First Field: Select Tenant Company (Searchable Dropdown) */}
                <div className="space-y-1.5" ref={dropdownRef}>
                  <label
                    htmlFor="tenant-select-button"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Tenant Organization / Company *
                  </label>

                  <div className="relative">
                    <button
                      id="tenant-select-button"
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-left transition-all cursor-pointer",
                        isDropdownOpen
                          ? "border-[#FF6B00] ring-4 ring-orange-500/10"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                        {selectedOrg ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {selectedOrg.name}
                            </span>
                            <span className="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                              {selectedOrg.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            {isOrgsLoading ? "Loading companies..." : "Select or search company workspace..."}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {selectedOrg && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrg(null);
                              setSearchQuery("");
                              setIsDropdownOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Clear selection"
                          >
                            <X className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate-400 transition-transform duration-200",
                            isDropdownOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </button>

                    {/* Dropdown Menu with Search */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-300/40 dark:shadow-none overflow-hidden animate-fadeIn">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search company name or code..."
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 pl-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00]"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Company List */}
                        <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                          {filteredOrgs.length > 0 ? (
                            filteredOrgs.map((org) => {
                              const isSelected = selectedOrg?.id === org.id;
                              return (
                                <button
                                  key={org.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setIsDropdownOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors cursor-pointer text-left",
                                    isSelected
                                      ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800/60"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase">
                                      {org.code.slice(0, 3)}
                                    </div>
                                    <div className="truncate">
                                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                                        {org.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        Code: {org.code}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400 ml-2" />
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No company found matching &quot;{searchQuery}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* 3. Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(
                          selectedOrg
                            ? `Please contact your ${selectedOrg.name} administrator to reset your credentials.`
                            : "Please contact your company administrator or IT helpdesk to reset your password."
                        );
                      }}
                      className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 pr-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Remember Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#FF6B00] focus:ring-[#FF6B00]/20 cursor-pointer accent-[#FF6B00]"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Remember this device
                    </span>
                  </label>
                </div>

                {/* 5. Submit Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#E85E00] active:scale-[0.99] px-4 py-3 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loginMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to FieldOps</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <a
                    href="/admin/login"
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Platform Governance Administrator? <span className="underline font-medium text-slate-500 dark:text-slate-400">Sign in here</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Subtle, Professional Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 z-10">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Enterprise Pharmaceutical Field Intelligence · Mediqbyte</span>
        </div>
      </footer>
    </div>
  );
}
