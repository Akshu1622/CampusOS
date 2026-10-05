# Product Requirements Document
## University Higher Education ERP System (Web)

**Course context:** DBMS Collaborative Project, PICT, Dept. of E&TCE (Mr. L. P. Patil)
**Team structure:** 20–21 students · 2 Team Leaders · 7 sub-groups of 3
**Stack:** React (frontend) · FastAPI (backend) · MySQL (DBMS)
**Source of truth:** `DBMS_PBL_Activity.pdf` (Educational ERP portions only)

---

## 0. How to Read This Document

The PDF is a short architecture and specification deck. It gives a title, tech stack, three roles, a handful of named business functions, an Advanced SQL requirements table, leadership/integration expectations, and submission guidelines. It does **not** list pages, screens or APIs. To produce a buildable specification, every requirement here carries one of two tags:

| Tag | Meaning |
|---|---|
| **[PDF]** | Explicitly stated or directly implied by the PDF. Mandatory. |
| **[DER]** | Derived: the minimum supporting functionality needed to make a PDF-stated feature actually work (e.g., a "fee payment procedure" needs a fee structure, dues and a payment page). Nothing tagged [DER] contradicts the PDF. |

Anything common in ERPs but absent from the PDF is listed in **Section 1.4 (Out of Scope)** and is deliberately not specified.

---

## 1. Project Scope

### 1.1 Product
A web-based **University Higher Education ERP System** that integrates academic, examination, finance, HR, and hostel operations on one relational database, with dashboards for Admin, Faculty and Student roles. [PDF: "Interactive dashboards for admin, faculty & students"; "Connects modules like Finance, Academics & HR"]

### 1.2 In Scope
- **7 integrated database modules** [PDF: "7 integrated database modules"] with 3NF design and 20+ entities [PDF: advantages slide].
- Web application (React) for Admin, Faculty, Student roles.
- REST API backend (FastAPI), JWT/OAuth2-style authentication, RBAC. [PDF]
- MySQL with **stored procedures, triggers, user-defined functions, complex queries and views**. [PDF]
- Functions named by the PDF: bulk student enrollment, monthly payroll, fee payment with receipts, hostel bed auto-update on room allocation, fee-change audit logging, exam-registration block when attendance < 75%, CGPA calculation, late-fee penalty, faculty leave balances, analytical reports with JOIN / GROUP BY / HAVING / subqueries / window functions (RANK).
- Student-facing capabilities the PDF lists for the mobile app (attendance, grades, hostel requests) are delivered **in the web portal**.

### 1.3 Technology Decisions and Their Relation to the PDF

| Layer | PDF options | Decision (per team) | Notes |
|---|---|---|---|
| Frontend | React.js or Angular; Vue/Next; Bootstrap/Tailwind | **React** | PDF-compliant. |
| Backend | Java, Node, Python (Django/FastAPI), PHP | **FastAPI (Python)** | PDF-compliant. |
| Database | MySQL **and** MongoDB | **MySQL only** | The PDF lists MongoDB alongside MySQL. The team stack excludes it. All ACID, relational, procedure, trigger and view requirements are satisfied by MySQL. *Decision to confirm with the faculty guide.* |
| Auth | OAuth2 / JWT, RBAC (Admin, Faculty, Student) | JWT access/refresh tokens + RBAC | See §10. |
| API | REST / GraphQL; JSON/XML parsing | **REST** (GraphQL not used); JSON primary, XML accepted on bulk-import endpoints | PDF says "REST APIs / GraphQL", so REST alone is compliant. |

### 1.4 Out of Scope
- **Mobile application** (Flutter/React Native), mobile-specific features or pages.
- **Railway Reservation & Management System** (entire second project).
- UI/UX/visual design specifications.
- Physical schema, DDL and SQL scripts inside this PRD (they are separate team deliverables, see §14.3).
- Not mentioned in the PDF, therefore not specified: admissions/applicant management, library, transport, timetable/scheduling, parent portal, learning management (assignments/content), online payment gateway integration (the PDF lists gateways only for the Railway system), placement, alumni, notifications engine.

### 1.5 Mandatory Project Deliverables [PDF: Submission Guidelines]
1. Module-level ER diagram and system architecture.
2. Complete SQL DDL with PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL constraints.
3. SQL for procedures, triggers, functions with execution proof (test inputs/outputs).
4. Integration mapping document signed off by the 2 Team Leaders.
5. Also implied: data dictionary, database documentation, Git-based modular development. [PDF: advantages slide]

---

## 2. Product Overview

The ERP centralises a university's core operations on a single MySQL database:

- **Academics:** programs, courses, offerings, student enrollment (individual and bulk).
- **Attendance and Examinations:** attendance capture, exam registration gated by an attendance rule, marks, results, CGPA.
- **Finance:** fee structures, student dues, fee payment with receipts, late-fee penalties, fee audit trail.
- **HR:** employee/faculty records, leave policy and balances, leave workflow, monthly payroll.
- **Hostel:** hostels, rooms, beds, allocation, student hostel requests, live availability.
- **Platform and Analytics:** identity, RBAC, audit, dashboards, analytical reports.

**Design principle:** business rules the PDF assigns to SQL (procedures, triggers, UDFs) live **in the database**. FastAPI calls them and exposes results. The database enforces integrity even if the API is bypassed.

---

## 3. User Roles and Responsibilities

The PDF defines three RBAC roles: **Admin, Faculty, Student**. [PDF]

| Role | Responsibilities |
|---|---|
| **Admin** | Configure the university (departments, programs, terms, courses, offerings); manage users; run bulk enrollment; manage fee structures and view payments; run payroll; approve leave; manage hostels and allocations; publish results; view all analytical reports and audit logs. |
| **Faculty** | View assigned course offerings and rosters; mark attendance; enter marks; apply for leave and view leave balance; view own payslips and profile. |
| **Student** | View own profile, enrolled courses, attendance, grades/CGPA; register for exams (if eligible); view dues, pay fees, download receipts; view hostel allocation and raise hostel requests. |

