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

def main():
    parser = argparse.ArgumentParser(description="Test Runner")
    parser.add_argument("--proofs", action="store_true", help="Generate proofs for tests")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    sys_env = os.environ.copy()
    
    tests_dir = os.path.join(project_root, 'db', 'tests')
    if not os.path.exists(tests_dir):
        print("No tests found.")
        sys.exit(0)
        
    files = [f for f in os.listdir(tests_dir) if f.endswith('.sql') or f.endswith('.py')]
    files.sort()
    
    all_passed = True
    
    for file in files:
        file_path = os.path.join(tests_dir, file)
        print(f"Running test: {file}")
        
        if file.endswith('.py'):
            res = subprocess.run([sys.executable, file_path], capture_output=True, text=True)
            if res.returncode == 0:
                print(f"[PASS] {file}")
            else:
                print(f"[FAIL] {file}")
                print(res.stderr)
                all_passed = False
                
        elif file.endswith('.sql'):
            if args.proofs and (file.startswith('5') or file.startswith('6')):
                # Proof output format
                proofs_dir = os.path.join(project_root, 'docs', 'db', 'proofs')
                os.makedirs(proofs_dir, exist_ok=True)
                
                cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "--table", "-u", "root", f"-p{root_pass}", db_name]
                with open(file_path, 'r') as f:
                    res = subprocess.run(cmd, stdin=f, capture_output=True, text=True, env=sys_env)
                    
                if res.returncode == 0:
                    print(f"[PASS] {file}")
                    phase_prefix = "phase6" if file.startswith('6') else "phase5"
                    proof_file = os.path.join(proofs_dir, f"{phase_prefix}_{file.replace('.sql', '.txt')}")
                    with open(proof_file, 'w') as out_f:
                        out_f.write(res.stdout)
                else:
                    print(f"[FAIL] {file}")
                    print(res.stderr)
                    all_passed = False
            else:
                cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name]
                with open(file_path, 'r') as f:
                    res = subprocess.run(cmd, stdin=f, capture_output=True, text=True, env=sys_env)
                if res.returncode == 0:
                    print(f"[PASS] {file}")
                else:
                    print(f"[FAIL] {file}")
                    print(res.stderr)
                    all_passed = False
                
    if not all_passed:
        print("Some tests failed.")
        sys.exit(1)
    else:
        print("All tests passed.")
        sys.exit(0)

if __name__ == '__main__':
    main()
