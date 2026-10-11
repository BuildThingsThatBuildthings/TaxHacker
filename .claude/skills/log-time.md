---
name: log-time
description: Log billable and non-billable time for projects. Track hours for invoicing and profitability analysis.
---

# Log Time

Track time spent on projects for invoicing and profitability analysis.

## Arguments

- Natural language description, OR specific flags, OR "summary" / "uninvoiced" for reports

## Workflow

### Logging Time

1. **Parse the user's description** to extract:
   - **date**: When the work happened (default: today)
   - **minutes**: Duration (accept hours too — "2 hours" = 120 minutes)
   - **description**: What was done
   - **project**: Which project/client
   - **billable**: Whether it's billable (default: true)
   - **hourly rate**: If known (in cents)

2. **Log the time**:
   ```
   npx tsx src/cli/time.ts log --date 2026-03-23 --minutes 120 --description "UGC video editing for Client X" --project client_x --billable true --rate 15000
   ```
   Or with hours:
   ```
   npx tsx src/cli/time.ts log --date 2026-03-23 --hours 2 --description "..." --project client_x
   ```

3. **Confirm** with formatted output.

### Time Summary

```
npx tsx src/cli/time.ts summary [--from DATE] [--to DATE]
```

Present as:
```markdown
# Time Summary — March 2026
| Project | Billable | Non-billable | Total Hours |
|---------|----------|-------------|-------------|
| Client X | 24.5 hrs | 2.0 hrs | 26.5 hrs |
| Classes | 15.0 hrs | 5.0 hrs | 20.0 hrs |
| Internal | 0 hrs | 8.0 hrs | 8.0 hrs |
| **Total** | **39.5 hrs** | **15.0 hrs** | **54.5 hrs** |
```

### Uninvoiced Time

```
npx tsx src/cli/time.ts uninvoiced [--project X]
```

Shows billable time not yet linked to an invoice — ready to bill.

## Examples

User: "spent 3 hours on UGC editing today for Client X"
→ Log: date=today, minutes=180, description="UGC editing", project=client_x, billable=true

User: "2.5 hours of class prep yesterday, non-billable"
→ Log: date=yesterday, minutes=150, description="Class preparation", billable=false

## Important Rules
- Time stored as minutes (integer)
- Hourly rate in cents ($150/hr = 15000)
- Default is billable — explicitly mark non-billable
- Uninvoiced time can be pulled into invoice creation
- Time tracking feeds into project profitability analysis
