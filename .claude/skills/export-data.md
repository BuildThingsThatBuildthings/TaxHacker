---
name: export-data
description: Export transaction data to CSV or create a full backup ZIP file.
---

# Export Data

Export transactions or create a full backup.

## Workflow

1. **Ask the user** what they want:
   - **CSV export** - just transactions as a spreadsheet
   - **Full backup** - ZIP with all data + receipt files

2. **For CSV export**:
   ```
   npx tsx src/cli/import-export.ts export-csv --output ./exports/transactions.csv [--from DATE] [--to DATE]
   ```
   Tell the user the file path when done.

3. **For full backup**:
   ```
   npx tsx src/cli/import-export.ts backup --output ./exports/taxhacker-backup-YYYY-MM-DD.zip
   ```
   Tell the user the file path and size when done.

4. If the user specifies a date range, pass `--from` and `--to` flags.
