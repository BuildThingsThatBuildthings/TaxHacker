import { prisma } from "../lib/db.js"

export type BankAccountData = {
  name: string
  institution?: string | null
  accountType?: string
  currencyCode?: string
}

export type BankTransactionInput = {
  date: Date
  description: string
  amount: number // cents, positive=deposit, negative=withdrawal
  reference?: string
}

export type BankTransactionFilters = {
  bankAccountId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// ---- BankAccount functions ----

export async function listBankAccounts(userId: string) {
  return await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
}

export async function getBankAccount(id: string, userId: string) {
  return await prisma.bankAccount.findFirst({
    where: { id, userId },
  })
}

export async function getBankAccountByName(name: string, userId: string) {
  return await prisma.bankAccount.findFirst({
    where: { userId, name },
  })
}

export async function createBankAccount(userId: string, data: BankAccountData) {
  return await prisma.bankAccount.create({
    data: {
      name: data.name,
      institution: data.institution,
      accountType: data.accountType ?? "checking",
      currencyCode: data.currencyCode ?? "USD",
      userId,
    },
  })
}

export async function updateBalance(id: string, userId: string, balance: number, date?: Date) {
  const account = await getBankAccount(id, userId)
  if (!account) return undefined

  return await prisma.bankAccount.update({
    where: { id },
    data: {
      lastBalance: balance,
      lastBalanceDate: date ?? new Date(),
    },
  })
}

export async function deleteBankAccount(id: string, userId: string) {
  const account = await getBankAccount(id, userId)
  if (!account) return undefined

  // Delete all bank transactions for this account
  await prisma.bankTransaction.deleteMany({
    where: { bankAccountId: id, userId },
  })

  return await prisma.bankAccount.delete({
    where: { id },
  })
}

// ---- BankTransaction functions ----

export async function importBankTransactions(
  userId: string,
  bankAccountId: string,
  transactions: BankTransactionInput[],
  importBatch: string
): Promise<{ imported: number; skipped: number }> {
  let imported = 0
  let skipped = 0

  for (const tx of transactions) {
    // Check for duplicate: same bankAccountId + date + amount + description
    const existing = await prisma.bankTransaction.findFirst({
      where: {
        bankAccountId,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
      },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.bankTransaction.create({
      data: {
        userId,
        bankAccountId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        reference: tx.reference,
        importBatch,
      },
    })
    imported++
  }

  return { imported, skipped }
}

export async function listUnmatched(userId: string, bankAccountId?: string) {
  const where: Record<string, unknown> = { userId, status: "unmatched" }
  if (bankAccountId) where.bankAccountId = bankAccountId

  return await prisma.bankTransaction.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function matchTransaction(bankTxId: string, txId: string, userId: string) {
  const bankTx = await prisma.bankTransaction.findFirst({
    where: { id: bankTxId, userId },
  })
  if (!bankTx) return undefined

  return await prisma.bankTransaction.update({
    where: { id: bankTxId },
    data: {
      status: "matched",
      matchedTxId: txId,
    },
  })
}

export async function excludeTransaction(bankTxId: string, userId: string) {
  const bankTx = await prisma.bankTransaction.findFirst({
    where: { id: bankTxId, userId },
  })
  if (!bankTx) return undefined

  return await prisma.bankTransaction.update({
    where: { id: bankTxId },
    data: {
      status: "excluded",
    },
  })
}

export async function unmatchTransaction(bankTxId: string, userId: string) {
  const bankTx = await prisma.bankTransaction.findFirst({
    where: { id: bankTxId, userId },
  })
  if (!bankTx) return undefined

  return await prisma.bankTransaction.update({
    where: { id: bankTxId },
    data: {
      status: "unmatched",
      matchedTxId: null,
    },
  })
}

export async function getMerchantCategories(
  userId: string
): Promise<Array<{ merchant: string; categoryCode: string; count: number }>> {
  const results = await prisma.$queryRaw<
    Array<{ merchant: string; categoryCode: string; count: number }>
  >`
    SELECT merchant, categoryCode, COUNT(*) as count
    FROM Transaction
    WHERE userId = ${userId}
      AND merchant IS NOT NULL
      AND merchant != ''
      AND categoryCode IS NOT NULL
      AND categoryCode != ''
    GROUP BY merchant, categoryCode
    ORDER BY merchant ASC, count DESC
  `

  // For each merchant, keep only the most common category
  const merchantMap = new Map<string, { merchant: string; categoryCode: string; count: number }>()
  for (const row of results) {
    const existing = merchantMap.get(row.merchant)
    if (!existing || Number(row.count) > Number(existing.count)) {
      merchantMap.set(row.merchant, {
        merchant: row.merchant,
        categoryCode: row.categoryCode,
        count: Number(row.count),
      })
    }
  }

  return Array.from(merchantMap.values())
}

export async function listBankTransactions(userId: string, filters?: BankTransactionFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId
    if (filters.status) where.status = filters.status

    if (filters.dateFrom || filters.dateTo) {
      where.date = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      }
    }
  }

  return await prisma.bankTransaction.findMany({
    where,
    orderBy: { date: "desc" },
  })
}
