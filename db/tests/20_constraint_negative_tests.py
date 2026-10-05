#!/usr/bin/env python3
import os
import sys
import subprocess

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
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    
    tests = [
        # CHECK constraints (can be tested with FK checks disabled to avoid needing full parent rows)
        ("program.duration_years > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO program (code, name, department_id, duration_years, credits_required) VALUES ('CS', 'CS', 1, 0, 100);", True),
        ("academic_term dates", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO academic_term (term_identifier, term_year, term_label, start_date, end_date) VALUES ('2023-FALL', 2023, 'Fall', '2023-10-01', '2023-09-01');", True),
        ("student global_id regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO student (global_student_id, first_name, last_name, email, program_id, batch_year) VALUES ('INVALID', 'A', 'B', 'a@b.com', 1, 2023);", True),
        ("course credits >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO course (code, title, credits, department_id) VALUES ('CS101', 'Intro', -1, 1);", True),
        ("course code regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO course (code, title, credits, department_id) VALUES ('C101', 'Intro', 3, 1);", True),
        ("course_offering capacity > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO course_offering (course_id, term_id, faculty_id, section, capacity) VALUES (1, 1, 1, 'A', 0);", True),
        ("bulk_enrollment_batch batch_id regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO bulk_enrollment_batch (batch_id, run_by) VALUES ('INVALID', 1);", True),
        ("exam max_marks > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO exam (offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) VALUES (1, 'MID', '2023-10-10', 0, '2023-09-01', '2023-09-10');", True),
        ("exam dates", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO exam (offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) VALUES (1, 'MID', '2023-10-10', 100, '2023-09-10', '2023-09-01');", True),
        ("exam_marks_result marks >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO exam_marks_result (registration_id, marks) VALUES (1, -5);", True),
        ("fee_component amount >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO fee_component (structure_id, component_name, amount, due_date) VALUES (1, 'Tuition', -100, '2023-10-01');", True),
        ("student_fee amount_due >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO student_fee (student_id, component_id, amount_due) VALUES (1, 1, -1);", True),
        ("late_fee_rule penalty >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO late_fee_rule (rule_type, penalty_amount) VALUES ('FLAT', -10);", True),
        ("payment amount > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO payment (student_id, amount, payment_mode) VALUES (1, 0, 'CASH');", True),
        ("payment_allocation principal >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO payment_allocation (payment_id, student_fee_id, allocated_principal) VALUES (1, 1, -10);", True),
        ("receipt receipt_number regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO receipt (receipt_number, payment_id) VALUES ('INVALID', 1);", True),
        ("designation job_level > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO designation (title, job_level) VALUES ('Prof', 0);", True),
        ("employee emp_id regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO employee (employee_id, first_name, last_name, department_id, designation_id, joining_date, emp_type) VALUES ('INVALID', 'A', 'B', 1, 1, '2023-01-01', 'FACULTY');", True),
        ("leave_entitlement quota >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO leave_entitlement (leave_type_id, emp_type, annual_quota) VALUES (1, 'FACULTY', -1);", True),
        ("leave_application dates", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO leave_application (employee_id, leave_type_id, start_date, end_date, days) VALUES (1, 1, '2023-10-10', '2023-10-01', 5);", True),
        ("salary_structure basic >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO salary_structure (designation_id, basic_pay) VALUES (1, -1000);", True),
        ("payroll_run month regex", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO payroll_run (payroll_month, run_by) VALUES ('13-2023', 1);", True),
        ("payslip net_pay >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO payslip (run_id, employee_id, gross_pay, total_deductions, net_pay) VALUES (1, 1, 100, 200, -100);", True),
        ("payslip_line amount >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO payslip_line (payslip_id, component_type, description, amount) VALUES (1, 'EARNING', 'Bonus', -10);", True),
        ("hostel capacity >= 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO hostel (name, gender_block, total_capacity) VALUES ('H1', 'MALE', -1);", True),
        ("room bed_capacity > 0", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO room (hostel_id, room_number, bed_capacity, available_beds) VALUES (1, '101', 0, 0);", True),
        ("room available_beds bounds", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO room (hostel_id, room_number, bed_capacity, available_beds) VALUES (1, '101', 2, 3);", True),
        ("hostel_allocation dates", "SET FOREIGN_KEY_CHECKS=0; INSERT INTO hostel_allocation (student_id, room_id, from_date, to_date) VALUES (1, 1, '2023-10-10', '2023-10-01');", True),
        
        # FK Constraints (keep FK checks ON)
        ("Invalid FK program.department_id", "INSERT INTO program (code, name, department_id, duration_years, credits_required) VALUES ('TEST', 'Test', 9999, 4, 120);", True),
        ("Invalid FK student.program_id", "INSERT INTO student (global_student_id, first_name, last_name, email, program_id, batch_year) VALUES ('STU-2023-123456', 'A', 'B', 'a@b.com', 9999, 2023);", True),
        
        # UNIQUE Constraints and GENERATED VIRTUAL "One active" rules
        # To test these, we must insert a valid row, then try to insert another that collides.
        ("academic_term only one active", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO academic_term (term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES ('2023-FALL', 2023, 'Fall', '2023-08-01', '2023-12-01', 1); "
         "INSERT INTO academic_term (term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES ('2024-SPRI', 2024, 'Spring', '2024-01-01', '2024-05-01', 1);", True),
         
        ("enrollment only one active", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO enrollment (id, student_id, offering_id, status) VALUES (101, 1, 1, 'ENROLLED'); "
         "INSERT INTO enrollment (id, student_id, offering_id, status) VALUES (102, 1, 1, 'ENROLLED');", True),
         
        ("attendance_session unique offering date slot", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO attendance_session (offering_id, session_date, slot, marked_by) VALUES (1, '2023-10-10', '10:00', 1); "
         "INSERT INTO attendance_session (offering_id, session_date, slot, marked_by) VALUES (1, '2023-10-10', '10:00', 1);", True),
         
        ("payroll_run only one finalized", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO payroll_run (payroll_month, status, run_by) VALUES ('2023-10', 'FINALIZED', 1); "
         "INSERT INTO payroll_run (payroll_month, status, run_by) VALUES ('2023-11', 'FINALIZED', 1); " # This is valid, different month
         "UPDATE payroll_run SET payroll_month='2023-10' WHERE payroll_month='2023-11';", True), # This should fail since '2023-10' FINALIZED already exists
         
        ("hostel_allocation only one active", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (201, 1, '2023-01-01', 'ACTIVE'); "
         "INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (201, 2, '2023-02-01', 'ACTIVE');", True),
         
        ("exam_registration unique exam student", 
         "SET FOREIGN_KEY_CHECKS=0; "
         "INSERT INTO exam_registration (exam_id, student_id, status) VALUES (1, 1, 'REGISTERED'); "
         "INSERT INTO exam_registration (exam_id, student_id, status) VALUES (1, 1, 'CANCELLED');", True) # Fails because (exam_id, student_id) is UNIQUE regardless of status
    ]
    
    passed = 0
    failed = 0
    
    # We use a transaction or clean state? We can just let them fail, failing inserts don't persist (unless the first of a multi-statement succeeds).
    # Since we test failures, the failing statements rollback.
    # To be perfectly clean, we will wrap in transaction and rollback.
    
    for name, query, should_fail in tests:
        # Wrap in transaction
        full_query = f"START TRANSACTION; {query}; ROLLBACK;"
        res = run_query(full_query, db_name, root_pass)
        
        # If should_fail is True, we EXPECT an error (returncode != 0)
        # But wait! mysql -e "START TRANSACTION; query; ROLLBACK" might execute up to the failure and exit with non-zero.
        if should_fail:
            if res.returncode != 0:
                print(f"[PASS] {name} - Rejected as expected.")
                passed += 1
            else:
                print(f"[FAIL] {name} - Succeeded but should have failed!")
                failed += 1
        else:
            if res.returncode == 0:
                print(f"[PASS] {name} - Succeeded as expected.")
                passed += 1
            else:
                print(f"[FAIL] {name} - Failed but should have succeeded!")
                print(res.stderr)
                failed += 1
                
    if failed > 0:
        print(f"Negative tests completed: {passed} passed, {failed} failed.")
        sys.exit(1)
    else:
        print(f"All {passed} negative tests passed successfully.")
        sys.exit(0)

if __name__ == '__main__':
    main()
