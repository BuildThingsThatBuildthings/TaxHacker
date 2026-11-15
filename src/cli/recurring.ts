import { getOrCreateUser } from "../models/user.js"
import {
  listRecurring,
  listDueRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  deactivateRecurring,
  generateDueTransactions,
} from "../models/recurring.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const items = await listRecurring(user.id)
      outputJSON(items)
      break
    }
    case "due": {
      const items = await listDueRecurring(user.id)
      outputJSON(items)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      if (!flags.total) return outputError("--total is required (in cents)")
      if (!flags.frequency) return outputError("--frequency is required (weekly, monthly, quarterly, yearly)")
      if (!flags.start) return outputError("--start is required (YYYY-MM-DD next due date)")
      if (isNaN(parseInt(flags.total))) return outputError("Invalid total: must be a number in cents")
      if (isNaN(new Date(flags.start).getTime())) return outputError("Invalid start date. Use YYYY-MM-DD")

      const item = await createRecurring(user.id, {
        name: flags.name,
        total: parseInt(flags.total, 10),
        frequency: flags.frequency,
        nextDueDate: new Date(flags.start),
        merchant: flags.merchant,
        currencyCode: flags.currency || "USD",
        type: flags.type || "expense",
        categoryCode: flags.category,
        projectCode: flags.project,
      })
      outputJSON(item)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--name X] [--total X] ...")
      const data: Record<string, unknown> = {}
      if (flags.name) data.name = flags.name
      if (flags.total) data.total = parseInt(flags.total, 10)
      if (flags.frequency) data.frequency = flags.frequency
      if (flags.start) data.nextDueDate = new Date(flags.start)
      if (flags.merchant) data.merchant = flags.merchant
      if (flags.currency) data.currencyCode = flags.currency
      if (flags.type) data.type = flags.type
      if (flags.category) data.categoryCode = flags.category
      if (flags.project) data.projectCode = flags.project
      const item = await updateRecurring(id, user.id, data)
      outputJSON(item)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteRecurring(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    case "pause": {
      const id = positional[1]
      if (!id) return outputError("Usage: pause <id>")
      await deactivateRecurring(id, user.id)
      outputJSON({ success: true, paused: id })
      break
    }
    case "generate": {
      const generated = await generateDueTransactions(user.id)
      outputJSON({ success: true, generated: generated.length, transactions: generated })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, due, create, update, delete, pause, generate`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
