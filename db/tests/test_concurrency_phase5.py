import os
import threading
import subprocess
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

def run_query(query):
    root_pass = os.getenv('MYSQL_ROOT_PASSWORD', 'rootpassword')
    db_name = os.getenv('MYSQL_DATABASE', 'university_erp')
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), '..', '..'))
    if res.returncode != 0:
        raise Exception(res.stderr)
    return res.stdout

def test_hostel_allocation():
    print("Running Concurrency Test: Bed Allocation")
    run_query("INSERT IGNORE INTO hostel (id, name, gender_block, total_capacity) VALUES (99, 'Test Hostel', 'MALE', 10)")
    run_query("INSERT IGNORE INTO room (id, hostel_id, room_number, bed_capacity, available_beds) VALUES (99, 99, 'TEST', 1, 1)")
    run_query("UPDATE room SET bed_capacity = 100 WHERE id = 99")
    run_query("DELETE FROM hostel_allocation WHERE room_id = 99")
    run_query("UPDATE room SET bed_capacity = 1, available_beds = 1 WHERE id = 99")
    
    errors = []
    def alloc_student(student_id):
        try:
            run_query(f"INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES ({student_id}, 99, CURDATE(), 'ACTIVE')")
        except Exception as e:
            errors.append(e)

    t1 = threading.Thread(target=alloc_student, args=(80,))
    t2 = threading.Thread(target=alloc_student, args=(81,))
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    beds_out = run_query("SELECT available_beds FROM room WHERE id = 99").strip().split('\n')
    beds = int(beds_out[1])

    assert beds == 0, f"Beds should be 0, got {beds}"
    assert len(errors) == 1, f"Exactly one transaction should have failed. Got {len(errors)}"
    print("[PASS] Bed Allocation")

def test_fee_payment():
    print("Running Concurrency Test: Fee Payment")
    run_query("INSERT IGNORE INTO fee_structure (id, program_id, term_id, structure_name) VALUES (99, 1, 1, 'TEST')")
    run_query("INSERT IGNORE INTO fee_component (id, structure_id, component_name, amount, due_date) VALUES (99, 99, 'TEST DUE', 50.00, CURDATE())")
    run_query("UPDATE fee_component SET due_date = CURDATE() WHERE id = 99")
    run_query("INSERT IGNORE INTO student_fee (id, student_id, component_id, amount_due, amount_paid, status) VALUES (999, 1, 99, 50.00, 0.00, 'PENDING')")
    run_query("DELETE FROM payment_allocation WHERE student_fee_id = 999")
    run_query("UPDATE student_fee SET amount_paid = 0, status = 'PENDING' WHERE id = 999")
    
    errors = []
    def pay_fee():
        try:
            run_query("CALL sp_fee_payment(1, '[999]', 50.00, 'ONLINE', CONCAT('REF-', CONNECTION_ID()), 1)")
        except Exception as e:
            errors.append(e)

    t1 = threading.Thread(target=pay_fee)
    t2 = threading.Thread(target=pay_fee)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert len(errors) == 1, f"Exactly one fee payment should fail. Got {len(errors)}"
    print("[PASS] Fee Payment")

def test_payroll_finalize():
    print("Running Concurrency Test: Payroll Finalize")
    run_query("INSERT IGNORE INTO payroll_run (payroll_month, run_date, status, run_by) VALUES ('2022-01', NOW(), 'DRAFT', 1)")
    run_query("UPDATE payroll_run SET status = 'DRAFT' WHERE payroll_month = '2022-01'")
    
    errors = []
    def finalize():
        try:
            run_query("CALL sp_monthly_payroll('2022-01', 'FINALIZE', 1)")
        except Exception as e:
            errors.append(e)

    t1 = threading.Thread(target=finalize)
    t2 = threading.Thread(target=finalize)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert len(errors) == 1, f"Exactly one finalize should fail. Got {len(errors)}"
    print("[PASS] Payroll Finalize")

def test_enrollment_capacity():
    print("Running Concurrency Test: Bulk Enrollment Capacity")
    run_query("UPDATE academic_term SET is_current = 0")
    run_query("UPDATE academic_term SET is_current = 1 WHERE id = 1")
    run_query("INSERT IGNORE INTO curriculum_mapping (program_id, semester, course_id, type) VALUES (1, 1, 1, 'CORE')")
    run_query("INSERT IGNORE INTO course_offering (id, course_id, term_id, faculty_id, section, capacity) VALUES (99, 1, 1, 1, 'TEST', 1)")
    run_query("UPDATE course_offering SET capacity = 1 WHERE id = 99")
    run_query("DELETE FROM enrollment WHERE offering_id = 99")

    payload1 = '[{"student_id": 1, "offering_id": 99}]'
    payload2 = '[{"student_id": 2, "offering_id": 99}]'
    
    results = []
    def enroll(payload):
        try:
            out = run_query(f"CALL sp_bulk_enrollment('{payload}', 'SKIP_INVALID', 0, 1)")
            if 'SUCCESS' in out:
                results.append(1)
            else:
                print("Failed output:", out)
        except Exception as e:
            print("Exception:", str(e))

    t1 = threading.Thread(target=enroll, args=(payload1,))
    t2 = threading.Thread(target=enroll, args=(payload2,))
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert sum(results) == 1, f"Expected exactly 1 success, got {sum(results)}"
    print("[PASS] Enrollment Capacity")

if __name__ == '__main__':
    test_hostel_allocation()
    test_fee_payment()
    test_payroll_finalize()
    test_enrollment_capacity()
    print("All Phase 5 concurrency tests passed.")
