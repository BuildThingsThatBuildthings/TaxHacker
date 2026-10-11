---
name: generate-recurring
description: Check for due recurring transactions (subscriptions, rent, etc.) and generate them as actual transactions.
---

# Generate Recurring Transactions

Check what recurring transactions are due and create them.

## Workflow

1. **Check what's due**:
   ```
   npx tsx src/cli/recurring.ts due
   ```

2. **If nothing is due**, tell the user "No recurring transactions are due."

3. **If items are due**, show the user what will be generated:
   | Name | Merchant | Amount | Frequency | Due Date |
   Format amounts from cents to dollars.

4. **Ask for confirmation** before generating.

5. **Generate transactions**:
   ```
   npx tsx src/cli/recurring.ts generate
   ```

6. **Show results**: Which transactions were created, their IDs, and the next due dates.

## Managing Recurring Transactions

To help the user set up recurring transactions:
```
npx tsx src/cli/recurring.ts create --name "Adobe CC" --total 5499 --currency USD --category software --frequency monthly --start 2024-04-01 --merchant "Adobe"
npx tsx src/cli/recurring.ts list
npx tsx src/cli/recurring.ts pause <id>
npx tsx src/cli/recurring.ts delete <id>
```

Frequencies: weekly, monthly, quarterly, yearly.
