# Decisions Log

| Phase | Decision | Reason |
|-------|----------|--------|
| 3 | Added `db/schema/00_a_schema_version_fix.sql` to add `file_name` to `schema_version`. | Needed to track which specific files have been run by the runner since the frozen Phase 1 schema only had a `version` INT column. |
