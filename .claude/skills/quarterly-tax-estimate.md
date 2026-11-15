---
name: quarterly-tax-estimate
description: Calculate quarterly estimated tax payment based on YTD income. Answers "how much should I set aside for taxes?"
---

# Quarterly Tax Estimate

Calculate how much to set aside for quarterly estimated tax payments.

## Arguments (optional)
- `--year YYYY` — tax year (defaults to current year)

## Workflow

1. **Get estimated tax data**:
   ```
   npx tsx src/cli/stats.ts estimated-tax [--year YYYY]
   ```

2. **Present the tax estimate**:

   ```markdown
   # Quarterly Tax Estimate — 2026
   **As of:** March 23, 2026

   ## Year-to-Date
   | | Amount |
   |---|---|
   | Gross Income | $21,850.00 |
   | Total Expenses | $5,905.00 |
   | **Net Profit (Schedule C)** | **$15,945.00** |

   ## Tax Calculation
   | Tax | Amount |
   |-----|--------|
   | Self-Employment Tax (15.3%) | $2,258.50 |
   | Estimated Income Tax | $1,870.00 |
   | **Total Estimated Annual Tax** | **$4,128.50** |

   ## Quarterly Payment
   | | Amount |
   |---|---|
   | Quarterly Payment | **$1,032.13** |
   | Next Due Date | **June 15, 2026** |

   ## Quarterly Schedule
   | Quarter | Due Date | Amount |
   |---------|----------|--------|
   | Q1 | April 15, 2026 | $1,032.13 |
   | Q2 | June 15, 2026 | $1,032.13 |
   | Q3 | September 15, 2026 | $1,032.13 |
   | Q4 | January 15, 2027 | $1,032.13 |
   ```

3. **Add context**:
   - If this is early in the year, note the projection is based on limited data
   - If income is significantly higher/lower than last year, flag it
   - Remind about safe harbor: pay 100% of last year's tax to avoid penalties

## Important Rules
- Amounts are in cents from the CLI. Format for display: divide by 100
- Self-employment tax applies to 92.35% of net profit (not 100%)
- Half of SE tax is deductible from income tax calculation
- These are ESTIMATES — always recommend consulting a CPA for final numbers
- Tax brackets are for single filers — note this assumption
- If the user has other income sources, these estimates will be low
