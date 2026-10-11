import { getOrCreateUser } from "../models/user.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

function buildDateFilter(flags: Record<string, string>) {
  const filter: Record<string, Date> = {}
  if (flags.from) filter.gte = new Date(flags.from)
  if (flags.to) filter.lte = new Date(flags.to)
  return Object.keys(filter).length > 0 ? filter : undefined
}

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  const dateFilter = buildDateFilter(flags)
  const where: Record<string, unknown> = { userId: user.id }
  if (dateFilter) where.issuedAt = dateFilter

  switch (command) {
    case "summary": {
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, type: true, currencyCode: true },
      })

      const byCurrency: Record<string, { income: number; expenses: number; net: number }> = {}
      for (const tx of transactions) {
        const currency = tx.currencyCode || "USD"
        if (!byCurrency[currency]) byCurrency[currency] = { income: 0, expenses: 0, net: 0 }
        const amount = tx.total || 0
        if (tx.type === "income") {
          byCurrency[currency].income += amount
        } else {
          byCurrency[currency].expenses += amount
        }
        byCurrency[currency].net = byCurrency[currency].income - byCurrency[currency].expenses
      }

      outputJSON({
        totalTransactions: transactions.length,
        byCurrency,
      })
      break
    }
    case "by-category": {
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, type: true, currencyCode: true, categoryCode: true },
      })

      const byCategory: Record<string, Record<string, { income: number; expenses: number; net: number; count: number }>> = {}
      for (const tx of transactions) {
        const cat = tx.categoryCode || "uncategorized"
        const currency = tx.currencyCode || "USD"
        if (!byCategory[cat]) byCategory[cat] = {}
        if (!byCategory[cat][currency]) byCategory[cat][currency] = { income: 0, expenses: 0, net: 0, count: 0 }
        const amount = tx.total || 0
        byCategory[cat][currency].count++
        if (tx.type === "income") {
          byCategory[cat][currency].income += amount
        } else {
          byCategory[cat][currency].expenses += amount
        }
        byCategory[cat][currency].net = byCategory[cat][currency].income - byCategory[cat][currency].expenses
      }

      outputJSON(byCategory)
      break
    }
    case "by-project": {
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, type: true, currencyCode: true, projectCode: true },
      })

      const byProject: Record<string, Record<string, { income: number; expenses: number; net: number; count: number }>> = {}
      for (const tx of transactions) {
        const proj = tx.projectCode || "unassigned"
        const currency = tx.currencyCode || "USD"
        if (!byProject[proj]) byProject[proj] = {}
        if (!byProject[proj][currency]) byProject[proj][currency] = { income: 0, expenses: 0, net: 0, count: 0 }
        const amount = tx.total || 0
        byProject[proj][currency].count++
        if (tx.type === "income") {
          byProject[proj][currency].income += amount
        } else {
          byProject[proj][currency].expenses += amount
        }
        byProject[proj][currency].net = byProject[proj][currency].income - byProject[proj][currency].expenses
      }

      outputJSON(byProject)
      break
    }
    case "by-month": {
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, type: true, currencyCode: true, issuedAt: true },
      })

      const byMonth: Record<string, Record<string, { income: number; expenses: number; net: number; count: number }>> = {}
      for (const tx of transactions) {
        const month = tx.issuedAt ? tx.issuedAt.toISOString().slice(0, 7) : "unknown"
        const currency = tx.currencyCode || "USD"
        if (!byMonth[month]) byMonth[month] = {}
        if (!byMonth[month][currency]) byMonth[month][currency] = { income: 0, expenses: 0, net: 0, count: 0 }
        const amount = tx.total || 0
        byMonth[month][currency].count++
        if (tx.type === "income") {
          byMonth[month][currency].income += amount
        } else {
          byMonth[month][currency].expenses += amount
        }
        byMonth[month][currency].net = byMonth[month][currency].income - byMonth[month][currency].expenses
      }

      outputJSON(byMonth)
      break
    }
    case "by-quarter": {
      const year = parseInt(flags.year || String(new Date().getFullYear()), 10)
      const quarterWhere: Record<string, unknown> = {
        userId: user.id,
        issuedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      }

      const transactions = await prisma.transaction.findMany({
        where: quarterWhere,
        select: { total: true, type: true, currencyCode: true, issuedAt: true },
      })

      const byQuarter: Record<string, Record<string, { income: number; expenses: number; net: number; count: number }>> = {}
      for (const tx of transactions) {
        const month = tx.issuedAt ? tx.issuedAt.getMonth() + 1 : 1
        const quarter = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4"
        const currency = tx.currencyCode || "USD"
        if (!byQuarter[quarter]) byQuarter[quarter] = {}
        if (!byQuarter[quarter][currency]) byQuarter[quarter][currency] = { income: 0, expenses: 0, net: 0, count: 0 }
        const amount = tx.total || 0
        byQuarter[quarter][currency].count++
        if (tx.type === "income") {
          byQuarter[quarter][currency].income += amount
        } else {
          byQuarter[quarter][currency].expenses += amount
        }
        byQuarter[quarter][currency].net = byQuarter[quarter][currency].income - byQuarter[quarter][currency].expenses
      }

      outputJSON(byQuarter)
      break
    }
    case "top-merchants": {
      const limit = parseInt(flags.limit || "10", 10)
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, currencyCode: true, merchant: true },
      })

      const merchantMap: Record<string, { merchant: string; total: number; count: number; currency: string }> = {}
      for (const tx of transactions) {
        const merchant = tx.merchant || "unknown"
        const currency = tx.currencyCode || "USD"
        const key = `${merchant}::${currency}`
        if (!merchantMap[key]) merchantMap[key] = { merchant, total: 0, count: 0, currency }
        merchantMap[key].total += tx.total || 0
        merchantMap[key].count++
      }

      const sorted = Object.values(merchantMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)

      outputJSON(sorted)
      break
    }
    case "top-categories": {
      const limit = parseInt(flags.limit || "10", 10)
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, currencyCode: true, categoryCode: true },
      })

      const categoryMap: Record<string, { category: string; total: number; count: number; currency: string }> = {}
      for (const tx of transactions) {
        const category = tx.categoryCode || "uncategorized"
        const currency = tx.currencyCode || "USD"
        const key = `${category}::${currency}`
        if (!categoryMap[key]) categoryMap[key] = { category, total: 0, count: 0, currency }
        categoryMap[key].total += tx.total || 0
        categoryMap[key].count++
      }

      const sorted = Object.values(categoryMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)

      outputJSON(sorted)
      break
    }
    case "profit-loss": {
      const transactions = await prisma.transaction.findMany({
        where,
        select: { total: true, type: true, currencyCode: true, categoryCode: true },
      })

      const byCurrency: Record<string, {
        revenue: Record<string, { name: string; total: number; count: number }>
        totalRevenue: number
        expenses: Record<string, { name: string; total: number; count: number }>
        totalExpenses: number
        netIncome: number
      }> = {}

      for (const tx of transactions) {
        const currency = tx.currencyCode || "USD"
        if (!byCurrency[currency]) {
          byCurrency[currency] = { revenue: {}, totalRevenue: 0, expenses: {}, totalExpenses: 0, netIncome: 0 }
        }
        const amount = tx.total || 0
        const cat = tx.categoryCode || "uncategorized"

        if (tx.type === "income") {
          if (!byCurrency[currency].revenue[cat]) byCurrency[currency].revenue[cat] = { name: cat, total: 0, count: 0 }
          byCurrency[currency].revenue[cat].total += amount
          byCurrency[currency].revenue[cat].count++
          byCurrency[currency].totalRevenue += amount
        } else {
          if (!byCurrency[currency].expenses[cat]) byCurrency[currency].expenses[cat] = { name: cat, total: 0, count: 0 }
          byCurrency[currency].expenses[cat].total += amount
          byCurrency[currency].expenses[cat].count++
          byCurrency[currency].totalExpenses += amount
        }
        byCurrency[currency].netIncome = byCurrency[currency].totalRevenue - byCurrency[currency].totalExpenses
      }

      const currencies = Object.keys(byCurrency)
      if (currencies.length === 1) {
        const currency = currencies[0]
        const data = byCurrency[currency]
        outputJSON({
          period: { from: flags.from || "all", to: flags.to || "all" },
          revenue: data.revenue,
          totalRevenue: data.totalRevenue,
          expenses: data.expenses,
          totalExpenses: data.totalExpenses,
          netIncome: data.netIncome,
          currency,
        })
      } else {
        const result: Record<string, unknown> = { period: { from: flags.from || "all", to: flags.to || "all" } }
        for (const currency of currencies) {
          const data = byCurrency[currency]
          result[currency] = {
            revenue: data.revenue,
            totalRevenue: data.totalRevenue,
            expenses: data.expenses,
            totalExpenses: data.totalExpenses,
            netIncome: data.netIncome,
          }
        }
        outputJSON(result)
      }
      break
    }
    case "estimated-tax": {
      const year = parseInt(flags.year || String(new Date().getFullYear()), 10)
      const today = new Date()
      const yearStart = new Date(`${year}-01-01`)
      const ytdEnd = year === today.getFullYear() ? today : new Date(`${year}-12-31`)

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          issuedAt: { gte: yearStart, lte: ytdEnd },
        },
        select: { total: true, type: true, currencyCode: true },
      })

      // Sum in cents, USD only for tax calc
      let ytdIncome = 0
      let ytdExpenses = 0
      for (const tx of transactions) {
        const amount = tx.total || 0
        if (tx.type === "income") {
          ytdIncome += amount
        } else {
          ytdExpenses += amount
        }
      }

      const netProfit = ytdIncome - ytdExpenses
      // Convert cents to dollars for tax calculations
      const netProfitDollars = netProfit / 100

      // Self-employment tax: 92.35% of net profit * 15.3%
      const seTaxDollars = Math.max(0, netProfitDollars * 0.9235 * 0.153)

      // Taxable income = net profit minus deductible half of SE tax
      const taxableIncome = Math.max(0, netProfitDollars - seTaxDollars / 2)

      // 2025 tax brackets
      const brackets = [
        { limit: 11925, rate: 0.10 },
        { limit: 48475, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 197300, rate: 0.24 },
        { limit: 250525, rate: 0.32 },
        { limit: 626350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ]

      let incomeTaxDollars = 0
      let prevLimit = 0
      for (const bracket of brackets) {
        if (taxableIncome <= prevLimit) break
        const taxableInBracket = Math.min(taxableIncome, bracket.limit) - prevLimit
        incomeTaxDollars += taxableInBracket * bracket.rate
        prevLimit = bracket.limit
      }

      const totalAnnualTaxDollars = seTaxDollars + incomeTaxDollars
      const quarterlyPaymentDollars = totalAnnualTaxDollars / 4

      // Convert back to cents
      const selfEmploymentTax = Math.round(seTaxDollars * 100)
      const estimatedIncomeTax = Math.round(incomeTaxDollars * 100)
      const totalAnnualTax = Math.round(totalAnnualTaxDollars * 100)
      const quarterlyPayment = Math.round(quarterlyPaymentDollars * 100)

      // Next due date
      const dueDates = [
        new Date(`${year}-04-15`),
        new Date(`${year}-06-15`),
        new Date(`${year}-09-15`),
        new Date(`${year + 1}-01-15`),
      ]
      const nextDueDate = dueDates.find((d) => d > today) || dueDates[dueDates.length - 1]

      outputJSON({
        year,
        ytdIncome,
        ytdExpenses,
        netProfit,
        selfEmploymentTax,
        estimatedIncomeTax,
        totalAnnualTax,
        quarterlyPayment,
        nextDueDate: nextDueDate.toISOString().slice(0, 10),
        currency: "USD",
      })
      break
    }
    case "anomalies": {
      const transactions = await prisma.transaction.findMany({
        where: { ...where, type: "expense" },
        select: { id: true, name: true, merchant: true, total: true },
      })

      // Group by merchant
      const merchantGroups: Record<string, Array<{ id: string; name: string | null; merchant: string; total: number }>> = {}
      for (const tx of transactions) {
        const merchant = tx.merchant || "unknown"
        if (!merchantGroups[merchant]) merchantGroups[merchant] = []
        merchantGroups[merchant].push({ id: tx.id, name: tx.name, merchant, total: tx.total || 0 })
      }

      const anomalies: Array<{ id: string; name: string | null; merchant: string; total: number; average: number; stddev: number; reason: string }> = []

      for (const [merchant, txs] of Object.entries(merchantGroups)) {
        if (txs.length >= 3) {
          const amounts = txs.map((t) => t.total)
          const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
          const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
          const stddev = Math.sqrt(variance)

          for (const tx of txs) {
            if (tx.total > mean + 2 * stddev) {
              anomalies.push({
                id: tx.id,
                name: tx.name,
                merchant: tx.merchant,
                total: tx.total,
                average: Math.round(mean),
                stddev: Math.round(stddev),
                reason: `Amount ${tx.total} exceeds mean (${Math.round(mean)}) + 2*stddev (${Math.round(stddev)})`,
              })
            }
          }
        } else if (txs.length === 1 && txs[0].total > 100000) {
          const tx = txs[0]
          anomalies.push({
            id: tx.id,
            name: tx.name,
            merchant: tx.merchant,
            total: tx.total,
            average: tx.total,
            stddev: 0,
            reason: `Single transaction over $1000 from merchant with no history`,
          })
        }
      }

      outputJSON(anomalies)
      break
    }
    case "compare-periods": {
      const parsePeriod = (ym: string): { start: Date; end: Date } => {
        const [y, m] = ym.split("-").map(Number)
        const start = new Date(y, m - 1, 1)
        const end = new Date(y, m, 0, 23, 59, 59, 999)
        return { start, end }
      }

      const now = new Date()
      const currentMonth = flags.current || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonth = flags.previous || `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`

      const currentPeriod = parsePeriod(currentMonth)
      const previousPeriod = parsePeriod(previousMonth)

      const [currentTxs, previousTxs] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId: user.id, issuedAt: { gte: currentPeriod.start, lte: currentPeriod.end } },
          select: { total: true, type: true },
        }),
        prisma.transaction.findMany({
          where: { userId: user.id, issuedAt: { gte: previousPeriod.start, lte: previousPeriod.end } },
          select: { total: true, type: true },
        }),
      ])

      const sumPeriod = (txs: Array<{ total: number | null; type: string }>) => {
        let income = 0
        let expenses = 0
        for (const tx of txs) {
          const amount = tx.total || 0
          if (tx.type === "income") income += amount
          else expenses += amount
        }
        return { income, expenses, net: income - expenses, count: txs.length }
      }

      const current = { period: currentMonth, ...sumPeriod(currentTxs) }
      const previous = { period: previousMonth, ...sumPeriod(previousTxs) }

      const calcChange = (curr: number, prev: number) => {
        const amount = curr - prev
        const percent = prev === 0 ? (curr === 0 ? 0 : 100) : Math.round(((curr - prev) / Math.abs(prev)) * 10000) / 100
        return { amount, percent }
      }

      outputJSON({
        current,
        previous,
        changes: {
          income: calcChange(current.income, previous.income),
          expenses: calcChange(current.expenses, previous.expenses),
          net: calcChange(current.net, previous.net),
        },
      })
      break
    }
    case "health-check": {
      const allTxs = await prisma.transaction.findMany({
        where: { userId: user.id },
        select: { id: true, categoryCode: true, issuedAt: true, total: true, files: true, merchant: true },
      })

      const total = allTxs.length
      if (total === 0) {
        outputJSON({
          totalTransactions: 0,
          uncategorized: { count: 0, percent: 0 },
          undated: { count: 0, percent: 0 },
          missingReceipts: { count: 0, percent: 0 },
          noMerchant: { count: 0, percent: 0 },
          score: 100,
        })
        break
      }

      const uncategorizedCount = allTxs.filter((tx) => tx.categoryCode === null).length
      const undatedCount = allTxs.filter((tx) => tx.issuedAt === null).length
      const missingReceiptsCount = allTxs.filter((tx) => (tx.total || 0) > 5000 && (tx.files === "[]" || tx.files === null)).length
      const noMerchantCount = allTxs.filter((tx) => tx.merchant === null).length

      const uncategorizedPct = (uncategorizedCount / total) * 100
      const undatedPct = (undatedCount / total) * 100
      const missingReceiptsPct = (missingReceiptsCount / total) * 100
      const noMerchantPct = (noMerchantCount / total) * 100

      const score = Math.max(0, Math.round((100 - (uncategorizedPct * 0.3 + undatedPct * 0.3 + missingReceiptsPct * 0.2 + noMerchantPct * 0.2)) * 100) / 100)

      outputJSON({
        totalTransactions: total,
        uncategorized: { count: uncategorizedCount, percent: Math.round(uncategorizedPct * 100) / 100 },
        undated: { count: undatedCount, percent: Math.round(undatedPct * 100) / 100 },
        missingReceipts: { count: missingReceiptsCount, percent: Math.round(missingReceiptsPct * 100) / 100 },
        noMerchant: { count: noMerchantCount, percent: Math.round(noMerchantPct * 100) / 100 },
        score,
      })
      break
    }
    case "1099-summary": {
      const year = parseInt(flags.year || String(new Date().getFullYear()), 10)
      const yearWhere = {
        userId: user.id,
        type: "expense",
        issuedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      }

      const transactions = await prisma.transaction.findMany({
        where: yearWhere,
        select: { total: true, merchant: true, currencyCode: true },
      })

      // Group by merchant
      const byVendor: Record<string, { merchant: string; total: number; count: number; currency: string }> = {}
      for (const tx of transactions) {
        const merchant = tx.merchant || "unknown"
        const currency = tx.currencyCode || "USD"
        const key = `${merchant}::${currency}`
        if (!byVendor[key]) byVendor[key] = { merchant, total: 0, count: 0, currency }
        byVendor[key].total += tx.total || 0
        byVendor[key].count++
      }

      // Filter for 1099 threshold ($600 = 60000 cents)
      const threshold = 60000
      const needsForm = Object.values(byVendor).filter((v) => v.total >= threshold)
      const belowThreshold = Object.values(byVendor).filter((v) => v.total < threshold && v.total > 0)

      // Check contacts for W-9 status
      const contacts = await prisma.contact.findMany({
        where: { userId: user.id },
        select: { name: true, taxId: true, w9Received: true },
      })
      const contactMap = new Map(contacts.map((c) => [c.name.toLowerCase(), c]))

      const vendors1099 = needsForm
        .sort((a, b) => b.total - a.total)
        .map((v) => {
          const contact = contactMap.get(v.merchant.toLowerCase())
          return {
            ...v,
            hasTaxId: contact?.taxId ? true : false,
            w9Received: contact?.w9Received || false,
          }
        })

      outputJSON({
        year,
        threshold,
        vendorsNeedingForm: vendors1099,
        vendorsBelowThreshold: belowThreshold.length,
        totalVendors: Object.keys(byVendor).length,
        missingW9: vendors1099.filter((v) => !v.w9Received).length,
        missingTaxId: vendors1099.filter((v) => !v.hasTaxId).length,
      })
      break
    }
    case "project-profitability": {
      const transactions = await prisma.transaction.findMany({
        where: { ...where },
        select: { total: true, type: true, currencyCode: true, projectCode: true },
      })

      const byProject: Record<string, { project: string; revenue: number; expenses: number; net: number; txCount: number; currency: string }> = {}
      for (const tx of transactions) {
        const proj = tx.projectCode || "unassigned"
        const currency = tx.currencyCode || "USD"
        const key = `${proj}::${currency}`
        if (!byProject[key]) byProject[key] = { project: proj, revenue: 0, expenses: 0, net: 0, txCount: 0, currency }
        const amount = tx.total || 0
        byProject[key].txCount++
        if (tx.type === "income") {
          byProject[key].revenue += amount
        } else {
          byProject[key].expenses += amount
        }
        byProject[key].net = byProject[key].revenue - byProject[key].expenses
      }

      // Try to get time entries for hours per project
      const timeEntries = await prisma.timeEntry.findMany({
        where: { userId: user.id },
        select: { minutes: true, projectCode: true },
      })

      const hoursByProject: Record<string, number> = {}
      for (const te of timeEntries) {
        const proj = te.projectCode || "unassigned"
        hoursByProject[proj] = (hoursByProject[proj] || 0) + te.minutes
      }

      const results = Object.values(byProject)
        .sort((a, b) => b.net - a.net)
        .map((p) => ({
          ...p,
          totalMinutes: hoursByProject[p.project] || 0,
          totalHours: Math.round((hoursByProject[p.project] || 0) / 60 * 10) / 10,
          effectiveHourlyRate: hoursByProject[p.project] ? Math.round(p.net / (hoursByProject[p.project] / 60)) : null,
        }))

      outputJSON(results)
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: summary, by-category, by-project, by-month, by-quarter, top-merchants, top-categories, profit-loss, estimated-tax, anomalies, compare-periods, health-check, 1099-summary, project-profitability`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
