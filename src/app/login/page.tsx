"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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
import { getTenantSubdomain, buildTenantSubdomainUrl, getRootDomain } from "@/lib/subdomain";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const selectCompanyMutation = useSelectCompany();

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

  // Redirect to canonical root domain if accessed directly on a tenant subdomain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const subdomain = getTenantSubdomain();
      if (subdomain) {
        const rootDomain = getRootDomain();
        const rootHost = rootDomain.split(":")[0];
        const isLocal = rootHost.includes("localhost") || rootHost.startsWith("127.");
        const protocol = isLocal ? "http:" : "https:";
        window.location.href = `${protocol}//${rootDomain}/login?tenant=${encodeURIComponent(subdomain)}`;
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

        const orgSlug = result.user?.organization?.slug;
        const currentSubdomain = getTenantSubdomain();

        // Redirect tenant users to their dedicated tenant subdomain portal if applicable
        if (orgSlug && canonicalRole !== "SUPER_ADMIN" && currentSubdomain !== orgSlug) {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem("mbyte_tenant_slug", orgSlug);
            } catch {}
          }
          const destinationUrl = buildTenantSubdomainUrl(orgSlug, targetPath);
          window.location.href = destinationUrl;
          return;
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

      const orgSlug = user.organization?.slug;
      const currentSubdomain = getTenantSubdomain();

      if (orgSlug && canonicalRole !== "SUPER_ADMIN" && currentSubdomain !== orgSlug) {
        const destinationUrl = buildTenantSubdomainUrl(orgSlug, targetPath);
        window.location.href = destinationUrl;
        return;
      }

      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to establish tenant session.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* Ambient Animated Liquid Mesh Glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-70 dark:opacity-40">
        <div className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-400/30 via-amber-300/20 to-transparent blur-[100px] animate-liquid-pulse" />
        <div className="absolute top-[40%] -right-[15%] h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-sky-400/25 via-indigo-300/20 to-transparent blur-[110px] animate-liquid-float" />
        <div className="absolute -bottom-[15%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-rose-400/20 via-orange-300/20 to-transparent blur-[100px] animate-liquid-pulse" />
      </div>

      {/* Top Bar */}
      <header className="relative w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img
            src="/brand/kovelbyte-logo.png"
            alt="Kövelbyte"
            className="h-8 sm:h-9 w-auto dark:hidden object-contain"
          />
          <img
            src="/brand/kovelbyte-logo-dark.png"
            alt="Kövelbyte"
            className="h-8 sm:h-9 w-auto hidden dark:block object-contain"
          />
        </div>
        <ThemeToggle className="border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 shadow-sm backdrop-blur-xl" />
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5 filter drop-shadow-[0_8px_20px_rgba(255,107,0,0.15)]">
              <MByteLogo variant="full" width={220} height={60} priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to FieldOps
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Enter your corporate email and password to access your portal
            </p>
          </div>

          {/* Liquid Glass Form Card */}
          <div className="rounded-3xl border border-white/70 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all">
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
              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                {/* 1. Email Field */}
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
                      autoComplete="off"
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
                        alert("Please contact your company administrator or IT helpdesk to reset your password.");
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
                      autoComplete="new-password"
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
            <span>Enterprise Pharmaceutical Field Intelligence</span>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
            <span>Powered by</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Nithbyte</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
