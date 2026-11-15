import { getOrCreateUser } from "../models/user.js"
import {
  registerFile,
  listUnsortedFiles,
  getFile,
  linkFileToTransaction,
  deleteFile,
} from "../models/files.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { config } from "../lib/config.js"
import { prisma } from "../lib/db.js"
import path from "path"

async function main() {
  const user = await getOrCreateUser()
  const { positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "upload": {
      const sourcePath = positional[1]
      if (!sourcePath) return outputError("Usage: upload <path>")
      const file = await registerFile(user.id, sourcePath)
      outputJSON(file)
      break
    }
    case "list-unsorted": {
      const files = await listUnsortedFiles(user.id)
      outputJSON(files)
      break
    }
    case "preview": {
      const id = positional[1]
      if (!id) return outputError("Usage: preview <id>")
      const file = await getFile(id, user.id)
      if (!file) return outputError(`File not found: ${id}`)
      const absolutePath = path.resolve(config.uploadPath, file.path)
      outputJSON({ id: file.id, filename: file.filename, path: absolutePath, mimetype: file.mimetype })
      break
    }
    case "link": {
      const fileId = positional[1]
      const transactionId = positional[2]
      if (!fileId || !transactionId) return outputError("Usage: link <fileId> <transactionId>")
      await linkFileToTransaction(fileId, transactionId, user.id)
      outputJSON({ success: true, fileId, transactionId })
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteFile(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: upload, list-unsorted, preview, link, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
