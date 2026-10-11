import { prisma } from "../lib/db.js"

export type TimeEntryData = {
  date: Date
  minutes: number
  description: string
  projectCode?: string
  categoryCode?: string
  billable?: boolean
  hourlyRate?: number
}

export type TimeEntryFilters = {
  dateFrom?: string
  dateTo?: string
  projectCode?: string
  billable?: boolean
  invoiceId?: string
}

export async function listTimeEntries(userId: string, filters?: TimeEntryFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom)
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo)
      where.date = dateFilter
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.billable !== undefined) {
      where.billable = filters.billable
    }

    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId
    }
  }

  return await prisma.timeEntry.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function getTimeEntry(id: string, userId: string) {
  return await prisma.timeEntry.findFirst({
    where: { id, userId },
  })
}

export async function logTime(userId: string, data: TimeEntryData) {
  return await prisma.timeEntry.create({
    data: {
      date: data.date,
      minutes: data.minutes,
      description: data.description,
      projectCode: data.projectCode,
      categoryCode: data.categoryCode,
      billable: data.billable ?? true,
      hourlyRate: data.hourlyRate,
      userId,
    },
  })
}

export async function updateTimeEntry(id: string, userId: string, data: Partial<TimeEntryData>) {
  const entry = await getTimeEntry(id, userId)
  if (!entry) return undefined

  return await prisma.timeEntry.update({
    where: { id },
    data,
  })
}

export async function deleteTimeEntry(id: string, userId: string) {
  const entry = await getTimeEntry(id, userId)
  if (!entry) return undefined

  return await prisma.timeEntry.delete({
    where: { id },
  })
}

export async function getTimeSummary(userId: string, filters?: TimeEntryFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom)
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo)
      where.date = dateFilter
    }
  }

  const entries = await prisma.timeEntry.findMany({ where })

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100
  const billableMinutes = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.minutes, 0)
  const nonBillableMinutes = totalMinutes - billableMinutes

  const projectMap: Record<string, { minutes: number }> = {}
  for (const entry of entries) {
    const key = entry.projectCode || "(none)"
    if (!projectMap[key]) projectMap[key] = { minutes: 0 }
    projectMap[key].minutes += entry.minutes
  }

  const byProject = Object.entries(projectMap).map(([project, data]) => ({
    project,
    minutes: data.minutes,
    hours: Math.round((data.minutes / 60) * 100) / 100,
  }))

  return { totalMinutes, totalHours, billableMinutes, nonBillableMinutes, byProject }
}

export async function listUninvoiced(userId: string, projectCode?: string) {
  const where: Record<string, unknown> = {
    userId,
    billable: true,
    invoiceId: null,
  }

  if (projectCode) {
    where.projectCode = projectCode
  }

  return await prisma.timeEntry.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function markInvoiced(ids: string[], invoiceId: string, userId: string) {
  return await prisma.timeEntry.updateMany({
    where: {
      id: { in: ids },
      userId,
    },
    data: { invoiceId },
  })
}
