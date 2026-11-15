import { randomUUID } from "crypto"

export function generateUUID(): string {
  return randomUUID()
}

export function codeFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .trim()
}

export function formatCurrency(cents: number, currencyCode?: string): string {
  const amount = cents / 100
  const symbol = CURRENCY_SYMBOLS[currencyCode || "USD"] || currencyCode || "$"
  return `${symbol}${amount.toFixed(2)}`
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
  CAD: "$",
  AUD: "$",
  CHF: "Fr",
  CNY: "\u00A5",
  INR: "\u20B9",
  BTC: "\u20BF",
}

export function parseArgs(args: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {}
  const positional: string[] = []

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith("--")) {
        flags[key] = next
        i++
      } else {
        flags[key] = "true"
      }
    } else {
      positional.push(arg)
    }
  }

  return { flags, positional }
}

export function outputJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function outputError(message: string): void {
  console.error(JSON.stringify({ error: message }))
  process.exit(1)
}
