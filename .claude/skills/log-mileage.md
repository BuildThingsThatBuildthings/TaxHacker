---
name: log-mileage
description: Log business mileage from natural language. "Drove to client meeting, 22 miles round trip." Also generates mileage deduction reports.
---

# Log Mileage

Log business mileage for tax deductions. Accepts natural language descriptions.

## Arguments

- Natural language description of a trip, OR specific flags, OR "deduction" / "summary" for reports

## Workflow

### Logging a Trip

1. **Parse the user's description** to extract:
   - **date**: When the trip happened (default: today)
   - **origin**: Starting point (default: "Home" or "Office")
   - **destination**: Where they went
   - **miles**: Distance in miles. Store as tenths (22.5 miles = 225)
   - **purpose**: Business reason for the trip
   - **project**: If applicable
   - **round trip**: If mentioned, the CLI doubles the miles automatically

2. **Log the mileage**:
   ```
   npx tsx src/cli/mileage.ts log --date 2026-03-23 --origin "Home" --destination "Client Office" --miles 225 --purpose "Client meeting" --project acme --round-trip
   ```
   Note: miles are in tenths. 22.5 miles = 225.

3. **Confirm** to the user with formatted output.

### Mileage Summary

```
npx tsx src/cli/mileage.ts summary [--from DATE] [--to DATE]
```

### Mileage Deduction Report

```
npx tsx src/cli/mileage.ts deduction --year 2026
```

Present as:
```markdown
# Mileage Deduction Report — 2026
| | Value |
|---|---|
| Total Business Miles | 1,234.5 |
| Total Trips | 47 |
| IRS Rate | $0.70/mile |
| **Total Deduction** | **$864.15** |
```

## Examples

User: "drove to the client meeting downtown, about 15 miles"
→ Log: date=today, destination="Downtown client office", miles=150, purpose="Client meeting"

User: "22 mile round trip to the studio yesterday"
→ Log: date=yesterday, miles=220, roundTrip=true (doubles to 440 = 44 miles total)

## Important Rules
- Miles stored as tenths of a mile (22.5 = 225)
- IRS rate for 2025: $0.70/mile (70 cents). Check for updates annually.
- Round trip flag DOUBLES the miles automatically
- Purpose must be a legitimate business reason
- Commuting (home to regular office) is NOT deductible — flag if it looks like a daily commute
