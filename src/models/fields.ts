import { prisma } from "../lib/db.js"
import { codeFromName } from "../lib/utils.js"

export type FieldData = {
  name: string
  type?: string
  prompt?: string
  required?: boolean
  isExtra?: boolean
}

export async function listFields(userId: string) {
  return await prisma.field.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })
}

export async function createField(userId: string, data: FieldData) {
  const code = codeFromName(data.name)
  return await prisma.field.create({
    data: {
      code,
      name: data.name,
      type: data.type ?? "string",
      prompt: data.prompt,
      required: data.required ?? false,
      isExtra: data.isExtra ?? true,
      userId,
    },
  })
}

export async function updateField(userId: string, code: string, data: Partial<FieldData>) {
  return await prisma.field.update({
    where: { userId_code: { code, userId } },
    data,
  })
}

export async function deleteField(userId: string, code: string) {
  return await prisma.field.delete({
    where: { userId_code: { code, userId } },
  })
}
