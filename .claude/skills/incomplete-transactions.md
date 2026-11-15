---
name: incomplete-transactions
description: Find and fix transactions missing required data - category, date, amount, or receipt.
---

# Incomplete Transactions

Find transactions with missing data and help the user fix them.

## Workflow

1. **Get all transactions**:
   ```
   npx tsx src/cli/transactions.ts list --limit 1000
   ```

2. **Identify incomplete transactions** by checking each one for:
   - **Missing category**: categoryCode is null or empty
   - **Missing date**: issuedAt is null
   - **Missing amount**: total is null or 0
   - **Missing receipt**: files is "[]" (empty) AND total > 5000 cents ($50)

3. **Present results grouped by issue type**:

   **Missing Category** (X transactions):
   | ID | Name | Merchant | Amount | Date |

   **Missing Date** (X transactions):
   | ID | Name | Merchant | Amount | Category |

   **Missing Amount** (X transactions):
   | ID | Name | Merchant | Date | Category |

   **Missing Receipt** (X transactions over $50):
   | ID | Name | Merchant | Amount | Date |

4. **Offer to fix interactively**. For each issue type:

   - **Missing category**: First get the categories list:
     ```
     npx tsx src/cli/categories.ts list
     ```
     Then for each transaction, show the transaction details and ask the user which category to assign.

   - **Missing date**: Ask the user for the correct date in YYYY-MM-DD format.

   - **Missing amount**: Ask the user for the correct amount in dollars (convert to cents before updating).

5. **Apply fixes** using the update command:
   ```
   npx tsx src/cli/transactions.ts update <id> --category <code> --date <YYYY-MM-DD> --total <cents>
   ```
   Only include the flags for fields being updated.

6. **Show summary** after fixes: how many transactions were fixed, how many remain incomplete.

## Important Rules
- Amounts are ALWAYS in cents (integer). Format for display: $15.50 = 1550 cents
- When the user provides a dollar amount, multiply by 100 to convert to cents
- Do not auto-fix anything - always ask the user for the correct value
- A transaction can have multiple issues (e.g., missing both category and date) - list it under each relevant group
- The $50 receipt threshold is for flagging only - smaller transactions without receipts are acceptable
