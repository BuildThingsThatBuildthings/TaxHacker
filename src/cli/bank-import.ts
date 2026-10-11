import * as fs from "fs"
import { parse } from "@fast-csv/parse"
import { getOrCreateUser } from "../models/user.js"
import {
  getBankAccountByName,
  importBankTransactions,
  listBankTransactions,
  listUnmatched,
  matchTransaction,
  excludeTransaction,
  unmatchTransaction,
  getMerchantCategories,
} from "../models/bank.js"
import { parseArgs, outputJSON, outputError } from "../lib/utils.js"
import { prisma } from "../lib/db.js"

type ColumnMapping = {
  date?: string
  description?: string
  amount?: string
  debit?: string
  credit?: string
  reference?: string
}

function detectColumns(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase())
  const mapping: Record<string, string> = {}
  for (let i = 0; i < lower.length; i++) {
    const h = lower[i]
    if (h.includes("date") && !mapping.date) mapping.date = headers[i]
    else if (
      (h.includes("description") ||
        h.includes("memo") ||
        h.includes("payee") ||
        h.includes("narrative")) &&
      !mapping.description
    )
      mapping.description = headers[i]
    else if (h === "amount" && !mapping.amount) mapping.amount = headers[i]
    else if ((h.includes("debit") || h === "withdrawal") && !mapping.debit)
      mapping.debit = headers[i]
    else if ((h.includes("credit") || h === "deposit") && !mapping.credit)
      mapping.credit = headers[i]
    else if (
      (h.includes("reference") || h.includes("check") || h.includes("ref")) &&
      !mapping.reference
    )
      mapping.reference = headers[i]
  }
  return mapping
}

function parseAmount(value: string | undefined | null): number {
  if (!value || value.trim() === "") return 0
  // Strip currency symbols and commas
  const cleaned = value.replace(/[$€£¥,]/g, "").trim()
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  return Math.round(num * 100) // convert to cents
}

function parseCSVFile(
  filePath: string
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = []
    let headers: string[] = []

    const stream = fs.createReadStream(filePath)
    const parser = parse({ headers: true, trim: true })

    parser.on("headers", (h: string[]) => {
      headers = h
    })

    parser.on("data", (row: Record<string, string>) => {
      rows.push(row)
    })

    parser.on("end", () => resolve({ headers, rows }))
    parser.on("error", (err: Error) => reject(err))

    stream.pipe(parser)
  })
}

async function main() {
  const user = await getOrCreateUser()
  const { flags, positional } = parseArgs(process.argv.slice(2))
  const command = positional[0]

  switch (command) {
    case "import-csv": {
      const filePath = positional[1]
      if (!filePath) return outputError("Usage: import-csv <file> --account <accountName>")
      if (!flags.account) return outputError("--account is required (bank account name)")

      if (!fs.existsSync(filePath)) return outputError(`File not found: ${filePath}`)

      const account = await getBankAccountByName(flags.account, user.id)
      if (!account) return outputError(`Bank account not found: ${flags.account}`)

      const { headers, rows } = await parseCSVFile(filePath)
      const mapping = detectColumns(headers)

      if (!mapping.date) return outputError("Could not detect a date column in CSV headers")
      if (!mapping.description)
        return outputError("Could not detect a description column in CSV headers")
      if (!mapping.amount && !mapping.debit && !mapping.credit)
        return outputError("Could not detect amount/debit/credit columns in CSV headers")

      const transactions = rows.map((row) => {
        let amount: number
        if (mapping.amount) {
          amount = parseAmount(row[mapping.amount])
        } else {
          const credit = parseAmount(row[mapping.credit!])
          const debit = parseAmount(row[mapping.debit!])
          amount = credit - debit
        }

        return {
          date: new Date(row[mapping.date!]),
          description: row[mapping.description!] || "",
          amount,
          reference: mapping.reference ? row[mapping.reference] || undefined : undefined,
        }
      })

      // Filter out rows with invalid dates
      const validTransactions = transactions.filter(
        (tx) => !isNaN(tx.date.getTime()) && tx.description
      )

      const now = new Date()
      const importBatch = `import-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`

      const result = await importBankTransactions(user.id, account.id, validTransactions, importBatch)
      outputJSON({ ...result, account: account.name, batch: importBatch })
      break
    }
    case "list": {
      const filters: Record<string, string> = {}
      if (flags.account) {
        const account = await getBankAccountByName(flags.account, user.id)
        if (!account) return outputError(`Bank account not found: ${flags.account}`)
        filters.bankAccountId = account.id
      }
      if (flags.status) filters.status = flags.status
      if (flags.from) filters.dateFrom = flags.from
      if (flags.to) filters.dateTo = flags.to
      const transactions = await listBankTransactions(user.id, filters)
      outputJSON(transactions)
      break
    }
    case "unmatched": {
      let bankAccountId: string | undefined
      if (flags.account) {
        const account = await getBankAccountByName(flags.account, user.id)
        if (!account) return outputError(`Bank account not found: ${flags.account}`)
        bankAccountId = account.id
      }
      const transactions = await listUnmatched(user.id, bankAccountId)
      outputJSON(transactions)
      break
    }
    case "match": {
      const bankTxId = positional[1]
      const txId = positional[2]
      if (!bankTxId || !txId) return outputError("Usage: match <bankTxId> <txId>")
      const result = await matchTransaction(bankTxId, txId, user.id)
      if (!result) return outputError("Bank transaction not found")
      outputJSON(result)
      break
    }
    case "exclude": {
      const bankTxId = positional[1]
      if (!bankTxId) return outputError("Usage: exclude <bankTxId>")
      const result = await excludeTransaction(bankTxId, user.id)
      if (!result) return outputError("Bank transaction not found")
      outputJSON(result)
      break
    }
    case "unmatch": {
      const bankTxId = positional[1]
      if (!bankTxId) return outputError("Usage: unmatch <bankTxId>")
      const result = await unmatchTransaction(bankTxId, user.id)
      if (!result) return outputError("Bank transaction not found")
      outputJSON(result)
      break
    }
    case "merchant-categories": {
      const categories = await getMerchantCategories(user.id)
      outputJSON(categories)
      break
    }
    default:
      outputError(
        `Unknown command: ${command}. Available: import-csv, list, unmatched, match, exclude, unmatch, merchant-categories`
      )
  }
}

main()
  .catch((e) => outputError(e.message))
  .finally(() => prisma.$disconnect())
