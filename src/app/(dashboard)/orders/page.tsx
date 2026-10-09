"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrders,
  useOrderKPIs,
  useOrderTrend,
  useOrderDetail,
  useMRList,
  useIsMounted,
} from "@/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingCart,
  Receipt,
  Search,
  Eye,
  Clock,
  RotateCcw,
  Building2,
  User,
  Calendar,
  Layers,
  TrendingUp,
} from "lucide-react";
import { OrderStatus } from "@/types";

export default function OrdersPage() {
  const isMounted = useIsMounted();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [mrFilter, setMrFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: kpis, isLoading: kpisLoading } = useOrderKPIs({
    mrId: mrFilter !== "ALL" ? mrFilter : undefined,
  });

  const { data: trendData, isLoading: trendLoading } = useOrderTrend();
  const { data: mrs } = useMRList();

  const { data: orders, isLoading: ordersLoading } = useOrders({
    status: statusFilter,
    mrId: mrFilter,
    date: dateFilter || undefined,
    search: searchQuery || undefined,
  });

  const { data: activeOrder, isLoading: orderDetailLoading } = useOrderDetail(selectedOrderId);

  const resetFilters = () => {
    setStatusFilter("ALL");
    setMrFilter("ALL");
    setDateFilter("");
    setSearchQuery("");
  };

  const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (status) {
      case "DELIVERED":
        return "success";
      case "DISPATCHED":
      case "PROCESSING":
        return "info";
      case "ACCEPTED":
      case "SUBMITTED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const maxTrendAmount = Math.max(...(trendData?.map((t) => t.amount) || [1]), 1000);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Commercial Orders & Field Booking"
        description="Comprehensive tracking of pharmaceutical supply orders booked by medical representatives across retail pharmacies and hospital dispensaries."
        badge={<Badge variant="info">{orders?.length || 0} Orders Displayed</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/commercial">
              <Button variant="outline" size="sm" className="gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Commercial Overview
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Collections & Receipts
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
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
                  {formatCurrency(kpis?.todayValue || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {kpis?.todayCount || 0} orders
                  </span>
                  <span>booked on Oct 08</span>
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
                  {formatCurrency(kpis?.monthlyValue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {kpis?.monthlyCount || 0} orders
                  </span>{" "}
                  across active territories
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg Order Ticket Size
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.averageOrderValue || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Per chemist requisition
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Fulfillment */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Fulfillment
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            {kpisLoading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {kpis?.pendingCount || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Submitted & In-Processing
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Booking Daily Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                Daily Order Booking Value Trend (October 2026)
              </CardTitle>
              <CardDescription className="text-xs">
                Value and volume of pharmaceutical stock orders booked day-by-day
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total MTD: {formatCurrency(kpis?.monthlyValue || 0)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="pt-2">
              <div className="flex items-end justify-between gap-3 h-32 border-b border-slate-200 dark:border-slate-800 pb-2">
                {trendData?.map((item) => {
                  const pct = Math.min(100, Math.max(8, Math.round((item.amount / maxTrendAmount) * 100)));
                  return (
                    <div
                      key={item.date}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-md transition-opacity whitespace-nowrap dark:bg-slate-800">
                        <div>{item.label}: {formatCurrency(item.amount)}</div>
                        <div className="text-[9px] text-slate-400">{item.count} orders booked</div>
                      </div>

                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-sky-500 group-hover:bg-sky-400 transition-all duration-300"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between gap-3 pt-2 text-[11px] text-slate-500">
                {trendData?.map((item) => (
                  <div key={item.date} className="flex-1 text-center font-medium">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search order #, customer, or MR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                aria-label="Filter by order status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PROCESSING">Processing</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* MR Filter */}
              <select
                aria-label="Filter by field representative"
                value={mrFilter}
                onChange={(e) => setMrFilter(e.target.value)}
                suppressHydrationWarning
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="ALL">All Representatives</option>
                {isMounted &&
                  mrs?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeId})
                    </option>
                  ))}
              </select>

              {/* Date Filter */}
              <select
                aria-label="Filter by order date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="">All Dates</option>
                <option value="2026-10-08">Today (08 Oct 2026)</option>
                <option value="2026-10-07">07 Oct 2026</option>
                <option value="2026-10-06">06 Oct 2026</option>
                <option value="2026-10-05">05 Oct 2026</option>
                <option value="2026-10-04">04 Oct 2026</option>
              </select>
            </div>

            {/* Reset */}
            {(statusFilter !== "ALL" || mrFilter !== "ALL" || dateFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 gap-1.5 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold">No commercial orders found</div>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting the status, representative, or date filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order # & Date</TableHead>
                  <TableHead>Customer (Chemist / Clinic)</TableHead>
                  <TableHead>Field Representative</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {o.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(o.orderDate)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {o.pharmacyName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {o.customerAddress}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {o.mrName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {o.mrEmployeeCode}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(o.status)} className="text-[10px] font-semibold">
                        {o.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {o.items?.length || 1}
                      </span>{" "}
                      products
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(o.totalAmount)}
                      </div>
                      {o.taxAmount ? (
                        <div className="text-[10px] text-slate-400">
                          Incl. {formatCurrency(o.taxAmount)} GST
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderId(o.id)}
                        className="h-8 px-2.5 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/60"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        title={activeOrder ? `Order Requisition #${activeOrder.orderNumber}` : "Order Details"}
        description={activeOrder ? `Booked on ${formatDate(activeOrder.orderDate)} • Status: ${activeOrder.status}` : ""}
        maxWidth="2xl"
      >
        {orderDetailLoading || !activeOrder ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-5 py-2 text-xs">
            {/* Top Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-sky-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Fulfillment Status:
                </span>
                <Badge variant={getStatusBadgeVariant(activeOrder.status)} className="text-[10px]">
                  {activeOrder.status}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                ID: {activeOrder.id}
              </div>
            </div>

            {/* Customer & MR Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                  <Building2 className="h-3.5 w-3.5 text-sky-600" /> Customer Chemist / Hospital
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeOrder.pharmacyName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 mt-1">
                  {activeOrder.customerAddress}
                </div>
                <div className="text-slate-500 text-[11px] mt-1 font-medium">
                  Territory: {activeOrder.territoryName}
                </div>
              </div>

              {/* MR */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                  <User className="h-3.5 w-3.5 text-indigo-600" /> Medical Representative
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeOrder.mrName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono mt-1">
                  Employee Code: {activeOrder.mrEmployeeCode}
                </div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Distributor: {activeOrder.distributorName || "Sri Ram Pharma Distributors"}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                <span>Requisitioned Formulations & SKUs</span>
                <span className="text-slate-500 text-[11px]">
                  {activeOrder.items?.length || 0} line items
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                    <TableRow>
                      <TableHead className="text-xs">Product & SKU</TableHead>
                      <TableHead className="text-right text-xs">Unit Rate</TableHead>
                      <TableHead className="text-center text-xs">Qty</TableHead>
                      <TableHead className="text-right text-xs">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrder.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {item.sku}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.subtotal || item.lineTotal || item.unitPrice * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial Calculation Breakdown */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(activeOrder.subtotalAmount || activeOrder.totalAmount * 0.9)}
                </span>
              </div>
              {activeOrder.discountAmount ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Trade Discount</span>
                  <span>-{formatCurrency(activeOrder.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Applicable GST / Taxes</span>
                <span className="font-medium">
                  {formatCurrency(activeOrder.taxAmount || activeOrder.totalAmount * 0.1)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Net Invoice Payable</span>
                <span className="text-sky-600 dark:text-sky-400 text-base">
                  {formatCurrency(activeOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Remarks / Dispatch Notes */}
            <div className="rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 p-3">
              <div className="font-semibold text-sky-800 dark:text-sky-300 text-[11px] mb-1">
                Representative Field Notes
              </div>
              <div className="text-sky-700 dark:text-sky-300/90 text-xs">
                {activeOrder.notes || activeOrder.remarks || "Standard delivery terms apply. Booked during scheduled field call."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(null)}>
                Close Requisition
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
