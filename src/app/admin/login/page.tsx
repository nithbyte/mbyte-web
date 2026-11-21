"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useLogin, useSelectCompany } from "@/hooks";
import { normalizeRole } from "@/types";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const selectCompanyMutation = useSelectCompany();

  // Mode: 'SUPER_ADMIN' (Platform Level) or 'COMPANY_ADMIN' (Tenant Level)
  const [adminType, setAdminType] = useState<"SUPER_ADMIN" | "COMPANY_ADMIN">("SUPER_ADMIN");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-Company Selection State
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your administrator email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your administrator password.");
      return;
    }

    if (adminType === "COMPANY_ADMIN" && !companySlug.trim()) {
      setErrorMsg("Please enter the company code or tenant identifier for Company Administrator access.");
      return;
    }

    const effectiveSlug =
      adminType === "SUPER_ADMIN"
        ? undefined
        : companySlug.trim().toLowerCase() || undefined;

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        tenantSlug: effectiveSlug,
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
        } else if (canonicalRole === "ADMIN" || canonicalRole === "TERRITORY_MANAGER") {
          targetPath = "/field-force";
        } else if (canonicalRole === "MR") {
          targetPath = "/visits";
        }

        router.push(targetPath);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "Administrator authentication failed. Please verify your credentials and permissions."
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
      } else if (canonicalRole === "ADMIN" || canonicalRole === "TERRITORY_MANAGER") {
        targetPath = "/field-force";
      } else if (canonicalRole === "MR") {
        targetPath = "/visits";
      }

      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to establish tenant administrator session.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar with Discreet Theme Toggle */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 shadow-xs">
            <Shield className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span>Platform Governance</span>
          </span>
        </div>
        <ThemeToggle className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs backdrop-blur-xs" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <MByteLogo variant="full" width={220} height={60} priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Administrator Access
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Privileged portal for platform operations & company administrators
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-950 p-1 mb-6 border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAdminType("SUPER_ADMIN");
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  adminType === "SUPER_ADMIN"
                    ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminType("COMPANY_ADMIN");
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  adminType === "COMPANY_ADMIN"
                    ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>Company Admin</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Multi-Company Selection */}
            {multiCompanyData ? (
              <div className="space-y-4">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select Administration Target
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your credentials have administrative access across multiple organizations:
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
                  ← Back to login
                </button>
              </div>
            ) : (
              /* Credentials Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Identifier for Company Admin */}
                {adminType === "COMPANY_ADMIN" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label
                      htmlFor="admin-company"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Company Code or Subdomain Identifier
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="admin-company"
                        type="text"
                        required
                        value={companySlug}
                        onChange={(e) => setCompanySlug(e.target.value)}
                        placeholder="e.g. acme or acme-pharma"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@mediqbyte.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <span className="text-xs text-slate-400">Privileged Session</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="admin-password"
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

                {/* Remember Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#FF6B00] focus:ring-[#FF6B00]/20 cursor-pointer accent-[#FF6B00]"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Remember administrator session
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#E85E00] active:scale-[0.99] px-4 py-3 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loginMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {adminType === "SUPER_ADMIN"
                          ? "Sign in to Platform Governance"
                          : "Sign in to Company Administration"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Subtle, Professional Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 z-10">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Privileged Administrative Console · Mediqbyte Platform</span>
        </div>
      </footer>
    </div>
  );
}
