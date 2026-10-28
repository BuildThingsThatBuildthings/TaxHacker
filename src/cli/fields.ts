import { getOrCreateUser } from "../models/user.js"
import {
  listFields,
  createField,
  updateField,
  deleteField,
} from "../models/fields.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const fields = await listFields(user.id)
      outputJSON(fields)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      const data: Record<string, unknown> = { name: flags.name }
      if (flags.type) data.type = flags.type
      if (flags.prompt) data.prompt = flags.prompt
      if (flags.required) data.required = flags.required === "true"
      if (flags.extra) data.isExtra = flags.extra === "true"
      const field = await createField(user.id, data)
      outputJSON(field)
      break
    }
    case "update": {
      const code = positional[1]
      if (!code) return outputError("Usage: update <code> [--name X] [--type X] [--prompt X] [--required true|false] [--extra true|false]")
      const data: Record<string, unknown> = {}
      if (flags.name) data.name = flags.name
      if (flags.type) data.type = flags.type
      if (flags.prompt) data.prompt = flags.prompt
      if (flags.required) data.required = flags.required === "true"
      if (flags.extra) data.isExtra = flags.extra === "true"
      const field = await updateField(user.id, code, data)
      outputJSON(field)
      break
    }
    case "delete": {
      const code = positional[1]
      if (!code) return outputError("Usage: delete <code>")
      await deleteField(user.id, code)
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
