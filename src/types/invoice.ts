export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id?: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  lineTotal: number;
}

export interface PaymentAllocation {
  id: string;
  invoiceId: string;
  collectionId: string;
  allocatedAmount: number;
  allocatedAt: string;
  allocatedById: string;
  notes?: string;
  isReversed: boolean;
  reversalReason?: string;
  reversedAt?: string;
  reversedById?: string;
  collection?: {
    receiptNumber: string;
    amount: number;
    paymentMode: string;
    collectionDate: string;
    referenceNumber?: string;
  };
  allocatedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  orderId?: string;
  order?: {
    orderNumber: string;
    totalAmount: number;
  };
  customerId: string;
  customerName: string;
  customerType: string;
  distributorId?: string;
  distributorName?: string;
  territoryId?: string;
  territoryName?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  allocations?: PaymentAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAging {
  customerId: string;
  customerName: string;
  customerType: string;
  totalOutstanding: number;
  current0To30: number;
  overdue31To60: number;
  overdue61To90: number;
  overdue90Plus: number;
  oldestDueDate?: string;
  invoiceCount: number;
}

export interface StatementEntry {
  date: string;
  type: 'INVOICE' | 'COLLECTION' | 'ALLOCATION' | 'REVERSAL';
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerType: string;
  asOfDate: string;
  currency: string;
  totalBilled: number;
  totalPaid: number;
  currentBalance: number;
  entries: StatementEntry[];
}

export interface ReceivablesSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  aging: {
    current0To30: number;
    overdue31To60: number;
    overdue61To90: number;
    overdue90Plus: number;
  };
  invoicesCount: {
    total: number;
    issued: number;
    partiallyPaid: number;
    paid: number;
  };
}
