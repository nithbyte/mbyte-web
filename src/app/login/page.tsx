"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building,
  MapPin,
  Stethoscope,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { useLogin } from "@/hooks";
import { normalizeRole } from "@/types";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    try {
      const { user } = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      const canonicalRole = normalizeRole(user.role);
      let targetPath = "/";
      if (canonicalRole === "SUPER_ADMIN") {
        targetPath = "/companies";
      } else if (canonicalRole === "MR") {
        targetPath = "/visits";
      }

      router.push(targetPath);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "Authentication failed. Please verify your email and password."
      );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800" />
      </div>

      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-sky-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Enterprise Platform Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <MByteLogo variant="full" theme="dark" width={320} height={133} priority />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pharma Field-Force Access & Management
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise role-based management platform for pharmaceutical field forces, territory managers, and executive administrators.
            </p>
          </div>

          {/* Enterprise Capabilities Showcase */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enterprise Security & Architecture
            </span>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Multi-Tenant Isolation</h2>
                  <p className="text-[11px] text-slate-400">Independent company business data, catalogs, and quotas.</p>
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

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Commercial Sales Telemetry</h2>
                  <p className="text-[11px] text-slate-400">Real-time secondary orders, stockist collections, and pacing alerts.</p>
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

        {/* Right Side: Login Card */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-blue-500/20">
                    <MByteLogo variant="icon" theme="dark" width={44} height={44} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Sign In to MByte</h2>
                    <p className="text-xs text-slate-400">
                      Enter your corporate credentials to continue
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  Secure Enterprise SSO
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Corporate Email
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
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
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
                      alert("Please contact your Company Administrator or IT support to reset your credentials.");
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
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
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500/20"
                  />
                  <span className="text-xs text-slate-400">Remember session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/25 hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to FieldOps Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Unauthorized access to MByte FieldOps is strictly prohibited. Activity is logged under pharmaceutical audit compliance policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
