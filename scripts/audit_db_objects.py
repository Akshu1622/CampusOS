import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.db.engine import engine
from sqlalchemy import text

def audit():
    with engine.connect() as conn:
        print("=== VIEWS ===")
        views = ['vw_student_transcript', 'vw_course_attendance_summary', 'vw_fee_defaulters', 'vw_payroll_summary', 'vw_hostel_occupancy']
        for v in views:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM {v}")).scalar()
                print(f"  {v}: {cnt} rows")
            except Exception as e:
                print(f"  {v}: ERROR -> {e}")

        print("\n=== STORED ROUTINES (Procedures & Functions) ===")
        routines = conn.execute(text("""
            SELECT routine_name, routine_type 
            FROM information_schema.routines 
            WHERE routine_schema = 'university_erp'
            ORDER BY routine_type, routine_name
        """)).fetchall()
        for r in routines:
            print(f"  {r[1]}: {r[0]}")

        print("\n=== TRIGGERS ===")
        triggers = conn.execute(text("""
            SELECT trigger_name, event_manipulation, event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_schema = 'university_erp'
            ORDER BY event_object_table, trigger_name
        """)).fetchall()
        print(f"  Total Triggers: {len(triggers)}")
        for t in triggers:
            print(f"  {t[0]} ON {t[2]} FOR {t[1]}")

        print("\n=== ALL DATABASE TABLES ===")
        tables = conn.execute(text("""
            SELECT table_name, table_rows 
            FROM information_schema.tables 
            WHERE table_schema = 'university_erp' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)).fetchall()
        print(f"  Total Tables: {len(tables)}")
        for tb in tables:
            actual_count = conn.execute(text(f"SELECT COUNT(*) FROM `{tb[0]}`")).scalar()
            print(f"  {tb[0]}: {actual_count} records")

        print("\n=== UDF EXECUTION TESTS ===")
        test_queries = [
            ("fn_is_valid_student_id('STU-2023-0001')", "SELECT fn_is_valid_student_id('STU-2023-0001')"),
            ("fn_is_valid_employee_id('EMP-2020-0001')", "SELECT fn_is_valid_employee_id('EMP-2020-0001')"),
            ("fn_is_valid_course_code('CS101')", "SELECT fn_is_valid_course_code('CS101')"),
            ("fn_is_valid_payroll_month('2026-09')", "SELECT fn_is_valid_payroll_month('2026-09')"),
            ("fn_attendance_pct(1, 1)", "SELECT fn_attendance_pct(1, 1)"),
            ("fn_student_cgpa(1)", "SELECT fn_student_cgpa(1)"),
            ("fn_leave_balance(1, 1, 2026)", "SELECT fn_leave_balance(1, 1, 2026)"),
            ("fn_late_fee_penalty(1, '2026-08-01', '2026-09-01')", "SELECT fn_late_fee_penalty(1, '2026-08-01', '2026-09-01')"),
        ]
        for name, q in test_queries:
            try:
                res = conn.execute(text(q)).scalar()
                print(f"  {name} -> {res}")
            except Exception as e:
                print(f"  {name} -> ERROR: {e}")

if __name__ == '__main__':
    audit()
