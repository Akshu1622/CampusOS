# Phase 7 Frozen State

Everything built up to Phase 7 is now considered FROZEN. 
This includes:
- The base database schema (tables, constraints, foreign keys).
- All seed data configurations.
- All programmability objects (procedures, functions, triggers, views).
- The initial user accounts and privilege grants.

## Change Process
If a frozen file contains an error or blocks future work:
1. **Do NOT edit the frozen file.**
2. Create a new, additive migration script in `db/schema/` (e.g., `98_fix_something.sql`).
3. Ensure the migration can be safely executed by the database runner (`db_up.py` or `db_reset.py`).
4. Log the issue and the corresponding migration in `docs/DECISIONS_LOG.md`.
