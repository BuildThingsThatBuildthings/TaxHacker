---
name: record-bill
description: Record a bill from a vendor. Can be created from a receipt image, email, or manual entry.
---

# Record Bill

Record a bill (something you owe) from a vendor. This creates an accounts payable entry that tracks the bill until it's paid.

## Arguments

- Natural language description, receipt image path, or specific flags

## Workflow

1. **Get context** — load contacts and categories:
   ```
   npx tsx src/cli/contacts.ts list --type vendor
   npx tsx src/cli/categories.ts list
   ```

2. **If a receipt/image is provided**, analyze it first:
   - Read the image using the Read tool
   - Extract: vendor name, total, date, due date, bill number, line items
   - Match vendor to existing contacts

3. **Parse the bill details**:
   - **vendor**: Vendor/company name. Match against existing contacts.
   - **total**: Amount in cents
   - **due-date**: When payment is due
   - **bill-number**: Vendor's invoice/bill number (for reference)
   - **category**: Best matching expense category
   - **project**: If applicable

4. **Create the bill**:
   ```
   npx tsx src/cli/bills.ts create --vendor "Adobe" --total 5499 --currency USD --category software --due-date 2026-04-01 --bill-number "INV-12345" --notes "Creative Cloud subscription"
   ```

5. **If the vendor is new**, offer to create a contact:
   ```
   npx tsx src/cli/contacts.ts create --name "Adobe" --type vendor --default-category software
   ```

6. **Present the bill** to the user for confirmation.

## Important Rules
- Amounts are ALWAYS in cents. $54.99 = 5499 cents
- If the bill is already past due, flag it immediately
- If a similar bill exists (same vendor + similar amount in same month), warn about potential duplicate
- Bills start in "pending" status — they need to be approved before payment
