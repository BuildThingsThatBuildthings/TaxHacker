---
name: project-profitability
description: Analyze profitability by project/client. Revenue minus costs, effective hourly rate, time invested.
---

# Project Profitability Analysis

Which projects actually make money? Revenue minus expenses, with effective hourly rate.

## Arguments (optional)
- `--from YYYY-MM-DD` — start date
- `--to YYYY-MM-DD` — end date

## Workflow

1. **Get profitability data**:
   ```
   npx tsx src/cli/stats.ts project-profitability [--from DATE] [--to DATE]
   ```

2. **Present the report**:

   ```markdown
   # Project Profitability Report
   **Period:** 2026-01-01 to 2026-03-23

   | Project | Revenue | Expenses | Net Profit | Hours | $/Hour |
   |---------|---------|----------|------------|-------|--------|
   | UGC Services | $15,000 | $2,100 | $12,900 | 85.0 | $151.76 |
   | Educational Classes | $8,500 | $1,200 | $7,300 | 62.5 | $116.80 |
   | App Development | $3,200 | $800 | $2,400 | 40.0 | $60.00 |
   | Personal | $0 | $4,500 | -$4,500 | - | - |

   ## Insights
   - **Most profitable:** UGC Services at $151.76/hr effective rate
   - **Needs attention:** App Development at $60/hr — below market rate
   - **Overhead:** $4,500 in unassigned/personal expenses
   ```

3. **Add context and recommendations**:
   - Flag projects with negative profit
   - Highlight projects with no time tracked (can't calculate $/hr)
   - Suggest raising rates for low-$/hr projects
   - Note if some revenue has no project assigned

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- Effective hourly rate = net profit / total hours
- Projects with no time entries show "-" for hours and $/hr
- Include both invoice-generated income and manual income transactions
- This analysis requires time tracking to be most useful — suggest `/log-time` if hours are missing
