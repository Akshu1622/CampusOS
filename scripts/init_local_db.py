#!/usr/bin/env python3
"""
CampusOS Local Database Setup (Non-Docker)
Initializes the university_erp MySQL database directly on a local MySQL server
(such as MySQL Community Server, XAMPP, or MariaDB) without requiring Docker.
"""

import os
import sys
import argparse
import re

def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k.strip()] = v.strip()
    return env

def strip_sql_comment(line: str) -> str:
    """Strips trailing SQL comments (-- comment or # comment) while respecting quotes."""
    in_single_quote = False
    in_double_quote = False
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == "'" and not in_double_quote:
            if i > 0 and line[i - 1] == '\\':
                pass
            else:
                in_single_quote = not in_single_quote
        elif ch == '"' and not in_single_quote:
            if i > 0 and line[i - 1] == '\\':
                pass
            else:
                in_double_quote = not in_double_quote
        elif not in_single_quote and not in_double_quote:
            if ch == '-' and i + 1 < len(line) and line[i + 1] == '-':
                return line[:i].rstrip()
            elif ch == '#':
                return line[:i].rstrip()
        i += 1
    return line.rstrip()

def split_sql_script(content: str):
    """
    Splits a SQL script into individual executable statements,
    properly respecting custom DELIMITER commands and inline comments.
    """
    statements = []
    current_delimiter = ';'
    current_statement = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        
        # Check for DELIMITER change
        if line.upper().startswith('DELIMITER'):
            parts = line.split()
            if len(parts) >= 2:
                current_delimiter = parts[1].strip()
            continue

        # Strip trailing comments outside quotes
        cleaned_line = strip_sql_comment(raw_line)
        cleaned_stripped = cleaned_line.strip()

        # Ignore comments and empty lines when not accumulating statements
        if not current_statement and not cleaned_stripped:
            continue

        # Check if line ends with the active delimiter
        if cleaned_stripped.endswith(current_delimiter):
            # Strip the delimiter from the end of the cleaned line
            idx = cleaned_line.rfind(current_delimiter)
            current_statement.append(cleaned_line[:idx])
            stmt = '\n'.join(current_statement).strip()
            if stmt:
                statements.append(stmt)
            current_statement = []
        else:
            current_statement.append(raw_line)

    remaining = '\n'.join(current_statement).strip()
    if remaining:
        statements.append(remaining)

    return statements

