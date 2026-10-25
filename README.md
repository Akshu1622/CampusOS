# CampusOS — University ERP System

CampusOS is an enterprise University ERP solution engineered for institutional governance, academic planning, exam processing, finance, human resources, hostel administration, and institutional analytics.

---

## 🏛️ System Architecture & Modules

The platform is partitioned into 7 cohesive modules built according to the PRD specification (`docs/Educational_ERP_PRD.md`) and UI design system (`docs/design.md`):

| Module | Scope & Capabilities | Key Entities & Views | Status |
|--------|----------------------|-----------------------|--------|
| **M1: Core** | Identity, RBAC, departments, academic terms, programs, students | `user_account`, `department`, `program`, `academic_term`, `student` | ✅ Complete |
| **M2: Academics & Enrollment** | Course catalog, curriculum matrices, term offerings, capacity & waitlists, individual & bulk enrollment | `course`, `curriculum_mapping`, `course_offering`, `enrollment` | ✅ Complete |
| **M3: Attendance & Exams** | Session attendance, 75% shortage enforcement, exam scheduling, hall-ticket registration, double-entry marks, SGPA/CGPA evaluation | `attendance_session`, `exam`, `exam_registration`, `exam_marks_result` | ✅ Complete |
| **M4: Finance** | Fee groups, component structures, student dues generation, payment allocations, audit ledger | `fee_structure`, `fee_component`, `student_fee`, `payment`, `receipt` | ✅ Complete |
| **M5: HR & Payroll** | Faculty directory, designation bands, leave entitlements & approvals, monthly payroll finalization | `employee`, `leave_type`, `leave_application`, `salary_structure`, `payroll_run` | ✅ Complete |
| **M6: Hostel** | Hall management, room & bed allocations, student accommodation applications & reviews | `hostel`, `room`, `hostel_allocation`, `hostel_request` | ✅ Complete |
| **M7: Analytics & Audit** | Role dashboards (Admin, Faculty, Student), statutory report hub, system data integrity engine | `audit_log`, `vw_admin_dashboard`, `sp_student_dashboard`, `sp_faculty_dashboard` | ✅ Complete |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS / Vanilla Design Tokens, React Router DOM, Lucide Icons, Headless UI
- **Backend:** FastAPI (Python 3.12+), SQLAlchemy 2.0, PyMySQL, Pydantic V2, SlowAPI Rate Limiting, Argon2 Password Hashing
- **Database:** MySQL 8.x in Docker container (`university_erp_db`), Strict SQL Mode, Triggers, Stored Procedures, Deterministic Generators
- **Testing:** Pytest (Backend API & Services), Vitest (Frontend Unit Tests), Playwright (End-to-End Automation)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/) (running)
- Python 3.12+
- Node.js 20+ & npm

### 2. Environment Configuration
Copy `.env.example` to `.env` (or configure your database parameters):
```bash
# Core Environment Variables
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=university_erp
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_APP_USER=app
MYSQL_APP_PASSWORD=apppassword
JWT_SECRET=8f5b8c9d0a1e2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Database Initialization
```powershell
# Start MySQL in Docker
python scripts/db_up.py

# Reset schema and seed baseline demo data
python scripts/db_reset.py

# Verify seed integrity
python scripts/verify_seed.py
```

### 4. Running the Backend
```powershell
# Automated launcher with virtualenv setup:
python scripts/dev_backend.py

# Or manual execution:
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
or python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI is accessible at: `http://localhost:8000/docs`

### 5. Running the Frontend
```powershell
cd frontend
npm install
npm run dev
```
Application interface is accessible at: `http://localhost:5173`

---

## 🔑 Demo Accounts & Credentials

All test accounts use the password: `password123`

