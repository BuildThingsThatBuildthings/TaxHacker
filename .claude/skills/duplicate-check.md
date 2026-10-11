---
name: duplicate-check
description: Find potential duplicate transactions based on matching amount, date, and merchant.
---

# Duplicate Check

Find and resolve potential duplicate transactions.

## Workflow

1. **Get recent transactions**:
   ```
   npx tsx src/cli/transactions.ts list --limit 1000
   ```

2. **Group transactions** by the combination of (merchant + total + issuedAt date). Any group with more than one transaction is a potential duplicate.

3. **Present potential duplicates** in a table with:
   - **Group**: Numbered group for reference
   - **Transaction IDs**: All IDs in the duplicate group
   - **Merchant**: The merchant name
   - **Amount**: The transaction amount (formatted as currency)
   - **Date**: The transaction date
   - **Files Attached**: Whether each transaction has files linked (transactions with different files are less likely to be true duplicates)

4. **Assess likelihood**: For each group, note:
   - **Likely duplicate**: Same merchant, amount, date, and no files or same files
   - **Possible duplicate**: Same merchant, amount, date, but different files attached (could be separate legitimate transactions)

5. **Ask the user** which duplicates to remove. Present options per group: "Which transaction ID should be kept? (Enter ID to keep, others will be deleted)"

6. **Delete confirmed duplicates**: For each confirmed duplicate, run:
   ```
   npx tsx src/cli/transactions.ts delete <id>
   ```

## Important Rules
- Amounts are ALWAYS in cents (integer). Format for display: $15.50 = 1550 cents
- NEVER delete transactions without explicit user confirmation
- If no duplicates are found, report that the data looks clean
- Transactions with null/empty merchant should be grouped separately as "Unknown Merchant"
- Two transactions on the same day from the same merchant with the same amount could still be legitimate (e.g., two coffees) - always let the user decide
