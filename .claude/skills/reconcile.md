---
name: reconcile
description: Reconcile bank account balance against recorded transactions. Find discrepancies between bank and books.
---

# Bank Reconciliation

Compare bank account balance to recorded transactions and find discrepancies.

## Workflow

1. **Get bank account details**:
   ```
   npx tsx src/cli/bank-accounts.ts list
   ```

2. **Ask the user** for the current bank balance (or use lastBalance if recent).

3. **Get all unmatched bank transactions**:
   ```
   npx tsx src/cli/bank-import.ts unmatched --account "<name>"
   ```

4. **Get recorded transactions** for the same period:
   ```
   npx tsx src/cli/transactions.ts list --from <start> --to <end> --limit 5000
   ```

5. **Calculate reconciliation**:
   - Bank balance (as stated)
   - Sum of matched bank transactions
   - Number of unmatched bank transactions (in bank but not in books)
   - Recorded transactions not matched to any bank transaction (in books but not in bank)
   - Difference = bank balance - (starting balance + sum of recorded transactions)

6. **Present reconciliation report**:
   ```markdown
   # Bank Reconciliation: Chase Checking
   **Date:** 2026-03-23

   ## Balance Comparison
   | | Amount |
   |---|---|
   | Bank Statement Balance | $12,345.67 |
   | Book Balance (recorded transactions) | $12,100.67 |
   | **Difference** | **$245.00** |

   ## Unmatched Items
   ### In Bank, Not in Books (need to record)
   | Date | Description | Amount |
   |------|-------------|--------|
   | 03-15 | INTEREST PAYMENT | $12.50 |
   | 03-20 | BANK FEE | -$35.00 |

   ### In Books, Not in Bank (pending/error)
   | Date | Name | Amount |
   |------|------|--------|
   | 03-22 | Check #1045 | -$500.00 |

   ## Status
   Reconciled: NO (difference of $245.00)
   ```

7. **Suggest actions** for unmatched items:
   - "Create a transaction for INTEREST PAYMENT $12.50?"
   - "The check for $500 hasn't cleared yet — that's normal"

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- A reconciled account has $0 difference
- Outstanding checks (recorded but not in bank) are expected — don't flag as errors
- Bank fees and interest are common unmatched items — suggest creating transactions for them
