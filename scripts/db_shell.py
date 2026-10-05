#!/usr/bin/env python3
import os
import subprocess
import sys

def main():
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
    
    cmd = ["docker", "compose", "exec", "-it", "db", "mysql", "-u", "root", f"-p{password}", db_name]
    sys.exit(subprocess.call(cmd, cwd=root_dir))

if __name__ == '__main__':
    main()