def main():
    parser = argparse.ArgumentParser(description="CampusOS Local Database Setup (No Docker)")
    parser.add_argument("--host", help="MySQL Host (default from .env or localhost)")
    parser.add_argument("--port", type=int, help="MySQL Port (default from .env or 3306)")
    parser.add_argument("--root-user", help="Root/Admin MySQL User (default 'root')")
    parser.add_argument("--root-pass", help="Root/Admin MySQL Password")
    parser.add_argument("--db-name", help="Database name (default from .env or university_erp)")
    parser.add_argument("--app-pass", help="App user password (default from .env or apppassword)")
    parser.add_argument("--skip-demo", action="store_true", help="Skip demo seed data")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)

    host = args.host or env_vars.get("MYSQL_HOST", "localhost")
    port = args.port or int(env_vars.get("MYSQL_PORT", 3306))
    root_user = args.root_user or env_vars.get("MYSQL_ROOT_USER", "root")
    root_pass = args.root_pass if args.root_pass is not None else env_vars.get("MYSQL_ROOT_PASSWORD", "")
    db_name = args.db_name or env_vars.get("MYSQL_DATABASE", "university_erp")
    app_user = env_vars.get("MYSQL_APP_USER", "app")
    app_pass = args.app_pass or env_vars.get("MYSQL_APP_PASSWORD", "apppassword")

    print("=" * 60)
    print(" CampusOS Local Database Setup (Direct MySQL - No Docker)")
    print("=" * 60)
    print(f"Connecting to MySQL at {host}:{port} as user '{root_user}'...")

    try:
        import pymysql
    except ImportError:
        print("\n[ERROR] PyMySQL is not installed in current Python environment.")
        print("Please install requirements using:")
        print("  pip install pymysql passlib argon2-cffi")
        sys.exit(1)

    # 1. Connect to MySQL server
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=root_user,
            password=root_pass,
            autocommit=True,
            charset='utf8mb4'
        )
    except Exception as e:
        print(f"\n[ERROR] Could not connect to MySQL server at {host}:{port} with user '{root_user}':")
        print(f"  {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure your local MySQL service (MySQL Server / XAMPP / MariaDB) is running.")
        print("2. Check credentials in CampusOS/.env:")
        print("   - For XAMPP, MYSQL_ROOT_PASSWORD is often blank ('').")
        print("   - For MySQL Community Server, provide your root password.")
        print("   - You can also pass credentials directly, e.g.:")
        print("     python scripts/init_local_db.py --root-pass your_password")
        sys.exit(1)

    cursor = conn.cursor()

    # 2. Configure global variables if possible
    try:
        cursor.execute("SET GLOBAL log_bin_trust_function_creators = 1;")
        print("[OK] Configured log_bin_trust_function_creators = 1")
    except Exception as e:
        print(f"[NOTE] Could not set log_bin_trust_function_creators globally ({e}). Proceeding...")

    # 3. Create database
    print(f"Recreating database `{db_name}`...")
    cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`;")
    cursor.execute(f"CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;")
    cursor.execute(f"USE `{db_name}`;")

    folders_to_run = [
        "db/schema",
        "db/seed/reference",
        "db/seed/demo",
        "db/programs/functions",
        "db/programs/triggers",
        "db/programs/procedures",
        "db/views"
    ]

    if args.skip_demo:
        folders_to_run.remove("db/seed/demo")

    version_counter = 1

    # 4. Execute SQL files
    for folder in folders_to_run:
        folder_path = os.path.join(project_root, folder)
        if not os.path.exists(folder_path):
            continue

        files = sorted([f for f in os.listdir(folder_path) if f.endswith('.sql')])
        if not files:
            continue

        print(f"\nApplying {folder} ({len(files)} files)...")
        for file in files:
            file_path = os.path.join(folder_path, file)
            print(f"  -> {file}")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            statements = split_sql_script(content)
            for stmt in statements:
                if not stmt:
                    continue
                try:
                    cursor.execute(stmt)
                except Exception as ex:
                    print(f"\n[ERROR] Failed in {folder}/{file}:")
                    print(f"Statement:\n{stmt[:300]}...")
                    print(f"Error: {ex}")
                    sys.exit(1)

            # Record in schema_version if table exists
            try:
                cursor.execute(f"INSERT INTO schema_version (version, file_name) VALUES ({version_counter}, '{file}');")
                version_counter += 1
            except Exception:
                pass

    # 5. Create app user & permissions
    print("\nConfiguring database users & grants...")
    try:
        # Create for both '%' and 'localhost'
        for u_host in ['%', 'localhost']:
            cursor.execute(f"CREATE USER IF NOT EXISTS '{app_user}'@'{u_host}' IDENTIFIED BY '{app_pass}';")
            cursor.execute(f"ALTER USER '{app_user}'@'{u_host}' IDENTIFIED BY '{app_pass}';")
            cursor.execute(f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO '{app_user}'@'{u_host}';")
            cursor.execute(f"CREATE USER IF NOT EXISTS 'migrator'@'{u_host}' IDENTIFIED BY 'migratorpass123';")
            cursor.execute(f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO 'migrator'@'{u_host}';")
        cursor.execute("FLUSH PRIVILEGES;")
        print(f"[OK] Database user '{app_user}' configured with full privileges on `{db_name}`.")
    except Exception as e:
        print(f"[WARNING] Could not configure '{app_user}' user ({e}). Backend can connect as '{root_user}' if configured in .env.")

    # 6. Ensure Argon2 Password Hash for password123
    print("\nEnsuring demo credentials password hashes...")
    known_argon2_hash = "$argon2id$v=19$m=65536,t=3,p=4$rRVizBmDcI5xrhVCiJGSkg$z3sAf/VapY24rAqnIwu1hOcw1xv8mdKU6AoE6x0ZZa4"
    try:
        cursor.execute(f"UPDATE user_account SET password_hash = '{known_argon2_hash}';")
        cursor.execute("SELECT username, status FROM user_account ORDER BY id ASC;")
        users = cursor.fetchall()
        print(f"[OK] Updated {len(users)} user accounts to password 'password123':")
        for u in users:
            print(f"     - {u[0]} (Status: {u[1]})")
    except Exception as e:
        print(f"[WARNING] Failed updating demo passwords: {e}")

    # 7. Quick verification check
    cursor.execute("SHOW TABLES;")
    tables = cursor.fetchall()
    print(f"\n[SUCCESS] Database `{db_name}` initialized successfully with {len(tables)} tables and views!")
    print("\nDemo Accounts (Password for all: password123):")
    print("  - Admin:   admin_core, admin_finance, admin_hr, admin_hostel")
    print("  - Faculty: faculty1, faculty2, faculty3")
    print("  - Student: student1, student2, student3, student4, student5")
    print("\nYou can now start the backend without Docker:")
    print("  python scripts/dev_backend.py")
    print("=" * 60)

    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
