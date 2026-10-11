import { getOrCreateUser } from "../models/user.js"
import {
  getAllSettings,
  getSetting,
  setSetting,
} from "../models/settings.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const settings = await getAllSettings(user.id)
      outputJSON(settings)
      break
    }
    case "get": {
      const code = positional[1]
      if (!code) return outputError("Usage: get <code>")
      const setting = await getSetting(user.id, code)
      if (!setting) return outputError(`Setting not found: ${code}`)
      outputJSON(setting)
      break
    }
    case "set": {
      const code = positional[1]
      const value = positional[2]
      if (!code || value === undefined) return outputError("Usage: set <code> <value>")
      const setting = await setSetting(user.id, code, value)
      outputJSON(setting)
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, get, set`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