**[DER] Admin scopes.** To keep a single "Admin" role while avoiding every admin seeing everything, Admin is implemented as one role with **permission sets** (Academic Admin, Exam Admin, Finance Admin, HR Admin, Hostel Admin, Super Admin). The Super Admin holds all sets. No additional top-level roles are introduced.

### 3.1 Access Matrix (summary)

| Capability | Admin | Faculty | Student |
|---|:-:|:-:|:-:|
| Manage users / roles / master data | ✔ | ✘ | ✘ |
| View own profile | ✔ | ✔ | ✔ |
| Course catalog and offerings (manage) | ✔ | ✘ | ✘ |
| Course offerings (view assigned / enrolled) | ✔ | ✔ own | ✔ own |
| Individual / bulk enrollment | ✔ | ✘ | ✘ |
| Mark attendance | ✔ (override) | ✔ own offerings | ✘ |
| View attendance | ✔ all | ✔ own offerings | ✔ own |
| Exam schedule (manage) / marks entry | ✔ | ✔ marks for own offerings | ✘ |
| Exam registration | ✔ (view/override per policy) | ✘ | ✔ own |
| View results / CGPA | ✔ all | ✔ own offerings | ✔ own |
| Fee structures / assignments | ✔ | ✘ | ✘ |
| Pay fees / view receipts | ✔ record on behalf | ✘ | ✔ own |
| Leave: apply / view balance | ✔ approve | ✔ own | ✘ |
| Payroll: run / view | ✔ | ✔ own payslips | ✘ |
| Hostel: manage / allocate | ✔ | ✘ | ✘ |
| Hostel: request / view own | ✔ review | ✘ | ✔ own |
| Analytical reports | ✔ | limited (own courses) | ✘ |
| Audit logs | ✔ | ✘ | ✘ |

---

## 4. Complete ERP Modules (the 7 Integrated Modules)

| # | Module | Primary PDF anchors |
|---|---|---|
| M1 | **Core Platform: Identity, RBAC, Master Data** | OAuth2/JWT, RBAC; global data standards (Student_ID); referential integrity |
| M2 | **Academics and Enrollment** | Bulk enrollment of students; Academics module |
| M3 | **Attendance and Examinations (incl. Results and CGPA)** | Attendance < 75% exam block; CGPA UDF; RANK() reports |
| M4 | **Finance and Fees** | Fee payment with receipts; late fee UDF; fee audit trigger; Finance module |
| M5 | **HR, Leave and Payroll** | Monthly payroll; faculty leave balance UDF; HR module |
| M6 | **Hostel Management** | Hostel bed trigger; hostel requests |
| M7 | **Analytics, Reporting and Audit** | Views; JOIN/GROUP BY/HAVING/Subquery/Window reports; audit tables |

### 4.1 Module Dependencies

```
M1 Core ──► M2 Academics ──► M3 Attendance/Exams/Results
   │              │                   │
   │              └──► M4 Finance ◄───┘   (exam fees, dues; results for reports)
   ├──► M5 HR/Payroll  ◄── M2 (faculty ↔ offerings)
   ├──► M6 Hostel      ◄── M4 (hostel fee dues, optional link)
   └──► M7 Analytics reads from all modules (views); Audit written by M4 and others
```

| Dependency | Description |
|---|---|
| M1 → all | Student, Faculty/Employee, Department, Program, Term, User identities are referenced by every module. |
| M2 → M3 | Attendance and exam registration reference **enrollments**. |
| M3 → M3 (rule) | Exam registration trigger reads attendance percentage per enrolled course. |
| M2/M3 → M4 | Fee assignments reference student, program and term; exam results do not alter fees. |
| M5 ↔ M2 | Faculty teaching assignments are course offerings; HR employee records include faculty. |
| M6 → M1 | Hostel allocation references student records. |
| M4 ↔ M6 | **[DER]** Hostel fee may be a fee component so that hostel dues flow through Finance. |
| M7 ← all | Views and reports join across modules. Read-only. |

---

## 5. Complete Page / Screen List

IDs are used in the work distribution (§15). "A/F/S" = Admin / Faculty / Student.

### 5.1 M1: Core Platform

| ID | Page | Roles |
|---|---|---|
| C-01 | Login | All |
| C-02 | Admin Dashboard | A |
| C-03 | Faculty Dashboard | F |
| C-04 | Student Dashboard | S |
| C-05 | My Profile / Change Password | All |
| C-06 | User Management (list, create, activate/deactivate, reset) | A |
| C-07 | Role & Permission Management | A |
| C-08 | Department Management | A |
| C-09 | Program (Degree) Management | A |
| C-10 | Academic Year / Term Management | A |
| C-11 | Student Master (list, create, edit, detail) | A |
| C-12 | Faculty/Staff Master → shared with M5 (see H-01) | A |
| C-13 | Unauthorized / Not Found / Session-expired screens | All |

### 5.2 M2: Academics and Enrollment

| ID | Page | Roles |
|---|---|---|
| A-01 | Course Catalog (list, create, edit) | A |
| A-02 | Curriculum Mapping (program–semester–course) | A |
| A-03 | Course Offerings (term, course, faculty, section, capacity) | A |
| A-04 | Individual Enrollment (single student / course) | A |
| A-05 | **Bulk Enrollment** (select program/term/offerings or upload JSON/XML/CSV; preview; run; result report) | A |
| A-06 | Enrollment Records (search, filter, drop/withdraw) | A |
| A-07 | My Courses | S |
| A-08 | My Teaching / Course Roster | F |

### 5.3 M3: Attendance, Examinations, Results

| ID | Page | Roles |
|---|---|---|
| E-01 | Mark Attendance (offering → session → roster) | F (A override) |
| E-02 | Attendance History / Edit Session | F, A |
| E-03 | My Attendance (per course %, eligibility flag) | S |
| E-04 | Attendance Shortage Report (< 75%) | A, F (own) |
| E-05 | Exam Management (create exam events/schedule per offering) | A |
| E-06 | **Exam Registration** (list eligible/ineligible courses, register) | S |
| E-07 | Exam Registration Monitor (registrations, blocked attempts) | A |
| E-08 | Marks Entry | F |
| E-09 | Result Processing and Publishing (compute grades, publish) | A |
| E-10 | My Results / Grade Card (SGPA, CGPA) | S |
| E-11 | Grade Scale and Credit Configuration | A |
| E-12 | Course Result Summary | F, A |

