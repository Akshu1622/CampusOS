#!/usr/bin/env python3
import os
import subprocess
import sys

def run_query(query, db_name, root_pass, env):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return res.stdout

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k] = v
                    
    root_pass = env.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env.get("MYSQL_DATABASE", "university_erp")
    sys_env = os.environ.copy()

    queries = {
        "RP-1 Dept Ranking": "EXPLAIN SELECT * FROM vw_dept_student_ranking;",
        "RP-2 Program Ranking": "EXPLAIN SELECT * FROM vw_program_term_ranking;",
        "RP-3 Course Attendance": "EXPLAIN SELECT * FROM vw_course_attendance_summary;",
        "RP-4 Fee Defaulters": "EXPLAIN SELECT * FROM vw_fee_defaulters;",
        "RP-5 High Dues": "EXPLAIN SELECT * FROM vw_high_dues_students;",
        "RP-6 Hostel Occupancy": "EXPLAIN SELECT * FROM vw_hostel_occupancy;",
        "RP-7 Payroll Summary": "EXPLAIN SELECT * FROM vw_payroll_summary;",
        "RP-8 Faculty Leave": "EXPLAIN SELECT * FROM vw_faculty_leave_utilisation;",
        "RP-9 Course Pass %": "EXPLAIN SELECT * FROM vw_course_pass_percentage;",
        "RP-10 Exam Blocked": "EXPLAIN SELECT * FROM vw_exam_blocked_students;",
        "Student Enrollments": "EXPLAIN SELECT * FROM enrollment WHERE student_id = 1;",
        "Student Fees": "EXPLAIN SELECT * FROM student_fee WHERE student_id = 1;",
        "Student Payments": "EXPLAIN SELECT * FROM payment WHERE student_id = 1;",
        "Student Attendances": "EXPLAIN SELECT * FROM attendance_record WHERE enrollment_id = 1;"
    }

    out_file = os.path.join(project_root, "docs", "db", "INDEX_REVIEW.md")
    with open(out_file, 'w') as f:
        f.write("# Index Review\n\n")
        f.write("This document records the EXPLAIN output for major report views and list queries.\n\n")
        for name, query in queries.items():
            f.write(f"## {name}\n")
            f.write(f"Query: `{query.replace('EXPLAIN ', '')}`\n\n")
            f.write("```text\n")
            output = run_query(query, db_name, root_pass, sys_env)
            f.write(output.replace('mysql: [Warning] Using a password on the command line interface can be insecure.\n', ''))
            f.write("```\n\n")
            
    print(f"Generated {out_file}")

if __name__ == '__main__':
    main()
