---
name: daily-briefing
description: Proactive financial briefing - surfaces what needs attention. Uncategorized transactions, overdue invoices/bills, spending anomalies, recurring dues.
---

# Daily Financial Briefing

Proactive intelligence — Claude tells you what needs attention instead of waiting to be asked.

## Workflow

Run all data gathering commands:

1. **Health check**:
   ```
   npx tsx src/cli/stats.ts health-check
   ```

2. **Overdue invoices** (money owed to you):
   ```
   npx tsx src/cli/invoices.ts overdue
   ```

3. **Bills due this week** (money you owe):
   ```
   npx tsx src/cli/bills.ts due-this-week
   ```

4. **Overdue bills**:
   ```
   npx tsx src/cli/bills.ts overdue
   ```

5. **Recurring transactions due**:
   ```
   npx tsx src/cli/recurring.ts due
   ```

6. **Recent uncategorized transactions** (last 7 days):
   ```
   npx tsx src/cli/transactions.ts list --from <7-days-ago> --to <today> --limit 100
   ```
   Filter for categoryCode = null.

7. **Month-to-date comparison**:
   ```
   npx tsx src/cli/stats.ts compare-periods
   ```

8. **Spending anomalies**:
   ```
   npx tsx src/cli/stats.ts anomalies --from <30-days-ago> --to <today>
   ```

9. **Unsorted files** in inbox:
   ```
   npx tsx src/cli/files.ts list-unsorted
   ```

10. **Unmatched bank transactions**:
    ```
    npx tsx src/cli/bank-import.ts unmatched
    ```

## Present the Briefing

```markdown
# Financial Briefing — March 23, 2026

## Action Required
- 2 overdue invoices totaling $7,500 (oldest: 15 days)
- 3 bills due this week totaling $1,245
- 5 uncategorized transactions from last 7 days
- 12 unmatched bank transactions
- 3 receipts in inbox/ waiting to be processed

## Recurring Due
- Adobe CC ($54.99) — due tomorrow
- AWS ($245.00) — due in 3 days

## This Month vs Last Month
| | This Month | Last Month | Change |
|---|---|---|---|
| Income | $12,000 | $8,500 | +41% |
| Expenses | $4,200 | $3,800 | +11% |
| Net | $7,800 | $4,700 | +66% |

## Anomalies
- Uber charge of $187.50 on 03-18 (avg is $25, 7.5x higher than normal)

## Data Quality Score: 82/100
- 5 uncategorized transactions (−6 pts)
- 2 undated transactions (−4 pts)
- 3 large expenses without receipts (−8 pts)
```

## Important Rules
- Run ALL data gathering commands — the value is in the complete picture
- Amounts are in cents. Format for display: divide by 100
- Sort action items by urgency (overdue first, then due soon, then data quality)
- If everything is clean, celebrate: "All clear! Your books are up to date."
- Suggest specific next actions for each issue found
