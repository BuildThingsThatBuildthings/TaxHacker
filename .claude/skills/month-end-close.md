---
name: month-end-close
description: Monthly accounting close - review transactions, flag issues, confirm month is complete.
---

# Month-End Close

Review all transactions for a given month, flag issues, and confirm the month is complete.

## Workflow

1. **Determine the month to close**: Default to the previous month. If the user specifies a month (e.g., "close January 2025"), use that instead. Calculate the first and last day of the month (`YYYY-MM-01` to `YYYY-MM-DD`).

2. **Get the monthly summary**:
   ```
   npx tsx src/cli/stats.ts summary --from YYYY-MM-01 --to YYYY-MM-DD
   ```

3. **Get the category breakdown**:
   ```
   npx tsx src/cli/stats.ts by-category --from YYYY-MM-01 --to YYYY-MM-DD
   ```

4. **List all transactions for the month**:
   ```
   npx tsx src/cli/transactions.ts list --from YYYY-MM-01 --to YYYY-MM-DD --limit 1000
   ```

5. **Identify issues** by inspecting the transaction list output:
   - **Uncategorized**: Transactions where categoryCode is null or empty
   - **Undated**: Transactions where issuedAt is null
   - **Zero/missing amount**: Transactions where total is 0 or null
   - **Potential duplicates**: Transactions with the same merchant + total + issuedAt date appearing more than once

6. **Present the month-end report** with these sections:
   - **Period**: The month being closed
   - **Summary**: Total income, total expenses, net (income - expenses)
   - **Category Breakdown**: Table of each category with its total (formatted as currency)
   - **Transaction Count**: Total number of transactions in the month
   - **Issues Found**:
     - Uncategorized transactions (count + list)
     - Undated transactions (count + list)
     - Zero-amount transactions (count + list)
     - Potential duplicates (count + list with merchant, amount, date)
   - **Status**: Whether the month is clean (no issues) or needs attention

7. **Ask user to confirm** the month is reviewed. If issues exist, ask if they want to fix them before confirming.

## Important Rules
- Amounts are ALWAYS in cents (integer). Format for display: $15.50 = 1550 cents
- Do not modify any transactions unless the user explicitly asks
- If no issues are found, congratulate the user on a clean month
- Always show the full report even if there are no issues
