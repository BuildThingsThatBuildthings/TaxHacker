---
name: profit-loss
description: Generate a Profit & Loss (Income Statement) report. Standard financial statement format with period comparison.
---

# Profit & Loss Statement

Generate a standard P&L report suitable for business review or CPA handoff.

## Arguments (optional)
- `--from YYYY-MM-DD` — start date (defaults to start of current year)
- `--to YYYY-MM-DD` — end date (defaults to today)
- `--compare` — include comparison to prior period

## Workflow

1. **Get P&L data**:
   ```
   npx tsx src/cli/stats.ts profit-loss [--from DATE] [--to DATE]
   ```

2. **If comparison requested**, also get the prior period:
   - If period is a month, compare to previous month
   - If period is a quarter, compare to previous quarter
   - If period is a year, compare to previous year
   ```
   npx tsx src/cli/stats.ts profit-loss --from <prior-start> --to <prior-end>
   ```

3. **Format as a standard P&L**:

   ```markdown
   # Profit & Loss Statement
   **Period:** January 1, 2026 — March 23, 2026
   **Prepared:** March 23, 2026

   ## Revenue
   | Category | Amount |
   |----------|--------|
   | Invoice payments | $18,500.00 |
   | Product sales | $3,200.00 |
   | Other income | $150.00 |
   | **Total Revenue** | **$21,850.00** |

   ## Expenses
   | Category | Amount |
   |----------|--------|
   | Software & SaaS | $1,450.00 |
   | Travel | $2,100.00 |
   | Food & Drinks (50% deductible) | $680.00 |
   | Office Supplies | $230.00 |
   | Communication | $450.00 |
   | Fees | $875.00 |
   | Other | $120.00 |
   | **Total Expenses** | **$5,905.00** |

   ## Summary
   | | Amount |
   |---|---|
   | Gross Revenue | $21,850.00 |
   | Total Expenses | $5,905.00 |
   | **Net Income** | **$15,945.00** |
   | Net Margin | 73.0% |
   ```

4. **If comparison included**, add a comparison column:
   ```
   | Category | Current | Prior | Change |
   |----------|---------|-------|--------|
   | Revenue  | $21,850 | $18,200 | +20% |
   ```

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- Sort expense categories by amount (largest first)
- Food/meals at 50% is an IRS rule for business meals — note it
- Net Margin = Net Income / Total Revenue * 100
- If multi-currency, show separate P&L per currency
