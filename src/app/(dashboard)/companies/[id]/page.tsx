"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Sliders,
  Shield,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Power,
  ShieldCheck,
  Stethoscope,
  Building,
  ShoppingCart,
  Receipt,
  FileCheck,
  Calendar,
  Package,
  Gift,
  DollarSign,
  Clock,
  Sparkles,
  UserPlus,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  useOrganization,
  useUpdateOrganization,
  useTenantFeatures,
  useUpdateTenantFeatures,
  useTenantUsers,
  useUserFeatures,
  useUpdateUserFeatures,
  useResetPassword,
  useUpdateUserStatus,
  useCreateUser,
} from "@/hooks";
import {
  APP_FEATURES_METADATA,
  DEFAULT_APP_FEATURES,
  type AppFeatures,
  type FeatureMeta,
} from "@/types";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { organizationService } from "@/services/organizationService";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  MapPin: <MapPin className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  FileCheck: <FileCheck className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Phone: <Phone className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
};

type ActiveTab = "USERS" | "FEATURES" | "SETTINGS";

export default function TenantDetailsPage() {
  const params = useParams();
  const orgId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("USERS");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Queries
  const { data: org, isLoading: isOrgLoading, refetch: refetchOrg } = useOrganization(orgId);
  const { data: tenantFeatures, isLoading: isFeaturesLoading, refetch: refetchFeatures } = useTenantFeatures(orgId);
  const { data: users = [], isLoading: isUsersLoading, refetch: refetchUsers } = useTenantUsers(orgId);

  // Mutations
  const updateOrgMutation = useUpdateOrganization();
  const updateFeaturesMutation = useUpdateTenantFeatures();
  const resetPasswordMutation = useResetPassword();
  const updateStatusMutation = useUpdateUserStatus();
  const updateUserFeaturesMutation = useUpdateUserFeatures();
  const createUserMutation = useCreateUser();

  // Local state for tenant features
  const [localFeatures, setLocalFeatures] = useState<AppFeatures>(DEFAULT_APP_FEATURES);
  const [featuresDirty, setFeaturesDirty] = useState(false);
  const [featuresSaveSuccess, setFeaturesSaveSuccess] = useState(false);

  // Sync loaded tenant features to local state
  React.useEffect(() => {
    if (tenantFeatures) {
      setLocalFeatures({ ...DEFAULT_APP_FEATURES, ...tenantFeatures });
      setFeaturesDirty(false);
    }
  }, [tenantFeatures]);

  // Company Profile Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    geofenceRadius: 200,
  });
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (org) {
      setSettingsForm({
        name: org.name || "",
        contactEmail: org.contactEmail || "",
        contactPhone: org.contactPhone || "",
        geofenceRadius: org.geofenceRadius || 200,
      });
    }
  }, [org]);

  // Password Reset Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // User Feature Override Modal State
  const [featureModalUser, setFeatureModalUser] = useState<any | null>(null);
  const [userFeatureOverrides, setUserFeatureOverrides] = useState<Partial<AppFeatures>>({});
  const [userFeaturesLoading, setUserFeaturesLoading] = useState(false);
  const [userFeaturesSuccess, setUserFeaturesSuccess] = useState<string | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password123!",
    phone: "",
    role: "MR",
    designation: "Medical Representative",
  });
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchSearch =
        !userSearch.trim() ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.employeeCode && u.employeeCode.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.phone && u.phone.includes(userSearch));

      const userRole = (u.role || (u.roles && u.roles[0]) || "MR").toUpperCase();
      const matchRole =
        roleFilter === "ALL" ||
        (roleFilter === "ADMIN" && (userRole === "COMPANY_ADMIN" || userRole === "ADMIN")) ||
        (roleFilter === "MANAGER" && (userRole === "MANAGER" || userRole === "TERRITORY_MANAGER")) ||
        (roleFilter === "MR" && userRole === "MR");

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.status === "ACTIVE") ||
        (statusFilter === "INACTIVE" && u.status !== "ACTIVE");

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  // Handlers for Features Tab
  const handleToggleFeature = (key: keyof AppFeatures) => {
    setLocalFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setFeaturesDirty(true);
    setFeaturesSaveSuccess(false);
  };

  const handleSaveTenantFeatures = async () => {
    if (!orgId) return;
    try {
      await updateFeaturesMutation.mutateAsync({
        orgId,
        features: localFeatures,
      });
      setFeaturesDirty(false);
      setFeaturesSaveSuccess(true);
      setTimeout(() => setFeaturesSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to save tenant feature configuration");
    }
  };

  // Handlers for Password Reset
  const handleOpenPasswordModal = (user: any) => {
    setPasswordModalUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsCopied(false);
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += "9!";
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setPasswordError(null);
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmPasswordReset = async () => {
    if (!passwordModalUser) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        userId: passwordModalUser.id,
        mrId: passwordModalUser.medicalRepresentative?.id,
        password: newPassword,
      });
      setPasswordSuccess(
        `Password updated successfully for ${passwordModalUser.firstName} ${passwordModalUser.lastName}. The user will be required to log in with this new password.`
      );
      setTimeout(() => {
        setPasswordModalUser(null);
        setPasswordSuccess(null);
      }, 1800);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password");
    }
  };

  // Handlers for User Feature Overrides
  const handleOpenUserFeatures = async (user: any) => {
    setFeatureModalUser(user);
    setUserFeaturesSuccess(null);
    setUserFeaturesLoading(true);
    try {
      const data = await organizationService.getUserFeatures(user.id, orgId || user.organizationId);
      setUserFeatureOverrides(data?.overrides || {});
    } catch {
      setUserFeatureOverrides({});
    } finally {
      setUserFeaturesLoading(false);
    }
  };

  const handleToggleUserFeature = (key: keyof AppFeatures) => {
    // Current effective value: user override (if defined) or tenant default
    const currentEffective =
      typeof userFeatureOverrides[key] === "boolean"
        ? userFeatureOverrides[key]
        : localFeatures[key];

    setUserFeatureOverrides((prev) => ({
      ...prev,
      [key]: !currentEffective,
    }));
  };

  const handleResetUserToDefaults = () => {
    setUserFeatureOverrides({});
  };

  const handleSaveUserFeatures = async () => {
    if (!featureModalUser) return;
    setUserFeaturesSuccess(null);
    try {
      await updateUserFeaturesMutation.mutateAsync({
        userId: featureModalUser.id,
        features: userFeatureOverrides,
        organizationId: orgId || featureModalUser.organizationId,
      });
      setUserFeaturesSuccess("User feature capabilities updated successfully.");
      refetchUsers();
      setTimeout(() => {
        setFeatureModalUser(null);
        setUserFeaturesSuccess(null);
      }, 1400);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to save user feature capabilities");
    }
  };

  // Handlers for User Status Toggle
  const handleToggleUserStatus = async (user: any) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmMsg = `Are you sure you want to ${
      nextStatus === "ACTIVE" ? "activate" : "deactivate"
    } ${user.firstName} ${user.lastName}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        status: nextStatus,
      });
      refetchUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to update user account status");
    }
  };

  // Handlers for Add User
  const handleOpenAddUser = () => {
    setAddUserForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "Password123!",
      phone: "",
      role: "MR",
      designation: "Medical Representative",
    });
    setAddUserError(null);
    setAddUserSuccess(null);
    setIsAddUserOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    setAddUserSuccess(null);

    if (!addUserForm.firstName.trim() || !addUserForm.lastName.trim() || !addUserForm.email.trim()) {
      setAddUserError("First Name, Last Name, and Corporate Email are required.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        ...addUserForm,
        organizationId: orgId,
      });
      setAddUserSuccess(`User ${addUserForm.firstName} ${addUserForm.lastName} provisioned successfully!`);
      refetchUsers();
      setTimeout(() => {
        setIsAddUserOpen(false);
        setAddUserSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddUserError(err?.message || "Failed to create user");
    }
  };

  // Handlers for Company Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await updateOrgMutation.mutateAsync({
        id: orgId,
        dto: {
          name: settingsForm.name,
          contactEmail: settingsForm.contactEmail,
          contactPhone: settingsForm.contactPhone || undefined,
          geofenceRadius: Number(settingsForm.geofenceRadius) || 200,
        },
      });
      setSettingsSaveSuccess(true);
      refetchOrg();
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to update company settings");
    }
  };

  if (isOrgLoading || !org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
        <span className="text-xs font-medium">Loading tenant organization and governance profile...</span>
      </div>
    );
  }

  const activeFeaturesCount = Object.values(localFeatures).filter(Boolean).length;
  const totalFeaturesCount = Object.keys(DEFAULT_APP_FEATURES).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tenant Companies</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-md">
              {org.code?.slice(0, 3) || "ORG"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {org.name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {org.code}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active Tenant
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <a
                  href={`/login?tenant=${org.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                >
                  <span>{org.slug}.mediqbyte.com</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span>•</span>
                <span>{org.contactEmail}</span>
                {org.contactPhone && (
                  <>
                    <span>•</span>
                    <span>{org.contactPhone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddUser}
            className="text-xs gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5 text-sky-600" />
            <span>Add User</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchOrg();
              refetchFeatures();
              refetchUsers();
            }}
            className="text-xs gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Company Workforce</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {users.length}
            </span>
            <span className="text-xs text-slate-400">total accounts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {users.filter((u: any) => u.status === "ACTIVE").length} active personnel
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">App Feature Modules</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {activeFeaturesCount}
            </span>
            <span className="text-xs text-slate-400">/ {totalFeaturesCount} enabled</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Active in Mobile App & Admin Portal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GPS Geofence Policy</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {org.geofenceRadius}m
            </span>
            <span className="text-xs text-slate-400">radius</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">PostGIS authoritative visit boundary</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tenant Isolation</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Strictly Partitioned
            </span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
            Zero cross-tenant data leakage
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
              activeTab === "USERS"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Company Users & Passwords ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("FEATURES")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
              activeTab === "FEATURES"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Tenant App & Mobile Features ({activeFeaturesCount}/{totalFeaturesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs transition-colors cursor-pointer ${
              activeTab === "SETTINGS"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Geofence Policy & Company Settings</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: USERS & PASSWORDS & INDIVIDUAL FEATURE OVERRIDES */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, employee code, or phone..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Company Admins</option>
                  <option value="MANAGER">Area Managers</option>
                  <option value="MR">Medical Reps</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddUser}
                className="text-xs gap-1.5 ml-auto bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">User & Details</th>
                    <th className="px-4 py-3.5">Role & Territory</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-4 py-3.5">Feature Controls</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Loading company personnel...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No users found in {org.name} matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => {
                      const roleName = (u.role || (u.roles && u.roles[0]) || "MR").toUpperCase();
                      const isCompanyAdmin = roleName === "COMPANY_ADMIN" || roleName === "ADMIN";
                      const isManager = roleName === "MANAGER" || roleName === "TERRITORY_MANAGER";

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                                {u.firstName?.charAt(0)}
                                {u.lastName?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {u.firstName} {u.lastName}
                                </div>
                                <div className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                                  {u.employeeCode || u.medicalRepresentative?.employeeCode || "—"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <Badge
                                className={
                                  isCompanyAdmin
                                    ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                                    : isManager
                                    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                    : "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300"
                                }
                              >
                                {isCompanyAdmin
                                  ? "Company Admin"
                                  : isManager
                                  ? "Area Manager"
                                  : "Medical Rep"}
                              </Badge>
                              <div className="text-[11px] text-slate-400">
                                {u.territoryName || u.medicalRepresentative?.territoryName || org.name}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-400"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  u.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {u.status === "ACTIVE" ? "Active" : "Deactivated"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleOpenUserFeatures(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 transition-colors text-[11px] font-medium cursor-pointer"
                              title="Configure custom feature overrides for this user"
                            >
                              <SlidersHorizontal className="h-3 w-3 text-orange-600" />
                              <span>Feature Access</span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Password Button */}
                              <button
                                onClick={() => handleOpenPasswordModal(u)}
                                title={`Change Password for ${u.firstName} ${u.lastName}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/60 cursor-pointer transition-colors"
                              >
                                <KeyRound className="h-3.5 w-3.5 text-orange-600" />
                                <span>Change Password</span>
                              </button>

                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                title={u.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
                                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                                  u.status === "ACTIVE"
                                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                }`}
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENANT APP & MOBILE FEATURES */}
      {activeTab === "FEATURES" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Tenant Company Feature Matrix</span>
                <span className="text-xs font-normal text-slate-400">
                  ({activeFeaturesCount} of {totalFeaturesCount} active)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Activate or deactivate operational modules for <strong>{org.name}</strong>. Enabled features immediately reflect across the mobile app for field medical representatives and the admin web portal for company supervisors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {featuresSaveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Changes Saved Successfully!</span>
                </div>
              )}
              <Button
                onClick={handleSaveTenantFeatures}
                disabled={!featuresDirty || updateFeaturesMutation.isPending}
                className="bg-[#FF6B00] hover:bg-[#E85E00] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {updateFeaturesMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Tenant Features</span>
                )}
              </Button>
            </div>
          </div>

          {/* Grouped Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {APP_FEATURES_METADATA.map((meta) => {
              const isEnabled = localFeatures[meta.key];
              return (
                <div
                  key={meta.key}
                  className={`rounded-2xl border p-4.5 transition-all flex items-start justify-between gap-4 ${
                    isEnabled
                      ? "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs"
                      : "border-slate-200/50 bg-slate-50/70 dark:border-slate-800/40 dark:bg-slate-950/40 opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isEnabled
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
                          : "bg-slate-200/60 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {FEATURE_ICONS[meta.icon] || <Sparkles className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {meta.title}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {meta.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {meta.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Check className="h-3 w-3 text-emerald-500" /> Mobile App & Admin Portal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(meta.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? "bg-[#FF6B00]" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GEOFENCE POLICY & COMPANY SETTINGS */}
      {activeTab === "SETTINGS" && (
        <div className="max-w-2xl space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5"
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Company Profile & Geofence Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update perimeter geofencing enforcement and primary contact coordinates.
              </p>
            </div>

            {settingsSaveSuccess && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Company governance settings saved successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settingsForm.contactEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settingsForm.contactPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Geofence Distance Slider */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>GPS Visit Geofence Boundary</span>
                  </label>
                  <span className="font-mono text-sm font-extrabold text-[#FF6B00]">
                    {settingsForm.geofenceRadius} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={settingsForm.geofenceRadius}
                  onChange={(e) => setSettingsForm({ ...settingsForm, geofenceRadius: Number(e.target.value) })}
                  className="w-full accent-[#FF6B00] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Strict (50m)</span>
                  <span>Recommended Standard (200m)</span>
                  <span>Relaxed (1000m)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  During doctor and chemist detailing, representatives must be within this radius of the mapped clinic coordinates to complete a GPS-verified call.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={updateOrgMutation.isPending}
                className="bg-[#FF6B00] hover:bg-[#E85E00] text-white text-xs font-semibold px-5 py-2 rounded-xl cursor-pointer"
              >
                {updateOrgMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: CHANGE PASSWORD */}
      <Modal
        isOpen={Boolean(passwordModalUser)}
        onClose={() => setPasswordModalUser(null)}
        title={`Change Password for ${passwordModalUser?.firstName || ""} ${passwordModalUser?.lastName || ""}`}
        description={`Set a new account password for this company user (${passwordModalUser?.email || ""}).`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">User:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {passwordModalUser?.firstName} {passwordModalUser?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Corporate Email:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {passwordModalUser?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Company:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{org.name}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Generate Strong Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-20 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copy password"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 text-xs text-slate-900 focus:border-[#FF6B00] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <p className="font-semibold">Security Notice:</p>
            <p className="text-[11px] leading-relaxed mt-0.5">
              Updating this user&apos;s password immediately invalidates any active mobile or web login sessions. The user must sign in using this new password.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPasswordModalUser(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPasswordReset}
              disabled={resetPasswordMutation.isPending}
              className="rounded-xl bg-[#FF6B00] hover:bg-[#E85E00] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: USER FEATURE OVERRIDES */}
      <Modal
        isOpen={Boolean(featureModalUser)}
        onClose={() => setFeatureModalUser(null)}
        title={`Feature Capabilities for ${featureModalUser?.firstName || ""} ${featureModalUser?.lastName || ""}`}
        description={`Customize individual permissions for this user. Overrides will take priority over company defaults.`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {userFeaturesSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{userFeaturesSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {featureModalUser?.firstName} {featureModalUser?.lastName}
              </span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                ({featureModalUser?.email})
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetUserToDefaults}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Company Defaults</span>
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
            {APP_FEATURES_METADATA.map((meta) => {
              const hasOverride = typeof userFeatureOverrides[meta.key] === "boolean";
              const isEnabled = hasOverride ? userFeatureOverrides[meta.key]! : localFeatures[meta.key];

              return (
                <div
                  key={meta.key}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isEnabled
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-slate-200/50 bg-slate-50/60 dark:border-slate-800/40 dark:bg-slate-950/40 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isEnabled
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
                          : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {FEATURE_ICONS[meta.icon] || <Sparkles className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {meta.title}
                        </span>
                        {hasOverride && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Custom Override
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleUserFeature(meta.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? "bg-[#FF6B00]" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFeatureModalUser(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUserFeatures}
              disabled={updateUserFeaturesMutation.isPending}
              className="rounded-xl bg-[#FF6B00] hover:bg-[#E85E00] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {updateUserFeaturesMutation.isPending ? "Saving..." : "Save Feature Overrides"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: ADD USER TO COMPANY */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={`Add User to ${org.name}`}
        description="Provision an Administrator, Area Manager, or Medical Representative for this company."
        maxWidth="md"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          {addUserError && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
              {addUserError}
            </div>
          )}

          {addUserSuccess && (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
              {addUserSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={addUserForm.firstName}
                onChange={(e) => setAddUserForm({ ...addUserForm, firstName: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={addUserForm.lastName}
                onChange={(e) => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corporate Email Address *
            </label>
            <input
              type="email"
              required
              value={addUserForm.email}
              onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
              placeholder={`user@${org.slug}.com`}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role *
              </label>
              <select
                value={addUserForm.role}
                onChange={(e) => {
                  const role = e.target.value;
                  const designation =
                    role === "COMPANY_ADMIN"
                      ? "Company Administrator"
                      : role === "MANAGER"
                      ? "Area Sales Manager"
                      : "Medical Representative";
                  setAddUserForm({ ...addUserForm, role, designation });
                }}
                className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="MR">Medical Representative</option>
                <option value="MANAGER">Area Sales Manager</option>
                <option value="COMPANY_ADMIN">Company Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={addUserForm.designation}
                onChange={(e) => setAddUserForm({ ...addUserForm, designation: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password
              </label>
              <input
                type="text"
                value={addUserForm.password}
                onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 font-mono focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={addUserForm.phone}
                onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                placeholder="+91..."
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
