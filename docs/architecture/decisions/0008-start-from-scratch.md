# 0008. Start from scratch: retire the old app's data, load investments once

- Status: Accepted
- Date: 2026-10-10

## Context

An import of the old app's data with a check report (ADR 0007) was built and merged, but the owner
decided not to run it: the expense history in the old app is not wanted, and day-to-day spending
will come from the export of the app used today. The owner's mutual fund and share history lives
in a personal Excel tracker.

## Decision

- Migration 0008 permanently deletes the old app's tables and the functions that wrote them. The
  import migration, its Settings card and its code were removed before they ever ran.
- The ledger starts empty; the existing starter (usual categories and a Cash account) sets it up.
- Fund and share history from the Excel tracker is loaded once with a SQL file generated for the
  owner and run in the SQL Editor as the owner (same Row Level Security and checks as the app).
  The file holds personal data; it is committed in `supabase/one-time/` at the owner's request,
  although the repository is public. Fund purchases follow the owner's rule (the first date as in
  the sheet, then the 1st of each following month); share dates that Excel read as month/day are
  corrected; two rows are read as sales so the sheet's own totals reconcile under FIFO; and it
  refuses to commit if the loaded totals differ from the sheet.
- The next importer is built around the export file of the app used today, together with export.

## Consequences

- No code path in the app for one-off migrations; the repository holds only reusable features.
- The owner must confirm the corrections listed at the top of the SQL file (the two sales and the
  corrected dates) before relying on gains and XIRR.
- Digital gold, PF history and salary rows from the Excel wait for their own modules.
