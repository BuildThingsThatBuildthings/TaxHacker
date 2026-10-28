# TaxHacker CLI Tutorial: Managing Your Monthly Finances

A practical guide to using TaxHacker with Claude Code as your personal accountant. This tutorial walks through a complete monthly workflow — from initial setup through tax time.

---

## 1. First-Time Setup

Open your terminal in the TaxHacker project directory and start Claude Code:

```bash
cd ~/TaxHacker
claude
```

Then tell Claude to initialize:

```
Set up TaxHacker for me
```

Claude runs `npx tsx src/cli/setup.ts init`, which creates your SQLite database, sets up your user account, and seeds 20 expense categories, 178 currencies, and all the default fields.

You're ready to go. No accounts to create, no API keys, no servers.

---

## 2. Daily: Capturing Expenses

### Drop receipts in the inbox

Whenever you get a receipt — photo from your phone, PDF from email, screenshot of an online purchase — drop it in the `inbox/` folder.

```
~/TaxHacker/inbox/
  starbucks-march-15.jpg
  aws-invoice-march.pdf
  uber-ride.png
```

### Process them all at once

```
/process-receipts
```

Claude reads every image in `inbox/`, extracts the data (merchant, amount, date, category), and creates transactions automatically. You'll see a summary like:

```
3 of 3 receipts processed successfully. 0 failed.

| Filename                  | Name              | Merchant   | Total   | Category | Date       |
|---------------------------|-------------------|------------|---------|----------|------------|
| starbucks-march-15.jpg    | Morning coffee    | Starbucks  | $5.50   | food     | 2024-03-15 |
| aws-invoice-march.pdf     | Cloud hosting     | AWS        | $127.43 | software | 2024-03-01 |
| uber-ride.png             | Ride to airport   | Uber       | $34.20  | transport| 2024-03-14 |
```

### Analyze a single receipt

If you have one receipt to process right now:

```
/analyze-receipt ~/Downloads/lunch-receipt.jpg
```

Claude reads the image, shows you what it extracted, and asks for confirmation before saving. You can correct anything before it saves.

---

## 3. Daily: Quick Expense Entry

Not everything has a receipt. For quick entries, just tell Claude:

```
I spent $42 on office supplies at Staples today
```

Claude creates the transaction with the right category, amount (4200 cents), date, and merchant.

Or be more specific:

```
Add a $1,200 income from Client ABC on March 10th, project consulting
```

Claude handles the conversion to cents (120000), sets type to "income", assigns the project, and saves it.

---

## 4. Setting Up Recurring Transactions

Most freelancers have monthly subscriptions. Set them up once and never re-enter them:

```
Set up these recurring expenses:
- Adobe Creative Cloud: $54.99/month, software category, starting April 1
- Slack Business: $12.50/month, software, starting April 1
- WeWork desk: $350/month, rental, starting April 1
- Phone bill: $85/month, communication, starting April 1
```

Claude creates each recurring transaction. Then at the start of each month:

```
/generate-recurring
```

Claude checks what's due, shows you the list, and creates the transactions on confirmation.

---

## 5. Organizing with Projects

If you work with multiple clients or have side projects, set up projects to track profitability:

```
Create a project called "Client ABC" with prompt "work for Client ABC consulting engagement"
Create a project called "Side Hustle" with prompt "Etsy shop and side business"
```

Then when entering transactions:

```
Add a $3,500 income from Client ABC on March 15, project client_abc
I spent $45 on shipping supplies for my Etsy shop, project side_hustle
```

---

## 6. Custom Categories

The 20 defaults cover most cases, but you can add your own:

```
Add a category called "Subscriptions" with prompt "recurring software and service subscriptions, SaaS tools"
Add a category called "Client Entertainment" with prompt "meals and events with clients, business entertainment"
```

The prompt field teaches Claude how to auto-categorize future receipts into this category.

---

## 7. Weekly: Quick Check-In

Once a week, ask Claude for a snapshot:

```
How much have I spent this month so far?
```

Or use the stats directly:

```
/financial-summary
```

Claude shows you:
- Total income vs expenses
- Breakdown by category
- Breakdown by project
- Any flagged issues

### Check your top spending

```
Show me my top 5 spending categories this month
Show me my top merchants this quarter
```

---

## 8. Monthly: Month-End Close

At the end of each month, run the close process:

```
/month-end-close
```

Claude reviews the month and flags:
- Uncategorized transactions (need a category assigned)
- Transactions without dates
- Zero-amount transactions
- Potential duplicates (same merchant + amount on same day)
- Expenses over $50 without receipt attachments

