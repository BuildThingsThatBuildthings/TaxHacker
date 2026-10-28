---
name: ap-check
description: Accounts payable check - show bills due, overdue bills, and AP aging report.
---

# AP Check (Accounts Payable)

Review what you owe — bills due soon, overdue bills, and payment aging.

## Workflow

1. **Get bills due this week**:
   ```
   npx tsx src/cli/bills.ts due-this-week
   ```

2. **Get overdue bills**:
   ```
   npx tsx src/cli/bills.ts overdue
   ```

3. **Get aging report**:
   ```
   npx tsx src/cli/bills.ts aging
   ```

4. **Present the AP report**:

   ```markdown
   # Accounts Payable Report
   **Date:** 2026-03-23

   ## Summary
   | | Amount |
   |---|---|
   | Total Outstanding | $XX,XXX.XX |
   | Due This Week | $X,XXX.XX |
   | Overdue | $X,XXX.XX |

   ## Due This Week
   | Vendor | Bill # | Amount | Due Date |
   |--------|--------|--------|----------|
   | Adobe | INV-123 | $54.99 | 2026-03-25 |

   ## Overdue (Action Required)
   | Vendor | Bill # | Amount | Due Date | Days Overdue |
   |--------|--------|--------|----------|-------------|
   | AWS | INV-456 | $245.00 | 2026-03-15 | 8 days |

   ## Aging
   | Bucket | Count | Total |
   |--------|-------|-------|
   | Current | X | $X,XXX.XX |
   | 1-30 days overdue | X | $X,XXX.XX |
   | 31-60 days overdue | X | $X,XXX.XX |
   | 61-90 days overdue | X | $X,XXX.XX |
   | 90+ days overdue | X | $X,XXX.XX |
   ```

5. **Suggest actions**:
   - "Pay the Adobe bill? (will create expense transaction)"
   - "Mark AWS bill as paid?"

## Important Rules
- Amounts are in cents. Format for display: divide by 100
- Sort due-this-week by due date (soonest first)
- Sort overdue by days overdue (most overdue first)
- Only include pending and approved bills (not already paid or void)
