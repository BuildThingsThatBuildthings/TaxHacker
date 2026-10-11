import { getOrCreateUser } from "../models/user.js"
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
} from "../models/contacts.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const filters: Record<string, string> = {}
      if (flags.type) filters.type = flags.type
      const contacts = await listContacts(user.id, filters)
      outputJSON(contacts)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      const data: Record<string, unknown> = { name: flags.name }
      if (flags.type) data.type = flags.type
      if (flags.email) data.email = flags.email
      if (flags.phone) data.phone = flags.phone
      if (flags.address) data.address = flags.address
      if (flags["tax-id"]) data.taxId = flags["tax-id"]
      if (flags["w9-received"]) data.w9Received = flags["w9-received"] === "true"
      if (flags["payment-terms"]) data.paymentTerms = flags["payment-terms"]
      if (flags["default-category"]) data.defaultCategory = flags["default-category"]
      if (flags["default-project"]) data.defaultProject = flags["default-project"]
      if (flags.notes) data.notes = flags.notes
      const contact = await createContact(user.id, data as any)
      outputJSON(contact)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--name X] [--type X] [--email X] ...")
      const data: Record<string, unknown> = {}
      if (flags.name) data.name = flags.name
      if (flags.type) data.type = flags.type
      if (flags.email) data.email = flags.email
      if (flags.phone) data.phone = flags.phone
      if (flags.address) data.address = flags.address
      if (flags["tax-id"]) data.taxId = flags["tax-id"]
      if (flags["w9-received"]) data.w9Received = flags["w9-received"] === "true"
      if (flags["payment-terms"]) data.paymentTerms = flags["payment-terms"]
      if (flags["default-category"]) data.defaultCategory = flags["default-category"]
      if (flags["default-project"]) data.defaultProject = flags["default-project"]
      if (flags.notes) data.notes = flags.notes
      const contact = await updateContact(id, user.id, data)
      outputJSON(contact)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteContact(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    case "search": {
      const query = positional[1]
      if (!query) return outputError("Usage: search <query>")
      const contacts = await searchContacts(user.id, query)
      outputJSON(contacts)
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: list, create, update, delete, search`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
