# Database cost check + unfinished-feature triage

## Part 1 — Database load (findings so far)
The busiest database work is the background AI agents, not people using the app:
- Agent run logging: ~62k writes, the largest single cost (~308s total).
- A full scan of the `vectors` table with a total count, ~9.5k times (~139s).
- Agent state lookups: ~170k reads; agent proposal expiry checks: ~57k reads (repeated polling).
- Agent event inserts: ~4.7k.

Steps:
1. Get this project's database credit usage for the current period as a baseline (instance hours, storage).
2. Review each agent schedule: how often it runs vs. how often it finds work. Cut polling that does nothing, batch run logs, drop the exact count on the vectors scan, add indexes for state and proposal lookups after checking query plans.
3. Check table sizes (agent_runs, agent_events, vectors) and propose a retention window — no deletions without your approval.
4. Re-measure with the same workload and report. Note: savings only show up if the database is busy fewer hours or moves to a smaller size.

## Part 2 — Feature triage (continue / improve / abandon)
1. Inventory every feature per page: what renders, whether it reads real data, and whether anyone uses it (row counts and recent activity in its tables). About 73 files contain "coming soon", placeholder or TODO markers.
2. Score each feature on: real usage, how finished it is, fit with the north star (citizens getting local problems fixed), and running cost (e.g. agents).
3. Deliver a report (PDF in Files) with three lists: Continue, Finish, Abandon — with evidence for each. Nothing gets removed until you sign off on the lists.

## Technical details
- Tools: pg_stat_statements, EXPLAIN ANALYZE, cost context, row counts/last-activity per table, code search for placeholders and Coming Soon routes.
- Index changes go through migrations (plain CREATE INDEX). RLS and agent behaviour stay as they are unless you approve a change.
