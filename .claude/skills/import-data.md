---
name: import-data
description: Import transactions from a CSV file or restore from a backup ZIP.
---

# Import Data

Import transactions from CSV or restore a backup.

## Workflow

### CSV Import
1. **Read the CSV file** using the Read tool to understand its columns
2. **Show the user** the detected columns and suggest a mapping to TaxHacker fields
3. **Confirm mapping** with the user
4. **Run import**:
   ```
   npx tsx src/cli/import-export.ts import-csv <file.csv> --mapping '{"CSV Column": "fieldCode", ...}'
   ```
5. **Report** how many transactions were imported

### Backup Restore
1. **Confirm** with the user that this will add data from the backup
2. **Run restore**:
   ```
   npx tsx src/cli/import-export.ts restore <backup.zip>
   ```
3. **Report** results

## Field Mapping Reference
Common field codes for mapping:
- `name` - transaction name/description
- `merchant` - store/vendor
- `total` - amount (will be converted to cents if decimal)
- `currencyCode` - currency (USD, EUR, etc.)
- `issuedAt` - date (YYYY-MM-DD)
- `categoryCode` - category code
- `projectCode` - project code
- `type` - "expense" or "income"
- `note` - notes
