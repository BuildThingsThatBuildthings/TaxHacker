---
name: tax-report
description: Generate annual tax summary for CPA handoff. Groups expenses by deductible category, flags incomplete data.
---

# Tax Report

Generate a comprehensive annual tax summary suitable for CPA handoff.

## Arguments

- **year** (optional): The tax year to report on. Defaults to the previous year.

## Workflow

1. **Set date range**: January 1 to December 31 of the tax year (`YYYY-01-01` to `YYYY-12-31`).

2. **Get the annual summary**:
   ```
   npx tsx src/cli/stats.ts summary --from YYYY-01-01 --to YYYY-12-31
   ```

3. **Get the category breakdown**:
   ```
   npx tsx src/cli/stats.ts by-category --from YYYY-01-01 --to YYYY-12-31
   ```

4. **List all transactions for the year**:
   ```
   npx tsx src/cli/transactions.ts list --from YYYY-01-01 --to YYYY-12-31 --limit 5000
   ```

5. **Identify issues** by inspecting the transaction list:
   - **Incomplete transactions**: Missing category, date, or amount
   - **Large expenses without receipts**: Transactions with total > 50000 cents ($500) where files is "[]" (empty array)

6. **Present the tax report** with these sections:

   - **Tax Year**: The year being reported
   - **Gross Income**: Total income for the year (formatted as currency)
   - **Total Deductible Expenses**: Total expenses for the year (formatted as currency)
   - **Net Profit/Loss**: Income minus expenses (formatted as currency)
   - **Category Breakdown**: Table with each category, transaction count, and total amount
   - **Issues**:
     - Incomplete transactions (list with ID, name, what is missing)
     - Large expenses without receipts (list with ID, name, amount, date)
   - **Action Items**: Specific things that need fixing before handing to CPA:
     - "Categorize X uncategorized transactions"
     - "Attach receipts to X large expenses"
     - "Add dates to X undated transactions"
     - "Add amounts to X zero-amount transactions"

7. **Offer CSV export**: Ask the user if they want to export a tax-ready CSV:
   ```
   npx tsx src/cli/import-export.ts export-csv --output ./tax-report-YYYY.csv --from YYYY-01-01 --to YYYY-12-31
   ```

## Important Rules
- Amounts are ALWAYS in cents (integer). Format for display: $15.50 = 1550 cents
- Do not modify any transactions unless the user explicitly asks
- Flag ALL issues - it is better to over-report than under-report for tax purposes
- The $500 receipt threshold is a guideline; the user's CPA may have different requirements
