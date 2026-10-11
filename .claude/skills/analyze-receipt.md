---
name: analyze-receipt
description: Analyze a single receipt image or PDF and create a transaction from it. Pass the file path as an argument.
---

# Analyze Receipt

Analyze a single receipt/invoice file and create a transaction.

## Arguments
- First argument: path to the receipt file (image or PDF)

## Workflow

1. **Get context** by running in parallel:
   ```
   npx tsx src/cli/categories.ts list
   npx tsx src/cli/fields.ts list
   ```

2. **Read the receipt image** using the Read tool with the provided file path.

3. **Extract all data** from the image:
   - `name`: Summary of what was bought/paid
   - `merchant`: Store/vendor name
   - `total`: Amount in **cents** ($15.50 = 1550)
   - `currency`: ISO 4217 code
   - `date`: YYYY-MM-DD
   - `category`: Best matching category code
   - `project`: Best matching project code (if applicable)
   - `type`: "expense" or "income"
   - `description`: Brief description
   - `items`: Line items if visible
   - `vat_rate`: VAT % if shown
   - `vat`: VAT amount in cents if shown
   - `text`: All readable text

4. **Present findings** to the user in a clear format:
   ```
   Receipt Analysis:
   - Name: ...
   - Merchant: ...
   - Total: $XX.XX (XXXX cents)
   - Currency: USD
   - Date: 2024-03-15
   - Category: food (Food and Drinks)
   - Type: expense
   ```

5. **Ask for confirmation** before saving.

6. **On confirmation**, run:
   ```
   npx tsx src/cli/files.ts upload <path>
   npx tsx src/cli/transactions.ts create --name "..." --total <cents> --currency <code> --category <code> --date <date> --merchant "..." --type <type>
   npx tsx src/cli/files.ts link <fileId> <transactionId>
   ```

7. **Confirm** the transaction was created with its ID.

## Rules
- NEVER fabricate data. If uncertain, leave blank and tell the user.
- Amounts are ALWAYS in cents.
- Use the `prompt` field on categories/fields as classification guidance.
