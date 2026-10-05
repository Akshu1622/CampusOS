# Technical Decisions

- **MySQL Version**: MySQL 8.4 LTS - Provides long-term stability and avoids breaking changes during the project lifecycle.
- **Python and Node versions**: Python 3.12+ and Node.js 20+ - Offers modern language features and LTS support.
- **Migrations**: Numbered SQL files run by a Python runner plus a schema_version table (no Alembic) - Ensures simple, explicit, and direct control over database schema changes.
- **Data access**: SQLAlchemy Core with PyMySQL driver and direct stored-procedure calls - Balances Pythonic query building with cross-platform ease of installation (PyMySQL) and direct performance optimization.
- **Pydantic**: Pydantic v2 - Offers high-performance validation and serialization using its Rust core.
- **Password hashing**: argon2 - Chosen for superior resistance to GPU cracking and side-channel attacks compared to bcrypt.
- **JWT library**: PyJWT - Standard, widely supported, and easy to use for JWT generation and verification.
- **Test tools**: pytest, httpx; Vitest, React Testing Library, Playwright - Provides a comprehensive, modern testing stack from unit to end-to-end testing across both backend and frontend.
- **Frontend Stack**: Vite + React + TypeScript, React Router, TanStack Query, react-hook-form + zod - Delivers a fast, type-safe, and robust modern single-page application experience.
- **Styling approach**: Vanilla CSS with CSS variables - Maps the design file's tokens natively and predictably without requiring additional framework overhead.
- **Chart library**: Recharts - Composable, React-native, and maps well to CSS variables and design tokens.
- **Linting and formatting tools**: ESLint + Prettier for frontend, Ruff for Python backend - Ensures fast, consistent code style and catches common errors across codebases.
