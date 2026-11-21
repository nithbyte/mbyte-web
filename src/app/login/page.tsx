"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLogin, useSelectCompany, usePublicOrganizationBySlug } from "@/hooks";
import { normalizeRole } from "@/types";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getTenantSubdomain, getRootDomain } from "@/lib/subdomain";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const selectCompanyMutation = useSelectCompany();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subdomain & Manual Tenant Slug
  const [mounted, setMounted] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [manualTenantSlug, setManualTenantSlug] = useState("");

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

  useEffect(() => {
    setMounted(true);
    const detected = getTenantSubdomain();
    if (detected) {
      setTenantSlug(detected);
    }
  }, []);

  const {
    data: tenantOrg,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = usePublicOrganizationBySlug(tenantSlug);

  const rootDomain = mounted ? getRootDomain() : "localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveSlug = (tenantSlug || manualTenantSlug).trim().toLowerCase() || undefined;

    if (!effectiveSlug && !email.trim().toLowerCase().includes("admin")) {
      setErrorMsg("Please enter your Company Code to continue (or sign in as Platform Super Administrator).");
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
        } else if (canonicalRole === "MR") {
          targetPath = "/visits";
        } else if (canonicalRole === "ADMIN" || canonicalRole === "TERRITORY_MANAGER") {
          targetPath = "/field-force";
        }

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

  // If a tenant subdomain is requested but does not exist
  if (tenantSlug && isOrgError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
            <Building className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Workspace Not Found</h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The organization subdomain <code className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{tenantSlug}</code> does not exist or has been suspended.
            </p>
          </div>
          <div className="pt-2">
            <a
              href={`http://${rootDomain}/login`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <span>Return to Main Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar with Discreet Theme Toggle */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {tenantSlug && tenantOrg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40 shadow-xs">
              <Building className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span>{tenantOrg.name}</span>
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
              {tenantSlug && tenantOrg
                ? `Sign in to ${tenantOrg.name}`
                : "Sign in to your account"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {tenantSlug && tenantOrg
                ? `Enter your corporate credentials to access the ${tenantOrg.name} portal`
                : "Welcome back! Enter your credentials to access FieldOps"}
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

            {/* Multi-Company Selection Mode */}
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
                  ← Back to login
                </button>
              </div>
            ) : (
              /* Standard Credentials Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Code (or Subdomain Indicator) */}
                {!tenantSlug ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="tenant-slug"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Company Code
                      </label>
                      <a
                        href="/admin/login"
                        className="text-[11px] text-[#FF6B00] hover:underline font-medium"
                      >
                        Super Admin Portal &rarr;
                      </a>
                    </div>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="tenant-slug"
                        type="text"
                        value={manualTenantSlug}
                        onChange={(e) => setManualTenantSlug(e.target.value)}
                        placeholder="e.g. KOV-01 (leave blank for Super Admin)"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-mono uppercase placeholder:normal-case placeholder:font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Workspace: <strong className="text-orange-600 dark:text-orange-400 font-semibold">{tenantOrg?.name || tenantSlug}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {tenantSlug}
                    </span>
                  </div>
                )}

                {/* Email Field */}
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

                {/* Password Field */}
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
                          tenantSlug && tenantOrg
                            ? `Please contact your ${tenantOrg.name} administrator to reset your credentials.`
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
                      Remember this device
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
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to FieldOps</span>
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
          <span>Enterprise Pharmaceutical Field Intelligence · Mediqbyte</span>
        </div>
      </footer>
    </div>
  );
}
