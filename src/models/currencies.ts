import { prisma } from "../lib/db.js"

export async function listCurrencies(userId: string) {
  return await prisma.currency.findMany({
    where: { userId },
    orderBy: { code: "asc" },
  })
}

export async function createCurrency(userId: string, code: string, symbol: string) {
  return await prisma.currency.create({
    data: {
      code,
      symbol,
      userId,
    },
  })
}

export async function deleteCurrency(userId: string, code: string) {
  return await prisma.currency.delete({
    where: { userId_code: { code, userId } },
  })
}
