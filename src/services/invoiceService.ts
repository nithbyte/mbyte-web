import { apiClient, isMockFallbackAllowed } from "../lib/api-client";
import { mockOrders, mockCollections } from "../mock";
import type {
  Invoice,
  PaymentAllocation,
  CustomerAging,
  CustomerStatement,
  ReceivablesSummary,
} from "../types/invoice";

function mapApiInvoice(inv: any): Invoice {
  const totalAmount = Number(inv.totalAmount || 0);
  const paidAmount = Number(inv.paidAmount || 0);
  const balanceAmount = Number(inv.balanceAmount ?? (totalAmount - paidAmount));
  const subtotalAmount = Number(inv.subtotalAmount || totalAmount);
  const taxAmount = Number(inv.taxAmount || 0);
  const discountAmount = Number(inv.discountAmount || 0);

  return {
    id: inv.id,
    organizationId: inv.organizationId || "",
    invoiceNumber: inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`,
    orderId: inv.orderId,
    order: inv.order
      ? {
          orderNumber: inv.order.orderNumber,
          totalAmount: Number(inv.order.totalAmount || 0),
        }
      : undefined,
    customerId: inv.pharmacyId || inv.distributorId || inv.customerId || "cust_unknown",
    customerName:
      inv.pharmacy?.name ||
      inv.distributor?.name ||
      inv.customerName ||
      "Customer Entity",
    customerType: inv.pharmacyId ? "PHARMACY" : inv.distributorId ? "DISTRIBUTOR" : (inv.customerType || "PHARMACY"),
    distributorId: inv.distributorId,
    distributorName: inv.distributor?.name || inv.distributorName,
    territoryId: inv.territoryId,
    territoryName: inv.territoryName,
    invoiceDate: inv.invoiceDate?.split("T")[0] || "2026-10-09",
    dueDate: inv.dueDate?.split("T")[0] || "2026-10-25",
    status: inv.status || (balanceAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "ISSUED"),
    subtotalAmount,
    taxAmount,
    discountAmount,
    totalAmount,
    paidAmount,
    balanceAmount,
    notes: inv.notes,
    terms: inv.terms,
    items: Array.isArray(inv.items)
      ? inv.items.map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName || it.product?.brandName || "Item",
          sku: it.sku || it.product?.sku,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
          subtotal: Number(it.subtotal || 0),
          taxRate: Number(it.taxRate || 12),
          taxAmount: Number(it.taxAmount || 0),
          discount: Number(it.discount || 0),
          lineTotal: Number(it.lineTotal || 0),
        }))
      : [],
    allocations: Array.isArray(inv.allocations)
      ? inv.allocations.map((a: any) => ({
          id: a.id,
          invoiceId: a.invoiceId || inv.id,
          collectionId: a.collectionId,
          allocatedAmount: Number(a.allocatedAmount || 0),
          allocatedAt: a.allocatedAt || a.createdAt || new Date().toISOString(),
          allocatedById: a.allocatedById || "",
          notes: a.notes,
          isReversed: Boolean(a.isReversed),
          reversalReason: a.reversalReason,
          reversedAt: a.reversedAt,
          collection: a.collection
            ? {
                receiptNumber: a.collection.receiptNumber,
                amount: Number(a.collection.amount || 0),
                paymentMode: a.collection.paymentMode,
                collectionDate: a.collection.collectionDate || a.collection.paymentDate,
                referenceNumber: a.collection.referenceNumber,
              }
            : undefined,
        }))
      : [],
    createdAt: inv.createdAt || new Date().toISOString(),
    updatedAt: inv.updatedAt || new Date().toISOString(),
  };
}

// Generate in-memory mock invoices from mockOrders and mockCollections
let inMemoryInvoices: Invoice[] | null = null;

function getMockInvoices(): Invoice[] {
  if (inMemoryInvoices) return inMemoryInvoices;

  const invoices: Invoice[] = [];
  mockOrders.forEach((o, idx) => {
    const isPaid = idx % 3 === 0;
    const isPartial = idx % 3 === 1;
    const totalAmount = Math.round(Number(o.totalAmount || 1500));
    const paidAmount = isPaid ? totalAmount : isPartial ? Math.round(totalAmount * 0.45) : 0;
    const balanceAmount = totalAmount - paidAmount;
    const status = isPaid ? "PAID" : isPartial ? "PARTIALLY_PAID" : "ISSUED";

    // Due dates spaced between 10 days ago and 45 days in future
    const daysOffset = 25 - (idx * 3);
    const invoiceDate = new Date(2026, 9, Math.max(1, 10 - Math.floor(idx / 2)));
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const matchingCol = mockCollections[idx % mockCollections.length];
    const allocations: PaymentAllocation[] = paidAmount > 0 ? [
      {
        id: `alloc_mock_${idx}`,
        invoiceId: `inv_${o.id}`,
        collectionId: matchingCol ? matchingCol.id : `col_mock_${idx}`,
        allocatedAmount: paidAmount,
        allocatedAt: invoiceDate.toISOString(),
        allocatedById: "usr_admin_001",
        notes: "Automated payment match",
        isReversed: false,
        collection: matchingCol ? {
          receiptNumber: matchingCol.receiptNumber,
          amount: matchingCol.amount,
          paymentMode: matchingCol.paymentMode,
          collectionDate: matchingCol.paymentDate,
          referenceNumber: matchingCol.referenceNumber,
        } : undefined,
      }
    ] : [];

    invoices.push({
      id: `inv_${o.id}`,
      organizationId: o.organizationId || "org_novis_001",
      invoiceNumber: `INV-${o.orderNumber ? o.orderNumber.replace("ORD-", "") : String(10000 + idx)}`,
      orderId: o.id,
      order: {
        orderNumber: o.orderNumber,
        totalAmount: Number(o.totalAmount || 0),
      },
      customerId: o.pharmacyId || `phm_${idx}`,
      customerName: o.pharmacyName || "Apollo Pharmacy",
      customerType: "PHARMACY",
      distributorId: o.distributorId,
      distributorName: o.distributorName,
      territoryId: o.territoryId,
      territoryName: o.territoryName,
      invoiceDate: invoiceDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      status: status as any,
      subtotalAmount: Number(o.subtotalAmount || totalAmount * 0.9),
      taxAmount: Number(o.taxAmount || totalAmount * 0.1),
      discountAmount: Number(o.discountAmount || 0),
      totalAmount,
      paidAmount,
      balanceAmount,
      notes: "Commercial invoice automatically generated from booked orders",
      items: o.items.map((it, itIdx) => ({
        id: `inv_item_${idx}_${itIdx}`,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.quantity * it.unitPrice,
        taxRate: it.taxRate,
        lineTotal: it.lineTotal ?? (it.quantity * it.unitPrice),
      })),
      allocations,
      createdAt: invoiceDate.toISOString(),
      updatedAt: invoiceDate.toISOString(),
    });
  });

  inMemoryInvoices = invoices;
  return inMemoryInvoices;
}

export const invoiceService = {
  async getInvoices(params?: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Invoice[]; total: number }> {
    try {
      const res: any = await apiClient.get("/invoices", { params });
      const rawList = Array.isArray(res) ? res : res?.data || res?.items;
      if (Array.isArray(rawList) && rawList.length > 0) {
        return {
          data: rawList.map(mapApiInvoice),
          total: res?.meta?.total || rawList.length,
        };
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real /invoices failed, falling back to mock:", err);
    }

    let list = [...getMockInvoices()];
    if (params?.status && params.status !== "ALL") {
      list = list.filter((i) => i.status === params.status);
    }
    if (params?.customerId && params.customerId !== "ALL") {
      list = list.filter((i) => i.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          (i.order?.orderNumber && i.order.orderNumber.toLowerCase().includes(q))
      );
    }

    return {
      data: list,
      total: list.length,
    };
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const res: any = await apiClient.get(`/invoices/${id}`);
      if (res && (res.id || res.data?.id)) {
        return mapApiInvoice(res.data || res);
      }
    } catch {
      // fallback
    }
    const inv = getMockInvoices().find((i) => i.id === id);
    return inv || null;
  },

  async createInvoice(payload: any): Promise<Invoice> {
    const res: any = await apiClient.post("/invoices", payload);
    return mapApiInvoice(res?.data || res);
  },

  async createFromOrder(orderId: string, payload?: any): Promise<Invoice> {
    const res: any = await apiClient.post(`/invoices/from-order/${orderId}`, payload || {});
    return mapApiInvoice(res?.data || res);
  },

  async allocatePayment(
    invoiceId: string,
    payload: { collectionId: string; allocatedAmount: number; notes?: string }
  ): Promise<PaymentAllocation> {
    try {
      const res: any = await apiClient.post(`/invoices/${invoiceId}/allocations`, payload);
      if (res && res.id) return res;
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real allocate payment failed, falling back to mock:", err);
    }

    // Mock mutation
    const inv = getMockInvoices().find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    const amount = Number(payload.allocatedAmount);
    inv.paidAmount += amount;
    inv.balanceAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
    inv.status = inv.balanceAmount <= 0 ? "PAID" : "PARTIALLY_PAID";

    const newAlloc: PaymentAllocation = {
      id: `alloc_${Date.now()}`,
      invoiceId,
      collectionId: payload.collectionId,
      allocatedAmount: amount,
      allocatedAt: new Date().toISOString(),
      allocatedById: "usr_admin_001",
      notes: payload.notes,
      isReversed: false,
    };
    inv.allocations = [...(inv.allocations || []), newAlloc];
    return newAlloc;
  },

  async reverseAllocation(
    allocationId: string,
    reversalReason: string
  ): Promise<PaymentAllocation> {
    try {
      const res: any = await apiClient.post(`/invoices/allocations/${allocationId}/reverse`, {
        reversalReason,
      });
      if (res && res.id) return res;
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real reverse allocation failed, falling back to mock:", err);
    }

    // Mock mutation
    for (const inv of getMockInvoices()) {
      const alloc = inv.allocations?.find((a) => a.id === allocationId);
      if (alloc) {
        alloc.isReversed = true;
        alloc.reversalReason = reversalReason;
        alloc.reversedAt = new Date().toISOString();
        inv.paidAmount = Math.max(0, inv.paidAmount - alloc.allocatedAmount);
        inv.balanceAmount = inv.totalAmount - inv.paidAmount;
        inv.status = inv.paidAmount <= 0 ? "ISSUED" : "PARTIALLY_PAID";
        return alloc;
      }
    }
    throw new Error("Allocation not found");
  },

  async getAging(params?: { asOfDate?: string; territoryId?: string }): Promise<CustomerAging[]> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/aging", { params });
      const rawList = Array.isArray(res) ? res : res?.data || res?.items;
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map((item: any) => ({
          customerId: item.customerId,
          customerName: item.customerName || "Customer",
          customerType: item.customerType || "PHARMACY",
          totalOutstanding: Number(item.totalOutstanding || 0),
          current0To30: Number(item.aging?.current0To30Days ?? item.current0To30 ?? 0),
          overdue31To60: Number(item.aging?.overdue31To60Days ?? item.overdue31To60 ?? 0),
          overdue61To90: Number(item.aging?.overdue61To90Days ?? item.overdue61To90 ?? 0),
          overdue90Plus: Number(item.aging?.overdue90PlusDays ?? item.overdue90Plus ?? 0),
          oldestDueDate: item.oldestDueDate,
          invoiceCount: Number(item.invoiceCount || 1),
        }));
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real getAging failed, falling back to mock:", err);
    }

    // Compute aging from mock invoices
    const customerMap = new Map<string, CustomerAging>();
    const invoices = getMockInvoices();
    const asOf = params?.asOfDate ? new Date(params.asOfDate) : new Date(2026, 9, 23);

    for (const inv of invoices) {
      if (inv.balanceAmount <= 0) continue;

      if (!customerMap.has(inv.customerId)) {
        customerMap.set(inv.customerId, {
          customerId: inv.customerId,
          customerName: inv.customerName,
          customerType: inv.customerType,
          totalOutstanding: 0,
          current0To30: 0,
          overdue31To60: 0,
          overdue61To90: 0,
          overdue90Plus: 0,
          invoiceCount: 0,
          oldestDueDate: inv.dueDate,
        });
      }

      const row = customerMap.get(inv.customerId)!;
      row.totalOutstanding += inv.balanceAmount;
      row.invoiceCount += 1;

      const due = new Date(inv.dueDate);
      const diffDays = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        row.current0To30 += inv.balanceAmount;
      } else if (diffDays <= 60) {
        row.overdue31To60 += inv.balanceAmount;
      } else if (diffDays <= 90) {
        row.overdue61To90 += inv.balanceAmount;
      } else {
        row.overdue90Plus += inv.balanceAmount;
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  },

  async getStatement(customerId: string, asOfDate?: string): Promise<CustomerStatement | null> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/statement", {
        params: { customerId, asOfDate },
      });
      if (res && (res.customerId || res.data?.customerId)) {
        return res.data || res;
      }
    } catch {
      // fallback
    }

    const invoices = getMockInvoices().filter((i) => i.customerId === customerId);
    if (invoices.length === 0) {
      return {
        customerId,
        customerName: "Customer",
        customerType: "PHARMACY",
        asOfDate: asOfDate || "2026-10-23",
        currency: "INR",
        totalBilled: 0,
        totalPaid: 0,
        currentBalance: 0,
        entries: [],
      };
    }

    const entries: CustomerStatement["entries"] = [];
    let runningBalance = 0;
    let totalBilled = 0;
    let totalPaid = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount;
      runningBalance += inv.totalAmount;
      entries.push({
        date: inv.invoiceDate,
        type: "INVOICE",
        referenceNumber: inv.invoiceNumber,
        description: `Billed for Order ${inv.order?.orderNumber || "Ref"}`,
        debit: inv.totalAmount,
        credit: 0,
        runningBalance,
      });

      if (inv.paidAmount > 0) {
        totalPaid += inv.paidAmount;
        runningBalance -= inv.paidAmount;
        entries.push({
          date: inv.invoiceDate,
          type: "ALLOCATION",
          referenceNumber: `RCP-${inv.invoiceNumber}`,
          description: "Payment collection applied",
          debit: 0,
          credit: inv.paidAmount,
          runningBalance,
        });
      }
    });

    return {
      customerId,
      customerName: invoices[0].customerName,
      customerType: invoices[0].customerType,
      asOfDate: asOfDate || "2026-10-23",
      currency: "INR",
      totalBilled,
      totalPaid,
      currentBalance: Math.max(0, runningBalance),
      entries,
    };
  },

  async getSummary(): Promise<ReceivablesSummary | null> {
    try {
      const res: any = await apiClient.get("/invoices/receivables/summary");
      if (res && (res.totalInvoiced != null || res.data?.totalInvoiced != null)) {
        const data = res.data || res;
        const agingRaw = data.agingBreakdown || data.aging || {};
        return {
          totalInvoiced: Number(data.totalInvoiced || 0),
          totalCollected: Number(data.totalCollected || 0),
          totalOutstanding: Number(data.totalOutstanding || 0),
          aging: {
            current0To30: Number(agingRaw.current0To30Days ?? agingRaw.current0To30 ?? 0),
            overdue31To60: Number(agingRaw.overdue31To60Days ?? agingRaw.overdue31To60 ?? 0),
            overdue61To90: Number(agingRaw.overdue61To90Days ?? agingRaw.overdue61To90 ?? 0),
            overdue90Plus: Number(agingRaw.overdue90PlusDays ?? agingRaw.overdue90Plus ?? 0),
          },
          invoicesCount: {
            total: Number(data.totalOpenInvoices || 0) + Number(data.totalPaidInvoices || 0),
            issued: Number(data.totalOpenInvoices || 0),
            partiallyPaid: 0,
            paid: Number(data.totalPaidInvoices || 0),
          },
        };
      }
    } catch (err) {
      if (!isMockFallbackAllowed()) throw err;
      console.warn("Real getSummary failed, falling back to mock:", err);
    }

    const invoices = getMockInvoices();
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let current0To30 = 0;
    let overdue31To60 = 0;
    let overdue61To90 = 0;
    let overdue90Plus = 0;
    let paidCount = 0;
    let partiallyPaidCount = 0;
    let issuedCount = 0;

    const asOf = new Date(2026, 9, 23);

    invoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount;
      totalCollected += inv.paidAmount;
      totalOutstanding += inv.balanceAmount;

      if (inv.status === "PAID") paidCount++;
      else if (inv.status === "PARTIALLY_PAID") partiallyPaidCount++;
      else issuedCount++;

      if (inv.balanceAmount > 0) {
        const due = new Date(inv.dueDate);
        const diffDays = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) current0To30 += inv.balanceAmount;
        else if (diffDays <= 60) overdue31To60 += inv.balanceAmount;
        else if (diffDays <= 90) overdue61To90 += inv.balanceAmount;
        else overdue90Plus += inv.balanceAmount;
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      aging: {
        current0To30,
        overdue31To60,
        overdue61To90,
        overdue90Plus,
      },
      invoicesCount: {
        total: invoices.length,
        issued: issuedCount,
        partiallyPaid: partiallyPaidCount,
        paid: paidCount,
      },
    };
  },
};
