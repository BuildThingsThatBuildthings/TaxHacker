import { getOrCreateUser } from "../models/user.js"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../models/categories.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const categories = await listCategories(user.id)
      outputJSON(categories)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      const data: Record<string, string> = { name: flags.name }
      if (flags.color) data.color = flags.color
      if (flags.prompt) data.prompt = flags.prompt
      const category = await createCategory(user.id, data)
      outputJSON(category)
      break
    }
    case "update": {
      const code = positional[1]
      if (!code) return outputError("Usage: update <code> [--name X] [--color X] [--prompt X]")
      const data: Record<string, string> = {}
      if (flags.name) data.name = flags.name
      if (flags.color) data.color = flags.color
      if (flags.prompt) data.prompt = flags.prompt
      const category = await updateCategory(user.id, code, data)
      outputJSON(category)
      break
    }
    case "delete": {
      const code = positional[1]
      if (!code) return outputError("Usage: delete <code>")
      await deleteCategory(user.id, code)
      outputJSON({ success: true, deleted: code })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, create, update, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
