#!/usr/bin/env python3
import os
import sys
import subprocess
import argparse

def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k] = v
    return env

def run_sql_file(file_path, db_name, root_pass, env, verbose=False):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name]
    with open(file_path, 'r', encoding='utf-8') as f:
        res = subprocess.run(cmd, stdin=f, capture_output=True, text=True, env=env)
    return res

def run_sql_query(query, db_name, root_pass, env, verbose=False):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return res

def main():
    parser = argparse.ArgumentParser(description="Database Runner")
    parser.add_argument("--no-demo", action="store_true", help="Skip demo seed")
    parser.add_argument("--only", type=str, help="Run only specific folder")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    
    sys_env = os.environ.copy()

    if not args.only:
        if args.verbose:
            print("Recreating database...")
        cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", "-e", f"DROP DATABASE IF EXISTS {db_name}; CREATE DATABASE {db_name};"]
        res = subprocess.run(cmd, capture_output=True, text=True, env=sys_env)
        if res.returncode != 0:
            print("Failed to recreate database:")
            print(res.stderr)
            sys.exit(1)

    folders_to_run = [
        "db/schema",
        "db/seed/reference",
        "db/seed/demo",
        "db/programs/functions",
        "db/programs/triggers",
        "db/programs/procedures",
        "db/views"
    ]
    
    if args.no_demo:
        folders_to_run.remove("db/seed/demo")
        
    if args.only:
        args_only_norm = args.only.replace('\\', '/').rstrip('/')
        matched = [f for f in folders_to_run if f == args_only_norm or f.endswith(args_only_norm)]
        if matched:
            folders_to_run = [matched[0]]
        else:
            folders_to_run = [args_only_norm]

    version_counter = 1
    if args.only:
        res = run_sql_query("SELECT MAX(version) FROM schema_version;", db_name, root_pass, sys_env)
        if res.returncode == 0:
            try:
                lines = res.stdout.strip().split('\n')
                if len(lines) > 1 and lines[1].strip() != 'NULL':
                    version_counter = int(lines[1].strip()) + 1
            except Exception:
                pass
                
    for folder in folders_to_run:
        folder_path = os.path.join(project_root, folder)
        if not os.path.exists(folder_path):
            if args.verbose:
                print(f"Skipping {folder}, does not exist.")
            continue
            
        files = [f for f in os.listdir(folder_path) if f.endswith('.sql')]
        files.sort()
        
        if not files:
            if args.verbose:
                print(f"Skipping {folder}, empty.")
            continue
            
        print(f"Running {folder}...")
        for file in files:
            file_path = os.path.join(folder_path, file)
            if args.verbose:
                print(f"  -> {file}")
            res = run_sql_file(file_path, db_name, root_pass, sys_env, args.verbose)
            if res.returncode != 0:
                print(f"Error running {folder}/{file}:")
                print(res.stderr)
                sys.exit(1)
            
            # Record in schema_version
            if file == "00_foundation.sql":
                pass
            elif file == "00_z_schema_version_fix.sql":
                q = "INSERT INTO schema_version (version, file_name) VALUES (1, '00_foundation.sql'), (2, '00_z_schema_version_fix.sql');"
                run_sql_query(q, db_name, root_pass, sys_env)
                version_counter = 3
            else:
                # Check if we already have schema_version up
                if version_counter >= 3 or not any(f in folder for f in ["db/schema"]):
                    q = f"INSERT INTO schema_version (version, file_name) VALUES ({version_counter}, '{file}');"
                    run_sql_query(q, db_name, root_pass, sys_env)
                    version_counter += 1

    print("Database runner completed successfully.")

if __name__ == '__main__':
    main()
