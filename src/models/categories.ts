import { prisma } from "../lib/db.js"
import { codeFromName } from "../lib/utils.js"

export type CategoryData = {
  name: string
  color?: string
  prompt?: string
}

export async function listCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
}

export async function createCategory(userId: string, data: CategoryData) {
  const code = codeFromName(data.name)
  return await prisma.category.create({
    data: {
      code,
      name: data.name,
      color: data.color ?? "#000000",
      prompt: data.prompt,
      userId,
    },
  })
}

export async function updateCategory(userId: string, code: string, data: Partial<CategoryData>) {
  return await prisma.category.update({
    where: { userId_code: { userId, code } },
    data,
  })
}

export async function deleteCategory(userId: string, code: string) {
  // Unlink transactions from this category
  await prisma.transaction.updateMany({
    where: { userId, categoryCode: code },
    data: { categoryCode: null },
  })

  return await prisma.category.delete({
    where: { userId_code: { userId, code } },
  })
}
