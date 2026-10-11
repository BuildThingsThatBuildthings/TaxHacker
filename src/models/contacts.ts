import { prisma } from "../lib/db.js"

export type ContactData = {
  name: string
  type?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  taxId?: string | null
  w9Received?: boolean
  paymentTerms?: string | null
  defaultCategory?: string | null
  defaultProject?: string | null
  notes?: string | null
}

export type ContactFilters = {
  search?: string
  type?: string
}

export async function listContacts(userId: string, filters?: ContactFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ]
    }

    if (filters.type) {
      where.type = filters.type
    }
  }

  return await prisma.contact.findMany({
    where,
    orderBy: { name: "asc" },
  })
}

export async function getContact(id: string, userId: string) {
  return await prisma.contact.findFirst({
    where: { id, userId },
  })
}

export async function getContactByName(name: string, userId: string) {
  return await prisma.contact.findFirst({
    where: { userId, name },
  })
}

export async function createContact(userId: string, data: ContactData) {
  return await prisma.contact.create({
    data: {
      name: data.name,
      type: data.type ?? "client",
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxId: data.taxId,
      w9Received: data.w9Received ?? false,
      paymentTerms: data.paymentTerms,
      defaultCategory: data.defaultCategory,
      defaultProject: data.defaultProject,
      notes: data.notes,
      userId,
    },
  })
}

export async function updateContact(id: string, userId: string, data: Partial<ContactData>) {
  return await prisma.contact.update({
    where: { id },
    data,
  })
}

export async function deleteContact(id: string, userId: string) {
  const contact = await getContact(id, userId)
  if (!contact) return undefined

  return await prisma.contact.delete({
    where: { id },
  })
}

export async function searchContacts(userId: string, query: string) {
  return await prisma.contact.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { notes: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
  })
}
