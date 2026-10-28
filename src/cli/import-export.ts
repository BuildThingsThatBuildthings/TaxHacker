import { createWriteStream, createReadStream } from "fs"
import { resolve } from "path"
import { format } from "@fast-csv/format"
import { parse } from "@fast-csv/parse"
import { getOrCreateUser } from "../models/user.js"
import { listTransactions, createTransaction } from "../models/transactions.js"
import { createBackup, restoreBackup } from "../models/backups.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

async function exportCsv(userId: string, outputPath: string, flags: Record<string, string>) {
  const filters: Record<string, unknown> = {}
  if (flags.from) filters.dateFrom = flags.from
  if (flags.to) filters.dateTo = flags.to

  const { transactions } = await listTransactions(userId, filters)
  const absPath = resolve(outputPath)

  return new Promise<void>((res, rej) => {
    const stream = format({ headers: true })
    const fileStream = createWriteStream(absPath)
    stream.pipe(fileStream)

    for (const tx of transactions as Record<string, unknown>[]) {
      stream.write({
        id: tx.id,
        name: tx.name || "",
        description: tx.description || "",
        merchant: tx.merchant || "",
        total: tx.total || 0,
        currency: tx.currencyCode || "",
        type: tx.type || "expense",
        category: tx.categoryCode || "",
        project: tx.projectCode || "",
        date: tx.issuedAt || "",
        note: tx.note || "",
      })
    }

    stream.end()
    fileStream.on("finish", () => res())
    fileStream.on("error", rej)
  })
}

async function importCsv(userId: string, csvPath: string, mappingJson: string) {
  let mapping: Record<string, string>
  try {
    mapping = JSON.parse(mappingJson)
  } catch (e: unknown) {
    throw new Error(`Invalid mapping JSON: ${(e as Error).message}`)
  }
  const absPath = resolve(csvPath)
  const rows: Record<string, unknown>[] = []

  await new Promise<void>((res, rej) => {
    const stream = createReadStream(absPath)
    const parser = parse({ headers: true, trim: true })

    stream
      .pipe(parser)
      .on("data", (row: Record<string, string>) => {
        const data: Record<string, unknown> = {}
        for (const [csvCol, fieldCode] of Object.entries(mapping)) {
          const value = row[csvCol]
          if (value === undefined || value === "") continue
          switch (fieldCode) {
            case "total":
              data.total = parseInt(value, 10)
              break
            case "issuedAt":
            case "date":
              data.issuedAt = new Date(value)
              break
            default:
              data[fieldCode] = value
          }
        }
        rows.push(data)
      })
      .on("end", () => res())
      .on("error", rej)
  })

  const created = []
  const errors: Array<{row: number, error: string}> = []
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    try {
      const tx = await createTransaction(userId, row)
      created.push(tx)
    } catch (e: unknown) {
      errors.push({ row: rowIndex, error: (e as Error).message })
    }
  }

  return { created, errors }
}

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "export-csv": {
      const output = flags.output
      if (!output) return outputError("--output is required")
      await exportCsv(user.id, output, flags)
      outputJSON({ success: true, message: `Exported to ${output}` })
      break
    }
    case "import-csv": {
      const csvFile = positional[1]
      if (!csvFile) return outputError("Usage: import-csv <file.csv> --mapping '{...}'")
      if (!flags.mapping) return outputError("--mapping is required (JSON string mapping CSV columns to fields)")
      const { created, errors } = await importCsv(user.id, csvFile, flags.mapping)
      outputJSON({ success: true, imported: created.length, errors: errors, transactions: created })
      break
    }
    case "backup": {
      const output = flags.output
      if (!output) return outputError("--output is required")
      const absPath = resolve(output)
      await createBackup(user.id, absPath)
      outputJSON({ success: true, message: `Backup created at ${absPath}` })
      break
    }
    case "restore": {
      const zipPath = positional[1]
      if (!zipPath) return outputError("Usage: restore <backup.zip>")
      const absPath = resolve(zipPath)
      await restoreBackup(user.id, absPath)
      outputJSON({ success: true, message: `Restored from ${absPath}` })
      break
    }
    default:
      outputError(`Unknown command: ${command}. Available: export-csv, import-csv, backup, restore`)
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
