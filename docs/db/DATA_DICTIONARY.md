# Data Dictionary (Structure Outline)

*(Note: Detailed table-by-table column definitions are maintained in `LOGICAL_SCHEMA.md`. This document outlines the standard dictionary format.)*

## Standard Column Definitions

1. **id**: `BIGINT/INT AUTO_INCREMENT PK`. Surrogate primary key. Never exposed to users if a Global ID exists.
2. **global_x_id**: `VARCHAR` with format constraint. The human-readable identifier (e.g. `STU-2023-000123`).
3. **status**: `ENUM`. Governs lifecycle state (e.g., ACTIVE, PENDING, INACTIVE).
4. **_id**: Foreign Key column suffixed with `_id` always linking to the `id` column of the target table.
5. **created_at / timestamp**: `DATETIME DEFAULT CURRENT_TIMESTAMP`. Audit logging.

## Data Types

- **Currency/Money**: Always `DECIMAL(10,2)` (e.g., fee amounts, salary).
- **Percentages/Marks**: Always `DECIMAL(5,2)` or `DECIMAL(4,2)` (e.g., 95.50 marks).
- **Booleans**: Always `TINYINT(1)` (0 for False, 1 for True).
- **Dates**: `DATE` for calendar days, `DATETIME` for exact timestamps.

## Constraints

- **Foreign Keys**: Index on child column, mostly `RESTRICT` deletion rules, rarely `CASCADE` (only for weak entities like `payslip_line`).
- **Unique**: Secondary unique keys applied to business identifiers (e.g., `email`, `code`, `global_student_id`).
- **Check**: Range validations (e.g., `amount >= 0`).
