# TaxHacker CLI

A terminal-based AI accountant powered by [Claude Code](https://claude.ai/claude-code). Drop your receipts in a folder, and Claude reads them, extracts the data, and saves everything to a local database. No web UI, no external API keys, no cloud dependencies.

## How It Works

Claude Code **is** the AI. It sees your receipt images natively, understands your expense categories, and uses CLI tools to persist everything to a local SQLite database. You interact entirely through natural language in the terminal.

```
You: "Analyze this receipt inbox/coffee-receipt.jpg"
Claude: *reads the image, extracts merchant, total, date, category*
Claude: *runs CLI tools to save the transaction*
```

## Features

- **Receipt Analysis** - Claude reads receipt/invoice images and PDFs, extracts structured financial data
- **Transaction Management** - Create, search, filter, and manage expenses and income
- **20 Default Categories** - Food, Travel, Software, Salary, and 16 more with AI classification prompts
- **Multi-Currency** - 178 currencies including crypto (BTC, ETH, etc.), amounts stored in cents
- **Custom Fields** - Define your own fields with AI extraction prompts (e.g., VAT rate, invoice number)
- **Projects** - Group transactions by client or project
- **CSV Import/Export** - Import from spreadsheets, export for your accountant
- **Backup/Restore** - Full ZIP backup with all data and receipt files
- **Financial Reports** - Summaries by category, project, date range
- **Inbox Processing** - Drop receipts in `inbox/`, batch process them all

## Quick Start

### Prerequisites

- Node.js 20+
- [Claude Code](https://claude.ai/claude-code) installed

### Setup

```bash
# Install dependencies
npm install

# Initialize database and seed defaults
npm run setup
```

That's it. No Docker, no PostgreSQL, no API keys. Just a local SQLite file.

### Usage

Open Claude Code in the project directory:

```bash
claude
```

Then use natural language or skills:

| Command | What it does |
|---------|-------------|
| `/process-receipts` | Batch analyze all images in `inbox/` |
| `/analyze-receipt path/to/file.jpg` | Analyze a single receipt |
| `/financial-summary` | Income/expense report by category and project |
| `/export-data` | Export to CSV or create a full backup |
| `/import-data` | Import transactions from CSV |

Or just talk to Claude:

- *"Show me all travel expenses from January"*
- *"How much did I spend on software this quarter?"*
- *"Add a new category called Consulting"*
- *"Create a transaction for $45.99 at Amazon, category software"*

## Project Structure

```
inbox/              # Drop receipts here for batch processing
uploads/            # Organized receipt storage (auto-managed)
data/               # SQLite database (auto-created)
src/
  cli/              # CLI scripts Claude runs via terminal
  models/           # Data access layer (Prisma)
  lib/              # Utilities (config, db, helpers)
  prisma/           # Database schema and migrations
.claude/
  skills/           # Workflow definitions for Claude Code
CLAUDE.md           # Instructions that make Claude your accountant
```

## CLI Reference

All CLI scripts output JSON and are run via `npx tsx src/cli/<script>.ts <command>`.

<details>
<summary>Transactions</summary>

```bash
npx tsx src/cli/transactions.ts list [--search X] [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--category X] [--project X] [--type expense|income] [--limit N]
npx tsx src/cli/transactions.ts get <id>
npx tsx src/cli/transactions.ts create --name "Lunch" --total 1550 --currency USD --category food --date 2024-03-15 [--merchant "Cafe"] [--type expense]
npx tsx src/cli/transactions.ts update <id> [--name X] [--total X] [--category X] ...
npx tsx src/cli/transactions.ts delete <id>
npx tsx src/cli/transactions.ts bulk-delete <id1> <id2> ...
```
</details>

<details>
<summary>Files</summary>

```bash
npx tsx src/cli/files.ts upload <path>
npx tsx src/cli/files.ts list-unsorted
npx tsx src/cli/files.ts preview <id>
npx tsx src/cli/files.ts link <fileId> <transactionId>
npx tsx src/cli/files.ts delete <id>
```
</details>

<details>
<summary>Categories / Projects / Fields / Currencies</summary>

```bash
npx tsx src/cli/categories.ts list | create | update | delete
npx tsx src/cli/projects.ts list | create | update | delete
npx tsx src/cli/fields.ts list | create | update | delete
npx tsx src/cli/currencies.ts list | add | delete
```
</details>

<details>
<summary>Stats & Reporting</summary>

```bash
npx tsx src/cli/stats.ts summary [--from DATE] [--to DATE]
npx tsx src/cli/stats.ts by-category [--from DATE] [--to DATE]
npx tsx src/cli/stats.ts by-project [--from DATE] [--to DATE]
```
</details>

<details>
<summary>Import / Export / Backup</summary>

```bash
npx tsx src/cli/import-export.ts export-csv --output ./export.csv [--from DATE] [--to DATE]
npx tsx src/cli/import-export.ts import-csv <file.csv> --mapping '{"Column": "fieldCode"}'
npx tsx src/cli/import-export.ts backup --output ./backup.zip
npx tsx src/cli/import-export.ts restore <backup.zip>
```
</details>

<details>
<summary>Settings</summary>

```bash
npx tsx src/cli/settings.ts list
npx tsx src/cli/settings.ts get <code>
npx tsx src/cli/settings.ts set <code> <value>
```
</details>

## Data Conventions

- **Amounts** are stored as integers in cents: `$15.50 = 1550`
- **Dates** use `YYYY-MM-DD` format
- **Transaction types** are `"expense"` or `"income"`
- **Category/project codes** are lowercase with underscores: `food`, `utility_bills`
- **Currencies** use ISO 4217 codes: `USD`, `EUR`, `GBP`, `BTC`

## Credits

This project is adapted from [TaxHacker](https://github.com/vas3k/taxhacker) by [Vasily Zubarev](https://github.com/vas3k) (vas3k). The original is a self-hosted web application with a full UI and support for OpenAI, Google Gemini, and Mistral AI providers. This version strips the web interface and reimplements it as a Claude Code-native terminal tool, using Claude as both the AI and the interface.

Original project: [github.com/vas3k/taxhacker](https://github.com/vas3k/taxhacker) | MIT License
