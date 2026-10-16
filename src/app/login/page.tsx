"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Stethoscope,
  Briefcase,
} from "lucide-react";
import { useLogin } from "@/hooks";
import { normalizeRole, type CanonicalRole } from "@/types";

interface DemoPersona {
  role: CanonicalRole;
  title: string;
  desc: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  defaultDestination: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: "SUPER_ADMIN",
    title: "Super Admin",
    desc: "Platform & Multi-Company Oversight",
    email: "superadmin@mbyte.app",
    icon: Shield,
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-300",
    defaultDestination: "/companies",
  },
  {
    role: "ADMIN",
    title: "Company Admin",
    desc: "Novis Pharma Full Enterprise Ops",
    email: "admin@novispharma.com",
    icon: Building,
    badgeColor: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800 dark:text-sky-300",
    defaultDestination: "/",
  },
  {
    role: "TERRITORY_MANAGER",
    title: "Territory Manager",
    desc: "Chennai Central Field Operations",
    email: "manager.chennai@novispharma.com",
    icon: MapPin,
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-300",
    defaultDestination: "/",
  },
  {
    role: "MR",
    title: "Medical Rep",
    desc: "Field Rep Visits & Visual Aids",
    email: "mr.chennai1@novispharma.com",
    icon: Stethoscope,
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-300",
    defaultDestination: "/visits",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("admin@novispharma.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<CanonicalRole>("ADMIN");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPersona = (persona: DemoPersona) => {
    setEmail(persona.email);
    setPassword("Password123!");
    setSelectedRole(persona.role);
    setErrorMsg(null);
  };

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
        {/* Left Side: Brand & Role Presets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MByte FieldOps Platform v2.4</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pharma Field-Force Access & Management
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise role-based control platform for medical representatives, territory managers, and executive administrators.
            </p>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Role Selection (Demo)
              </span>
              <span className="text-[11px] text-slate-500">Click to autofill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {DEMO_PERSONAS.map((persona) => {
                const Icon = persona.icon;
                const isSelected = email.toLowerCase() === persona.email.toLowerCase();

                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handleSelectPersona(persona)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/15 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/30"
                        : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${persona.badgeColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {persona.title}
                        </span>
                        {isSelected && (
                          <span className="flex h-2 w-2 rounded-full bg-sky-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {persona.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
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
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white shadow-md shadow-sky-500/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Sign In to MByte</h2>
                    <p className="text-xs text-slate-400">
                      Enter your corporate credentials to continue
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  Secure SSO
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
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@novispharma.com"
                    autoComplete="email"
                    required
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span className="text-xs text-slate-400">Remember session for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Authenticating & Verifying Role...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to FieldOps Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Protected by Enterprise TLS 1.3</span>
              <span>Novis Pharma Tenant Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
