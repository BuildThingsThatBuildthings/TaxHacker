---
name: vendor-summary
description: Analyze spending by vendor/merchant. Shows top vendors, total spent, transaction frequency.
---

# Vendor Summary

Analyze spending patterns by vendor/merchant.

## Workflow

1. **Get top merchants**: Run with optional date filters if the user specifies a time range:
   ```
   npx tsx src/cli/stats.ts top-merchants --limit 20 [--from YYYY-MM-DD] [--to YYYY-MM-DD]
   ```

2. **Present a formatted table** with the following columns:
   - **Merchant**: Vendor/merchant name
   - **Total Spent**: Sum of all transactions (formatted as currency, e.g., $1,234.56)
   - **Transaction Count**: Number of transactions with this merchant
   - **Average Transaction**: Total divided by count (formatted as currency)

3. **Highlight frequent vendors**: Call out any merchant with more than 10 transactions as a "frequent vendor" - these are likely subscriptions or regular business relationships.

4. **Note one-time purchases**: List merchants with only 1 transaction separately - these may be one-off purchases worth reviewing.

## Important Rules
- Amounts are ALWAYS in cents (integer). Format for display: $15.50 = 1550 cents
- If the user asks about a specific vendor, use `npx tsx src/cli/transactions.ts list --search "vendor name"` to get detailed transactions
- Sort the table by total spent (highest first) unless the user requests otherwise
