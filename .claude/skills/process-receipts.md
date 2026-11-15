---
name: process-receipts
description: Batch process all receipt images in the inbox/ folder. Analyzes each receipt, extracts financial data, creates transactions, and links files.
---

# Process Receipts

Process all receipt images and PDFs in the `inbox/` folder.

## Workflow

1. **List inbox files**: Use Glob to find all files in `inbox/` matching `inbox/*` (images and PDFs).

2. **Get context**: Run these commands to understand the available categories and fields:
   ```
   npx tsx src/cli/categories.ts list
   npx tsx src/cli/fields.ts list
   ```

3. **For each file in inbox/**:
   a. **Read the image** using the Read tool to see the receipt/invoice
   b. **Extract data** from the image:
      - `name`: Human-readable summary of what was bought/paid
      - `merchant`: Store/vendor name (original spelling)
      - `total`: Amount in **cents** (multiply dollars by 100, e.g., $15.50 = 1550)
      - `currency`: ISO 4217 code (USD, EUR, GBP, etc.)
      - `date`: Transaction date in YYYY-MM-DD format
      - `category`: Best matching category code from the categories list
      - `type`: "expense" or "income"
      - `items`: Individual line items if visible
      - `vat_rate`: VAT percentage if shown (0-100)
      - `vat`: VAT amount in cents if shown
      - `text`: All readable text from the receipt
   c. **NEVER fabricate data** - if something is unclear, leave it blank
   d. **Check for duplicate files**: Before uploading, check if a file with the same name already exists by reviewing previously uploaded files. If a duplicate filename is detected, skip the file and record it as a failure with reason "Duplicate filename".
   e. **Upload the file**:
      ```
      npx tsx src/cli/files.ts upload <absolute-path-to-file>
      ```
   f. **Create the transaction**:
      ```
      npx tsx src/cli/transactions.ts create --name "..." --total <cents> --currency <code> --category <code> --date <YYYY-MM-DD> --merchant "..." --type expense
      ```
   g. **Link file to transaction**:
      ```
      npx tsx src/cli/files.ts link <fileId> <transactionId>
      ```
   h. **Error handling**: If any step (upload, create, or link) fails for a file:
      - Record the filename and the error reason
      - Continue processing the next file - do not stop the batch
      - Track successes and failures separately

4. **Show summary**: Present TWO markdown tables:

   **Successful Receipts**:
   | Filename | Name | Merchant | Total | Category | Date |

   **Failed Receipts** (if any):
   | Filename | Step Failed | Error Reason |

   Include counts: "X of Y receipts processed successfully. Z failed."

## Important Rules
- Amounts are ALWAYS in cents (integer). $15.50 = 1550, EUR 100.00 = 10000
- Never guess or make up information
- Use the `prompt` field from categories and fields as guidance for classification
- If a receipt has multiple items, still create ONE transaction with the total
- For PDFs, Claude can read them directly - if the PDF is unclear, note it in the summary