### 5.4 M4: Finance and Fees

| ID | Page | Roles |
|---|---|---|
| F-01 | Fee Structure Management (components per program/term) | A |
| F-02 | Fee Assignment / Invoice Generation (per student or bulk) | A |
| F-03 | Late Fee Rule Configuration | A |
| F-04 | My Fees and Dues (items, due dates, computed late fee) | S |
| F-05 | **Pay Fee** (select dues, mode, confirm) | S (A on behalf) |
| F-06 | Payment Confirmation and Receipt | S, A |
| F-07 | Receipt / Payment History | S, A |
| F-08 | Payment Ledger (search/filter all payments) | A |
| F-09 | Fee Defaulters List | A |
| F-10 | Fee Change Audit Log | A |

### 5.5 M5: HR, Leave, Payroll

| ID | Page | Roles |
|---|---|---|
| H-01 | Employee/Faculty Master (list, create, edit, detail) | A |
| H-02 | Designation Management | A |
| H-03 | Leave Types and Policy | A |
| H-04 | Apply for Leave | F |
| H-05 | My Leave (balance, history, status) | F |
| H-06 | Leave Approvals | A |
| H-07 | Salary Structure Management | A |
| H-08 | **Payroll Run** (month selector, run, review, finalize) | A |
| H-09 | Payroll Register (month/department view) | A |
| H-10 | My Payslips | F |

### 5.6 M6: Hostel

| ID | Page | Roles |
|---|---|---|
| S-01 | Hostel and Room Management (hostels, rooms, capacity) | A |
| S-02 | Room Allocation (assign student to room/bed; vacate) | A |
| S-03 | Hostel Occupancy Dashboard (beds total/occupied/available) | A |
| S-04 | My Hostel (allocation details) | S |
| S-05 | New Hostel Request | S |
| S-06 | My Hostel Requests (status tracker) | S |
| S-07 | Hostel Request Review (approve/reject → allocate) | A |

### 5.7 M7: Analytics and Audit

| ID | Page | Roles |
|---|---|---|
| R-01 | Reports Hub (list of reports, parameters, export) | A (F limited) |
| R-02 | Each report page (see §6.7) | A |
| R-03 | System Audit Log Viewer (all audit tables) | A |
| R-04 | Data Integrity / Integration Status (FK and ID-standard checks) | A |

---

## 6. Detailed Functionality by Module and Page

General behaviour on every list page: server-side **pagination, search, filter, sort**; export of the current result to CSV; empty/error/loading states; confirmation before destructive actions.

### 6.1 M1: Core Platform

**C-01 Login:** username/email + password; on success returns tokens and routes to the role's dashboard. Locked after repeated failures. Inactive accounts rejected.
**C-02 Admin Dashboard:** counts (students, faculty, active enrollments), fees collected vs. due for current term, hostel beds available, pending leave requests, pending hostel requests, students below 75% attendance. Each tile links to its page.
**C-03 Faculty Dashboard:** assigned offerings this term, today's attendance to mark, pending marks entry, leave balance, latest payslip.
**C-04 Student Dashboard:** enrolled courses, attendance % per course with low-attendance warnings, CGPA, outstanding dues, hostel allocation, exam registration status.
**C-05 Profile:** view personal and role-specific details; edit allowed fields (contact info); change password.
**C-06 User Management:** create account (linked to a student or employee record), assign role, activate/deactivate, reset password; search by name/ID/role.
**C-07 Roles and Permissions:** view three roles; assign admin permission sets (§3); show who holds which scope.
**C-08/09/10 Master data:** CRUD for departments, programs (duration, credits required, department), academic years and terms (start/end, "current" flag; only one current term).
**C-11 Student Master:** create student (generates **Student_ID in the global standard format**), edit, view full detail with tabs for academics, fees, hostel; filter by program/department/batch/status.

### 6.2 M2: Academics and Enrollment

**A-01 Course Catalog:** code (unique), title, credits, department, type; activate/retire.
**A-02 Curriculum Mapping:** map courses to program and semester, core/elective.
**A-03 Course Offerings:** create offering for a term with faculty, section, capacity; capacity tracked against enrollments.
**A-04 Individual Enrollment:** pick student + offering; validates term, capacity, duplicates, program mapping.
**A-05 Bulk Enrollment** [PDF: stored procedure]: Admin selects program + semester + term (enroll entire cohort in curriculum offerings) or uploads a JSON/XML/CSV file of (student, offering) pairs. Flow: upload/select → **validation preview** (valid / rejected rows with reasons) → confirm → executes the **bulk-enrollment stored procedure in one transaction** (or per-row savepoints with a reported rejects list; policy fixed by Team 2 and signed off by leaders) → result summary (enrolled, skipped, failed + reason) downloadable.
**A-06 Enrollment Records:** search by student/course/term; withdraw/drop with status history.
**A-07 / A-08:** student sees enrolled courses with faculty; faculty sees roster per offering.

### 6.3 M3: Attendance and Examinations

**E-01 Mark Attendance:** faculty picks offering and date/session; roster loads; mark present/absent (default present); submit. One session per offering/date/slot; resubmission edits existing session.
**E-02 History:** list sessions, edit within allowed window; Admin may override.
**E-03 My Attendance:** per course: sessions held, attended, percentage, **eligible / below 75%** indicator.
**E-04 Shortage Report:** list of (student, course, %) below 75%, filter by department/program/course.
**E-05 Exam Management:** define exam events per term/offering (type, date, max marks, registration open/close).
**E-06 Exam Registration** [PDF: trigger]: student sees exams for enrolled courses; ineligible ones (attendance < 75%) are flagged. Register action calls the API; the **database trigger rejects** registration when attendance < 75% and returns a clear reason. The UI check is advisory; the trigger is authoritative.
**E-07 Monitor:** counts by exam, blocked attempts, list of registrants.
**E-08 Marks Entry:** faculty enters marks for registered students of own offerings; validates against max marks; save draft/submit.
**E-09 Result Processing:** compute grade points per course from marks and the grade scale; compute SGPA; compute CGPA using the **CGPA UDF**; publish (published results become visible to students and read-only except via controlled revision).
**E-10 Grade Card:** per term courses, grades, credits, SGPA; cumulative CGPA.
**E-11 Grade Scale:** marks range → grade → grade points; credit rules.
**E-12 Course Result Summary:** pass %, average, distribution for the offering.

