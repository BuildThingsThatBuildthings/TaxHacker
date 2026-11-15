import { getOrCreateUser } from "../models/user.js"
import {
  listMileage,
  logMileage,
  deleteMileage,
  getMileageSummary,
  getMileageDeduction,
} from "../models/mileage.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "log": {
      if (!flags.date) return outputError("--date is required (YYYY-MM-DD)")
      if (!flags.origin) return outputError("--origin is required")
      if (!flags.destination) return outputError("--destination is required")
      if (!flags.miles) return outputError("--miles is required (tenths of a mile, e.g., 225 = 22.5 miles)")
      if (!flags.purpose) return outputError("--purpose is required")

      // Support decimal input: if user passes 22.5, multiply by 10 and round
      let miles: number
      const rawMiles = parseFloat(flags.miles)
      if (flags.miles.includes(".")) {
        miles = Math.round(rawMiles * 10)
      } else {
        miles = Math.round(rawMiles)
      }

      const entry = await logMileage(user.id, {
        date: new Date(flags.date),
        origin: flags.origin,
        destination: flags.destination,
        miles,
        purpose: flags.purpose,
        projectCode: flags.project,
        roundTrip: flags["round-trip"] === "true",
      })
      outputJSON(entry)
      break
    }
    case "list": {
      const filters: Record<string, string> = {}
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      if (flags.project) filters.projectCode = flags.project
      const entries = await listMileage(user.id, filters)
      outputJSON(entries)
      break
    }
    case "summary": {
      const filters: Record<string, string> = {}
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      const summary = await getMileageSummary(user.id, filters)
      outputJSON(summary)
      break
    }
    case "deduction": {
      if (!flags.year) return outputError("--year is required (YYYY)")
      const year = parseInt(flags.year, 10)
      const rate = flags.rate ? parseInt(flags.rate, 10) : 70
      const deduction = await getMileageDeduction(user.id, year, rate)
      outputJSON(deduction)
      break
    }
    case "delete": {
      const id = positional[1]
      if (!id) return outputError("Usage: delete <id>")
      await deleteMileage(id, user.id)
      outputJSON({ success: true, deleted: id })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: log, list, summary, deduction, delete`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
