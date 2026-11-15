---
name: create-invoice
description: Create and manage invoices for clients. Supports natural language input like "invoice Acme Corp $5000 for March consulting".
---

# Create Invoice

Create invoices from natural language descriptions and manage the full invoice lifecycle.

## Arguments

- Natural language description of what to invoice, OR specific flags

## Workflow

1. **Get context** — load contacts and projects:
   ```
   npx tsx src/cli/contacts.ts list --type client
   npx tsx src/cli/projects.ts list
   ```

2. **Parse the user's request** to extract:
   - **Client name**: Match against existing contacts. If no match, ask if they want to create one.
   - **Line items**: What's being billed. Each item needs: description, quantity, unit price.
   - **Currency**: Default to user's default currency if not specified
   - **Project**: Match against existing projects if mentioned
   - **Due date**: Calculate from contact's payment terms if not specified (e.g., net30 = 30 days from today)
   - **Tax rate**: Only if the user specifies it

3. **Build the line items JSON**:
   ```json
   [
     {"description": "March consulting - 40 hours", "quantity": 1, "unitPrice": 500000, "amount": 500000},
     {"description": "Travel expenses", "quantity": 1, "unitPrice": 15000, "amount": 15000}
   ]
   ```
   - unitPrice and amount are in **cents** (multiply dollars by 100)
   - amount = quantity * unitPrice

4. **Create the invoice**:
   ```
   npx tsx src/cli/invoices.ts create --client "Acme Corp" --items '[...]' --currency USD --project acme --due-date 2026-04-22 [--contact-id X] [--client-email X] [--tax-rate 0] [--notes "March 2026 services"]
   ```

5. **Present the invoice** to the user in a formatted table:
   ```
   Invoice: INV-2026-001
   Client: Acme Corp
   Date: 2026-03-23
   Due: 2026-04-22

   | Description                    | Qty | Unit Price | Amount    |
   |-------------------------------|-----|------------|-----------|
   | March consulting - 40 hours   | 1   | $5,000.00  | $5,000.00 |
   | Travel expenses               | 1   | $150.00    | $150.00   |
   |                               |     | Subtotal   | $5,150.00 |
   |                               |     | **Total**  | $5,150.00 |
   ```

6. **Ask the user** if they want to:
   - Mark it as sent (updates status)
   - Email it to the client (use /send-invoice)
   - Make changes

## Examples

User: "invoice Acme Corp $5000 for March consulting, net 30"
→ Create invoice with one line item: "March consulting", qty 1, $5000, due in 30 days

User: "bill Client ABC for 10 hours at $150/hr plus $200 travel"
→ Create invoice with two line items: "Consulting (10 hours)" qty 10 x $15000 = $150000, "Travel" qty 1 x $20000

## Important Rules
- Amounts are ALWAYS in cents. $5,000 = 500000 cents
- Invoice numbers auto-increment: INV-2026-001, INV-2026-002, etc.
- If contact has payment terms, use them to calculate due date
- Never create duplicate invoices — check recent invoices for same client + similar amount first
