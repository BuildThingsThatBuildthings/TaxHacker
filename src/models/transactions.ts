import { prisma } from "../lib/db.js"
import { listFields } from "./fields.js"
import { deleteFile } from "./files.js"

export type TransactionData = {
  name?: string | null
  description?: string | null
  merchant?: string | null
  total?: number | null
  currencyCode?: string | null
  type?: string | null
  items?: Record<string, unknown>[] | undefined
  note?: string | null
  files?: string[] | undefined
  extra?: Record<string, unknown>
  categoryCode?: string | null
  projectCode?: string | null
  issuedAt?: Date | string | null
  text?: string | null
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
  type?: string
  limit?: number
  offset?: number
}

export async function listTransactions(
  userId: string,
  filters?: TransactionFilters
): Promise<{ transactions: unknown[]; total: number }> {
  const where: Record<string, unknown> = { userId }
  let orderBy: Record<string, string> = { issuedAt: "desc" }

  if (filters) {
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { merchant: { contains: filters.search } },
        { description: { contains: filters.search } },
        { note: { contains: filters.search } },
        { text: { contains: filters.search } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.ordering) {
      const isDesc = filters.ordering.startsWith("-")
      const field = isDesc ? filters.ordering.slice(1) : filters.ordering
      orderBy = { [field]: isDesc ? "desc" : "asc" }
    }
  }

  const limit = filters?.limit
  const offset = filters?.offset

  const total = await prisma.transaction.count({ where })
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    ...(limit !== undefined ? { take: limit } : {}),
    ...(offset !== undefined ? { skip: offset } : {}),
  })

  return { transactions, total }
}

export async function getTransaction(id: string, userId: string) {
  return await prisma.transaction.findFirst({
    where: { id, userId },
  })
}

export async function createTransaction(userId: string, data: TransactionData) {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.create({
    data: {
      ...standard,
      extra: extra ? JSON.stringify(extra) : undefined,
      items: data.items ? JSON.stringify(data.items) : "[]",
      files: data.files ? JSON.stringify(data.files) : "[]",
      userId,
    },
  })
}

export async function updateTransaction(id: string, userId: string, data: TransactionData) {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.update({
    where: { id },
    data: {
      ...standard,
      extra: extra ? JSON.stringify(extra) : undefined,
      items: data.items ? JSON.stringify(data.items) : undefined,
      files: data.files ? JSON.stringify(data.files) : undefined,
      userId,
    },
  })
}

export async function deleteTransaction(id: string, userId: string) {
  const transaction = await getTransaction(id, userId)
  if (!transaction) return undefined

  // Parse files JSON and clean up orphaned files
  let fileIds: string[] = []
  try {
    fileIds = JSON.parse(transaction.files || "[]")
  } catch {
    fileIds = []
  }

  for (const fileId of fileIds) {
    // Check if any other transaction references this file
    const others = await prisma.transaction.findMany({
      where: {
        userId,
        id: { not: id },
        files: { contains: fileId },
      },
    })
    if (others.length === 0) {
      await deleteFile(fileId, userId)
    }
  }

  return await prisma.transaction.delete({
    where: { id },
  })
}

export async function bulkDeleteTransactions(ids: string[], userId: string) {
  return await prisma.transaction.deleteMany({
    where: { id: { in: ids }, userId },
  })
}

async function splitTransactionDataExtraFields(
  data: TransactionData,
  userId: string
): Promise<{ standard: Record<string, unknown>; extra: Record<string, unknown> | null }> {
  const fields = await listFields(userId)
  const fieldMap = new Map(fields.map((f) => [f.code, f]))

  const standard: Record<string, unknown> = {}
  const extra: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    // Skip meta fields handled separately
    if (key === "items" || key === "files" || key === "extra") continue

    const fieldDef = fieldMap.get(key)
    if (fieldDef) {
      if (fieldDef.isExtra) {
        extra[key] = value
      } else {
        standard[key] = value
      }
    }
  }

  // Merge any explicitly provided extra fields
  if (data.extra) {
    Object.assign(extra, data.extra)
  }

  // Handle issuedAt conversion
  if (standard.issuedAt && typeof standard.issuedAt === "string") {
    standard.issuedAt = new Date(standard.issuedAt as string)
  }

  return {
    standard,
    extra: Object.keys(extra).length > 0 ? extra : null,
  }
}
