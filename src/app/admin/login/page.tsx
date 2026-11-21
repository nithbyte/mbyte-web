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
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  KeyRound,
  ShieldCheck,
  Globe,
  Users,
  Layers,
  Sparkles,
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
      setErrorMsg("Please enter your corporate administrator email.");
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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800" />
      </div>

      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-amber-500/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Enterprise Administration Platform Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dedicated Enterprise Administrator Portal</span>
            </div>

            <div className="inline-block py-1">
              <MByteLogo variant="full" theme="dark" width={260} height={60} priority />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Platform & Company Governance Control
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Authorized portal for Super Administrators and pharmaceutical Company Administrators. Manage multi-tenant organizations, doctor directories, field personnel rosters, and territory hierarchies.
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Cryptographic Multi-Tenant Isolation</h2>
                  <p className="text-[11px] text-slate-400">Tenant-isolated schemas and automated tenant provisioning.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Cross-Tenant Oversight & Control</h2>
                  <p className="text-[11px] text-slate-400">Centralized control-plane routing for global company administrators.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Privileged RBAC Security</h2>
                  <p className="text-[11px] text-slate-400">Session isolation, token renewal, and mandatory audit log recording.</p>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Right Side: Admin Login Card */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border border-slate-800 bg-[#242424]/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 shadow-md shadow-orange-500/20 text-white font-black text-sm">
                    ADM
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Administrator Authentication
                    </h2>
                    <p className="text-xs text-slate-400">
                      Privileged access credentials required
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
                  <Shield className="h-3 w-3" />
                  <span>Admin Gate</span>
                </span>
              </div>

              {/* Role Scope Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdminType("SUPER_ADMIN");
                    setErrorMsg(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    adminType === "SUPER_ADMIN"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Platform Super Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminType("COMPANY_ADMIN");
                    setErrorMsg(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    adminType === "COMPANY_ADMIN"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Company Admin</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 px-1">
                {adminType === "SUPER_ADMIN" ? (
                  <span>Global platform control across all tenant pharmaceutical organizations.</span>
                ) : (
                  <span>Tenant organization administrator managing doctors, MR staff, orders, and field telemetry.</span>
                )}
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
                    <h3 className="text-base font-bold text-white">Select Tenant Company</h3>
                    <p className="text-xs text-slate-400">Choose the organization to administer</p>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {multiCompanyData.availableCompanies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectCompany(comp.id)}
                      disabled={selectCompanyMutation.isPending}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800/90 hover:border-orange-500/50 transition-all text-left group cursor-pointer"
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
                        {comp.role || "Admin"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMultiCompanyData(null)}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Sign in with another account
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {adminType === "COMPANY_ADMIN" && (
                  <div>
                    <label
                      htmlFor="admin-company-slug"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Tenant Company Identifier / Slug <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        id="admin-company-slug"
                        type="text"
                        autoCapitalize="none"
                        required={adminType === "COMPANY_ADMIN"}
                        value={companySlug}
                        onChange={(e) =>
                          setCompanySlug(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                          )
                        }
                        placeholder="e.g. kovel, novis-pharma, apex"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Enter the registered slug or code of your pharmaceutical company.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    {adminType === "SUPER_ADMIN" ? "Super Admin Corporate Email" : "Company Administrator Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        adminType === "SUPER_ADMIN"
                          ? "superadmin@mbyte.app"
                          : "admin@company.com"
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      Administrator Password
                    </label>
                    <a
                      href="#support"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("For security, administrator credentials can only be reset through platform security operations.");
                      }}
                      className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Privileged Support
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="admin-password"
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
                      className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
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
                    <span className="text-xs text-slate-400">Remember administrator session</span>
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
                      <span>Verifying Administrative Authority...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {adminType === "SUPER_ADMIN"
                          ? "Sign In to Platform Governance"
                          : "Sign In to Company Administration"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Privileged Session Active</span>
              </div>
              <span className="text-slate-500">MByte Private Governance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
