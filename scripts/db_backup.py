#!/usr/bin/env python3
import os
import subprocess
import sys
from datetime import datetime

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
    os.makedirs(backups_dir, exist_ok=True)
    
    # Ensure backups dir is git-ignored
    gitignore_path = os.path.join(project_root, ".gitignore")
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            content = f.read()
        if "backups/" not in content:
            with open(gitignore_path, 'a') as f:
                f.write("\nbackups/\n")
    else:
        with open(gitignore_path, 'w') as f:
            f.write("backups/\n")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_folder = os.path.join(backups_dir, timestamp)
    os.makedirs(backup_folder, exist_ok=True)
    
    backup_file = os.path.join(backup_folder, f"{db_name}_backup.sql")

    print(f"Creating backup in {backup_file}...")
    cmd = [
        "docker", "compose", "exec", "-T", "db", 
        "mysqldump", "-u", "root", f"-p{root_pass}",
        "--routines", "--triggers", "--events", "--single-transaction",
        db_name
    ]
    
    with open(backup_file, "w", encoding="utf-8") as f:
        res = subprocess.run(cmd, stdout=f, env=sys_env)
        
    if res.returncode != 0:
        print("Backup failed!")
        sys.exit(1)
        
    print(f"Backup successful: {backup_file}")
    
    # To facilitate db_restore.py finding the latest
    latest_link = os.path.join(backups_dir, "latest")
    if os.path.lexists(latest_link):
        os.remove(latest_link)
    
    # Just store the latest file path in a text file for Windows compatibility
    with open(latest_link + ".txt", "w") as f:
        f.write(backup_file)

if __name__ == '__main__':
    main()
