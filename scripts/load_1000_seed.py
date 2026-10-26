#!/usr/bin/env python3
"""
load_1000_seed.py - Database loader for the 1,000-student CampusOS dataset.
Executes schema, reference lookups, 1,000-student seed, UDFs, triggers, procedures, and views in the required sequence.

Usage:
    python scripts/load_1000_seed.py [--db-name university_erp] [--root-pass rootpassword]
"""

import os
import sys
import argparse
import pymysql

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
    statements = []
    current_delimiter = ';'
    current_statement = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if line.upper().startswith('DELIMITER'):
            parts = line.split()
            if len(parts) >= 2:
                current_delimiter = parts[1].strip()
            continue

        cleaned_line = strip_sql_comment(raw_line)
        cleaned_stripped = cleaned_line.strip()

        if not current_statement and not cleaned_stripped:
            continue

        if cleaned_stripped.endswith(current_delimiter):
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

def execute_file(cursor, file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    statements = split_sql_script(content)
    for stmt in statements:
        if not stmt:
            continue
        try:
            cursor.execute(stmt)
        except Exception as e:
            print(f"Error in {os.path.basename(file_path)}:")
            print(f"Statement: {stmt[:160]}...")
            print(f"Error: {e}")
            raise e

def main():
    parser = argparse.ArgumentParser(description="Load 1,000-student seed into CampusOS")
    parser.add_argument("--host", help="MySQL Host")
    parser.add_argument("--port", type=int, help="MySQL Port")
    parser.add_argument("--root-user", default="root", help="MySQL Root User")
    parser.add_argument("--root-pass", help="MySQL Root Password")
    parser.add_argument("--db-name", help="Database name")
    parser.add_argument("--seed-file", default="seed_data_campusos.sql", help="Path to seed SQL file")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env = load_env(os.path.join(project_root, '.env'))

    host = args.host or env.get("MYSQL_HOST", "localhost")
    port = args.port or int(env.get("MYSQL_PORT", 3306))
    root_user = args.root_user or env.get("MYSQL_ROOT_USER", "root")
    root_pass = args.root_pass if args.root_pass is not None else env.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = args.db_name or env.get("MYSQL_DATABASE", "university_erp")
    app_user = env.get("MYSQL_APP_USER", "app")
    app_pass = env.get("MYSQL_APP_PASSWORD", "apppassword")

    print(f"Connecting to MySQL at {host}:{port} as user '{root_user}'...")
    conn = pymysql.connect(
        host=host,
        port=port,
        user=root_user,
        password=root_pass,
        autocommit=True,
        charset='utf8mb4'
    )
    cursor = conn.cursor()

    try:
        cursor.execute("SET GLOBAL log_bin_trust_function_creators = 1;")
    except Exception:
        pass

    print(f"Recreating database `{db_name}`...")
    cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`;")
    cursor.execute(f"CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;")
    cursor.execute(f"USE `{db_name}`;")

    # Step 1: db/schema
    schema_dir = os.path.join(project_root, "db", "schema")
    schema_files = sorted([f for f in os.listdir(schema_dir) if f.endswith(".sql")])
    print(f"\n[1/7] Applying {len(schema_files)} schema files...")
    for sf in schema_files:
        print(f"  -> {sf}")
        execute_file(cursor, os.path.join(schema_dir, sf))

    # Step 2: db/seed/reference
    ref_dir = os.path.join(project_root, "db", "seed", "reference")
    ref_files = sorted([f for f in os.listdir(ref_dir) if f.endswith(".sql")])
    print(f"\n[2/7] Applying {len(ref_files)} reference files...")
    for rf in ref_files:
        print(f"  -> {rf}")
        execute_file(cursor, os.path.join(ref_dir, rf))

    # Step 3: 1,000-student seed data (BEFORE triggers/procedures)
    seed_path = os.path.join(project_root, args.seed_file)
    if not os.path.exists(seed_path):
        print(f"\nGenerating seed file {args.seed_file}...")
        import subprocess
        subprocess.run([sys.executable, os.path.join(project_root, "scripts", "seed_erp_campusos.py"), "--out", seed_path], check=True)

    print(f"\n[3/7] Loading 1,000-student seed from {os.path.basename(seed_path)}...")
    execute_file(cursor, seed_path)
    print("  -> Loaded successfully!")

    # Step 4: db/programs/functions
    func_dir = os.path.join(project_root, "db", "programs", "functions")
    func_files = sorted([f for f in os.listdir(func_dir) if f.endswith(".sql")])
    print(f"\n[4/7] Applying {len(func_files)} UDF functions...")
    for ff in func_files:
        print(f"  -> {ff}")
        execute_file(cursor, os.path.join(func_dir, ff))

    # Step 5: db/programs/triggers
    trig_dir = os.path.join(project_root, "db", "programs", "triggers")
    trig_files = sorted([f for f in os.listdir(trig_dir) if f.endswith(".sql")])
    print(f"\n[5/7] Applying {len(trig_files)} triggers...")
    for tf in trig_files:
        print(f"  -> {tf}")
        execute_file(cursor, os.path.join(trig_dir, tf))

    # Step 6: db/programs/procedures
    proc_dir = os.path.join(project_root, "db", "programs", "procedures")
    proc_files = sorted([f for f in os.listdir(proc_dir) if f.endswith(".sql")])
    print(f"\n[6/7] Applying {len(proc_files)} stored procedures...")
    for pf in proc_files:
        print(f"  -> {pf}")
        execute_file(cursor, os.path.join(proc_dir, pf))

    # Step 7: db/views
    views_dir = os.path.join(project_root, "db", "views")
    view_files = sorted([f for f in os.listdir(views_dir) if f.endswith(".sql")])
    print(f"\n[7/7] Applying {len(view_files)} views...")
    for vf in view_files:
        print(f"  -> {vf}")
        execute_file(cursor, os.path.join(views_dir, vf))

    # Configure app user grants
    print(f"\nConfiguring app user '{app_user}'...")
    cursor.execute(f"CREATE USER IF NOT EXISTS '{app_user}'@'%' IDENTIFIED BY '{app_pass}';")
    cursor.execute(f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO '{app_user}'@'%';")
    cursor.execute("FLUSH PRIVILEGES;")

    print(f"\n[SUCCESS] Database `{db_name}` successfully loaded with 1,000 students and all 7 modules!")

if __name__ == "__main__":
    main()
