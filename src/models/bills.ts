import { prisma } from "../lib/db.js"
import { createTransaction } from "./transactions.js"

export type BillData = {
  vendorName?: string
  billNumber?: string | null
  contactId?: string | null
  lineItems?: Record<string, unknown>[]
  total?: number
  currencyCode?: string
  status?: string
  issuedAt?: Date | string | null
  dueDate?: Date | string | null
  paidAt?: Date | string | null
  transactionId?: string | null
  categoryCode?: string | null
  projectCode?: string | null
  notes?: string | null
}

export type BillFilters = {
  status?: string
  contactId?: string
  categoryCode?: string
  projectCode?: string
}

export async function listBills(userId: string, filters?: BillFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.contactId) {
      where.contactId = filters.contactId
    }
    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }
    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }
  }

  return await prisma.bill.findMany({
    where,
    orderBy: { dueDate: "asc" },
  })
}

export async function getBill(id: string, userId: string) {
  return await prisma.bill.findFirst({
    where: { id, userId },
  })
}

export async function createBill(userId: string, data: BillData) {
  return await prisma.bill.create({
    data: {
      userId,
      vendorName: data.vendorName || "",
      billNumber: data.billNumber ?? null,
      contactId: data.contactId ?? null,
      lineItems: data.lineItems ? JSON.stringify(data.lineItems) : "[]",
      total: data.total || 0,
      currencyCode: data.currencyCode || "USD",
      status: data.status || "pending",
      issuedAt: data.issuedAt ? new Date(data.issuedAt as string) : null,
      dueDate: data.dueDate ? new Date(data.dueDate as string) : null,
      categoryCode: data.categoryCode ?? null,
      projectCode: data.projectCode ?? null,
      notes: data.notes ?? null,
    },
  })
}

export async function updateBill(id: string, userId: string, data: BillData) {
  const bill = await getBill(id, userId)
  if (!bill) return null

  if (bill.status !== "pending" && bill.status !== "approved") {
    throw new Error(`Cannot update bill with status "${bill.status}". Only pending or approved bills can be updated.`)
  }

  const updateData: Record<string, unknown> = {}
  if (data.vendorName !== undefined) updateData.vendorName = data.vendorName
  if (data.billNumber !== undefined) updateData.billNumber = data.billNumber
  if (data.contactId !== undefined) updateData.contactId = data.contactId
  if (data.lineItems !== undefined) updateData.lineItems = JSON.stringify(data.lineItems)
  if (data.total !== undefined) updateData.total = data.total
  if (data.currencyCode !== undefined) updateData.currencyCode = data.currencyCode
  if (data.issuedAt !== undefined) updateData.issuedAt = data.issuedAt ? new Date(data.issuedAt as string) : null
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate as string) : null
  if (data.categoryCode !== undefined) updateData.categoryCode = data.categoryCode
  if (data.projectCode !== undefined) updateData.projectCode = data.projectCode
  if (data.notes !== undefined) updateData.notes = data.notes

  return await prisma.bill.update({
    where: { id },
    data: updateData,
  })
}

export async function approveBill(id: string, userId: string) {
  const bill = await getBill(id, userId)
  if (!bill) return null

  if (bill.status !== "pending") {
    throw new Error(`Cannot approve bill with status "${bill.status}". Only pending bills can be approved.`)
  }

  return await prisma.bill.update({
    where: { id },
    data: { status: "approved" },
  })
}

export async function markPaid(id: string, userId: string, paidAt?: Date | string) {
  const bill = await getBill(id, userId)
  if (!bill) return null

  if (bill.status !== "pending" && bill.status !== "approved") {
    throw new Error(`Cannot mark bill as paid with status "${bill.status}". Only pending or approved bills can be marked paid.`)
  }

  const paidDate = paidAt ? new Date(paidAt as string) : new Date()

  // Auto-create an expense transaction
  const txName = `Bill ${bill.billNumber || bill.vendorName}`
  const tx = await createTransaction(userId, {
    name: txName,
    total: bill.total,
    currencyCode: bill.currencyCode,
    type: "expense",
    merchant: bill.vendorName,
    categoryCode: bill.categoryCode,
    projectCode: bill.projectCode,
    issuedAt: paidDate,
  })

  return await prisma.bill.update({
    where: { id },
    data: {
      status: "paid",
      paidAt: paidDate,
      transactionId: tx.id,
    },
  })
}

export async function listOverdue(userId: string) {
  const now = new Date()
  return await prisma.bill.findMany({
    where: {
      userId,
      status: { in: ["pending", "approved"] },
      dueDate: { lt: now },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function listDueThisWeek(userId: string) {
  const now = new Date()
  const oneWeek = new Date()
  oneWeek.setDate(oneWeek.getDate() + 7)

  return await prisma.bill.findMany({
    where: {
      userId,
      status: { in: ["pending", "approved"] },
      dueDate: { gte: now, lte: oneWeek },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function getAgingReport(userId: string) {
  const now = new Date()
  const bills = await prisma.bill.findMany({
    where: {
      userId,
      status: { in: ["pending", "approved"] },
    },
    orderBy: { dueDate: "asc" },
  })

  const buckets = {
    current: [] as typeof bills,
    overdue_1_30: [] as typeof bills,
    overdue_31_60: [] as typeof bills,
    overdue_61_90: [] as typeof bills,
    overdue_90_plus: [] as typeof bills,
  }

  for (const bill of bills) {
    if (!bill.dueDate || bill.dueDate >= now) {
      buckets.current.push(bill)
      continue
    }

    const daysOverdue = Math.floor(
      (now.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysOverdue <= 30) {
      buckets.overdue_1_30.push(bill)
    } else if (daysOverdue <= 60) {
      buckets.overdue_31_60.push(bill)
    } else if (daysOverdue <= 90) {
      buckets.overdue_61_90.push(bill)
    } else {
      buckets.overdue_90_plus.push(bill)
    }
  }

  return buckets
}
