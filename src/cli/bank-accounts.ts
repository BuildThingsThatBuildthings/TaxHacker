import { getOrCreateUser } from "../models/user.js"
import {
  listBankAccounts,
  createBankAccount,
  updateBalance,
  deleteBankAccount,
} from "../models/bank.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const accounts = await listBankAccounts(user.id)
      outputJSON(accounts)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      const data: Record<string, unknown> = { name: flags.name }
      if (flags.institution) data.institution = flags.institution
      if (flags.type) data.accountType = flags.type
      if (flags.currency) data.currencyCode = flags.currency
      const account = await createBankAccount(user.id, data as any)
      outputJSON(account)
      break
    }
    case "balance": {
      const id = positional[1]
      if (!id) return outputError("Usage: balance <id> --amount <cents> [--date YYYY-MM-DD]")
      if (!flags.amount) return outputError("--amount is required (in cents)")
      const amount = parseInt(flags.amount, 10)
      if (isNaN(amount)) return outputError("--amount must be a number (in cents)")
      const date = flags.date ? new Date(flags.date) : undefined
      const account = await updateBalance(id, user.id, amount, date)
      if (!account) return outputError("Bank account not found")
      outputJSON(account)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      const result = await deleteBankAccount(id, user.id)
      if (!result) return outputError("Bank account not found")
      outputJSON({ success: true, deleted: id })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, create, balance, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
