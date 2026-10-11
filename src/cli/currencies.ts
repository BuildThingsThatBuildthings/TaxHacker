import { getOrCreateUser } from "../models/user.js"
import {
  listCurrencies,
  createCurrency,
  deleteCurrency,
} from "../models/currencies.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const currencies = await listCurrencies(user.id)
      outputJSON(currencies)
      break
    }
    case "add": {
      if (!flags.code) return outputError("--code is required (e.g. USD)")
      if (!flags.symbol) return outputError("--symbol is required (e.g. $)")
      const currency = await createCurrency(user.id, flags.code, flags.symbol)
      outputJSON(currency)
      break
    }
    case "delete": {
      const code = positional[1]
      if (!code) return outputError("Usage: delete <code>")
      await deleteCurrency(user.id, code)
      outputJSON({ success: true, deleted: code })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, add, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