Fix any issues Claude finds:

```
Categorize that $200 transaction as "tools"
That duplicate from Amazon — delete the second one, keep the first
```

Once everything looks clean, confirm the month is reviewed.

---

## 9. Data Quality Checks

Run these periodically to keep your books clean:

### Find duplicates

```
/duplicate-check
```

Claude finds transactions with matching merchant + amount + date and asks which to keep.

### Find incomplete records

```
/incomplete-transactions
```

Claude lists everything missing a category, date, amount, or receipt (for expenses over $50), and helps you fix them one by one.

### Vendor analysis

```
/vendor-summary
```

See who you're spending the most with. Useful for negotiating discounts or identifying subscriptions you forgot about.

---

## 10. Importing Existing Data

### From a CSV (bank export, spreadsheet, etc.)

```
/import-data
```

Claude reads your CSV, shows the columns, and helps you map them:

```
Import transactions from ~/Downloads/bank-export.csv
```

Claude will show you the columns and ask how to map them:
- "Date" column → `issuedAt`
- "Description" column → `name`
- "Amount" column → `total`
- "Category" column → `categoryCode`

### From a backup

If you have a previous TaxHacker backup:

```
Restore from ~/backups/taxhacker-backup.zip
```

---

## 11. Exporting Your Data

### For your accountant (CSV)

```
/export-data
```

Choose CSV export. Claude creates a spreadsheet with all your transactions.

Filter by date range:

```
Export my 2024 transactions to CSV
```

### Full backup (data + receipts)

```
Create a full backup of everything
```

Claude creates a ZIP file containing your database, all transaction data, and all receipt files.

---

## 12. Quarterly: Tax Preparation

Every quarter (or at tax time), generate a tax report:

```
/tax-report 2024
```

Claude generates:
- **Gross income** for the year
- **Total deductible expenses** by category
- **Net profit/loss**
- **Issues to fix** before giving to your CPA (incomplete transactions, large expenses without receipts)
- **Action items** — what needs attention

Export the tax-ready CSV for your accountant:

```
Export my 2024 transactions to a tax CSV
```

### Estimated quarterly taxes

Claude knows the quarterly due dates (April 15, June 15, September 15, January 15) and can help estimate:

```
Based on my income this quarter, what should I set aside for estimated taxes?
```

---

## 13. Searching and Filtering

Ask Claude anything about your transactions:

```
Show me all travel expenses from January
How much did I spend at Amazon this year?
Find all transactions over $500
List income from Q1 2024
What did I spend on software in March?
```

Claude uses the right filters behind the scenes — date ranges, categories, merchant search, amount thresholds.

---

## 14. Multi-Currency

If you work internationally, TaxHacker handles 178 currencies including crypto. Claude detects the currency from receipts automatically:

```
I received EUR 2,500 from a European client on March 20, income
```

Claude stores it as 250000 cents in EUR. Ask for reports filtered by currency:

```
Show me all my EUR transactions this year
What's my total income in USD vs EUR?
```

---

## 15. Tips for an Efficient Workflow

1. **Batch your receipts.** Take photos throughout the week, drop them in `inbox/` on Friday, run `/process-receipts` once.

2. **Set up recurring first.** Get your subscriptions and fixed costs in the system immediately. Then `/generate-recurring` at the start of each month takes 10 seconds.

3. **Run `/month-end-close` religiously.** 5 minutes at the end of each month prevents a painful scramble at tax time.

4. **Use projects for client work.** Even if you have one client, tracking by project makes invoicing and tax prep much easier.

5. **Keep receipts for anything over $75.** The IRS requires documentation. Drop images in `inbox/` and they're attached to transactions automatically.

6. **Back up monthly.** After your month-end close, run a backup. One ZIP file, all your data and receipts, stored wherever you want.

---

## Command Reference

| What you want to do | What to say or run |
|---|---|
| Process all receipts | `/process-receipts` |
| Analyze one receipt | `/analyze-receipt path/to/file` |
| Monthly review | `/month-end-close` |
| Financial overview | `/financial-summary` |
| Tax prep | `/tax-report 2024` |
| Generate recurring charges | `/generate-recurring` |
| Find duplicates | `/duplicate-check` |
| Find incomplete data | `/incomplete-transactions` |
| Top vendors | `/vendor-summary` |
| Export data | `/export-data` |
| Import data | `/import-data` |
| Quick expense | "I spent $X on Y at Z" |
| Quick income | "Add $X income from Y" |
| Search transactions | "Show me all [category] from [date range]" |
| Create backup | "Create a full backup" |
