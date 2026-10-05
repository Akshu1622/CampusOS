#!/usr/bin/env python3
import os
import subprocess
import threading
import sys

def get_env():
    env = {}
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    env_path = os.path.join(root_dir, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env[k] = v
    return env, root_dir

env, root_dir = get_env()
password = env.get('MYSQL_ROOT_PASSWORD', 'rootpassword')
db_name = env.get('MYSQL_DATABASE', 'university_erp')

results = []
lock = threading.Lock()

def worker(num_iterations):
    # To test actual concurrency, we can create a single mysql session 
    # per thread and send multiple queries to avoid docker exec overhead
    query = "SELECT fn_generate_student_id('3000');\n" * num_iterations
    cmd = [
        "docker", "compose", "exec", "-T", "db", 
        "mysql", "-u", "root", f"-p{password}", db_name,
        "-N", "-B"
    ]
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=root_dir, text=True)
    out, err = process.communicate(input=query)
    
    if process.returncode == 0:
        lines = out.strip().split('\n')
        with lock:
            for line in lines:
                if line:
                    results.append(line.strip())
    else:
        print("Error in worker:", err)

threads = []
print("Starting concurrency test... Generating 200 IDs across 4 concurrent connections.")
for i in range(4):
    t = threading.Thread(target=worker, args=(50,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

duplicates = len(results) - len(set(results))
print(f"Total generated: {len(results)}")
print(f"Duplicates: {duplicates}")

if duplicates == 0 and len(results) == 200:
    print("PASS: Concurrency test successful. Zero duplicates.")
    sys.exit(0)
else:
    print("FAIL: Duplicates found or not all generated.")
    sys.exit(1)
