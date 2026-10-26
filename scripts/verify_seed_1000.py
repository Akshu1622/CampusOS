#!/usr/bin/env python3
"""
verify_seed_1000.py - Integrity and Report Smoke Tests for CampusOS 1,000-student database.
Adapted from verify_seed.sql to conform to CampusOS's schema and views.
"""

import os
import sys
import argparse
import pymysql

def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k.strip()] = v.strip()
    return env

def main():
    parser = argparse.ArgumentParser(description="Verify 1,000-student seed in CampusOS")
    parser.add_argument("--host", help="MySQL Host")
    parser.add_argument("--port", type=int, help="MySQL Port")
    parser.add_argument("--root-user", default="root", help="MySQL Root User")
    parser.add_argument("--root-pass", help="MySQL Root Password")
    parser.add_argument("--db-name", help="Database name")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env = load_env(os.path.join(project_root, '.env'))

    host = args.host or env.get("MYSQL_HOST", "localhost")
    port = args.port or int(env.get("MYSQL_PORT", 3306))
    root_user = args.root_user or env.get("MYSQL_ROOT_USER", "root")
    root_pass = args.root_pass if args.root_pass is not None else env.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = args.db_name or env.get("MYSQL_DATABASE", "university_erp")

    conn = pymysql.connect(
        host=host,
        port=port,
        user=root_user,
        password=root_pass,
        database=db_name,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = conn.cursor()

    print("=" * 65)
    print(" CampusOS 1,000-Student Database Verification & Smoke Test")
    print("=" * 65)

    # ===== A. Integrity Checks (All must be 0) =====
    print("\n[A] Integrity Rules (Target: 0 Violations)")
    checks = [
        ("Hostel: beds != capacity - active allocations", """
            SELECT COUNT(*) AS violations FROM room r
            LEFT JOIN (SELECT room_id, COUNT(*) c FROM hostel_allocation WHERE status='ACTIVE' GROUP BY room_id) a ON a.room_id=r.id
            WHERE r.available_beds <> r.bed_capacity - COALESCE(a.c, 0)
        """),
        ("Hostel: student with >1 active allocation", """
            SELECT COUNT(*) AS violations FROM (
                SELECT student_id FROM hostel_allocation WHERE status='ACTIVE' GROUP BY student_id HAVING COUNT(*) > 1
            ) x
        """),
        ("Finance: payment allocation sum != payment amount", """
            SELECT COUNT(*) AS violations FROM payment p
            LEFT JOIN (SELECT payment_id, SUM(allocated_principal) a FROM payment_allocation GROUP BY payment_id) x ON x.payment_id=p.id
            WHERE p.status='SUCCESS' AND ROUND(p.amount, 2) <> ROUND(COALESCE(x.a, 0), 2)
        """),
        ("Finance: student_fee.amount_paid != sum(allocations)", """
            SELECT COUNT(*) AS violations FROM student_fee f
            LEFT JOIN (SELECT student_fee_id, SUM(allocated_principal) a FROM payment_allocation GROUP BY student_fee_id) x ON x.student_fee_id=f.id
            WHERE ROUND(f.amount_paid, 2) <> ROUND(COALESCE(x.a, 0), 2)
        """),
        ("Finance: SUCCESS payment without receipt", """
            SELECT COUNT(*) AS violations FROM payment p
            LEFT JOIN receipt r ON r.payment_id=p.id
            WHERE p.status='SUCCESS' AND r.id IS NULL
        """),
        ("HR: approved leave exceeding yearly quota", """
            SELECT COUNT(*) AS violations FROM (
                SELECT a.employee_id, a.leave_type_id, YEAR(a.start_date) as yr, SUM(a.days) as used, le.annual_quota
                FROM leave_application a
                JOIN employee e ON e.id = a.employee_id
                JOIN leave_entitlement le ON le.leave_type_id = a.leave_type_id AND le.emp_type = e.emp_type
                WHERE a.status='APPROVED'
                GROUP BY a.employee_id, a.leave_type_id, yr, le.annual_quota
                HAVING used > le.annual_quota
            ) x
        """),
        ("HR: payslip net != gross - total deductions", """
            SELECT COUNT(*) AS violations FROM payslip
            WHERE ROUND(gross_pay - total_deductions, 2) <> net_pay
        """),
        ("Core: more than one current term", """
            SELECT (COUNT(*) - 1) AS violations FROM academic_term WHERE is_current=1
        """)
    ]

    all_passed = True
    for name, q in checks:
        cursor.execute(q)
        res = cursor.fetchone()
        v = list(res.values())[0]
        if v == 0:
            print(f"  [PASS] {name:50s} : 0 violations")
        else:
            print(f"  [FAIL] {name:50s} : {v} violations!")
            all_passed = False

    # ===== B. Row Counts per Module =====
    print("\n[B] Row Counts per Module")
    count_queries = [
        ("M1 Students", "SELECT COUNT(*) FROM student"),
        ("M1 User Accounts", "SELECT COUNT(*) FROM user_account"),
        ("M1 Employees", "SELECT COUNT(*) FROM employee"),
        ("M2 Course Offerings", "SELECT COUNT(*) FROM course_offering"),
        ("M2 Enrollments", "SELECT COUNT(*) FROM enrollment"),
        ("M3 Attendance Records", "SELECT COUNT(*) FROM attendance_record"),
        ("M3 Exam Registrations", "SELECT COUNT(*) FROM exam_registration"),
        ("M4 Student Fees", "SELECT COUNT(*) FROM student_fee"),
        ("M4 Payments", "SELECT COUNT(*) FROM payment"),
        ("M5 Payslips", "SELECT COUNT(*) FROM payslip"),
        ("M5 Pending Leaves", "SELECT COUNT(*) FROM leave_application WHERE status='PENDING'"),
        ("M6 Active Allocations", "SELECT COUNT(*) FROM hostel_allocation WHERE status='ACTIVE'"),
        ("M6 Pending Hostel Requests", "SELECT COUNT(*) FROM hostel_request WHERE status='PENDING'")
    ]
    for label, q in count_queries:
        cursor.execute(q)
        res = cursor.fetchone()
        cnt = list(res.values())[0]
        print(f"  {label:30s} : {cnt:>9,}")

    # ===== C. Student Coverage Cohorts =====
    print("\n[C] Student Module Touchpoints (Out of 1,000 Students)")
    touch_queries = [
        ("Enrolled in current term (2026-FALL)", """
            SELECT COUNT(DISTINCT e.student_id) FROM enrollment e
            JOIN course_offering o ON o.id = e.offering_id
            WHERE o.term_id = 7 AND e.status = 'ENROLLED'
        """),
        ("Have attendance records", """
            SELECT COUNT(DISTINCT e.student_id) FROM attendance_record a
            JOIN enrollment e ON e.id = a.enrollment_id
        """),
        ("Have fee dues", """
            SELECT COUNT(DISTINCT student_id) FROM student_fee
        """),
        ("Have successful payment", """
            SELECT COUNT(DISTINCT student_id) FROM payment WHERE status='SUCCESS'
        """),
        ("Have published CGPA", """
            SELECT COUNT(DISTINCT student_id) FROM semester_result
        """),
        ("Ever hosteller (active or vacated)", """
            SELECT COUNT(DISTINCT student_id) FROM hostel_allocation
        """),
        ("Below 75% attendance in >= 1 course", """
            SELECT COUNT(DISTINCT student_id) FROM vw_exam_blocked_students
        """),
        ("Fee defaulters (overdue balance)", """
            SELECT COUNT(DISTINCT student_id) FROM vw_fee_defaulters
        """)
    ]
    for label, q in touch_queries:
        cursor.execute(q)
        res = cursor.fetchone()
        cnt = list(res.values())[0]
        print(f"  {label:42s} : {cnt:>6} students")

    # ===== D. Smoke Test PRD Reports (Views RP-1 to RP-10) =====
    print("\n[D] Smoke Test PRD Reports (Views / Queries)")

    # RP-1: Department student ranking
    cursor.execute("SELECT dept_rank, department_name, first_name, last_name, cgpa FROM vw_dept_student_ranking WHERE dept_rank <= 2 LIMIT 6;")
    r1 = cursor.fetchall()
    print(f"  RP-1 Dept Ranking sample (returned {len(r1)} rows):")
    for row in r1[:3]:
        print(f"       Rank #{row['dept_rank']} {row['department_name']}: {row['first_name']} {row['last_name']} (CGPA {row['cgpa']})")

    # RP-3: Course attendance summary (Current term offerings with attendance)
    cursor.execute("SELECT course_code, course_title, avg_attendance_pct FROM vw_course_attendance_summary WHERE avg_attendance_pct IS NOT NULL ORDER BY avg_attendance_pct ASC LIMIT 3;")
    r3 = cursor.fetchall()
    print(f"  RP-3 Course Attendance Summary (returned {len(r3)} rows):")
    for row in r3:
        print(f"       {row['course_code']} - {row['course_title']}: {row['avg_attendance_pct']}% avg attendance")

    # RP-5: High dues students
    cursor.execute("SELECT COUNT(*) as high_due_count FROM vw_high_dues_students;")
    r5 = cursor.fetchone()
    print(f"  RP-5 High Dues Students (above average dues) : {r5['high_due_count']} students")

    # RP-6: Hostel occupancy
    cursor.execute("SELECT hostel_name, total_capacity, occupied_beds, available_beds, occupancy_pct FROM vw_hostel_occupancy;")
    r6 = cursor.fetchall()
    print(f"  RP-6 Hostel Occupancy ({len(r6)} hostels):")
    for row in r6:
        print(f"       {row['hostel_name']:20s} Occupied: {row['occupied_beds']}/{row['total_capacity']} ({row['occupancy_pct']}%)")

    # RP-7: Payroll summary
    cursor.execute("SELECT payroll_month, department_name, employee_count, total_net_pay FROM vw_payroll_summary ORDER BY payroll_month DESC, department_name ASC LIMIT 3;")
    r7 = cursor.fetchall()
    print(f"  RP-7 Payroll Summary sample ({len(r7)} rows):")
    for row in r7:
        print(f"       {row['payroll_month']} ({row['department_name']}): {row['employee_count']} employees, Net Payout: INR {row['total_net_pay']:,.2f}")

    # RP-10: Exam blocked students
    cursor.execute("SELECT COUNT(*) as blocked_count FROM vw_exam_blocked_students;")
    r10 = cursor.fetchone()
    print(f"  RP-10 Exam Ineligible Students (<75% attendance) : {r10['blocked_count']} enrollments flagged")

    print("\n" + "=" * 65)
    if all_passed:
        print(" [SUCCESS] All verification integrity checks and report tests passed!")
    else:
        print(" [WARNING] Some integrity checks reported violations.")
    print("=" * 65)

if __name__ == "__main__":
    main()
