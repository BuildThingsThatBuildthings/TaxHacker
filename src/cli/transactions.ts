import { getOrCreateUser } from "../models/user.js"
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
} from "../models/transactions.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const filters: Record<string, unknown> = {}
      if (flags.search) filters.search = flags.search
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      if (flags.category) filters.categoryCode = flags.category
      if (flags.project) filters.projectCode = flags.project
      if (flags.type) filters.type = flags.type
      if (flags.limit) filters.limit = parseInt(flags.limit, 10)
      if (flags.offset) filters.offset = parseInt(flags.offset, 10)
      if (flags.order) filters.ordering = flags.order
      const result = await listTransactions(user.id, filters)
      outputJSON(result)
      break
    }
    case "get": {
      const id = positional[1]
      if (!id) return outputError("Usage: get <id>")
      const tx = await getTransaction(id, user.id)
      if (!tx) return outputError(`Transaction not found: ${id}`)
      outputJSON(tx)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      if (!flags.total) return outputError("--total is required (in cents)")
      if (isNaN(parseInt(flags.total))) return outputError("Invalid total: must be a number in cents")
      if (flags.date && isNaN(new Date(flags.date).getTime())) return outputError("Invalid date format. Use YYYY-MM-DD")
      if (flags.type && flags.type !== "expense" && flags.type !== "income") return outputError("Invalid type: must be 'expense' or 'income'")
      const data: Record<string, unknown> = {
        name: flags.name,
        total: parseInt(flags.total, 10),
        currencyCode: flags.currency || "USD",
        type: flags.type || "expense",
      }
      if (flags.category) data.categoryCode = flags.category
      if (flags.project) data.projectCode = flags.project
      if (flags.date) data.issuedAt = new Date(flags.date)
      if (flags.merchant) data.merchant = flags.merchant
      if (flags.note) data.note = flags.note
      if (flags.description) data.description = flags.description
      const tx = await createTransaction(user.id, data)
      outputJSON(tx)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--field value ...]")
      if (flags.total && isNaN(parseInt(flags.total))) return outputError("Invalid total: must be a number in cents")
      if (flags.date && isNaN(new Date(flags.date).getTime())) return outputError("Invalid date format. Use YYYY-MM-DD")
      if (flags.type && flags.type !== "expense" && flags.type !== "income") return outputError("Invalid type: must be 'expense' or 'income'")
      const data: Record<string, unknown> = {}
      if (flags.name) data.name = flags.name
      if (flags.total) data.total = parseInt(flags.total, 10)
      if (flags.currency) data.currencyCode = flags.currency
      if (flags.category) data.categoryCode = flags.category
      if (flags.project) data.projectCode = flags.project
      if (flags.date) data.issuedAt = new Date(flags.date)
      if (flags.merchant) data.merchant = flags.merchant
      if (flags.type) data.type = flags.type
      if (flags.note) data.note = flags.note
      const tx = await updateTransaction(id, user.id, data)
      outputJSON(tx)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteTransaction(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    case "bulk-delete": {
      const ids = positional.slice(1)
      if (ids.length === 0) return outputError("Usage: bulk-delete <id1> <id2> ...")
      await bulkDeleteTransactions(ids, user.id)
      outputJSON({ success: true, deleted: ids })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, get, create, update, delete, bulk-delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
