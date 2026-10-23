#!/usr/bin/env python3
import os
import random
import datetime

# Fixed seed for determinism
random.seed(42)

def generate_demo_sql():
    sql = []
    sql.append("-- ==========================================")
    sql.append("-- M1: Core Base Data")
    sql.append("-- ==========================================")
    
    # 1. Departments (5)
    depts = [
        (1, 'CS', 'Computer Science'),
        (2, 'ME', 'Mechanical Engineering'),
        (3, 'EE', 'Electrical Engineering'),
        (4, 'CE', 'Civil Engineering'),
        (5, 'BBA', 'Business Administration')
    ]
    for d in depts:
        sql.append(f"INSERT INTO department (id, code, name) VALUES ({d[0]}, '{d[1]}', '{d[2]}');")
        
    # 2. Programs (10)
    progs = []
    pid = 1
    for d in depts:
        progs.append((pid, f"{d[1]}-B", f"Bachelors in {d[2]}", d[0], 4, 120))
        progs.append((pid+1, f"{d[1]}-M", f"Masters in {d[2]}", d[0], 2, 60))
        pid += 2
    for p in progs:
        sql.append(f"INSERT INTO program (id, code, name, department_id, duration_years, credits_required) VALUES ({p[0]}, '{p[1]}', '{p[2]}', {p[3]}, {p[4]}, {p[5]});")
        
    # 3. Academic Terms (2)
    # Exactly one current term
    sql.append("INSERT INTO academic_term (id, term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES (1, '2023-FALL', 2023, 'Fall 2023', '2023-08-01', '2023-12-15', 0);")
    sql.append("INSERT INTO academic_term (id, term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES (2, '2024-SPRING', 2024, 'Spring 2024', '2024-01-10', '2024-05-20', 1);")
    
    # 4. Students (250)
    for i in range(1, 251):
        global_id = f"STU-2023-{str(i).zfill(6)}"
        fname = f"Student{i}"
        lname = "Demo"
        email = f"student{i}@campus.edu"
        prog_id = random.randint(1, 10)
        batch = 2023
        status = 'ACTIVE'
        sql.append(f"INSERT INTO student (id, global_student_id, first_name, last_name, email, program_id, batch_year, status) VALUES ({i}, '{global_id}', '{fname}', '{lname}', '{email}', {prog_id}, {batch}, '{status}');")
        
    sql.append("-- ==========================================")
    sql.append("-- M5: HR Base Data")
    sql.append("-- ==========================================")
    # 5. Employees (30: 20 faculty, 10 staff)
    for i in range(1, 31):
        emp_id = f"EMP-2020-{str(i).zfill(4)}"
        fname = f"Emp{i}"
        lname = "Demo"
        dept_id = random.randint(1, 5)
        emp_type = 'FACULTY' if i <= 20 else 'STAFF'
        desig_id = random.randint(1, 3) if emp_type == 'FACULTY' else random.randint(4, 6)
        join_date = '2020-01-01'
        sql.append(f"INSERT INTO employee (id, employee_id, first_name, last_name, department_id, designation_id, joining_date, emp_type, status) VALUES ({i}, '{emp_id}', '{fname}', '{lname}', {dept_id}, {desig_id}, '{join_date}', '{emp_type}', 'ACTIVE');")

    sql.append("-- ==========================================")
    sql.append("-- M1: Auth & Users")
    sql.append("-- ==========================================")
    # 6. User Accounts
    # Argon2 hash for "password123"
    pwd_hash = "$argon2id$v=19$m=65536,t=3,p=4$Z0N4OEl0RUZtdkQ5R3pPQQ$xQJ0B1mG8XjX0nRJ+5C4Y3y6o8L4wW9uI3ZtT4cW1Yg"
    
    # 2 Admins (different perm sets)
    sql.append(f"INSERT INTO user_account (id, username, password_hash, employee_id) VALUES (1, 'admin_core', '{pwd_hash}', 21);")
    sql.append(f"INSERT INTO user_account (id, username, password_hash, employee_id) VALUES (2, 'admin_finance', '{pwd_hash}', 22);")
    sql.append("INSERT INTO role_assignment (user_id, role_id) VALUES (1, 1), (2, 1);")
    sql.append("INSERT INTO admin_permission_set_assignment (user_id, permission_set_id) VALUES (1, 1), (2, 4);")
    
    # 3 Faculty
    for i, emp_idx in enumerate([1, 2, 3], start=3):
        sql.append(f"INSERT INTO user_account (id, username, password_hash, employee_id) VALUES ({i}, 'faculty{emp_idx}', '{pwd_hash}', {emp_idx});")
        sql.append(f"INSERT INTO role_assignment (user_id, role_id) VALUES ({i}, 2);")
        
    # 5 Students
    for i, stu_idx in enumerate([1, 2, 3, 4, 5], start=6):
        sql.append(f"INSERT INTO user_account (id, username, password_hash, student_id) VALUES ({i}, 'student{stu_idx}', '{pwd_hash}', {stu_idx});")
        sql.append(f"INSERT INTO role_assignment (user_id, role_id) VALUES ({i}, 3);")
        
    sql.append("-- ==========================================")
    sql.append("-- M2: Academics")
    sql.append("-- ==========================================")
    # 7. Courses (50) - Real Engineering Curriculum
    eng_courses = [
        # User requested core subjects
        ("CS301", "Database and Management System", 4, 1),
        ("EE401", "Digital Signal Processing", 4, 3),
        ("EE302", "Embedded Processing", 4, 3),
        ("CS302", "Computer Networks", 4, 1),
        # 5 additional engineering subjects
        ("CS201", "Data Structures and Algorithms", 4, 1),
        ("CS303", "Operating Systems", 4, 1),
        ("CS304", "Theory of Computation", 3, 1),
        ("CS305", "Software Engineering", 3, 1),
        ("EE301", "Microprocessors and Microcontrollers", 4, 3),
        # Additional engineering subjects for full catalog
        ("CS202", "Computer Organization and Architecture", 4, 1),
        ("CS401", "Artificial Intelligence and Machine Learning", 4, 1),
        ("CS402", "Cryptography and Network Security", 3, 1),
        ("CS403", "Compiler Design", 4, 1),
        ("CS404", "Cloud Computing and Distributed Systems", 3, 1),
        ("CS203", "Object Oriented Programming", 3, 1),
        ("CS306", "Design and Analysis of Algorithms", 4, 1),
        ("CS405", "Web Technologies and Frameworks", 3, 1),
        ("EE201", "Digital Electronics and Logic Design", 4, 3),
        ("EE202", "Signals and Systems", 4, 3),
        ("EE303", "Control Systems Engineering", 4, 3),
        ("EE304", "Power Electronics and Drives", 4, 3),
        ("EE402", "VLSI Design and Embedded Systems", 4, 3),
        ("EE403", "Wireless and Mobile Communication", 3, 3),
        ("EE404", "Internet of Things (IoT) and Sensors", 3, 3),
        ("EE305", "Electrical Machines and Transformers", 4, 3),
        ("ME201", "Engineering Mechanics and Statics", 4, 2),
        ("ME202", "Thermodynamics and Heat Transfer", 4, 2),
        ("ME301", "Fluid Mechanics and Machinery", 4, 2),
        ("ME302", "Manufacturing and Machining Science", 3, 2),
        ("ME303", "Kinematics and Dynamics of Machines", 4, 2),
        ("ME401", "Robotics and Industrial Automation", 3, 2),
        ("ME402", "Automobile Engineering", 3, 2),
        ("ME403", "Finite Element Analysis (FEA)", 4, 2),
        ("ME404", "Refrigeration and Air Conditioning", 3, 2),
        ("CE201", "Strength of Materials", 4, 4),
        ("CE202", "Structural Analysis and Mechanics", 4, 4),
        ("CE301", "Concrete Technology and Design", 4, 4),
        ("CE302", "Geotechnical and Foundation Engineering", 4, 4),
        ("CE303", "Surveying and Geomatics", 3, 4),
        ("CE401", "Transportation and Highway Engineering", 3, 4),
        ("CE402", "Environmental Engineering and Hydrology", 3, 4),
        ("CE403", "Design of Steel Structures", 4, 4),
        ("MA101", "Engineering Mathematics I (Calculus)", 4, 1),
        ("MA102", "Engineering Mathematics II (Linear Algebra)", 4, 1),
        ("MA201", "Discrete Mathematics and Graph Theory", 3, 1),
        ("PH101", "Engineering Physics and Quantum Optics", 3, 3),
        ("CH101", "Engineering Chemistry and Materials", 3, 2),
        ("HS201", "Engineering Economics and Management", 3, 5),
        ("HS202", "Professional Ethics and Human Values", 2, 5),
        ("CS499", "Engineering Capstone Project", 6, 1),
    ]

    for i, (code, title, credits, dept_id) in enumerate(eng_courses, start=1):
        sql.append(f"INSERT INTO course (id, code, title, credits, department_id, status) VALUES ({i}, '{code}', '{title}', {credits}, {dept_id}, 'ACTIVE');")
        
    # 8. Course Offerings (50)
    # Edge case: offering at full capacity (id=1), open seats (id=2)
    sql.append("INSERT INTO course_offering (id, course_id, term_id, faculty_id, section, capacity) VALUES (1, 1, 2, 1, 'A', 5);")
    sql.append("INSERT INTO course_offering (id, course_id, term_id, faculty_id, section, capacity) VALUES (2, 2, 2, 2, 'A', 100);")
    for i in range(3, 51):
        fac = random.randint(1, 20)
        sql.append(f"INSERT INTO course_offering (id, course_id, term_id, faculty_id, section, capacity) VALUES ({i}, {i}, 2, {fac}, 'A', 50);")
        
    # 9. Enrollments
    eid = 1
    # Offering 1 full capacity (5 students)
    for i in range(1, 6):
        sql.append(f"INSERT INTO enrollment (id, student_id, offering_id, status) VALUES ({eid}, {i}, 1, 'ENROLLED');")
        eid += 1
    # Withdrawn enrollment edge case
    sql.append(f"INSERT INTO enrollment (id, student_id, offering_id, status) VALUES ({eid}, 6, 2, 'WITHDRAWN');")
    eid += 1
    
    # Generic enrollments
    for stu in range(6, 251):
        # 4 courses per student
        offs = random.sample(range(3, 51), 4)
        for o in offs:
            sql.append(f"INSERT INTO enrollment (id, student_id, offering_id, status) VALUES ({eid}, {stu}, {o}, 'ENROLLED');")
            eid += 1
            
    sql.append("-- ==========================================")
    sql.append("-- M3: Attendance & Exams")
    sql.append("-- ==========================================")
    # Edge case: Attendance at exactly 100%, 75%, 60-74%
    # We will use Offering 1, which has Students 1, 2, 3, 4, 5. 10 sessions total.
    # Student 1: 100% (10/10)
    # Student 2: 75% (need 12 sessions for exact math or 4 sessions) Let's do 4 sessions.
    
    for s_idx in range(1, 5):
        sql.append(f"INSERT INTO attendance_session (id, offering_id, session_date, slot, marked_by) VALUES ({s_idx}, 1, '2024-02-0{s_idx}', '10:00', 1);")
        
    # Student 1: 100% (4/4) -> PRESENT all
    # Student 2: 75% (3/4) -> PRESENT 3, ABSENT 1
    # Student 3: 50% (2/4) -> PRESENT 2, ABSENT 2
    for s_idx in range(1, 5):
        sql.append(f"INSERT INTO attendance_record (session_id, enrollment_id, status) VALUES ({s_idx}, 1, 'PRESENT');") # Student 1
        
        status2 = 'PRESENT' if s_idx <= 3 else 'ABSENT'
        sql.append(f"INSERT INTO attendance_record (session_id, enrollment_id, status) VALUES ({s_idx}, 2, '{status2}');") # Student 2
        
        status3 = 'PRESENT' if s_idx <= 2 else 'ABSENT'
        sql.append(f"INSERT INTO attendance_record (session_id, enrollment_id, status) VALUES ({s_idx}, 3, '{status3}');") # Student 3
        
    # 11. Exams
    # Offering 1 Exam
    sql.append("INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) VALUES (1, 1, 'FINAL', '2024-05-01', 100, '2024-04-01', '2024-04-15');")
    
    # 12. Exam Registration & Marks
    # Edge case: Published and unpublished results
    # Exam 1 Published
    for idx, stu_idx in enumerate([1,2,3,4,5], start=1):
        sql.append(f"INSERT INTO exam_registration (id, exam_id, student_id, status) VALUES ({idx}, 1, {stu_idx}, 'REGISTERED');")
        marks = 90 - (idx * 5)
        sql.append(f"INSERT INTO exam_marks_result (registration_id, marks, grade, grade_points, is_published) VALUES ({idx}, {marks}, 'A', 9.0, 1);")
        
    # 13. Semester Results
    # Student 1 with multiple semesters
    sql.append("INSERT INTO semester_result (id, student_id, term_id, total_credits, sgpa, cgpa) VALUES (1, 1, 1, 15, 8.5, 8.5);")
    sql.append("INSERT INTO semester_result (id, student_id, term_id, total_credits, sgpa, cgpa) VALUES (2, 1, 2, 15, 9.0, 8.75);")
    
    sql.append("-- ==========================================")
    sql.append("-- M4: Finance")
    sql.append("-- ==========================================")
    # Fee structures
    sql.append("INSERT INTO fee_structure (id, program_id, term_id, structure_name) VALUES (1, 1, 2, 'BTech Sem 1');")
    sql.append("INSERT INTO fee_component (id, structure_id, component_name, amount, due_date) VALUES (1, 1, 'Tuition', 50000, '2024-02-01');")
    
    # Student 1: All dues paid
    sql.append("INSERT INTO student_fee (id, student_id, component_id, amount_due, amount_paid, status) VALUES (1, 1, 1, 50000, 50000, 'PAID');")
    sql.append("INSERT INTO payment (id, student_id, amount, payment_mode, reference_no, status) VALUES (1, 1, 50000, 'ONLINE', 'PAY-STU1', 'SUCCESS');")
    sql.append("INSERT INTO payment_allocation (id, payment_id, student_fee_id, allocated_principal) VALUES (1, 1, 1, 50000);")
    sql.append("INSERT INTO receipt (id, receipt_number, payment_id) VALUES (1, 'RCP-20240201-00001', 1);")
    
    # Student 2: Partly paid
    sql.append("INSERT INTO student_fee (id, student_id, component_id, amount_due, amount_paid, status) VALUES (2, 2, 1, 50000, 25000, 'PARTIAL');")
    sql.append("INSERT INTO payment (id, student_id, amount, payment_mode, reference_no, status) VALUES (2, 2, 25000, 'ONLINE', 'PAY-STU2', 'SUCCESS');")
    sql.append("INSERT INTO payment_allocation (id, payment_id, student_fee_id, allocated_principal) VALUES (2, 2, 2, 25000);")
    sql.append("INSERT INTO receipt (id, receipt_number, payment_id) VALUES (2, 'RCP-20240201-00002', 2);")
    
    # Student 3: Overdue (Late fee applicable)
    # due date 2024-02-01, paid nothing
    sql.append("INSERT INTO student_fee (id, student_id, component_id, amount_due, amount_paid, status) VALUES (3, 3, 1, 50000, 0, 'PENDING');")
    
    # Student 4: Exceeds average dues (for RP-5)
    # Add huge dues
    sql.append("INSERT INTO student_fee (id, student_id, component_id, amount_due, amount_paid, status) VALUES (4, 4, 1, 150000, 0, 'PENDING');")
    
    sql.append("-- ==========================================")
    sql.append("-- M5: HR Payroll & Leave")
    sql.append("-- ==========================================")
    # Employee 1: Full leave used
    # Quota for Casual Leave is 12 for Faculty (Emp 1 is Faculty)
    sql.append("INSERT INTO leave_application (id, employee_id, leave_type_id, start_date, end_date, days, status) VALUES (1, 1, 1, '2024-01-01', '2024-01-12', 12, 'APPROVED');")
    
    # Employee 2: Pending leave
    sql.append("INSERT INTO leave_application (id, employee_id, leave_type_id, start_date, end_date, days, status) VALUES (2, 2, 1, '2024-03-01', '2024-03-02', 2, 'PENDING');")
    
    # Payroll Runs: Finalized and Non-finalized
    sql.append("INSERT INTO payroll_run (id, payroll_month, status, run_by) VALUES (1, '2023-12', 'FINALIZED', 1);")
    sql.append("INSERT INTO payroll_run (id, payroll_month, status, run_by) VALUES (2, '2024-01', 'DRAFT', 1);")
    
    sql.append("-- ==========================================")
    sql.append("-- M6: Hostel")
    sql.append("-- ==========================================")
    # 2 Hostels
    sql.append("INSERT INTO hostel (id, name, gender_block, total_capacity) VALUES (1, 'Boys Hostel A', 'MALE', 4);")
    sql.append("INSERT INTO hostel (id, name, gender_block, total_capacity) VALUES (2, 'Girls Hostel B', 'FEMALE', 100);")
    
    # Hostel 1 100% full (1 room, 4 beds)
    sql.append("INSERT INTO room (id, hostel_id, room_number, bed_capacity, available_beds) VALUES (1, 1, '101', 4, 0);")
    
    # Hostel 2 with one bed left in room 1
    sql.append("INSERT INTO room (id, hostel_id, room_number, bed_capacity, available_beds) VALUES (2, 2, '101', 4, 1);")
    
    # Allocations for Hostel 1 (100% full) -> Students 5,6,7,8
    for idx, stu in enumerate([5,6,7,8], start=1):
        sql.append(f"INSERT INTO hostel_allocation (id, student_id, room_id, from_date, status) VALUES ({idx}, {stu}, 1, '2024-01-01', 'ACTIVE');")
        
    # Allocations for Hostel 2 Room 1 (3 beds taken, 1 left) -> Students 9,10,11
    for idx, stu in enumerate([9,10,11], start=5):
        sql.append(f"INSERT INTO hostel_allocation (id, student_id, room_id, from_date, status) VALUES ({idx}, {stu}, 2, '2024-01-01', 'ACTIVE');")

    # Edge cases for requests
    # Active allocation: Student 5
    # Pending request: Student 12
    sql.append("INSERT INTO hostel_request (id, student_id, request_type, status) VALUES (1, 12, 'ALLOCATION', 'PENDING');")
    # Rejected request: Student 13
    sql.append("INSERT INTO hostel_request (id, student_id, request_type, status) VALUES (2, 13, 'ALLOCATION', 'REJECTED');")
    # No request/allocation: Student 14 (just implicitly no data)
    
    with open("db/seed/demo/01_demo_data.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql))
        f.write("\n")
        
    print("Demo seed generated successfully.")

if __name__ == '__main__':
    generate_demo_sql()
