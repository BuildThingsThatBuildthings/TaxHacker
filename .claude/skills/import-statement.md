---
name: import-statement
description: Import a bank or credit card statement (CSV or PDF). Auto-detects columns, fuzzy-matches existing transactions, auto-categorizes from merchant history.
---

# Import Bank Statement

The killer workflow for bookkeeping. Drop a bank statement CSV/PDF and Claude handles everything.

## Arguments

- **file path**: Path to CSV or PDF bank statement
- **account name** (optional): Which bank account this belongs to

## Workflow

1. **Check for bank account**. If the user didn't specify one, list accounts:
   ```
   npx tsx src/cli/bank-accounts.ts list
   ```
   If no accounts exist, create one first:
   ```
   npx tsx src/cli/bank-accounts.ts create --name "Chase Checking" --institution "Chase" --type checking --currency USD
   ```

2. **If the file is a PDF**, read it using the Read tool and extract transaction data into a table format. Then create a temporary CSV or process directly.

3. **If the file is a CSV**, import it directly:
   ```
   npx tsx src/cli/bank-import.ts import-csv <file> --account "<account name>"
   ```
   The CLI auto-detects column mappings (date, description, amount, debit/credit).

4. **Get merchant category patterns** (for auto-categorization):
   ```
   npx tsx src/cli/bank-import.ts merchant-categories
   ```

5. **Get unmatched transactions**:
   ```
   npx tsx src/cli/bank-import.ts unmatched --account "<account name>"
   ```

6. **For each unmatched transaction**, try to match or categorize:
   - Search existing transactions for a match (same amount + similar date):
     ```
     npx tsx src/cli/transactions.ts list --search "<description>" --from <date-3days> --to <date+3days>
     ```
   - If a match is found, link them:
     ```
     npx tsx src/cli/bank-import.ts match <bankTxId> <txId>
     ```
   - If no match, auto-categorize using merchant history patterns
   - If still unknown, flag for user review

7. **Present a summary table** to the user:
   ```markdown
   ## Import Summary: Chase Checking
   **Statement period:** 2026-03-01 to 2026-03-31
   **Imported:** 47 transactions

   | Status | Count | Total |
   |--------|-------|-------|
   | Matched to existing | 12 | $3,450.00 |
   | Auto-categorized (new) | 28 | $8,200.00 |
   | Needs review | 7 | $1,150.00 |

   ### Needs Review
   | Date | Description | Amount | Suggested Category |
   |------|-------------|--------|--------------------|
   | 03-05 | TRANSFER ACH | -$500.00 | ? |
   | 03-12 | POS PURCHASE 4829 | -$43.50 | ? |
   ```

8. **Ask the user** to:
   - Confirm auto-categorized transactions
   - Categorize or exclude the unknowns
   - Create transactions for the new ones:
     ```
     npx tsx src/cli/transactions.ts create --name "<description>" --total <amount> --category <cat> --date <date> --merchant "<merchant>" --type expense --currency USD
     ```
   - Then match:
     ```
     npx tsx src/cli/bank-import.ts match <bankTxId> <newTxId>
     ```

## Important Rules
- Amounts are in cents. Bank CSVs may show dollars — multiply by 100
- Negative amounts = expenses/withdrawals. Positive = deposits/income.
- Skip transfer-between-accounts (exclude them)
- NEVER create duplicate transactions — always check for matches first
- The import-csv command auto-detects columns and skips duplicates
