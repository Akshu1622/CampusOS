#!/usr/bin/env python3
import os
import subprocess
import sys

def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k] = v
    return env

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    sys_env = os.environ.copy()

    backups_dir = os.path.join(project_root, "backups")
    latest_link = os.path.join(backups_dir, "latest.txt")
    
    if len(sys.argv) > 1:
        backup_file = os.path.abspath(sys.argv[1])
    else:
        if not os.path.exists(latest_link):
            print("No backup specified and no latest backup found.")
            sys.exit(1)
        with open(latest_link, 'r') as f:
            backup_file = f.read().strip()
            
    if not os.path.exists(backup_file):
        print(f"Backup file not found: {backup_file}")
        sys.exit(1)

    print(f"Restoring backup from {backup_file}...")
    
    # 1. Wipe the database
    cmd_drop = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", "-e", f"DROP DATABASE IF EXISTS {db_name}; CREATE DATABASE {db_name};"]
    res_drop = subprocess.run(cmd_drop, capture_output=True, text=True, env=sys_env)
    if res_drop.returncode != 0:
        print("Failed to drop database")
        print(res_drop.stderr)
        sys.exit(1)
        
    # 2. Restore
    cmd_restore = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name]
    with open(backup_file, "r", encoding="utf-8") as f:
        res_restore = subprocess.run(cmd_restore, stdin=f, capture_output=True, text=True, env=sys_env)
        
    if res_restore.returncode != 0:
        print("Restore failed!")
        print(res_restore.stderr)
        sys.exit(1)
        
    print("Restore completed successfully.")

if __name__ == '__main__':
    main()
