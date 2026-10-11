import { prisma } from "../lib/db.js"
import { createTransaction } from "./transactions.js"

export type InvoiceLineItem = {
  description: string
  quantity: number
  unitPrice: number // cents
  amount: number // cents (quantity * unitPrice)
}

export type InvoiceData = {
  clientName: string
  clientEmail?: string | null
  contactId?: string | null
  lineItems: InvoiceLineItem[]
  taxRate?: number | null // percentage * 100 (e.g., 850 = 8.5%)
  currencyCode?: string
  projectCode?: string | null
  dueDate?: Date | string | null
  notes?: string | null
}

export type InvoiceUpdateData = {
  clientName?: string
  clientEmail?: string | null
  contactId?: string | null
  lineItems?: InvoiceLineItem[]
  taxRate?: number | null
  currencyCode?: string
  projectCode?: string | null
  dueDate?: Date | string | null
  notes?: string | null
}

export type InvoiceFilters = {
  status?: string
  contactId?: string
  projectCode?: string
}

async function getNextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const latest = await prisma.invoice.findFirst({
    where: { userId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  })
  const lastNum = latest ? parseInt(latest.invoiceNumber.replace(prefix, ""), 10) : 0
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`
}

function calculateTotals(lineItems: InvoiceLineItem[], taxRate?: number | null) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = taxRate ? Math.round(subtotal * (taxRate / 10000)) : null
  const total = subtotal + (taxAmount || 0)
  return { subtotal, taxAmount, total }
}

export async function listInvoices(userId: string, filters?: InvoiceFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.contactId) {
      where.contactId = filters.contactId
    }
    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }
  }

  return await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
}

export async function getInvoice(id: string, userId: string) {
  return await prisma.invoice.findFirst({
    where: { id, userId },
  })
}

export async function createInvoice(userId: string, data: InvoiceData) {
  const invoiceNumber = await getNextInvoiceNumber(userId)
  const { subtotal, taxAmount, total } = calculateTotals(data.lineItems, data.taxRate)

  return await prisma.invoice.create({
    data: {
      userId,
      invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail || null,
      contactId: data.contactId || null,
      lineItems: JSON.stringify(data.lineItems),
      subtotal,
      taxRate: data.taxRate || null,
      taxAmount,
      total,
      currencyCode: data.currencyCode || "USD",
      projectCode: data.projectCode || null,
      dueDate: data.dueDate ? new Date(data.dueDate as string) : null,
      notes: data.notes || null,
    },
  })
}

export async function updateInvoice(id: string, userId: string, data: InvoiceUpdateData) {
  const existing = await getInvoice(id, userId)
  if (!existing) return null
  if (existing.status !== "draft") {
    throw new Error("Can only update invoices in draft status")
  }

  const update: Record<string, unknown> = {}

  if (data.clientName !== undefined) update.clientName = data.clientName
  if (data.clientEmail !== undefined) update.clientEmail = data.clientEmail
  if (data.contactId !== undefined) update.contactId = data.contactId
  if (data.currencyCode !== undefined) update.currencyCode = data.currencyCode
  if (data.projectCode !== undefined) update.projectCode = data.projectCode
  if (data.notes !== undefined) update.notes = data.notes
  if (data.dueDate !== undefined) {
    update.dueDate = data.dueDate ? new Date(data.dueDate as string) : null
  }

  if (data.lineItems !== undefined || data.taxRate !== undefined) {
    const lineItems = data.lineItems || (JSON.parse(existing.lineItems) as InvoiceLineItem[])
    const taxRate = data.taxRate !== undefined ? data.taxRate : existing.taxRate
    const { subtotal, taxAmount, total } = calculateTotals(lineItems, taxRate)
    update.lineItems = JSON.stringify(lineItems)
    update.taxRate = taxRate
    update.subtotal = subtotal
    update.taxAmount = taxAmount
    update.total = total
  }

  return await prisma.invoice.update({
    where: { id },
    data: update,
  })
}

export async function markSent(id: string, userId: string) {
  const existing = await getInvoice(id, userId)
  if (!existing) return null

  return await prisma.invoice.update({
    where: { id },
    data: {
      status: "sent",
      issuedAt: existing.issuedAt || new Date(),
    },
  })
}

export async function markPaid(id: string, userId: string, paidAt?: Date | string) {
  const existing = await getInvoice(id, userId)
  if (!existing) return null

  const paidDate = paidAt ? new Date(paidAt as string) : new Date()

  // Auto-create income transaction
  const tx = await createTransaction(userId, {
    name: `Invoice ${existing.invoiceNumber} - ${existing.clientName}`,
    total: existing.total,
    currencyCode: existing.currencyCode,
    type: "income",
    categoryCode: "invoice",
    projectCode: existing.projectCode,
    issuedAt: paidDate,
  })

  return await prisma.invoice.update({
    where: { id },
    data: {
      status: "paid",
      paidAt: paidDate,
      transactionId: tx.id,
    },
  })
}

export async function voidInvoice(id: string, userId: string) {
  const existing = await getInvoice(id, userId)
  if (!existing) return null

  return await prisma.invoice.update({
    where: { id },
    data: { status: "void" },
  })
}

export async function listOverdue(userId: string) {
  return await prisma.invoice.findMany({
    where: {
      userId,
      status: "sent",
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function getAgingReport(userId: string) {
  const now = new Date()
  const sentInvoices = await prisma.invoice.findMany({
    where: { userId, status: "sent", dueDate: { not: null } },
    orderBy: { dueDate: "asc" },
  })

  const buckets = {
    current: [] as typeof sentInvoices,
    overdue_1_30: [] as typeof sentInvoices,
    overdue_31_60: [] as typeof sentInvoices,
    overdue_61_90: [] as typeof sentInvoices,
    overdue_90_plus: [] as typeof sentInvoices,
  }

  for (const inv of sentInvoices) {
    if (!inv.dueDate) continue
    const diffMs = now.getTime() - inv.dueDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      buckets.current.push(inv)
    } else if (diffDays <= 30) {
      buckets.overdue_1_30.push(inv)
    } else if (diffDays <= 60) {
      buckets.overdue_31_60.push(inv)
    } else if (diffDays <= 90) {
      buckets.overdue_61_90.push(inv)
    } else {
      buckets.overdue_90_plus.push(inv)
    }
  }

  const sumBucket = (items: typeof sentInvoices) =>
    items.reduce((sum, inv) => sum + inv.total, 0)

  return {
    current: { invoices: buckets.current, total: sumBucket(buckets.current) },
    overdue_1_30: { invoices: buckets.overdue_1_30, total: sumBucket(buckets.overdue_1_30) },
    overdue_31_60: { invoices: buckets.overdue_31_60, total: sumBucket(buckets.overdue_31_60) },
    overdue_61_90: { invoices: buckets.overdue_61_90, total: sumBucket(buckets.overdue_61_90) },
    overdue_90_plus: { invoices: buckets.overdue_90_plus, total: sumBucket(buckets.overdue_90_plus) },
  }
}
