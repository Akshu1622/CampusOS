# University ERP

## Prerequisites
- Docker Desktop (Required to run MySQL container)
- Python 3.12+
- Node.js 20+
- Git

## First-time Setup
1. Clone the repository and `cd` into it.
2. Copy `.env.example` to `.env` and fill in any required variables.
3. Run `python scripts/db_up.py` to start the database container.
4. Verify the database is running: `python scripts/db_shell.py` should connect successfully.

## Running the Backend (FastAPI)

The backend is built with FastAPI. To run it locally for development, we provide a cross-platform helper script that automatically sets up a Python virtual environment, installs dependencies, and starts the server with hot-reloading.

**Option 1: Using the dev script (Recommended)**
```bash
python scripts/dev_backend.py
```

**Option 2: Manual Setup (Windows)**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Option 2: Manual Setup (macOS / Linux)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Daily Commands
- **Start Database**: `python scripts/db_up.py` (Windows/macOS/Linux)
- **Stop Database**: `python scripts/db_down.py` (Windows/macOS/Linux)
- **Database Shell**: `python scripts/db_shell.py` (Windows/macOS/Linux)
- **Execute SQL**: `python scripts/db_exec.py <file.sql>` (Windows/macOS/Linux)

## Folder Map
- `docs/`: Reference documents (PRD, design, tech decisions).
- `docs/db/`: Database related documentation.
- `docs/db/er/`: ER diagrams and related files.
- `docs/db/proofs/`: Database proofs and validations.
- `docs/api/`: API documentation.
- `db/schema/`: DDL scripts for tables and schema setup.
- `db/seed/reference/`: Reference data seeding scripts.
- `db/seed/demo/`: Demo data seeding scripts.
- `db/programs/functions/`: Stored functions SQL files.
- `db/programs/triggers/`: Database triggers SQL files.
- `db/programs/procedures/`: Stored procedures SQL files.
- `db/views/`: Database views SQL files.
- `db/tests/`: Database unit tests.
- `backend/`: FastAPI backend application.
- `frontend/`: React frontend application.
- `scripts/`: Helper Python scripts for database and environment management.

## IDE Setup
- We recommend Visual Studio Code.
- Install the recommended extensions prompted by `.vscode/extensions.json` (SQLTools, Database Client, Python, ESLint, Prettier).
- Code formatting and linting are configured in `.vscode/settings.json` and `.editorconfig`.

## Troubleshooting
- **Docker not running**: Ensure Docker Desktop is started before running `db_up.py`.
- **Port in use**: If port 3306 is occupied, change `MYSQL_PORT` in your `.env` file (e.g., to 3307).
- **Permission errors**: Ensure your user has rights to execute Docker commands, or run terminal as administrator (Windows) / use `sudo` where necessary (Linux).
- **Line endings**: We enforce LF line endings via `.gitattributes`. If scripts fail to run (especially bash scripts or SQL files on Linux), check line endings.
- **Forgot password / reset volume**: If you lose the database password or need to clear all data, run `docker compose down -v` to delete the volume, then run `db_up.py` to recreate it with the password from your `.env`.
