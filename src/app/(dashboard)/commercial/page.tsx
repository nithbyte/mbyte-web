"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCommercialKPIs,
  useCommercialTrends,
  useCommercialLeaderboard,
  useRecentOrders,
  useRecentCollections,
} from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CommercialTrendChart } from "@/components/ui/charts/CommercialTrendChart";
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  Users,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function CommercialDashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useCommercialKPIs();
  const { data: trends, isLoading: trendsLoading } = useCommercialTrends();
  const { data: leaderboard, isLoading: lbLoading } = useCommercialLeaderboard();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5);
  const { data: recentCollections, isLoading: colsLoading } = useRecentCollections(5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Commercial & Revenue Intelligence"
        description="Executive visibility into order bookings, realized collections, clearance rates, and field representative financial performance."
        badge={<Badge variant="success">October 2026 Active</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/orders">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ShoppingCart className="h-4 w-4 text-sky-600" />
                Booked Orders
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Receipts & Payments
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <Card className="border-l-4 border-l-sky-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Booked Orders
              </span>
              <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.todayOrdersValue || 0)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {kpis?.todayOrdersCount || 0} orders
                  </span>
                  <span>booked on Oct 08</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Collections */}
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Collections
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.todayCollectionsValue || 0)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {kpis?.todayCollectionsCount || 0} receipts
                  </span>
                  <span>realized today</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orders Total */}
        <Card className="border-l-4 border-l-indigo-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Orders (MTD)
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.monthlyOrdersValue || 0)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>{kpis?.monthlyOrdersCount || 0} orders total</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Avg {formatCurrency(kpis?.averageOrderValue || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Collections Total */}
        <Card className="border-l-4 border-l-teal-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Collections (MTD)
              </span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.monthlyCollectionsValue || 0)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>{kpis?.monthlyCollectionsCount || 0} vouchers</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {kpis?.collectionRealizationRate || 0}% Recovery
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Commercial Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                Commercial Booking & Realization Trends (October 2026)
              </CardTitle>
              <CardDescription>
                Daily breakdown of orders booked in the field vs payment collections deposited
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-slate-600 dark:text-slate-300">
                Daily Timeline: Oct 01 – Oct 08
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <CommercialTrendChart data={trends || []} height={200} />
          )}
        </CardContent>
      </Card>

      {/* Field Force Commercial Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Representative Commercial Contribution
              </CardTitle>
              <CardDescription>
                Total orders booked and payments realized by each medical representative
              </CardDescription>
            </div>
            <Link href="/field-force">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900">
                View All MRs <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lbLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medical Representative</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead className="text-center">Orders Booked</TableHead>
                  <TableHead className="text-right">Order Value</TableHead>
                  <TableHead className="text-center">Collections Done</TableHead>
                  <TableHead className="text-right">Collection Value</TableHead>
                  <TableHead className="text-right">Realization %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.map((mr) => {
                  const rate =
                    mr.ordersValue > 0
                      ? Math.round((mr.collectionsValue / mr.ordersValue) * 100)
                      : 100;
                  return (
                    <TableRow key={mr.mrId}>
                      <TableCell>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {mr.mrName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {mr.employeeCode}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {mr.territoryName}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="outline">{mr.ordersCount} orders</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(mr.ordersValue)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="success">{mr.collectionsCount} receipts</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(mr.collectionsValue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            rate >= 80
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {rate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders and Recent Collections Two-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-sky-600" />
                  Latest Booked Orders
                </CardTitle>
                <CardDescription className="text-xs">
                  Recently captured chemist and hospital orders
                </CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-xs text-sky-600 hover:text-sky-700">
                  Manage Orders <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders?.map((ord) => (
                  <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </span>
                        <Badge
                          variant={
                            ord.status === "DELIVERED"
                              ? "success"
                              : ord.status === "CANCELLED"
                              ? "destructive"
                              : "default"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {ord.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {ord.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        By {ord.mrName} • {formatDate(ord.orderDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(ord.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ord.items?.length || 1} items
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Collections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  Latest Payment Receipts
                </CardTitle>
                <CardDescription className="text-xs">
                  Reconciled collections across UPI, Cheque & Cash
                </CardDescription>
              </div>
              <Link href="/collections">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700">
                  Manage Receipts <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {colsLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCollections?.map((col) => (
                  <div key={col.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {col.receiptNumber}
                        </span>
                        <Badge
                          variant={
                            col.paymentMode === "UPI"
                              ? "info"
                              : col.paymentMode === "CHEQUE"
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {col.paymentMode}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {col.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        By {col.mrName} • Ref: {col.referenceNumber || "Direct"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(col.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(col.paymentDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
