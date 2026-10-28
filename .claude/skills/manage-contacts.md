---
name: manage-contacts
description: View, create, update, and search contacts (clients, vendors, contractors). Foundation for invoicing and bill tracking.
---

# Manage Contacts

Manage the contact database — clients you invoice, vendors you pay, and contractors who need 1099s.

## Workflow

1. **Determine the action** from the user's request:
   - View all contacts → list
   - Add a new client/vendor → create
   - Update existing → update
   - Search → search
   - Delete → delete

2. **List contacts**:
   ```
   npx tsx src/cli/contacts.ts list [--type client|vendor|both]
   ```

3. **Create a contact** from natural language. Extract:
   - **name**: The person or company name
   - **type**: "client" (they pay you), "vendor" (you pay them), "both"
   - **email**: For invoicing
   - **payment-terms**: "due_on_receipt", "net15", "net30", "net60"
   - **default-category**: Auto-categorize their transactions
   - **default-project**: Auto-assign to a project
   ```
   npx tsx src/cli/contacts.ts create --name "Acme Corp" --type client --email "billing@acme.com" --payment-terms net30 --default-project acme
   ```

4. **Search contacts**:
   ```
   npx tsx src/cli/contacts.ts search "acme"
   ```

5. **Update a contact**:
   ```
   npx tsx src/cli/contacts.ts update <id> --email "new@acme.com" --payment-terms net15
   ```

6. **Delete a contact**:
   ```
   npx tsx src/cli/contacts.ts delete <id>
   ```

## Important Rules
- Contact names must be unique per user
- When the user mentions a client or vendor by name, search contacts first to avoid duplicates
- For 1099 tracking: set --tax-id and note if W-9 is received
- Payment terms affect invoice due date calculation
