---
name: scan-email
description: Scan Gmail for invoices, receipts, and bills. Extract attachments and process them through the receipt analysis pipeline.
---

# Scan Email for Receipts & Invoices

Automatically scan Gmail for invoices and receipts, then process them.

## Workflow

1. **Search Gmail for recent invoices/receipts**:
   Use `mcp__claude_ai_Gmail__gmail_search_messages` with query:
   - `"invoice OR receipt OR statement OR billing" newer_than:7d has:attachment`
   - Adjust time range based on user request

2. **Read each matching message**:
   Use `mcp__claude_ai_Gmail__gmail_read_message` for each result.

3. **For each email, determine the type**:
   - **Invoice FROM you** (confirmation of invoice you sent) → skip or link to existing invoice
   - **Invoice TO you** (bill from a vendor) → create a Bill via `/record-bill`
   - **Receipt** (purchase confirmation) → process via receipt analysis pipeline
   - **Statement** (bank/credit card) → suggest `/import-statement`
   - **Irrelevant** → skip

4. **For receipts/invoices**, extract key data from the email body:
   - Vendor/merchant name
   - Amount
   - Date
   - Invoice/receipt number

5. **Check for duplicates** before creating:
   ```
   npx tsx src/cli/transactions.ts list --search "<merchant>" --from <date-3days> --to <date+3days>
   ```

6. **Create transactions or bills**:
   - For receipts (already paid): create transaction directly
     ```
     npx tsx src/cli/transactions.ts create --name "<description>" --total <cents> --merchant "<vendor>" --category <cat> --date <date> --type expense
     ```
   - For unpaid bills: create bill
     ```
     npx tsx src/cli/bills.ts create --vendor "<vendor>" --total <cents> --due-date <date> --bill-number "<ref>"
     ```

7. **Present summary**:
   ```markdown
   ## Email Scan Results
   **Scanned:** 15 emails from last 7 days

   | # | From | Type | Amount | Action |
   |---|------|------|--------|--------|
   | 1 | Adobe | Bill | $54.99 | Created bill (due 04/01) |
   | 2 | Amazon | Receipt | $127.43 | Created expense |
   | 3 | Chase | Statement | - | Use /import-statement |
   | 4 | Client ABC | Payment confirm | $5,000 | Already recorded |
   | 5 | Uber | Receipt | $23.50 | Created expense |

   **Created:** 2 expenses, 1 bill
   **Skipped:** 1 duplicate, 1 statement (use /import-statement)
   ```

## Important Rules
- ALWAYS check for duplicates before creating transactions
- Amounts in cents — multiply dollar amounts from emails by 100
- If amount is unclear, flag for user review rather than guessing
- Don't process promotional emails or newsletters
- Track processed email IDs in settings to avoid re-processing
