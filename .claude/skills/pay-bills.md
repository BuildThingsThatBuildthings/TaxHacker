---
name: pay-bills
description: Review and pay outstanding bills. Marks bills as paid and creates corresponding expense transactions.
---

# Pay Bills

Review outstanding bills and mark them as paid, which automatically creates expense transactions.

## Workflow

1. **List unpaid bills**:
   ```
   npx tsx src/cli/bills.ts list --status pending
   npx tsx src/cli/bills.ts list --status approved
   ```

2. **Present bills for payment**:
   ```markdown
   ## Bills Ready for Payment

   | # | Vendor | Bill # | Amount | Due Date | Status |
   |---|--------|--------|--------|----------|--------|
   | 1 | Adobe | INV-123 | $54.99 | 2026-03-25 | approved |
   | 2 | AWS | INV-456 | $245.00 | 2026-03-15 | pending (overdue) |
   | 3 | Figma | INV-789 | $15.00 | 2026-04-01 | pending |

   Total: $314.99
   ```

3. **Ask the user** which bills to pay (all, specific ones, or none).

4. **For each bill to pay**:
   - If status is "pending", approve first:
     ```
     npx tsx src/cli/bills.ts approve <id>
     ```
   - Mark as paid:
     ```
     npx tsx src/cli/bills.ts mark-paid <id> --paid-date 2026-03-23
     ```
   - This automatically creates an expense transaction

5. **Confirm results**:
   ```markdown
   ## Payment Summary
   - Adobe INV-123: Paid $54.99 → Transaction created
   - AWS INV-456: Paid $245.00 → Transaction created

   Total paid: $299.99
   Remaining unpaid: 1 bill ($15.00)
   ```

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- The paid date should be today unless the user specifies otherwise
- Each mark-paid automatically creates an expense transaction — do NOT create a separate transaction manually
- After paying, the bill status changes to "paid" and cannot be unpaid
