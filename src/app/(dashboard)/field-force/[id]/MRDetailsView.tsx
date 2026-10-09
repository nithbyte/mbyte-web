"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useMRDetails } from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarCheck,
  ShoppingCart,
  Receipt,
  Package,
  Target,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export function MRDetailsView({ id }: { id: string }) {
  const { data, isLoading } = useMRDetails(id);

  const [activeTab, setActiveTab] = useState<
    "VISITS" | "ORDERS" | "COLLECTIONS" | "TARGET" | "PRODUCTS"
  >("VISITS");

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { mr, visits, orders, collections, target, productActivity } = data;
  const isAhead = mr.performanceStatus === "AHEAD" || mr.performanceStatus === "ON_TRACK";

  return (
    <div className="space-y-6">
      {/* Back button & Page Header */}
      <div>
        <Link
          href="/field-force"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Representative Directory</span>
        </Link>

        <PageHeader
          title={`${mr.name} (${mr.employeeId})`}
          description={`${mr.designation} • ${mr.territoryName} Territory • Reporting to ${mr.managerName}`}
          badge={
            <Badge
              variant={
                mr.status === "IN_FIELD"
                  ? "success"
                  : mr.status === "COMPLETED"
                  ? "secondary"
                  : "default"
              }
              className="text-xs"
            >
              {mr.status.replace("_", " ")}
            </Badge>
          }
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => alert(`Calling ${mr.name}: ${mr.phone}`)}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Representative</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Col 1: Identity */}
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-sm font-bold text-white shadow-md">
                {mr.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {mr.name}
                </div>
                <div className="font-mono text-xs text-sky-600 dark:text-sky-400">
                  {mr.employeeId}
                </div>
                <div className="text-[11px] text-slate-500">{mr.designation}</div>
              </div>
            </div>

            {/* Col 2: Territory & Manager */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{mr.territoryName} ({mr.headquarters})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Manager: {mr.managerName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Joined: {formatDate(mr.joiningDate)}</span>
              </div>
            </div>

            {/* Col 3: Contact */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{mr.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{mr.email}</span>
              </div>
            </div>

            {/* Col 4: Today's Status */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Field Status
              </span>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {mr.currentActivity}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {mr.todayVisits.completed} of {mr.todayVisits.planned} calls completed today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target & Commercial KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Target Quota */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Sales Target
            </span>
            <Target className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(target.targetAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">October 2026 Quota</p>
          </div>
        </div>

        {/* Quota Achievement */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Achieved Amount
            </span>
            {isAhead ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            )}
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(target.achievedAmount)}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {target.achievementRate}% of monthly target
            </p>
          </div>
        </div>

        {/* Visits Target vs Achieved */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Call Quota (Month)
            </span>
            <CalendarCheck className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {target.visitAchieved} / {target.visitTarget}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Goal: {target.dailyCallGoal} doctor calls / day
            </p>
          </div>
        </div>

        {/* Collections Reconciled */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Collections Recorded
            </span>
            <Receipt className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(mr.collectionsValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {collections.length} Payment Receipts
            </p>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Sales Quota Achievement Progress
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {target.achievementRate}% ({formatCurrency(target.achievedAmount)} / {formatCurrency(target.targetAmount)})
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAhead ? "bg-gradient-to-r from-sky-500 to-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, target.achievementRate)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Day-8 Benchmark: 26%</span>
            <span>Shortfall: {formatCurrency(target.shortfall)}</span>
            <span>Monthly Target: 100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <Button
          variant={activeTab === "VISITS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("VISITS")}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Visits & Field Detailing ({visits.length})</span>
        </Button>

        <Button
          variant={activeTab === "ORDERS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("ORDERS")}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Commercial Orders ({orders.length})</span>
        </Button>

        <Button
          variant={activeTab === "COLLECTIONS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("COLLECTIONS")}
        >
          <Receipt className="h-4 w-4" />
          <span>Collections & Receipts ({collections.length})</span>
        </Button>

        <Button
          variant={activeTab === "TARGET" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("TARGET")}
        >
          <Target className="h-4 w-4" />
          <span>Target & Quota Breakdown</span>
        </Button>

        <Button
          variant={activeTab === "PRODUCTS" ? "primary" : "ghost"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("PRODUCTS")}
        >
          <Package className="h-4 w-4" />
          <span>Product Activity & Audits ({productActivity.auditsCount})</span>
        </Button>
      </div>

      {/* TAB 1: VISITS */}
      {activeTab === "VISITS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-sky-600" />
              Doctor Calls & Field Detailing History
            </CardTitle>
            <CardDescription>
              Physician meetings, feedback, samples given, and GPS radius verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician & Clinic</TableHead>
                  <TableHead>Call Status</TableHead>
                  <TableHead>GPS Verification</TableHead>
                  <TableHead>Detailing Feedback</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {v.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {v.specialty || "Clinic / Pharmacy"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.status === "COMPLETED"
                            ? "default"
                            : v.status === "IN_PROGRESS"
                            ? "info"
                            : v.status === "MISSED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.verificationStatus === "VERIFIED"
                            ? "success"
                            : v.verificationStatus === "OUTSIDE_RADIUS"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] gap-1"
                      >
                        {v.verificationStatus === "VERIFIED" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {v.verificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-slate-600 dark:text-slate-300">
                      {(v as { feedbackNotes?: string }).feedbackNotes || v.doctorFeedback || "Prescribed core formulations"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-slate-500">
                      {v.actualStartTime || (v as { scheduledStartTime?: string }).scheduledStartTime || "10:00 AM"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === "ORDERS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-sky-600" />
              Commercial Orders Booked by {mr.name}
            </CardTitle>
            <CardDescription>
              Direct orders booked at chemists and hospital pharmacies
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No orders recorded for this representative yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Pharmacy / Chemist</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Line Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {o.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200">
                        {o.pharmacyName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(o.orderDate)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {o.items?.length || 0} product(s)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.status === "DELIVERED"
                              ? "success"
                              : o.status === "ACCEPTED"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatCurrency(o.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: COLLECTIONS */}
      {activeTab === "COLLECTIONS" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Payment Collections Reconciled
            </CardTitle>
            <CardDescription>
              Receipt vouchers cleared against outstanding chemist invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {collections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No payment receipts recorded for this representative yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Chemist / Pharmacy</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Ref / Cheque #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {c.receiptNumber}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200">
                        {c.pharmacyName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.paymentMode === "UPI"
                              ? "info"
                              : c.paymentMode === "CHEQUE"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {c.paymentMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {c.referenceNumber || "Cash Handover"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(c.paymentDate)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: TARGET TRACKING */}
      {activeTab === "TARGET" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Monthly Sales Quota Breakdown</CardTitle>
              <CardDescription>Fiscal month target performance and run-rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monthly Sales Quota</span>
                <span className="font-bold">{formatCurrency(target.targetAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Achieved Commercial Value</span>
                <span className="font-bold text-emerald-600">{formatCurrency(target.achievedAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Achievement Rate</span>
                <span className="font-semibold">{target.achievementRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Shortfall to Quota</span>
                <span className="font-semibold text-rose-600">{formatCurrency(target.shortfall)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Pacing Status</span>
                <Badge variant={isAhead ? "success" : "destructive"}>
                  {mr.performanceStatus.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Call Quota & Frequency Goals</CardTitle>
              <CardDescription>Physician reach target vs completed calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Monthly Visit Target</span>
                <span className="font-bold">{target.visitTarget} Calls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Visits Achieved</span>
                <span className="font-bold text-sky-600">{target.visitAchieved} Calls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Visit Completion Rate</span>
                <span className="font-semibold">{target.visitAchievementRate}%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Daily Target Expectation</span>
                <span className="font-semibold">{target.dailyCallGoal} doctor visits / day</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: PRODUCTS ACTIVITY & AUDITS */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products Detailed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-sky-600" />
                  Product Formulations Detailed & Promoted
                </CardTitle>
                <CardDescription>
                  Molecules detailed to physicians and sample units distributed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formulation Name</TableHead>
                      <TableHead>Times Detailed</TableHead>
                      <TableHead className="text-right">Samples Handed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productActivity.promotedProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {p.productName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {p.detailingCount} calls
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-sky-600">
                          {p.samplesDistributed} units
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pharmacy Presence Audits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Recent Pharmacy Stock Presence Audits
                </CardTitle>
                <CardDescription>
                  Retail stock availability recorded by this representative
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Product Molecule</TableHead>
                      <TableHead className="text-right">Stock Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productActivity.recentAudits.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {a.pharmacyName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {a.productName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              a.status === "AVAILABLE"
                                ? "success"
                                : a.status === "LOW_STOCK"
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {a.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
