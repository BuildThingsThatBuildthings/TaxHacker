import { prisma } from "../lib/db.js"

export type MileageData = {
  date: Date
  origin: string
  destination: string
  miles: number
  purpose: string
  projectCode?: string
  roundTrip?: boolean
}

export type MileageFilters = {
  dateFrom?: string
  dateTo?: string
  projectCode?: string
}

export async function listMileage(userId: string, filters?: MileageFilters) {
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
  }

  return await prisma.mileageLog.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function getMileage(id: string, userId: string) {
  return await prisma.mileageLog.findFirst({
    where: { id, userId },
  })
}

export async function logMileage(userId: string, data: MileageData) {
  const miles = data.roundTrip ? data.miles * 2 : data.miles

  return await prisma.mileageLog.create({
    data: {
      date: data.date,
      origin: data.origin,
      destination: data.destination,
      miles,
      purpose: data.purpose,
      projectCode: data.projectCode,
      roundTrip: data.roundTrip ?? false,
      userId,
    },
  })
}

export async function deleteMileage(id: string, userId: string) {
  const entry = await getMileage(id, userId)
  if (!entry) return undefined

  return await prisma.mileageLog.delete({
    where: { id },
  })
}

export async function getMileageSummary(userId: string, filters?: MileageFilters) {
  const where: Record<string, unknown> = { userId }

  if (filters) {
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom)
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo)
      where.date = dateFilter
    }
  }

  const entries = await prisma.mileageLog.findMany({ where })

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0)
  const totalTrips = entries.length

  const projectMap: Record<string, { miles: number; trips: number }> = {}
  for (const entry of entries) {
    const key = entry.projectCode || "(none)"
    if (!projectMap[key]) projectMap[key] = { miles: 0, trips: 0 }
    projectMap[key].miles += entry.miles
    projectMap[key].trips += 1
  }

  const byProject = Object.entries(projectMap).map(([project, data]) => ({
    project,
    miles: data.miles,
    trips: data.trips,
  }))

  return { totalMiles, totalTrips, byProject }
}

export async function getMileageDeduction(userId: string, year: number, ratePerMile: number) {
  const dateFrom = new Date(`${year}-01-01`)
  const dateTo = new Date(`${year}-12-31T23:59:59`)

  const entries = await prisma.mileageLog.findMany({
    where: {
      userId,
      date: { gte: dateFrom, lte: dateTo },
    },
  })

  const totalMiles = entries.reduce((sum, e) => sum + e.miles, 0)
  const totalTrips = entries.length
  // totalMiles is in tenths, ratePerMile is in cents
  // deduction = totalMiles * ratePerMile / 10 (converts tenths to whole miles, result in cents)
  const deduction = Math.round(totalMiles * ratePerMile / 10)

  return { year, totalMiles, totalTrips, ratePerMile, deduction }
}
