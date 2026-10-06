# Known Issues & Limitations

This document tracks known issues, minor non-blocking bugs, and architectural limitations in the current CampusOS implementation.

## Database & Analytics

1. **Only Full Group By (MySQL 8)**
   - **Issue:** Certain complex aggregation queries (like grade distribution snapshots) require workarounds or subqueries due to MySQL 8's strict `only_full_group_by` mode.
   - **Impact:** Analytics queries may need occasional refactoring if additional columns are added to the `SELECT` list without being included in the `GROUP BY` clause.
   - **Status:** Mitigated in Phase 12 using subquery aggregation.

2. **Cross-module Transactions**
   - **Issue:** Some cross-module operations (like Bulk Enrollment which spans M1 Core and M2 Academics) manage transactions at the application layer rather than the database level.
   - **Impact:** In the event of a catastrophic backend failure mid-execution, partial data might be persisted without rollback.
   - **Workaround:** Additive migrations can be used to wrap logic in a stored procedure if strict ACID guarantees are required across module boundaries.

## Frontend Application

1. **Real-time Updates**
   - **Issue:** The dashboards currently fetch data via REST upon loading and rely on React Query for caching. There are no WebSockets (Out of scope per PRD).
   - **Impact:** Analytics and dashboards are not strictly real-time and require a manual refresh (or component remount) to see the latest data.
   - **Status:** Working as intended (by design).

2. **Large Dataset Rendering**
   - **Issue:** The frontend does not currently employ virtualization for very large lists (e.g., thousands of audit logs or bulk enrollment lists).
   - **Impact:** Performance degradation could occur if a single payload returns an unusually large number of items. Pagination is implemented on the backend to mitigate this.

## Security & Authentication

1. **Secret Storage**
   - **Issue:** The `.env` file structure is used for secrets (JWT keys, DB passwords).
   - **Impact:** Suitable for development, but in a true production environment, a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) should be used.
   - **Status:** Documented limitation.

2. **Session Invalidation**
   - **Issue:** JWT tokens are stateless. Without a token blacklist, tokens remain valid until they expire.
   - **Impact:** Immediate logout is handled client-side by deleting the token. The backend cannot forcibly invalidate a token before its natural expiry.
   - **Status:** Accepted limitation for v1.0.

## Workflow Limitations

1. **Hostel Allocation Race Conditions**
   - **Issue:** Multiple admins approving hostel requests simultaneously could theoretically overallocate a room.
   - **Mitigation:** The database trigger (`TR_hostel_capacity_check`) enforces capacity constraints at the database level and will block the transaction, returning an error.
   - **Impact:** The UI might show a generic "Server Error" rather than a specific "Room Full" message if the trigger aborts the transaction.
