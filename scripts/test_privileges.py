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
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k] = v
    return env

def test_query(app_pass, db_name, query, env, expect_error=False, expected_error_msg=""):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "app", f"-p{app_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env)
    
    if expect_error:
        if res.returncode == 0:
            print(f"FAIL: Expected error for '{query}' but it succeeded!")
            return False
        if expected_error_msg and expected_error_msg not in res.stderr:
            print(f"FAIL: Expected error msg '{expected_error_msg}' for '{query}', got: {res.stderr}")
            return False
        print(f"PASS (Expected error): {query} -> {res.stderr.strip()}")
        return True
    else:
        # For procedures, they might fail due to validation logic, not permissions. 
        # So we just ensure it doesn't fail with "command denied to user".
        if "command denied to user" in res.stderr:
            print(f"FAIL: Privilege error for '{query}': {res.stderr}")
            return False
        # If it fails with a different error (e.g. unknown column, missing parameters), it's fine for privilege test
        print(f"PASS (Privilege OK): {query}")
        return True

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    app_pass = env_vars.get("MYSQL_APP_PASSWORD", "apppass123")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    sys_env = os.environ.copy()

    print("Running Privilege Tests for 'app' account...")
    tests_passed = True
    
    # 1. Test DROP
    if not test_query(app_pass, db_name, "DROP TABLE IF EXISTS student;", sys_env, expect_error=True, expected_error_msg="command denied to user"):
        tests_passed = False
        
    # 2. Test ALTER
    if not test_query(app_pass, db_name, "ALTER TABLE student ADD COLUMN test_col INT;", sys_env, expect_error=True, expected_error_msg="command denied to user"):
        tests_passed = False

    # 3. Test CREATE
    if not test_query(app_pass, db_name, "CREATE TABLE dummy (id INT);", sys_env, expect_error=True, expected_error_msg="command denied to user"):
        tests_passed = False
        
    # 4. Test CALL procedures
    procedures = [
        "CALL sp_bulk_enrollment(1, 1, 1);",
        "CALL sp_faculty_dashboard(1);",
        "CALL sp_fee_collection_summary(1, 1);",
        "CALL sp_fee_payment(1, '2026-TERM1', 1, 100.0, 'cash');",
        "CALL sp_monthly_payroll('2026-01');",
        "CALL sp_run_integrity_checks();",
        "CALL sp_student_dashboard(1);"
    ]
    
    for proc in procedures:
        if not test_query(app_pass, db_name, proc, sys_env, expect_error=False):
            tests_passed = False

    if tests_passed:
        print("ALL PRIVILEGE TESTS PASSED.")
        sys.exit(0)
    else:
        print("SOME PRIVILEGE TESTS FAILED.")
        sys.exit(1)

if __name__ == '__main__':
    main()