| Username | Role | Assigned Permissions / Notes |
|----------|------|------------------------------|
| `admin_core` | Admin | `Core_Admin`, `Academics_Admin`, `Exams_Admin`, `Finance_Admin` |
| `admin_finance` | Admin | `Finance_Admin` |
| `admin_hr` | Admin | `HR_Admin` |
| `admin_hostel` | Admin | `Hostel_Admin` |
| `faculty1` | Faculty | Assigned Instructor (`EMP-2020-0001`) |
| `student1` | Student | 100% Attendance Student (`STU-2023-0001`) |
| `student3` | Student | 50% Attendance Cohort (< 75% Shortage Test) |

Full credentials list available in [`docs/DEMO_CREDENTIALS.md`](file:///c:/Users/Admin/.antigravity/CampusOS/docs/DEMO_CREDENTIALS.md).

---

## 🧪 Comprehensive Verification & Test Suites

### 1. Database Full Verification (`db_verify.py`)
Runs 9 comprehensive verification tasks:
```powershell
python scripts/db_verify.py
```
- `db_reset` & `verify_seed`: 30 deterministic cohort checks
- `db_backup` & `db_restore`: SQL dump and recovery test
- `db_test --proofs`: Negative constraint tests, triggers, stored procedure tests, concurrency locks
- `test_privileges`: Strict DDL prevention on `app` database role
- `gen_data_dictionary` & `gen_db_contract`: Live schema synchronization

### 2. Backend Test Suite (Pytest)
```powershell
cd backend
.\venv\Scripts\python -m pytest tests/
```
38/38 unit and integration tests across M1..M7 modules and security.

### 3. Frontend Unit Tests (Vitest)
```powershell
cd frontend
npm test -- --run
```
18/18 tests verifying attendance percentage math, marks range bounds, CSV parsing, and UI components.

### 4. Frontend E2E Tests (Playwright)
```powershell
cd frontend
npx playwright test tests/e2e/m2_academics.spec.ts tests/e2e/m3_attendance_exams.spec.ts
```
20/20 end-to-end tests across A-01..A-08 and E-01..E-12 with visual responsive snapshots at 1440px, 768px, and 375px in [`docs/repair_screenshots/m2_m3/`](file:///c:/Users/Admin/.antigravity/CampusOS/docs/repair_screenshots/m2_m3/).

### 5. API Smoke & Health Audits
```powershell
# API Smoke Test:
.\backend\venv\Scripts\python -u scripts/smoke_test.py

# Backend SQL Static/Dynamic Check:
.\backend\venv\Scripts\python -u scripts/check_backend_sql.py

# M2 & M3 Specific Endpoint Contract Check:
.\backend\venv\Scripts\python -u scripts/check_m2_m3_api.py
```

### 6. Full Route Health Crawler
All 78 application routes crawled with live user sessions:
- Results documented in [`docs/PAGE_HEALTH.md`](file:///c:/Users/Admin/.antigravity/CampusOS/docs/PAGE_HEALTH.md) (78/78 OK, 0 errors).

---

## 📁 Repository Structure

```
CampusOS/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Security, errors, rate limiter, config
│   │   ├── dependencies/     # Database and auth dependencies
│   │   └── modules/          # m1_core .. m7_analytics
│   └── tests/                # Module test suites (test_m1 .. test_m7)
├── frontend/                 # React 19 Frontend
│   ├── src/
│   │   ├── components/       # Shared UI primitives, Layouts, Navigation
│   │   ├── features/         # Feature modules (m1 .. m7)
│   │   └── routes/           # Role-based route declarations
│   └── tests/e2e/            # Playwright end-to-end specifications
├── db/                       # SQL Schema & Programs
│   ├── schema/               # Table DDL definitions
│   ├── programs/             # Functions, triggers, procedures
│   ├── views/                # Reporting and dashboard views
│   └── seed/                 # Deterministic demo and reference datasets
├── docs/                     # Specifications & Health Logs
│   ├── Educational_ERP_PRD.md # Master Product Requirements Document
│   ├── design.md             # UI Design Specifications
│   ├── DEMO_CREDENTIALS.md   # Test account directory
│   ├── PAGE_HEALTH.md        # 78-route crawler health audit
│   └── REPAIR_PROGRESS.md    # Multi-phase repair tracker
└── scripts/                  # CLI automation and verification utilities
```
