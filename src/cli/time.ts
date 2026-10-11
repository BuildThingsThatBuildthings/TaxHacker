import { getOrCreateUser } from "../models/user.js"
import {
  listTimeEntries,
  logTime,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeSummary,
  listUninvoiced,
} from "../models/time.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "log": {
      if (!flags.date) return outputError("--date is required (YYYY-MM-DD)")
      if (!flags.description) return outputError("--description is required")
      if (!flags.minutes && !flags.hours) return outputError("--minutes or --hours is required")

      let minutes: number
      if (flags.hours) {
        minutes = Math.round(parseFloat(flags.hours) * 60)
      } else {
        minutes = parseInt(flags.minutes, 10)
      }

      const data: Record<string, unknown> = {
        date: new Date(flags.date),
        minutes,
        description: flags.description,
      }
      if (flags.project) data.projectCode = flags.project
      if (flags.category) data.categoryCode = flags.category
      if (flags.billable) data.billable = flags.billable === "true"
      if (flags.rate) data.hourlyRate = parseInt(flags.rate, 10)

      const entry = await logTime(user.id, data as any)
      outputJSON(entry)
      break
    }
    case "list": {
      const filters: Record<string, unknown> = {}
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      if (flags.project) filters.projectCode = flags.project
      if (flags.billable) filters.billable = flags.billable === "true"
      const entries = await listTimeEntries(user.id, filters as any)
      outputJSON(entries)
      break
    }
    case "summary": {
      const filters: Record<string, string> = {}
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      const summary = await getTimeSummary(user.id, filters)
      outputJSON(summary)
      break
    }
    case "uninvoiced": {
      const entries = await listUninvoiced(user.id, flags.project)
      outputJSON(entries)
      break
    }
    case "update": {
      const id = positional[1]
      if (!id) return outputError("Usage: update <id> [--description X] [--minutes X] [--project X] ...")
      const data: Record<string, unknown> = {}
      if (flags.description) data.description = flags.description
      if (flags.minutes) data.minutes = parseInt(flags.minutes, 10)
      if (flags.hours) data.minutes = Math.round(parseFloat(flags.hours) * 60)
      if (flags.project) data.projectCode = flags.project
      if (flags.category) data.categoryCode = flags.category
      if (flags.billable) data.billable = flags.billable === "true"
      if (flags.rate) data.hourlyRate = parseInt(flags.rate, 10)
      if (flags.date) data.date = new Date(flags.date)
      const entry = await updateTimeEntry(id, user.id, data)
      if (!entry) return outputError(`Time entry ${id} not found`)
      outputJSON(entry)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteTimeEntry(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: log, list, summary, uninvoiced, update, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
