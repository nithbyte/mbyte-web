"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useLogin } from "@/hooks";
import { normalizeRole } from "@/types";
import { MByteLogo } from "@/components/ui/mbyte-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AdminLoginPage() {
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
      setErrorMsg("Please enter your Super Administrator email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your Super Administrator password.");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (result.user) {
        const canonicalRole = normalizeRole(result.user.role);
        if (canonicalRole !== "SUPER_ADMIN") {
          setErrorMsg(
            "Access Denied: This portal is exclusively restricted to Platform Super Administrators. Company Administrators and field staff must sign in through the standard portal."
          );
          return;
        }

        router.push("/companies");
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "Super Administrator authentication failed. Please verify your credentials."
      );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar with Discreet Theme Toggle */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50 shadow-xs">
            <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Platform Super Admin</span>
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
              Super Admin Access
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Privileged console for multi-tenant governance & platform operations
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

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Super Admin Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Super Admin Email
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
                    placeholder="superadmin@mediqbyte.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FF6B00] focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
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
                    <span>Verifying Authority...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Platform Governance</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Subtle, Professional Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 z-10">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>Privileged Administrative Console · Mediqbyte Platform</span>
        </div>
      </footer>
    </div>
  );
}
