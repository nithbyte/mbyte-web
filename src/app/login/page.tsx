"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Building,
  MapPin,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  Smartphone,
  BarChart3,
  ExternalLink,
  Clock,
  Coins,
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

  // Subdomain detection
  const [mounted, setMounted] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [manualTenantSlug, setManualTenantSlug] = useState("");
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(false);

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

    if (!email.trim()) {
      setErrorMsg("Please enter your corporate email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your account password.");
      return;
    }

    const effectiveSlug = isSuperAdminLogin
      ? undefined
      : (tenantSlug || manualTenantSlug).trim().toLowerCase() || undefined;

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
          "Authentication failed. Please verify your email and password."
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

  // If a tenant subdomain is requested but does not exist in backend
  if (tenantSlug && isOrgError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden px-4 py-8">
        <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#242424]/95 p-8 backdrop-blur-xl shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Building className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Company Workspace Not Found</h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              The tenant organization subdomain <code className="font-mono text-rose-400 font-semibold">{tenantSlug}</code> does not exist or has been deactivated.
            </p>
          </div>
          <div className="pt-2">
            <a
              href={`http://${rootDomain}/login`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <span>Return to MByte Main Platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800" />
      </div>

      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] h-[400px] w-[400px] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Enterprise Platform or Tenant Overview */}
        <div className="lg:col-span-5 space-y-6">
          {tenantSlug && tenantOrg ? (
            /* Tenant Subdomain Branded View */
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-400">
                <Building className="h-3.5 w-3.5" />
                <span>Dedicated Enterprise Subdomain Portal</span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-base shadow-lg shadow-sky-500/20">
                  {tenantOrg.code ? tenantOrg.code.slice(0, 3) : "ORG"}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white capitalize">
                    {tenantOrg.name}
                  </h1>
                  <span className="font-mono text-xs text-sky-400 font-semibold tracking-wide">
                    {tenantOrg.code} • Subdomain: {tenantOrg.slug}.{rootDomain}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Welcome to the official {tenantOrg.name} sales force automation workspace. All operations, visits, orders, and telemetry in this portal are isolated to your organization.
              </p>

              {/* Tenant Configuration Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Geofenced GPS Check-In</h2>
                    <p className="text-[11px] text-slate-400">Enforced radius: {tenantOrg.geofenceRadius || 200} meters for doctor and chemist visits.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Company Timezone & Ledger</h2>
                    <p className="text-[11px] text-slate-400">{tenantOrg.timezone || "Asia/Kolkata"} • Currency: {tenantOrg.currency || "INR"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Strict Tenant Boundary</h2>
                    <p className="text-[11px] text-slate-400">Authentication restricted to authorized {tenantOrg.name} personnel.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Root Domain Platform Overview */
            <div className="space-y-4">
              <div className="inline-block py-1">
                <MByteLogo variant="full" theme="dark" width={260} height={60} priority />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Pharma Field-Force Access & Management
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enterprise role-based management platform for pharmaceutical field forces, territory managers, and executive administrators.
              </p>

              {/* Enterprise Capabilities Showcase */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Enterprise Security & Architecture
                </span>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-white">Multi-Tenant Subdomain Routing</h2>
                      <p className="text-[11px] text-slate-400">Each organization operates on its own dedicated subdomain.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-white">200m PostGIS GPS Geo-Fencing</h2>
                      <p className="text-[11px] text-slate-400">Verified doctor and chemist field visits with tamper detection.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-white">Offline-First Mobile Sync</h2>
                      <p className="text-[11px] text-slate-400">Field orders and e-Detailing visual aids with automatic conflict resolution.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance features badge list */}
              <div className="hidden sm:flex items-center gap-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Multi-Tenant Isolated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>200m PostGIS GPS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>RBAC Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border border-slate-800 bg-[#242424]/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-orange-500/20">
                    <MByteLogo variant="icon" width={44} height={44} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {tenantSlug && tenantOrg ? `Sign In to ${tenantOrg.name}` : "Sign In to MByte"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {tenantSlug && tenantOrg
                        ? `Authorized ${tenantOrg.name} personnel credentials required`
                        : "Enter your corporate credentials to continue"}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  {tenantSlug ? "Tenant SSO" : "Platform SSO"}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {multiCompanyData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Select Pharmaceutical Company</h3>
                    <p className="text-xs text-slate-400">Your account is authorized across multiple companies</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {multiCompanyData.availableCompanies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectCompany(comp.id)}
                      disabled={selectCompanyMutation.isPending}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800/90 hover:border-orange-500/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-orange-400 border border-slate-700 font-bold text-xs uppercase">
                          {comp.code?.slice(0, 3) || "ORG"}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                            {comp.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {comp.code} • {comp.slug}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                        {comp.role || "Member"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMultiCompanyData(null)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Sign in with a different account
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!tenantSlug && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-company-slug"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      Company Identifier / Subdomain
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSuperAdminLogin}
                        onChange={(e) => setIsSuperAdminLogin(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500 h-3 w-3"
                      />
                      <span className="text-[11px] text-orange-400 font-medium">Platform Super Admin</span>
                    </label>
                  </div>
                  {!isSuperAdminLogin && (
                    <>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          id="login-company-slug"
                          type="text"
                          autoCapitalize="none"
                          value={manualTenantSlug}
                          onChange={(e) => setManualTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                          placeholder="e.g. novis-pharma, cipla, or company code"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Enter your company code or slug, or leave blank to select from authorized companies.
                      </p>
                    </>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  {tenantSlug && tenantOrg ? `${tenantOrg.name} Corporate Email` : "Corporate Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tenantSlug && tenantOrg ? `username@${tenantOrg.slug}.com` : "name@company.com"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Account Password
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        tenantSlug && tenantOrg
                          ? `Please contact your ${tenantOrg.name} Company Administrator to reset your credentials.`
                          : "Please contact your Company Administrator or IT support to reset your credentials."
                      );
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 focus:outline-none"
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-[#FF6B00] focus:ring-[#FF6B00]/20"
                  />
                  <span className="text-xs text-slate-400">Remember session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F45100] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:from-[#F45100] hover:to-[#C23B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating Identity...</span>
                  </>
                ) : (
                  <>
                    <span>{tenantSlug && tenantOrg ? `Sign In to ${tenantOrg.name}` : "Sign In to FieldOps Portal"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <p className="text-[11px] text-slate-400">
                Unauthorized access to MByte FieldOps is strictly prohibited. Activity is logged under pharmaceutical audit compliance policies.
              </p>
              <Link
                href="/admin/login"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Portal Login →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
