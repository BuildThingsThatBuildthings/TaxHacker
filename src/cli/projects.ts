import { getOrCreateUser } from "../models/user.js"
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../models/projects.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "list": {
      const projects = await listProjects(user.id)
      outputJSON(projects)
      break
    }
    case "create": {
      if (!flags.name) return outputError("--name is required")
      const data: Record<string, string> = { name: flags.name }
      if (flags.color) data.color = flags.color
      if (flags.prompt) data.prompt = flags.prompt
      const project = await createProject(user.id, data)
      outputJSON(project)
      break
    }
    case "update": {
      const code = positional[1]
      if (!code) return outputError("Usage: update <code> [--name X] [--color X] [--prompt X]")
      const data: Record<string, string> = {}
      if (flags.name) data.name = flags.name
      if (flags.color) data.color = flags.color
      if (flags.prompt) data.prompt = flags.prompt
      const project = await updateProject(user.id, code, data)
      outputJSON(project)
      break
    }
    case "delete": {
      const code = positional[1]
      if (!code) return outputError("Usage: delete <code>")
      await deleteProject(user.id, code)
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
