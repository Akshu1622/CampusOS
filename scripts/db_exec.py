#!/usr/bin/env python3
import os
import subprocess
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python db_exec.py <file.sql>")
        sys.exit(1)

    sql_file = sys.argv[1]
    # We must allow relative paths from cwd where script was called
    if not os.path.isabs(sql_file):
        sql_file = os.path.abspath(sql_file)

    if not os.path.exists(sql_file):
        print(f"Error: File {sql_file} not found.")
        sys.exit(1)

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env = {}
    env_path = os.path.join(root_dir, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env[k] = v

    password = env.get('MYSQL_ROOT_PASSWORD', 'rootpassword')
    db_name = env.get('MYSQL_DATABASE', 'university_erp')

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{password}", db_name]
    
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=sys.stdout, stderr=sys.stderr, cwd=root_dir)
    process.communicate(input=sql_content.encode('utf-8'))
    
    if process.returncode != 0:
        print("SQL execution failed.", file=sys.stderr)
        sys.exit(process.returncode)

if __name__ == '__main__':
    main()
