---
name: financial-summary
description: Generate a financial summary report showing income, expenses, and profit broken down by category and project.
---

# Financial Summary

Generate a comprehensive financial report.

## Arguments (optional)
- `--from YYYY-MM-DD` - start date
- `--to YYYY-MM-DD` - end date

## Workflow

1. **Get summary stats**:
   ```
   npx tsx src/cli/stats.ts summary [--from DATE] [--to DATE]
   ```

2. **Get category breakdown**:
   ```
   npx tsx src/cli/stats.ts by-category [--from DATE] [--to DATE]
   ```

3. **Get project breakdown**:
   ```
   npx tsx src/cli/stats.ts by-project [--from DATE] [--to DATE]
   ```

4. **Format as a report**:

   ```markdown
   # Financial Summary
   **Period:** [start] to [end] (or "All time")

   ## Overview
   | | Amount |
   |---|---|
   | Total Income | $X,XXX.XX |
   | Total Expenses | $X,XXX.XX |
   | Net Profit/Loss | $X,XXX.XX |

   ## By Category
   | Category | Expenses | Income |
   |---|---|---|
   | Food & Drinks | $XXX.XX | - |
   | ... | ... | ... |

   ## By Project
   | Project | Expenses | Income | Net |
   |---|---|---|---|
   | Personal | $XXX.XX | $XXX.XX | $XXX.XX |
   | ... | ... | ... | ... |
   ```

5. Present the formatted report to the user.