### 6.4 M4: Finance and Fees

**F-01 Fee Structure:** fee components (tuition, exam, hostel, etc. **[DER]**) with amounts per program/term, due date.
**F-02 Fee Assignment:** generate dues for one student or a whole cohort.
**F-03 Late Fee Rules:** penalty rule used by the **late-fee UDF** (e.g., per-day or flat after due date; parameters stored in DB, not hard-coded).
**F-04 My Fees:** itemised dues with due date, paid, balance, and late fee computed live via the UDF.
**F-05 Pay Fee** [PDF: stored procedure]: choose dues and mode; the API calls the **fee-payment stored procedure** which, in one ACID transaction, validates amount against balance, adds late fee, records payment, updates dues status, generates a **unique receipt number** and receipt record. No gateway integration (§1.4); mode is recorded (cash/online/DD **[DER]**) and "online" is simulated/confirmed by the system.
**F-06/07 Receipts:** receipt view (printable) and history with download.
**F-08 Ledger:** all payments, filter by date/student/program/mode/status; totals.
**F-09 Defaulters:** students with outstanding balance past due (HAVING-based report).
**F-10 Fee Audit Log** [PDF: trigger]: every change to fee structures or fee amounts is captured automatically by a DB trigger: old value, new value, who, when. View-only.

### 6.5 M5: HR, Leave, Payroll

**H-01 Employee Master:** employee code, personal details, department, designation, joining date, type (faculty/staff), status; faculty are employees linked to a user account.
**H-02/03 Designations and Leave Policy:** leave types, annual entitlement, carry-forward rule.
**H-04/05 Leave:** apply (type, dates, reason); system shows the **UDF-calculated balance** and blocks if insufficient; status tracking.
**H-06 Approvals:** admin approves/rejects with remark; approval deducts from balance (balance is always derived by the UDF from entitlement minus approved leave, not stored as a mutable number only).
**H-07 Salary Structure:** earning/deduction components per designation or employee.
**H-08 Payroll Run** [PDF: stored procedure]: select month → pre-check (already run?) → run **monthly payroll stored procedure** (computes gross, deductions, net per employee, accounting for unpaid leave **[DER]**) → review → finalize. One run per month; finalized runs are immutable.
**H-09 Register:** monthly payroll by employee/department; totals.
**H-10 Payslips:** faculty views/downloads own payslips.

### 6.6 M6: Hostel

**S-01:** define hostels, rooms, bed capacity.
**S-02 Allocation:** assign student to a room; the **trigger auto-updates available beds** [PDF]; blocked if no beds or student already allocated; vacate releases bed (trigger reverses).
**S-03 Occupancy:** per hostel total/occupied/available.
**S-05/06 Requests** [PDF: hostel requests]: student raises request (types **[DER]**: allocation, room change, vacate) and tracks status.
**S-07 Review:** admin approves/rejects; approval of allocation requests leads into S-02 flow.

### 6.7 M7: Analytics, Reporting and Audit

Reports are backed by **database views / complex queries** [PDF]. Report list below is **[DER]** examples chosen so that every SQL construct the PDF names is exercised:

| # | Report | SQL constructs demonstrated |
|---|---|---|
| RP-1 | Department-wise student ranking by CGPA | JOIN, **RANK() window function**, PARTITION BY |
| RP-2 | Top N students per program per term | Window function, subquery |
| RP-3 | Courses with average attendance below threshold | JOIN, GROUP BY, **HAVING** |
| RP-4 | Fee collection summary by program/term; defaulters above X amount | JOIN, GROUP BY, HAVING |
| RP-5 | Students whose dues exceed the average dues | **Subquery** |
| RP-6 | Hostel occupancy by hostel | JOIN, GROUP BY |
| RP-7 | Payroll summary by department/month | JOIN, GROUP BY |
| RP-8 | Faculty leave utilisation vs. entitlement | JOIN, UDF |
| RP-9 | Course-wise pass percentage and grade distribution | GROUP BY, conditional aggregation |
| RP-10 | Exam registration blocked/ineligible list | JOIN |

