#!/usr/bin/env python3
import os
import sys
import subprocess
import hashlib
import json

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

def run_query(query, db_name, root_pass):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-B", "-N", "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Error executing query:", query)
        print(res.stderr)
        sys.exit(1)
    return res.stdout.strip()

def check_count(query, db_name, root_pass, expected_count, name):
    res = run_query(query, db_name, root_pass)
    # The output might be just a number or multiple rows depending on query
    lines = [line for line in res.split('\n') if line]
    # For a simple COUNT(*) query, lines[0] is the result
    try:
        count = int(lines[0].split('\t')[-1] if lines else 0)
    except:
        count = len(lines)
        
    if count == expected_count:
        print(f"[PASS] {name}: {count}")
    else:
        print(f"[FAIL] {name}: Expected {expected_count}, got {count}")
        print("Query result:")
        print(res)
        sys.exit(1)

def check_zero(query, db_name, root_pass, name):
    res = run_query(query, db_name, root_pass)
    lines = [line for line in res.split('\n') if line.strip()]
    if len(lines) == 0 or (len(lines) == 1 and lines[0] == '0'):
        print(f"[PASS] {name}: 0 violations")
    else:
        print(f"[FAIL] {name}: Found violations!")
        print(res)
        sys.exit(1)

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    
    print("=== Row Counts ===")
    check_count("SELECT COUNT(*) FROM student", db_name, root_pass, 250, "Students count")
    check_count("SELECT COUNT(*) FROM department", db_name, root_pass, 5, "Departments count")
    check_count("SELECT COUNT(*) FROM program", db_name, root_pass, 10, "Programs count")
    check_count("SELECT COUNT(*) FROM employee", db_name, root_pass, 30, "Employees count")
    check_count("SELECT COUNT(*) FROM course", db_name, root_pass, 50, "Courses count")
    check_count("SELECT COUNT(*) FROM course_offering", db_name, root_pass, 50, "Course offerings count")
    check_count("SELECT COUNT(*) FROM enrollment", db_name, root_pass, 986, "Enrollments count")
    check_count("SELECT COUNT(*) FROM hostel", db_name, root_pass, 2, "Hostels count")
    check_count("SELECT COUNT(*) FROM room", db_name, root_pass, 2, "Rooms count")
    
    print("\n=== Edge-Case Cohorts ===")
    check_count("SELECT COUNT(*) FROM attendance_record WHERE enrollment_id = 1 AND status = 'PRESENT'", db_name, root_pass, 4, "Student 100% attendance (4 present)")
    check_count("SELECT COUNT(*) FROM attendance_record WHERE enrollment_id = 2 AND status = 'PRESENT'", db_name, root_pass, 3, "Student 75% attendance (3 present)")
    check_count("SELECT COUNT(*) FROM attendance_record WHERE enrollment_id = 3 AND status = 'PRESENT'", db_name, root_pass, 2, "Student 50% attendance (2 present)")
    
    check_count("SELECT COUNT(*) FROM student_fee WHERE student_id = 1 AND status = 'PAID'", db_name, root_pass, 1, "Student with all dues paid")
    check_count("SELECT COUNT(*) FROM student_fee WHERE student_id = 2 AND status = 'PARTIAL'", db_name, root_pass, 1, "Student with partly paid dues")
    check_count("SELECT COUNT(*) FROM student_fee WHERE student_id = 3 AND status = 'PENDING'", db_name, root_pass, 1, "Student with overdue/pending dues")
    
    check_count("SELECT COUNT(*) FROM (SELECT student_id, SUM(amount_due) as total FROM student_fee GROUP BY student_id HAVING SUM(amount_due) > (SELECT AVG(amount_due) FROM student_fee)) as sub", db_name, root_pass, 1, "Students exceeding average dues")
    
    check_count("SELECT COUNT(*) FROM room WHERE hostel_id = 1 AND available_beds = 0", db_name, root_pass, 1, "Hostel 100% full (1 room full)")
    check_count("SELECT COUNT(*) FROM room WHERE hostel_id = 2 AND available_beds = 1", db_name, root_pass, 1, "Room with exactly one bed left")
    
    check_count("SELECT COUNT(*) FROM hostel_allocation WHERE student_id = 5", db_name, root_pass, 1, "Student with active hostel allocation")
    check_count("SELECT COUNT(*) FROM hostel_request WHERE student_id = 12 AND status = 'PENDING'", db_name, root_pass, 1, "Student with pending hostel request")
    check_count("SELECT COUNT(*) FROM hostel_request WHERE student_id = 13 AND status = 'REJECTED'", db_name, root_pass, 1, "Student with rejected hostel request")
    
    check_count("SELECT COUNT(*) FROM leave_application WHERE employee_id = 1", db_name, root_pass, 1, "Employee with full leave used")
    check_count("SELECT COUNT(*) FROM leave_application WHERE employee_id = 2 AND status = 'PENDING'", db_name, root_pass, 1, "Employee with pending leave")
    
    check_count("SELECT COUNT(*) FROM payroll_run WHERE status = 'FINALIZED'", db_name, root_pass, 1, "Finalized payroll month")
    check_count("SELECT COUNT(*) FROM payroll_run WHERE status = 'DRAFT'", db_name, root_pass, 1, "Non-finalized payroll month")
    
    check_count("SELECT COUNT(*) FROM enrollment WHERE status = 'WITHDRAWN'", db_name, root_pass, 1, "Withdrawn enrollment")
    check_count("SELECT capacity FROM course_offering WHERE id = 1", db_name, root_pass, 5, "Offering 1 at full capacity (capacity 5)")
    check_count("SELECT capacity FROM course_offering WHERE id = 2", db_name, root_pass, 100, "Offering 2 with open seats (capacity 100)")
    
    check_count("SELECT COUNT(*) FROM exam_marks_result WHERE is_published = 1", db_name, root_pass, 5, "Published results")
    check_count("SELECT COUNT(*) FROM semester_result WHERE student_id = 1", db_name, root_pass, 2, "Student with multiple semesters (CGPA)")
    
    print("\n=== Consistency Queries ===")
    # beds = capacity minus active allocations
    check_zero("SELECT COUNT(*) FROM room r LEFT JOIN (SELECT room_id, COUNT(*) as c FROM hostel_allocation WHERE status = 'ACTIVE' GROUP BY room_id) a ON r.id = a.room_id WHERE r.available_beds != (r.bed_capacity - IFNULL(a.c, 0))", db_name, root_pass, "Beds = capacity - active allocations")
    
    # sum of allocations = payment amount
    check_zero("SELECT COUNT(*) FROM payment p LEFT JOIN (SELECT payment_id, SUM(allocated_principal) as s FROM payment_allocation GROUP BY payment_id) a ON p.id = a.payment_id WHERE p.amount != IFNULL(a.s, 0)", db_name, root_pass, "Sum of allocations = payment amount")
    
    # receipt totals = payment amounts
    check_zero("SELECT COUNT(*) FROM receipt r JOIN payment p ON r.payment_id = p.id WHERE p.amount != (SELECT amount FROM payment WHERE id = r.payment_id)", db_name, root_pass, "Receipt totals = payment amounts")
    
    # every user links to exactly one student or employee
    check_zero("SELECT COUNT(*) FROM user_account WHERE (student_id IS NULL AND employee_id IS NULL) OR (student_id IS NOT NULL AND employee_id IS NOT NULL)", db_name, root_pass, "Every user links to exactly one student or employee")
    
    # exactly one current term
    check_count("SELECT COUNT(*) FROM academic_term WHERE is_current = 1", db_name, root_pass, 1, "Exactly one current term")
    
    print("\n=== Testing Generator Determinism ===")
    demo_file = os.path.join(project_root, 'db', 'seed', 'demo', '01_demo_data.sql')
    with open(demo_file, 'rb') as f:
        hash1 = hashlib.md5(f.read()).hexdigest()
        
    gen_script = os.path.join(project_root, 'db', 'seed', 'generate_demo.py')
    subprocess.run([sys.executable, gen_script], capture_output=True, text=True)
    
    with open(demo_file, 'rb') as f:
        hash2 = hashlib.md5(f.read()).hexdigest()
        
    if hash1 == hash2:
        print("[PASS] Generator is deterministic.")
    else:
        print("[FAIL] Generator is NOT deterministic.")
        sys.exit(1)
        
    print("\nAll verifications passed!")

if __name__ == '__main__':
    main()
