# CampusOS Architecture Overview

## Tech Stack
- **Frontend:** React (Out of scope for API phases but endpoints are React-ready REST API).
- **Backend:** Python 3.12, FastAPI, Pydantic, SQLAlchemy.
- **Database:** MySQL 8.4.2 InnoDB.

## Design Patterns
- **Dependency Injection:** Database sessions (`get_db`), services, and authorization (`require_role`, `require_permission`) are injected into route handlers.
- **Service Layer Pattern:** Business logic resides inside `service.py` files (e.g. `M1Service`, `M2Service`). Routers simply parse HTTP requests, inject services, and return responses.
- **Data Models:** Granular SQLAlchemy ORM models handle complex joins and constraints.
- **Database Layer:** Raw SQL migrations define the schema exactly as specified in the PRD, enforcing data integrity at the database layer. 

## Endpoints
- Base URL: `/api/v1`
- Modules:
  - `auth/`: Login and token refresh.
  - `users/`: User management.
  - `me/`: Student/Faculty personalized portals.
  - `departments/`, `programs/`, `courses/`: Academics mapping.
  - `offerings/`, `enrollments/`: Section allocation.
  - `attendance/`, `exams/`, `results/`: Exam tracking and result matrix.
  - `fee-structures/`, `payments/`, `receipts/`: Invoicing and fee collection.
  - `leave/`, `payroll/`: Faculty HR tracking.
  - `hostels/`, `rooms/`: Accommodations.
  - `analytics/`: Chart-friendly dashboards.

## Setup Instructions
1. Run `docker compose up -d db`.
2. Run `python scripts/db_reset.py` to reset the database and seed dummy data.
3. cd into `backend/` and activate venv (`.\venv\Scripts\activate`).
4. Run `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` to start the backend.
5. Access `/docs` for Swagger UI.