**R-03 Audit Log Viewer:** unified read-only view across fee audit and other audit tables with filters (entity, user, date).
**R-04 Integration Status:** admin screen listing results of referential-integrity and ID-format validation checks across modules (supports the leaders' integration sign-off).

---

## 7. User Workflows

| ID | Workflow | Steps (high level) |
|---|---|---|
| W-01 | Authentication | Login → token issued → role dashboard → token refresh → logout. |
| W-02 | Term setup | Admin creates term → fee structures → course offerings → curriculum mapping. |
| W-03 | **Bulk enrollment** | Select cohort/upload → validate → preview → execute procedure → result report. |
| W-04 | Attendance | Faculty marks sessions → system computes % per student-course → student sees status. |
| W-05 | **Exam registration** | Admin opens exam → student attempts registration → trigger checks attendance ≥ 75% → registered or rejected with reason. |
| W-06 | Results and CGPA | Marks entered → admin processes → grade points/SGPA → CGPA via UDF → published → student views grade card. |
| W-07 | **Fee payment** | Admin assigns dues → student views dues (late fee applied by UDF) → pays → procedure records payment and receipt → receipt available; any fee-structure edit is audited. |
| W-08 | Leave | Faculty applies → balance check (UDF) → admin approves/rejects → balance updated. |
| W-09 | **Monthly payroll** | Admin selects month → procedure computes payslips → review → finalize → faculty views payslip. |
| W-10 | **Hostel** | Student requests → admin reviews → allocation → trigger decrements available beds → student sees allocation. |
| W-11 | Reporting | Admin opens report → sets parameters → view/export. |

---

## 8. Frontend Requirements (React)

### 8.1 Navigation Structure (role-based)

- **Admin:** Dashboard · Users and Access · Master Data (Departments, Programs, Terms, Students) · Academics (Courses, Curriculum, Offerings, Enrollment, Bulk Enrollment) · Attendance and Exams · Finance · HR (Employees, Leave, Payroll) · Hostel · Reports and Audit.
- **Faculty:** Dashboard · My Courses · Attendance · Marks Entry · Course Results · Leave · Payslips · Profile.
- **Student:** Dashboard · My Courses · Attendance · Exam Registration · Results · Fees and Receipts · Hostel · Profile.

Menus show only items the role may access; direct URL access to forbidden routes shows C-13.

### 8.2 Functional Requirements
- FE-1 Role-aware routing and protected routes driven by the token's role/permissions.
- FE-2 Token handling: attach access token, silent refresh, redirect to login on expiry.
- FE-3 All list pages: server-side pagination, search, multi-filter, sort; CSV export.
- FE-4 Forms with client-side validation mirroring backend rules; display backend error messages (including **trigger/procedure rejection reasons**, e.g., attendance < 75%, no beds available).
- FE-5 Bulk enrollment: file upload (JSON/XML/CSV), preview table with row-level errors, downloadable result.
- FE-6 Dashboards display live aggregates from API.
- FE-7 Printable receipt, grade card and payslip views.
- FE-8 Confirmation dialogs for payment, publish results, payroll finalize, vacate, deactivate.
- FE-9 Consistent loading, empty and error states.
- FE-10 Browser support: current Chrome, Edge, Firefox; responsive web layout (desktop/laptop priority; this is a web app, not a mobile app).

---

## 9. Backend Requirements (FastAPI)

### 9.1 Architecture
- Modular routers per module (M1–M7), service layer, data-access layer using parameterised queries/ORM and **direct calls to stored procedures, functions, and views**.
- Pydantic request/response validation; OpenAPI docs auto-generated.
- Versioned prefix `/api/v1`. JSON responses; XML accepted on bulk-import endpoints (parse → normalise → same service).
- Standard error format with code, message, and field errors. DB errors raised by triggers/procedures (SIGNAL) are mapped to 4xx business errors.
- Transaction management: a request that changes multiple tables runs in a single transaction (or a single stored procedure).

### 9.2 Endpoint Catalogue (representative, complete by resource)

**M1 Core**
| Endpoint | Purpose | Access |
|---|---|---|
| `POST /auth/login`, `/auth/refresh`, `/auth/logout` | Authentication | Public / authenticated |
| `GET/PUT /me`, `POST /me/change-password` | Profile | All |
| `CRUD /users`, `POST /users/{id}/reset-password`, `PATCH /users/{id}/status` | User admin | Admin |
| `GET /roles`, `PUT /users/{id}/roles` | RBAC | Admin |
| `CRUD /departments`, `/programs`, `/terms` | Master data | Admin (read: all) |
| `CRUD /students`, `GET /students/{id}` | Student master | Admin; student reads own |

**M2 Academics**
| Endpoint | Purpose | Access |
|---|---|---|
| `CRUD /courses`, `/curriculum`, `/offerings` | Academic setup | Admin (read: all) |
| `POST /enrollments`, `GET /enrollments`, `PATCH /enrollments/{id}/withdraw` | Individual enrollment | Admin |
| `POST /enrollments/bulk` (JSON/XML/CSV), `POST /enrollments/bulk/validate` | Bulk enrollment (procedure) | Admin |
| `GET /me/courses`, `GET /faculty/me/offerings`, `GET /offerings/{id}/roster` | Role views | S / F |

**M3 Attendance and Exams**
| Endpoint | Purpose | Access |
|---|---|---|
| `POST /attendance/sessions`, `PUT /attendance/sessions/{id}`, `GET /attendance/sessions` | Mark/edit/list | Faculty (own), Admin |
| `GET /me/attendance`, `GET /attendance/shortage` | Views / report | S; A, F(own) |
| `CRUD /exams` | Exam setup | Admin |
| `POST /exam-registrations` | Register (trigger enforced) | Student |
| `GET /exam-registrations` | Monitor | Admin |
| `PUT /exams/{id}/marks` | Marks entry | Faculty (own) |
| `POST /results/process`, `POST /results/publish` | Processing | Admin |
| `GET /me/results`, `GET /me/cgpa` | Student results (CGPA UDF) | Student |
| `CRUD /grade-scale` | Grade config | Admin |

**M4 Finance**
| Endpoint | Purpose | Access |
|---|---|---|
| `CRUD /fee-structures`, `/late-fee-rules` | Config | Admin |
| `POST /fee-assignments` (single/bulk) | Generate dues | Admin |
| `GET /me/dues` | Dues with UDF late fee | Student |
| `POST /payments` | Calls payment procedure; returns receipt | Student, Admin |
| `GET /receipts/{id}`, `GET /me/payments`, `GET /payments` | Receipts, history, ledger | S / A |
| `GET /fees/defaulters`, `GET /audit/fees` | Reports/audit | Admin |

**M5 HR**
| Endpoint | Purpose | Access |
|---|---|---|
| `CRUD /employees`, `/designations`, `/leave-types`, `/salary-structures` | HR setup | Admin |
| `POST /leaves`, `GET /leaves/me`, `GET /leaves/me/balance` | Apply / view (UDF) | Faculty |
| `GET /leaves`, `PATCH /leaves/{id}/decision` | Approvals | Admin |
| `POST /payroll/run`, `POST /payroll/{month}/finalize`, `GET /payroll/{month}` | Payroll (procedure) | Admin |
| `GET /me/payslips` | Payslips | Faculty |

**M6 Hostel**
| Endpoint | Purpose | Access |
|---|---|---|
| `CRUD /hostels`, `/rooms` | Setup | Admin |
| `POST /hostel-allocations`, `PATCH /hostel-allocations/{id}/vacate` | Allocate/vacate (trigger) | Admin |
| `GET /hostels/occupancy` | Availability | Admin |
| `POST /hostel-requests`, `GET /me/hostel-requests`, `GET /hostel-requests`, `PATCH /hostel-requests/{id}/decision` | Requests | S / A |
| `GET /me/hostel` | Own allocation | Student |

**M7 Reports**
`GET /reports/{report-key}` (RP-1…RP-10, parameters as query), `GET /audit-logs`, `GET /integrity/checks`, `GET /dashboard/{role}`.

### 9.3 Business Logic Summary (what the backend/DB must enforce)
- Enrollment: one active enrollment per student per offering; capacity; term must be open; program mapping valid.
- Attendance: unique session per offering/date/slot; only the assigned faculty (or Admin) may write.
- Exam registration: attendance ≥ 75% in the course; student enrolled; registration window open; no duplicate.
- Marks within 0…max; only registered students; no edits after publish (except audited revision).
- Fee payment: payment ≤ balance; atomic update of dues, payment, receipt; receipt numbers unique and sequential.
- Leave: days ≤ available balance; non-overlapping with approved leave.
- Payroll: one finalized run per month; net = earnings − deductions; reruns only before finalize.
- Hostel: allocation only if beds available; one active allocation per student; counts always consistent.

### 9.4 Validation
Server-side validation of all inputs (types, ranges, enums, dates), file validation for bulk imports (size, format, schema), ID formats per global standards, authorisation checks on every ownership-scoped resource (a student can only fetch their own records).

---

## 10. Authentication and Authorization [PDF]

- **OAuth2 password flow with JWT** access tokens (short-lived) and refresh tokens; payload carries user id, role, permission sets.
- Passwords hashed (bcrypt/argon2); never returned by APIs.
- **RBAC** for Admin/Faculty/Student, enforced by FastAPI dependencies at route level, plus **ownership checks** (own data only) at the service level.
- Admin permission sets (§3) restrict which module admin routes are usable.
- Login attempt limiting; token revocation on logout/deactivation.
- All security-relevant events (login failures, role changes) written to audit.
- Database access via a least-privilege application account; application cannot drop tables.

---

## 11. Database / DBMS Requirements (MySQL)

> This section defines **what the database must manage**. Physical schema, DDL, and column-level design are team deliverables produced later (§1.5) and are intentionally not included here.

### 11.1 General DB Requirements
- Engine supporting **ACID transactions, row-level locking and foreign keys** (InnoDB). [PDF: "complex ACID transactions"]
- **3NF** normalised design, **20+ entities** across 7 modules. [PDF]
- Constraints: PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL throughout. [PDF]
- **Global data standards** defined once by the Team Leaders and used everywhere: Student_ID format, Employee ID, Course code, Receipt number, term identifiers, and consistent data types for shared keys. [PDF: leadership]
- Referential integrity across all modules; no orphan records; defined delete/update behaviour (restrict by default; history is retained rather than deleted).
- Data dictionary and per-module ER diagrams. [PDF]
- Indexing on foreign keys and frequent search/report columns.
- Backup and restore procedure documented; seed data for demo and testing.

### 11.2 Entities and the Data They Must Hold (conceptual)

**M1 Core**
| Entity | Information stored |
|---|---|
| User Account | login identifier, credential hash, status, last login, linked person record |
| Role / Permission Set / Role assignment | role names, admin permission sets, which user holds which |
| Department | code, name, head (optional) |
| Program | name, department, duration, credits required |
| Academic Term | year, term label, dates, current flag |
| Student | Student_ID (global format), personal and contact details, program, batch/year, status |
| Audit Log (general) | actor, action, entity, before/after, timestamp |

**M2 Academics**
| Entity | Information stored |
|---|---|
| Course | code, title, credits, department, type |
| Curriculum Mapping | program, semester, course, core/elective |
| Course Offering | course, term, faculty (employee), section, capacity |
| Enrollment | student, offering, status, enrolled date, withdrawal info |
| Bulk Enrollment Batch Log **[DER]** | who ran it, when, counts, per-row outcomes |

**M3 Attendance and Exams**
| Entity | Information stored |
|---|---|
| Attendance Session | offering, date/slot, marked by |
| Attendance Record | session, student (enrollment), present/absent |
| Exam | offering/term, type, date, max marks, registration window |
| Exam Registration | exam, student, status, timestamp |
| Exam Marks / Result | registration, marks, grade, grade points, publish status |
| Grade Scale | marks range, grade, grade points |
| Semester Result **[DER]** | student, term, credits, SGPA, cumulative CGPA snapshot |

**M4 Finance**
| Entity | Information stored |
|---|---|
| Fee Structure / Fee Component | program, term, component, amount, due date |
| Student Fee (Due) | student, structure/component, amount, paid, status |
| Late Fee Rule | rule parameters used by UDF |
| Payment | student, amount, mode, date, status, reference |
| Payment–Due allocation **[DER]** | which dues a payment settled and by how much |
| Receipt | unique receipt number, payment, issued date, totals |
| Fee Audit Log | changed entity, old/new values, user, timestamp |

**M5 HR**
| Entity | Information stored |
|---|---|
| Employee (Faculty/Staff) | Employee ID, personal details, department, designation, joining date, type, status |
| Designation | title, level |
| Leave Type / Entitlement | type, annual quota, carry-forward rule |
| Leave Application | employee, type, dates, days, reason, status, decision by/date |
| Salary Structure / Component | employee or designation, earnings and deductions |
| Payroll Run | month/year, status, run date, finalized flag |
| Payslip | run, employee, gross, deductions, net, leave adjustments |

**M6 Hostel**
| Entity | Information stored |
|---|---|
| Hostel | name, type/gender block, total capacity |
| Room | hostel, number, bed capacity, available beds |
| Hostel Allocation | student, room, from/to dates, status |
| Hostel Request | student, type, details, status, decision, remark |

### 11.3 Key Relationships
- Department 1–N Program, Course, Employee, Student (via program).
- Program N–M Course (via Curriculum Mapping).
- Course 1–N Course Offering; Term 1–N Offering; Employee 1–N Offering.
- Student N–M Offering (via Enrollment).
- Enrollment 1–N Attendance Record; Attendance Session 1–N Attendance Record.
- Offering 1–N Exam; Exam N–M Student (via Exam Registration); Registration 1–1 Marks/Result.
- Student 1–N Student Fee; Payment N–M Student Fee; Payment 1–1 Receipt.
- Employee 1–N Leave Application, Payslip; Payroll Run 1–N Payslip.
- Hostel 1–N Room; Room 1–N Allocation; Student 1–N Allocation (only one active); Student 1–N Hostel Request.
- User Account 1–1 Student or Employee.

### 11.4 Required Integrity Rules and Dependencies
- Student_ID, Employee ID, course code and similar keys are identical across all modules.
- No enrollment/attendance/registration/fee/allocation record without an existing student (and offering/term where relevant).
- Attendance percentage is derived from attendance records and must be computable per student-course for the 75% rule.
- Room available beds ≥ 0 and ≤ capacity; equals capacity minus active allocations.
- A payment never exceeds outstanding dues; receipt numbers unique.
- Only one current term; one finalized payroll per month; one active hostel allocation per student.
- Leave balance = entitlement − approved leave (derived).
- Cross-module dependency order for build and merge: M1 → M2 → M3, M4, M5, M6 → M7.

### 11.5 Advanced SQL Programming Requirements [PDF]

| Component | Required items |
|---|---|
| **Stored Procedures** | (1) **Bulk enrollment of students**; (2) **Monthly payroll calculation**; (3) **Fee payment processing with receipt generation**. |
| **Triggers** | (1) **Auto-update available hostel beds on room allocation** (and vacate **[DER]**); (2) **Log fee changes into audit tables**; (3) **Prevent exam registration if attendance < 75%**. |
| **User-Defined Functions** | (1) **Student CGPA**; (2) **Late fee penalty**; (3) **Faculty leave balance**. |
| **Complex Queries and Views** | Analytical reports using **JOINs, GROUP BY, HAVING, subqueries, window functions (e.g., RANK())**: see RP-1…RP-10 (§6.7). |

Requirements on every program: documented inputs/outputs; error signalling with meaningful messages; transactional safety; test cases with captured input/output evidence (submission requirement).

### 11.6 Concurrency and Transactions
Fee payment, bed allocation, enrollment (capacity) and payroll finalize must be safe under concurrent use: transactions with appropriate locking so two users cannot take the last bed, pay the same due twice, or exceed capacity.

---

## 12. Module Dependencies and Relationships (Integration)

- Each module exposes an **API contract** (inputs/outputs) and a **foreign-key contract** (which keys it references from other modules). All contracts are consolidated in the **Integration Mapping Document**, verified and signed off by both Team Leaders. [PDF]
- Cross-module calls: Exam registration (M3) reads attendance (M3) and enrollment (M2); Fees (M4) reference student (M1) and term (M1); hostel fee component (M4↔M6); payroll (M5) reads employees (M5/M1) and leave (M5); reports (M7) read all.
- Breaking changes to shared keys or contracts require leader approval before merge.

---

## 13. Overall System Requirements (Non-Functional)

| Area | Requirement |
|---|---|
| Integrity | ACID guaranteed; FK-enforced; triggers/procedures cannot be bypassed by API. |
| Performance | List and report endpoints paginated; typical page response under 2 s on the project dataset; indexes on report/search columns. |
| Security | JWT, RBAC, hashed passwords, input validation, parameterised queries, least-privilege DB account. |
| Auditability | Fee changes (mandatory), sensitive actions logged. |
| Reliability | Documented backup/restore; migrations versioned. |
| Maintainability | Modular code, per-module folders, Git branching and pull-request review, API docs (OpenAPI), data dictionary. |
| Testing | Unit tests for services; SQL test scripts with captured outputs for every procedure/trigger/UDF; end-to-end test per workflow W-01…W-11. |
| Data | Seed dataset sufficient to demonstrate all reports (multiple departments, 100+ students, terms, payments, payroll months). |
| Compatibility | Modern desktop browsers. |
| Documentation | ER diagrams, system architecture, DDL, SQL programs with proof, integration mapping. [PDF] |

---

## 14. Project Scope from 0 to 100%

### 14.1 Phases

| Phase | Output | Cumulative |
|---|---|---|
| P0: Governance (Week 1) | Global data standards (ID formats, naming, types), repo/branching, API conventions, error format, shared auth contract | 5% |
| P1: Data design | Module ER diagrams, 3NF review, cross-module FK map, data dictionary; Integration Mapping v1 signed off | 20% |
| P2: Core platform | M1 auth, RBAC, master data live; shared libraries (frontend shell, API client, DB access) | 35% |
| P3: Module build | M2–M6 DDL, SQL programs, APIs, pages (parallel) | 70% |
| P4: Analytics and integration | M7 views/reports, dashboards, cross-module workflows W-01…W-11 | 85% |
| P5: Hardening | Testing, execution proofs, performance and security pass, seed data, bug fixes | 95% |
| P6: Submission | Project report, ER diagrams, DDL, SQL proof, integration mapping signed by both leaders, demo | 100% |

### 14.2 Definition of Done (per page/feature)
Page implemented per §6 → API implemented with validation and authorisation → DB objects implemented and tested → role-based behaviour verified → merged via reviewed PR → documented in data dictionary/API docs.

### 14.3 Deliverables to be authored later (not part of this PRD)
Per-module ER diagram, DDL with constraints, SQL for procedures/triggers/functions with execution screenshots, data dictionary, integration mapping, final report.

---

## 15. Work Distribution: 7 Sub-Teams (3 students each)

Division is by **functional slice**: each team owns its module's pages, APIs and database objects end to end. The 2 Team Leaders own cross-cutting governance (§15.2).

### 15.1 Team Assignments

| Team | Module / Slice | Pages | Backend ownership | Database ownership | SQL programmability (PDF) |
|---|---|---|---|---|---|
| **Team 1** | **Core Platform (M1)**: identity, RBAC, master data, shells and dashboards | C-01…C-13 (incl. three dashboards' shell and navigation) | Auth, users, roles, departments, programs, terms, student master, `/me`, dashboard aggregation endpoints (data from other teams' views) | User, Role/Permission, Department, Program, Term, Student, general Audit Log | Student_ID generation/validation helpers; shared frontend shell, route guards, API client |
| **Team 2** | **Academics and Enrollment (M2)** | A-01…A-08 | Courses, curriculum, offerings, enrollment, bulk enrollment (JSON/XML/CSV parsing) | Course, Curriculum Mapping, Offering, Enrollment, Bulk Batch Log | **Stored procedure: Bulk enrollment** |
| **Team 3** | **Attendance and Exam Registration (M3-a)** | E-01…E-07 | Attendance sessions/records, shortage report, exam setup, exam registration | Attendance Session/Record, Exam, Exam Registration | **Trigger: block exam registration if attendance < 75%**; attendance % view/function used by the trigger |
| **Team 4** | **Results, Grading and CGPA (M3-b)** | E-08…E-12 | Marks entry, result processing/publishing, grade scale, grade card, SGPA/CGPA | Marks/Result, Grade Scale, Semester Result | **UDF: Student CGPA**; RP-1, RP-2, RP-9 (RANK window reports) |
| **Team 5** | **Finance and Fees (M4)** | F-01…F-10 | Fee structures, assignments, dues, payments, receipts, defaulters, fee audit | Fee Structure/Component, Student Fee, Late Fee Rule, Payment, Allocation, Receipt, Fee Audit Log | **Stored procedure: fee payment with receipt**; **trigger: fee-change audit log**; **UDF: late fee penalty**; RP-4, RP-5 |
| **Team 6** | **HR, Leave and Payroll (M5)** | H-01…H-10 | Employees, designations, leave, salary structure, payroll, payslips | Employee, Designation, Leave Type/Entitlement, Leave Application, Salary Structure, Payroll Run, Payslip | **Stored procedure: monthly payroll**; **UDF: faculty leave balance**; RP-7, RP-8 |
| **Team 7** | **Hostel Management and Reporting/Audit Hub (M6 + M7)** | S-01…S-07, R-01, R-03, R-04 | Hostels, rooms, allocation, requests, occupancy; reports hub and generic report endpoints, audit viewer, integrity checks | Hostel, Room, Allocation, Request | **Trigger: auto-update available beds on allocation/vacate**; RP-3, RP-6, RP-10; hub views; integrity-check queries |

**Balance note:** Teams 2–6 each carry one module and their own SQL objects. Team 1 carries the foundation and shared frontend shell. Team 7 carries the smallest functional module plus the reporting hub, so overall load is even. RP-n report ownership: report SQL is written by the team that owns the data; Team 7 provides the hub UI and endpoint pattern.

### 15.2 Team Leaders (cross-cutting, per PDF leadership criteria)

| Leader | Responsibility |
|---|---|
| **Leader A** | Global data standards (Student_ID, Employee ID, codes, data types); FK and referential-integrity enforcement across modules; owns M1 contract review with Team 1, 2, 3, 4; maintains Integration Mapping (Academic side: M1–M3). |
| **Leader B** | API contracts, error format and auth conventions; Git workflow and merge-conflict prevention; owns contract review with Teams 5, 6, 7; maintains Integration Mapping (Operations side: M4–M7); progress tracking vs. deadlines. |
| **Both** | Resolve schema overlaps/circular dependencies; sign off the Integration Mapping Document; mentor teams on SQL/normalisation without taking over their work. |

*(Leaders are members of sub-teams as well; assign each to the team whose module best matches their strengths while keeping 3 per team.)*

### 15.3 Inter-Team Contracts (must be agreed in P1)

| Producer → Consumer | Contract |
|---|---|
| Team 1 → all | Student, Employee reference keys, auth dependency, term identifier, role claims |
| Team 2 → Teams 3, 4, 5 | Enrollment key and status values; offering key |
| Team 3 → Team 4 | Registration status; attendance % definition (shared by trigger and UI) |
| Team 4 → Team 1, 7 | CGPA/SGPA values for dashboards and reports |
| Team 5 → Team 7 | Dues/payment views for reports; optional hostel fee component with Team 7 |
| Team 6 → Team 2, 7 | Faculty (employee) key for offerings; payroll views |
| Team 7 → Team 1 | Occupancy summary for admin dashboard |

### 15.4 Suggested Internal Split inside each 3-person team
Member 1: database objects (DDL, procedure/trigger/UDF, tests and proofs) · Member 2: FastAPI endpoints and validation · Member 3: React pages and workflows. Members rotate review responsibilities, and every member documents their part in the data dictionary/report.

---

## 16. Appendix: Traceability to the PDF

| PDF statement | PRD location |
|---|---|
| University Higher Education ERP System | Whole document |
| MySQL (and MongoDB) | §1.3, §11 |
| React, FastAPI | §1.3, §8, §9 |
| Interactive dashboards for admin, faculty, students | C-02, C-03, C-04 |
| Mobile (attendance, grades, hostel requests): *excluded as mobile app* | Delivered as web pages E-03, E-10, S-05/06 |
| OAuth2/JWT; RBAC (Admin, Faculty, Student) | §3, §10 |
| REST/GraphQL connecting Finance, Academics, HR; JSON/XML parsing | §1.3, §9 |
| SP: bulk enrollment, monthly payroll, fee payment with receipts | A-05, H-08, F-05, §11.5 |
| Triggers: hostel beds, fee-change audit, exam registration < 75% | S-02, F-10, E-06, §11.5 |
| UDFs: CGPA, late fee, faculty leave balance | E-09/E-10, F-04, H-04, §11.5 |
| Complex queries/views: JOIN, GROUP BY, HAVING, subquery, RANK() | §6.7 |
| 7 modules; 20+ entities; 3NF | §4, §11 |
| Global data standards, referential integrity, API contracts, FK linkages | §11.1, §12, §15.2–15.3 |
| ER diagram, DDL, SQL proofs, integration mapping signed by 2 leaders | §1.5, §14.3 |
| Data dictionary, Git, modular development | §11.1, §13 |
| 20–21 students, 2 leaders, 7 groups of 3 | §15 |
