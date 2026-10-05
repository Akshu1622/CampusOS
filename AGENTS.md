# Standing Rules for Agents

1. **Read Reference Documents First**: Always read the PRD (`docs/Educational_ERP_PRD.md`) and design file (`docs/design.md`) as well as `docs/TECH_DECISIONS.md` and `docs/DECISIONS_LOG.md` before acting.
2. **Never Edit Reference Documents**: The PRD and design file are strictly read-only. Never edit them.
3. **Database Management**: All database objects live in SQL files. Never create them by hand in the container.
4. **Build Order & Frozen-File Rule**:
   - The build proceeds in order from Phase 0 to Phase 13.
   - Everything built in earlier phases is FROZEN. Do not edit it unless a prompt explicitly allows it.
   - If a frozen file is wrong or blocks you, add a new additive file (e.g., a new migration) instead and log the issue in `docs/DECISIONS_LOG.md`.
5. **No Secrets**: Never hard-code secrets in the code. Use `.env`.
6. **Strict Scope**: Never add a feature, table, page, or endpoint that cannot be traced to the PRD or design file. Items tagged [DER] in the PRD are allowed; label them "derived".
7. **Verification**: Run all requested verifications before declaring a phase done.
8. **Reporting Blocks**: Stop and report the exact error only if the fix would require editing a frozen file.
9. **Commit Message Convention**: Use Conventional Commits with a phase prefix (e.g., `phase-3: add 01_core.sql`).
10. **Branch Naming**: Name branches using the pattern `phase-N/slug` (e.g., `phase-0/foundation`).
11. **Merging**: When all checks pass, merge the branch to `main` with `--no-ff`.
