import { prisma } from "../lib/db.js"
import { codeFromName } from "../lib/utils.js"
import { createTransaction } from "./transactions.js"

export type RecurringData = {
  name: string
  merchant?: string
  total: number
  currencyCode?: string
  type?: string
  categoryCode?: string
  projectCode?: string
  frequency: string // monthly, weekly, quarterly, yearly
  nextDueDate: Date | string
}

const VALID_FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"]

export async function listRecurring(userId: string) {
  return await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { nextDueDate: "asc" },
  })
}

export async function listDueRecurring(userId: string) {
  return await prisma.recurringTransaction.findMany({
    where: {
      userId,
      active: true,
      nextDueDate: { lte: new Date() },
    },
    orderBy: { nextDueDate: "asc" },
  })
}

export async function createRecurring(userId: string, data: RecurringData) {
  if (!VALID_FREQUENCIES.includes(data.frequency)) {
    throw new Error(`Invalid frequency: ${data.frequency}. Must be one of: ${VALID_FREQUENCIES.join(", ")}`)
  }

  const nextDueDate = typeof data.nextDueDate === "string" ? new Date(data.nextDueDate) : data.nextDueDate

  return await prisma.recurringTransaction.create({
    data: {
      name: data.name,
      merchant: data.merchant,
      total: data.total,
      currencyCode: data.currencyCode || "USD",
      type: data.type || "expense",
      categoryCode: data.categoryCode,
      projectCode: data.projectCode,
      frequency: data.frequency,
      nextDueDate,
      userId,
    },
  })
}

export async function updateRecurring(id: string, userId: string, data: Partial<RecurringData>) {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.merchant !== undefined) updateData.merchant = data.merchant
  if (data.total !== undefined) updateData.total = data.total
  if (data.currencyCode !== undefined) updateData.currencyCode = data.currencyCode
  if (data.type !== undefined) updateData.type = data.type
  if (data.categoryCode !== undefined) updateData.categoryCode = data.categoryCode
  if (data.projectCode !== undefined) updateData.projectCode = data.projectCode
  if (data.frequency !== undefined) {
    if (!VALID_FREQUENCIES.includes(data.frequency)) {
      throw new Error(`Invalid frequency: ${data.frequency}. Must be one of: ${VALID_FREQUENCIES.join(", ")}`)
    }
    updateData.frequency = data.frequency
  }
  if (data.nextDueDate !== undefined) {
    updateData.nextDueDate = typeof data.nextDueDate === "string" ? new Date(data.nextDueDate) : data.nextDueDate
  }

  return await prisma.recurringTransaction.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteRecurring(id: string, userId: string) {
  return await prisma.recurringTransaction.delete({
    where: { id },
  })
}

export async function deactivateRecurring(id: string, userId: string) {
  return await prisma.recurringTransaction.update({
    where: { id },
    data: { active: false },
  })
}

function advanceDate(date: Date, frequency: string): Date {
  const next = new Date(date)
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      break
    case "quarterly":
      next.setMonth(next.getMonth() + 3)
      break
    case "yearly":
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

export async function generateDueTransactions(userId: string) {
  const dueItems = await listDueRecurring(userId)
  const generated = []

  for (const item of dueItems) {
    const tx = await createTransaction(userId, {
      name: item.name,
      merchant: item.merchant,
      total: item.total,
      currencyCode: item.currencyCode,
      type: item.type,
      categoryCode: item.categoryCode,
      projectCode: item.projectCode,
      issuedAt: item.nextDueDate,
    })

    const nextDate = advanceDate(item.nextDueDate, item.frequency)
    await prisma.recurringTransaction.update({
      where: { id: item.id },
      data: {
        lastGenerated: new Date(),
        nextDueDate: nextDate,
      },
    })

    generated.push({ recurring: item.name, transactionId: tx.id, nextDueDate: nextDate.toISOString() })
  }

  return generated
}
