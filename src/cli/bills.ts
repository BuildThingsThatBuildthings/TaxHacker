import { getOrCreateUser } from "../models/user.js"
import {
  listBills,
  getBill,
  createBill,
  updateBill,
  approveBill,
  markPaid,
  listOverdue,
  listDueThisWeek,
  getAgingReport,
} from "../models/bills.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const filters: Record<string, unknown> = {}
      if (flags.status) filters.status = flags.status
      if (flags.contact) filters.contactId = flags.contact
      if (flags.category) filters.categoryCode = flags.category
      if (flags.project) filters.projectCode = flags.project
      const bills = await listBills(user.id, filters)
      outputJSON(bills)
      break
    }
    case "get": {
      const id = positional[1]
      if (!id) return outputError("Usage: get <id>")
      const bill = await getBill(id, user.id)
      if (!bill) return outputError(`Bill not found: ${id}`)
      outputJSON(bill)
      break
    }
    case "create": {
      if (!flags.vendor) return outputError("--vendor is required")
      if (!flags.total) return outputError("--total is required (in cents)")
      if (isNaN(parseInt(flags.total))) return outputError("Invalid total: must be a number in cents")
      if (flags["due-date"] && isNaN(new Date(flags["due-date"]).getTime())) return outputError("Invalid due-date format. Use YYYY-MM-DD")
      if (flags["issued-date"] && isNaN(new Date(flags["issued-date"]).getTime())) return outputError("Invalid issued-date format. Use YYYY-MM-DD")

      const data: Record<string, unknown> = {
        vendorName: flags.vendor,
        total: parseInt(flags.total, 10),
        currencyCode: flags.currency || "USD",
      }
      if (flags["bill-number"]) data.billNumber = flags["bill-number"]
      if (flags["contact-id"]) data.contactId = flags["contact-id"]
      if (flags.category) data.categoryCode = flags.category
      if (flags.project) data.projectCode = flags.project
      if (flags["due-date"]) data.dueDate = flags["due-date"]
      if (flags["issued-date"]) data.issuedAt = flags["issued-date"]
      if (flags.notes) data.notes = flags.notes
      if (flags.items) {
        try {
          data.lineItems = JSON.parse(flags.items)
        } catch {
          return outputError("Invalid items JSON")
        }
      }

      const bill = await createBill(user.id, data)
      outputJSON(bill)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--field value ...]")
      if (flags.total && isNaN(parseInt(flags.total))) return outputError("Invalid total: must be a number in cents")
      if (flags["due-date"] && isNaN(new Date(flags["due-date"]).getTime())) return outputError("Invalid due-date format. Use YYYY-MM-DD")
      if (flags["issued-date"] && isNaN(new Date(flags["issued-date"]).getTime())) return outputError("Invalid issued-date format. Use YYYY-MM-DD")

      const data: Record<string, unknown> = {}
      if (flags.vendor) data.vendorName = flags.vendor
      if (flags.total) data.total = parseInt(flags.total, 10)
      if (flags.currency) data.currencyCode = flags.currency
      if (flags["bill-number"]) data.billNumber = flags["bill-number"]
      if (flags["contact-id"]) data.contactId = flags["contact-id"]
      if (flags.category) data.categoryCode = flags.category
      if (flags.project) data.projectCode = flags.project
      if (flags["due-date"]) data.dueDate = flags["due-date"]
      if (flags["issued-date"]) data.issuedAt = flags["issued-date"]
      if (flags.notes) data.notes = flags.notes
      if (flags.items) {
        try {
          data.lineItems = JSON.parse(flags.items)
        } catch {
          return outputError("Invalid items JSON")
        }
      }

      try {
        const bill = await updateBill(id, user.id, data)
        if (!bill) return outputError(`Bill not found: ${id}`)
        outputJSON(bill)
      } catch (e: unknown) {
        return outputError((e as Error).message)
      }
      break
    }
    case "approve": {
      const id = positional[1]
      if (!id) return outputError("Usage: approve <id>")
      try {
        const bill = await approveBill(id, user.id)
        if (!bill) return outputError(`Bill not found: ${id}`)
        outputJSON(bill)
      } catch (e: unknown) {
        return outputError((e as Error).message)
      }
      break
    }
    case "mark-paid": {
      const id = positional[1]
      if (!id) return outputError("Usage: mark-paid <id> [--paid-date YYYY-MM-DD]")
      if (flags["paid-date"] && isNaN(new Date(flags["paid-date"]).getTime())) return outputError("Invalid paid-date format. Use YYYY-MM-DD")

      try {
        const paidDate = flags["paid-date"] || undefined
        const bill = await markPaid(id, user.id, paidDate)
        if (!bill) return outputError(`Bill not found: ${id}`)
        outputJSON(bill)
      } catch (e: unknown) {
        return outputError((e as Error).message)
      }
      break
    }
    case "overdue": {
      const bills = await listOverdue(user.id)
      outputJSON(bills)
      break
    }
    case "due-this-week": {
      const bills = await listDueThisWeek(user.id)
      outputJSON(bills)
      break
    }
    case "aging": {
      const report = await getAgingReport(user.id)
      outputJSON(report)
      break
    }
    default:
      outputError(
        `Unknown command: ${command}. Available: list, get, create, update, approve, mark-paid, overdue, due-this-week, aging`
      )
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
