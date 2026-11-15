---
name: ar-check
description: Accounts receivable check - show outstanding invoices, overdue amounts, and aging report.
---

# AR Check (Accounts Receivable)

Review outstanding invoices and track what clients owe you.

## Workflow

1. **Get overdue invoices**:
   ```
   npx tsx src/cli/invoices.ts overdue
   ```

2. **Get aging report**:
   ```
   npx tsx src/cli/invoices.ts aging
   ```

3. **Get all outstanding (sent but unpaid) invoices**:
   ```
   npx tsx src/cli/invoices.ts list --status sent
   ```

4. **Present the AR report**:

   ```markdown
   # Accounts Receivable Report
   **Date:** 2026-03-23

   ## Summary
   | | Amount |
   |---|---|
   | Total Outstanding | $XX,XXX.XX |
   | Current (not yet due) | $XX,XXX.XX |
   | Overdue | $XX,XXX.XX |

   ## Aging
   | Bucket | Count | Total |
   |--------|-------|-------|
   | Current | X | $X,XXX.XX |
   | 1-30 days overdue | X | $X,XXX.XX |
   | 31-60 days overdue | X | $X,XXX.XX |
   | 61-90 days overdue | X | $X,XXX.XX |
   | 90+ days overdue | X | $X,XXX.XX |

   ## Overdue Invoices (Action Required)
   | Invoice | Client | Amount | Due Date | Days Overdue |
   |---------|--------|--------|----------|-------------|
   | INV-2026-001 | Acme Corp | $5,000 | 2026-02-15 | 36 days |
   ```

5. **Suggest actions** for overdue invoices:
   - "Send a reminder to Acme Corp?" (use /send-invoice to draft follow-up)
   - "Mark INV-2026-001 as paid?" (if client already paid)

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- Only count invoices with status "sent" as outstanding
- "Draft" invoices are not AR — they haven't been issued yet
- Always sort overdue invoices by days overdue (most overdue first)
