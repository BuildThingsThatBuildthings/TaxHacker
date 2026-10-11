---
name: send-invoice
description: Email an invoice to a client via Gmail. Drafts a professional email with invoice details and marks the invoice as sent.
---

# Send Invoice

Email an invoice to a client using Gmail MCP integration.

## Arguments

- **invoice ID or number**: Which invoice to send

## Workflow

1. **Get the invoice**:
   ```
   npx tsx src/cli/invoices.ts get <id>
   ```

2. **Verify the invoice is ready to send**:
   - Must have a client email (from invoice or contact)
   - Must be in "draft" or "sent" status (allow re-sending)
   - Must have line items and a total

3. **If no client email**, look up the contact:
   ```
   npx tsx src/cli/contacts.ts search "<clientName>"
   ```
   If contact has an email, use it. Otherwise, ask the user for the email.

4. **Compose the email** using Gmail MCP:
   Use `mcp__claude_ai_Gmail__gmail_create_draft` to create a draft with:

   **Subject:** Invoice {invoiceNumber} from {businessName} - {description}

   **Body:**
   ```
   Hi {clientName},

   Please find below the details for invoice {invoiceNumber}.

   Invoice: {invoiceNumber}
   Date: {issuedAt}
   Due Date: {dueDate}

   {line items formatted as a text table}

   Total: {total formatted as currency}

   Payment Terms: {paymentTerms or "Due on receipt"}

   {notes if any}

   Thank you for your business.

   {businessName}
   ```

5. **Mark the invoice as sent**:
   ```
   npx tsx src/cli/invoices.ts mark-sent <id>
   ```

6. **Confirm to the user**: "Invoice {invoiceNumber} email drafted for {clientEmail}. Check Gmail drafts to review and send."

## Important Rules
- Always create a DRAFT, not send directly — let the user review before sending
- Amounts are in cents. Format for display: divide by 100
- If the invoice was already sent, warn the user this is a re-send
- Include the business name from settings if available
