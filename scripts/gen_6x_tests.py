import os

tests = {
    "61_vw_dept_student_ranking_test.sql": """
SELECT 'Testing vw_dept_student_ranking' AS Test;
SELECT * FROM vw_dept_student_ranking LIMIT 5;
""",
    "62_vw_program_term_ranking_test.sql": """
SELECT 'Testing vw_program_term_ranking' AS Test;
SELECT * FROM vw_program_term_ranking WHERE prog_term_rank <= 3 LIMIT 5;
""",
    "63_vw_course_attendance_summary_test.sql": """
SELECT 'Testing vw_course_attendance_summary' AS Test;
SELECT * FROM vw_course_attendance_summary LIMIT 5;
""",
    "64_sp_fee_collection_summary_test.sql": """
SELECT 'Testing sp_fee_collection_summary' AS Test;
CALL sp_fee_collection_summary(0.00);
""",
    "65_vw_high_dues_students_test.sql": """
SELECT 'Testing vw_high_dues_students' AS Test;
SELECT * FROM vw_high_dues_students LIMIT 5;
""",
    "66_vw_hostel_occupancy_test.sql": """
SELECT 'Testing vw_hostel_occupancy' AS Test;
SELECT * FROM vw_hostel_occupancy LIMIT 5;
""",
    "67_vw_payroll_summary_test.sql": """
SELECT 'Testing vw_payroll_summary' AS Test;
SELECT * FROM vw_payroll_summary LIMIT 5;
""",
    "68_vw_faculty_leave_utilisation_test.sql": """
SELECT 'Testing vw_faculty_leave_utilisation' AS Test;
SELECT * FROM vw_faculty_leave_utilisation LIMIT 5;
""",
    "69_vw_course_pass_percentage_test.sql": """
SELECT 'Testing vw_course_pass_percentage' AS Test;
SELECT * FROM vw_course_pass_percentage LIMIT 5;
""",
    "610_vw_exam_blocked_students_test.sql": """
SELECT 'Testing vw_exam_blocked_students' AS Test;
SELECT * FROM vw_exam_blocked_students LIMIT 5;
""",
    "611_vw_audit_log_unified_test.sql": """
SELECT 'Testing vw_audit_log_unified' AS Test;
SELECT * FROM vw_audit_log_unified LIMIT 5;
""",
    "612_sp_run_integrity_checks_test.sql": """
SELECT 'Testing sp_run_integrity_checks' AS Test;
CALL sp_run_integrity_checks();
""",
    "613_vw_admin_dashboard_test.sql": """
SELECT 'Testing vw_admin_dashboard' AS Test;
SELECT * FROM vw_admin_dashboard;
""",
    "614_sp_faculty_dashboard_test.sql": """
SELECT 'Testing sp_faculty_dashboard' AS Test;
CALL sp_faculty_dashboard(3);
""",
    "615_sp_student_dashboard_test.sql": """
SELECT 'Testing sp_student_dashboard' AS Test;
CALL sp_student_dashboard(1);
""",
    "616_vw_attendance_shortage_test.sql": """
SELECT 'Testing vw_attendance_shortage' AS Test;
SELECT * FROM vw_attendance_shortage LIMIT 5;
""",
    "617_vw_fee_defaulters_test.sql": """
SELECT 'Testing vw_fee_defaulters' AS Test;
SELECT * FROM vw_fee_defaulters LIMIT 5;
""",
    "618_vw_enrollment_roster_test.sql": """
SELECT 'Testing vw_enrollment_roster' AS Test;
SELECT * FROM vw_enrollment_roster LIMIT 5;
""",
    "619_vw_payroll_register_test.sql": """
SELECT 'Testing vw_payroll_register' AS Test;
SELECT * FROM vw_payroll_register LIMIT 5;
""",
    "620_vw_course_result_summary_test.sql": """
SELECT 'Testing vw_course_result_summary' AS Test;
SELECT * FROM vw_course_result_summary LIMIT 5;
"""
}

os.makedirs('db/tests', exist_ok=True)
for name, content in tests.items():
    with open(f"db/tests/{name}", "w") as f:
        f.write(content)

print("Generated Phase 6 tests.")
