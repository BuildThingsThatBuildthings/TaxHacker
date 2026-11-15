import { getOrCreateUser } from "../models/user.js"
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  markSent,
  markPaid,
  voidInvoice,
  listOverdue,
  getAgingReport,
} from "../models/invoices.js"
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
      if (flags.project) filters.projectCode = flags.project
      const result = await listInvoices(user.id, filters)
      outputJSON(result)
      break
    }
    case "get": {
      const id = positional[1]
      if (!id) return outputError("Usage: get <id>")
      const inv = await getInvoice(id, user.id)
      if (!inv) return outputError(`Invoice not found: ${id}`)
      outputJSON(inv)
      break
    }
    case "create": {
      if (!flags.client) return outputError("--client is required")
      if (!flags.items) return outputError("--items is required (JSON array of line items)")
      let lineItems
      try {
        lineItems = JSON.parse(flags.items)
      } catch {
        return outputError("Invalid --items JSON. Expected: [{\"description\":\"...\",\"quantity\":1,\"unitPrice\":500000,\"amount\":500000}]")
      }
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return outputError("--items must be a non-empty JSON array")
      }
      const data: Record<string, unknown> = {
        clientName: flags.client,
        lineItems,
      }
      if (flags["client-email"]) data.clientEmail = flags["client-email"]
      if (flags["contact-id"]) data.contactId = flags["contact-id"]
      if (flags.currency) data.currencyCode = flags.currency
      if (flags["tax-rate"]) data.taxRate = parseInt(flags["tax-rate"], 10)
      if (flags.project) data.projectCode = flags.project
      if (flags["due-date"]) {
        if (isNaN(new Date(flags["due-date"]).getTime())) return outputError("Invalid due-date format. Use YYYY-MM-DD")
        data.dueDate = flags["due-date"]
      }
      if (flags.notes) data.notes = flags.notes
      const inv = await createInvoice(user.id, data as any)
      outputJSON(inv)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--field value ...]")
      const data: Record<string, unknown> = {}
      if (flags.client) data.clientName = flags.client
      if (flags["client-email"]) data.clientEmail = flags["client-email"]
      if (flags["contact-id"]) data.contactId = flags["contact-id"]
      if (flags.currency) data.currencyCode = flags.currency
      if (flags.project) data.projectCode = flags.project
      if (flags.notes) data.notes = flags.notes
      if (flags["due-date"]) {
        if (isNaN(new Date(flags["due-date"]).getTime())) return outputError("Invalid due-date format. Use YYYY-MM-DD")
        data.dueDate = flags["due-date"]
      }
      if (flags["tax-rate"]) data.taxRate = parseInt(flags["tax-rate"], 10)
      if (flags.items) {
        try {
          data.lineItems = JSON.parse(flags.items)
        } catch {
          return outputError("Invalid --items JSON")
        }
      }
      const inv = await updateInvoice(id, user.id, data as any)
      if (!inv) return outputError(`Invoice not found or not in draft status: ${id}`)
      outputJSON(inv)
      break
    }
    case "mark-sent": {
      const id = positional[1]
      if (!id) return outputError("Usage: mark-sent <id>")
      const inv = await markSent(id, user.id)
      if (!inv) return outputError(`Invoice not found: ${id}`)
      outputJSON(inv)
      break
    }
    case "mark-paid": {
      const id = positional[1]
      if (!id) return outputError("Usage: mark-paid <id> [--paid-date YYYY-MM-DD]")
      let paidDate: string | undefined
      if (flags["paid-date"]) {
        if (isNaN(new Date(flags["paid-date"]).getTime())) return outputError("Invalid paid-date format. Use YYYY-MM-DD")
        paidDate = flags["paid-date"]
      }
      const inv = await markPaid(id, user.id, paidDate)
      if (!inv) return outputError(`Invoice not found: ${id}`)
      outputJSON(inv)
      break
    }
    case "void": {
      const id = positional[1]
      if (!id) return outputError("Usage: void <id>")
      const inv = await voidInvoice(id, user.id)
      if (!inv) return outputError(`Invoice not found: ${id}`)
      outputJSON(inv)
      break
    }
    case "overdue": {
      const result = await listOverdue(user.id)
      outputJSON(result)
      break
    }
    case "aging": {
      const result = await getAgingReport(user.id)
      outputJSON(result)
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, get, create, update, mark-sent, mark-paid, void, overdue, aging`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
