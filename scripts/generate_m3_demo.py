#!/usr/bin/env python3
"""
Generate extended realistic dummy records for Module 3 (Attendance & Exams).
Populates:
  - attendance_session
  - attendance_record
  - exam
  - exam_registration
  - exam_marks_result
  - semester_result
Output: db/seed/demo/08_m3_extended_demo_data.sql
"""

import os
import random
import pymysql

# Fixed seed for deterministic generation
random.seed(42)

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    output_path = os.path.join(project_root, "db", "seed", "demo", "08_m3_extended_demo_data.sql")
    
    conn = pymysql.connect(
        host="localhost",
        port=3307,
        user="root",
        password="rootpassword",
        database="university_erp"
    )
    cur = conn.cursor(pymysql.cursors.DictCursor)
    
    # Fetch active enrollments for target offerings
    target_offerings = [3, 4, 5, 6, 7, 8, 9, 10]
    cur.execute("""
        SELECT e.id as enrollment_id, e.offering_id, e.student_id, s.first_name, s.last_name
        FROM enrollment e
        JOIN student s ON e.student_id = s.id
        WHERE e.offering_id IN (%s) AND e.status = 'ENROLLED'
        ORDER BY e.offering_id, e.student_id
    """ % ",".join(str(o) for o in [1] + target_offerings))
    all_enrollments = cur.fetchall()
    
    enrollments_by_offering = {}
    for enr in all_enrollments:
        enrollments_by_offering.setdefault(enr["offering_id"], []).append(enr)
        
    sql = []
    sql.append("-- ========================================================")
    sql.append("-- Module 3 Extended Realistic Demo Seed")
    sql.append("-- Attendance Sessions, Records, Exams, Registrations, Marks, Sem Results")
    sql.append("-- Generated deterministically with valid relational integrity")
    sql.append("-- ========================================================\n")
    
    # -------------------------------------------------------------------------
    # 1. Attendance Sessions & Records
    # -------------------------------------------------------------------------
    sql.append("-- 1. Attendance Sessions & Records")
    session_id = 5  # Sessions 1-4 already exist for offering 1
    
    dates = [
        "2024-02-05", "2024-02-12", "2024-02-19", "2024-02-26",
        "2024-03-04", "2024-03-11", "2024-03-18", "2024-03-25",
        "2024-04-01", "2024-04-08", "2024-04-15", "2024-04-22"
    ]
    slots = ["09:00 - 10:00", "10:15 - 11:15", "11:30 - 12:30", "14:00 - 15:00"]
    
    for off_idx, off_id in enumerate(target_offerings):
        students_in_off = enrollments_by_offering.get(off_id, [])
        slot = slots[off_idx % len(slots)]
        
        # Categorize students in this offering to simulate realistic attendance:
        # ~70% high attendance (85-100%)
        # ~18% medium attendance (75-84%)
        # ~12% shortage attendance (40-65%)
        student_profiles = {}
        for s_i, enr in enumerate(students_in_off):
            if s_i % 8 == 0:
                profile = "SHORTAGE"
            elif s_i % 5 == 0:
                profile = "MEDIUM"
            else:
                profile = "HIGH"
            student_profiles[enr["enrollment_id"]] = profile
            
        for dt_idx, dt in enumerate(dates):
            # Create session
            sql.append(f"INSERT INTO attendance_session (id, offering_id, session_date, slot, marked_by, marked_at) "
                       f"VALUES ({session_id}, {off_id}, '{dt}', '{slot}', 1, '{dt} 10:30:00');")
            
            # Attendance records for all enrolled students
            for enr in students_in_off:
                eid = enr["enrollment_id"]
                prof = student_profiles[eid]
                
                # Determine presence
                if prof == "HIGH":
                    # ~92% present
                    is_present = (dt_idx not in [2, 7]) if (eid % 3 == 0) else (dt_idx != 4)
                elif prof == "MEDIUM":
                    # ~75-83% present (absent on 2 or 3 sessions)
                    is_present = dt_idx not in [(eid % 4), (eid % 4) + 4, (eid % 4) + 8]
                else:  # SHORTAGE
                    # ~50% present (absent on 6 of 12 sessions)
                    is_present = dt_idx % 2 == 0
                    
                status = "PRESENT" if is_present else "ABSENT"
                sql.append(f"INSERT INTO attendance_record (session_id, enrollment_id, status) "
                           f"VALUES ({session_id}, {eid}, '{status}');")
                
            session_id += 1
            
    sql.append("\n-- --------------------------------------------------------")
    sql.append("-- 2. Exams")
    sql.append("-- --------------------------------------------------------")
    exam_id = 2  # Exam 1 already exists (Offering 1, FINAL)
    
    # Offering 1 additional exams (MIDTERM, PRACTICAL)
    sql.append(f"INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) "
               f"VALUES ({exam_id}, 1, 'MIDTERM', '2024-03-20', 50.00, '2024-03-01 09:00:00', '2024-03-15 17:00:00');")
    exam_1_midterm = exam_id
    exam_id += 1
    
    sql.append(f"INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) "
               f"VALUES ({exam_id}, 1, 'PRACTICAL', '2024-04-18', 50.00, '2024-04-01 09:00:00', '2024-04-12 17:00:00');")
    exam_1_practical = exam_id
    exam_id += 1
    
    # Offerings 3 through 10 exams
    exams_metadata = {}
    # (offering_id, exam_type, date, max_marks, reg_start, reg_end, is_published, status_type)
    for off_id in target_offerings:
        # Midterm
        dt_mid = f"2024-03-{20 + (off_id % 8)}"
        sql.append(f"INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) "
                   f"VALUES ({exam_id}, {off_id}, 'MIDTERM', '{dt_mid}', 50.00, '2024-03-01 09:00:00', '2024-03-15 17:00:00');")
        exams_metadata[exam_id] = {"offering_id": off_id, "max_marks": 50.00, "is_published": 1 if off_id in [3, 4, 6] else 0}
        exam_id += 1
        
        # Final or Special
        if off_id in [8, 10]:
            # Upcoming exam with OPEN registration window!
            sql.append(f"INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) "
                       f"VALUES ({exam_id}, {off_id}, 'SPECIAL_UPCOMING', '2026-11-20', 100.00, '2026-10-01 00:00:00', '2026-11-15 23:59:59');")
            exams_metadata[exam_id] = {"offering_id": off_id, "max_marks": 100.00, "is_open": True}
        else:
            dt_fin = f"2024-05-{10 + (off_id % 10)}"
            sql.append(f"INSERT INTO exam (id, offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date) "
                       f"VALUES ({exam_id}, {off_id}, 'FINAL', '{dt_fin}', 100.00, '2024-04-10 09:00:00', '2024-04-25 17:00:00');")
            exams_metadata[exam_id] = {"offering_id": off_id, "max_marks": 100.00, "is_published": 1 if off_id in [3, 5] else 0}
        exam_id += 1

    sql.append("\n-- --------------------------------------------------------")
    sql.append("-- 3. Exam Registrations & Marks")
    sql.append("-- --------------------------------------------------------")
    reg_id = 6  # Registrations 1-5 already exist for Exam 1
    
    # Offering 1 Midterm registrations & marks (Students 1..5)
    for stu_i in range(1, 6):
        sql.append(f"INSERT INTO exam_registration (id, exam_id, student_id, status, registered_at) "
                   f"VALUES ({reg_id}, {exam_1_midterm}, {stu_i}, 'REGISTERED', '2024-03-05 11:00:00');")
        marks = 45.0 - (stu_i * 2.5)
        grade = "S" if marks >= 45 else ("A" if marks >= 40 else "B")
        gp = 10.0 if grade == "S" else (9.0 if grade == "A" else 8.0)
        sql.append(f"INSERT INTO exam_marks_result (registration_id, marks, grade, grade_points, is_published) "
                   f"VALUES ({reg_id}, {marks}, '{grade}', {gp}, 1);")
        reg_id += 1
        
    # Offering 1 Practical registrations (draft/unpublished)
    for stu_i in range(1, 6):
        sql.append(f"INSERT INTO exam_registration (id, exam_id, student_id, status, registered_at) "
                   f"VALUES ({reg_id}, {exam_1_practical}, {stu_i}, 'REGISTERED', '2024-04-05 14:00:00');")
        marks = 42.0 - (stu_i * 2.0)
        grade = "A" if marks >= 40 else "B"
        gp = 9.0 if grade == "A" else 8.0
        sql.append(f"INSERT INTO exam_marks_result (registration_id, marks, grade, grade_points, is_published) "
                   f"VALUES ({reg_id}, {marks}, '{grade}', {gp}, 0);")
        reg_id += 1

    # Registrations and marks for other exams
    for e_id, meta in exams_metadata.items():
        off_id = meta["offering_id"]
        max_m = meta["max_marks"]
        is_open = meta.get("is_open", False)
        is_pub = meta.get("is_published", 0)
        enrs = enrollments_by_offering.get(off_id, [])
        
        if is_open:
            # Register about half the students; leave rest open for manual student registration
            for idx, enr in enumerate(enrs[:len(enrs)//2]):
                sql.append(f"INSERT INTO exam_registration (id, exam_id, student_id, status, registered_at) "
                           f"VALUES ({reg_id}, {e_id}, {enr['student_id']}, 'REGISTERED', '2026-10-20 10:00:00');")
                reg_id += 1
        else:
            # Completed exam: register all students (with 1 cancelled)
            for idx, enr in enumerate(enrs):
                status = "CANCELLED" if (idx == len(enrs) - 1 and off_id in [4, 7]) else "REGISTERED"
                sql.append(f"INSERT INTO exam_registration (id, exam_id, student_id, status, registered_at) "
                           f"VALUES ({reg_id}, {e_id}, {enr['student_id']}, '{status}', '2024-03-10 10:00:00');")
                
                # If registered, assign marks
                if status == "REGISTERED":
                    # Generate realistic marks curve
                    if max_m == 50.00:
                        raw_marks = round(max(18.0, min(48.5, 38.0 + random.gauss(0, 7.0))), 2)
                        pct = (raw_marks / 50.0) * 100.0
                    else:
                        raw_marks = round(max(35.0, min(97.0, 76.0 + random.gauss(0, 14.0))), 2)
                        pct = raw_marks
                        
                    if pct >= 90.0:
                        grade, gp = "S", 10.0
                    elif pct >= 80.0:
                        grade, gp = "A", 9.0
                    elif pct >= 70.0:
                        grade, gp = "B", 8.0
                    elif pct >= 60.0:
                        grade, gp = "C", 7.0
                    elif pct >= 50.0:
                        grade, gp = "D", 6.0
                    elif pct >= 40.0:
                        grade, gp = "E", 5.0
                    else:
                        grade, gp = "F", 0.0
                        
                    sql.append(f"INSERT INTO exam_marks_result (registration_id, marks, grade, grade_points, is_published) "
                               f"VALUES ({reg_id}, {raw_marks}, '{grade}', {gp}, {is_pub});")
                reg_id += 1

    sql.append("\n-- --------------------------------------------------------")
    sql.append("-- 4. Semester Results (SGPA / CGPA Snapshots)")
    sql.append("-- --------------------------------------------------------")
    sem_id = 3  # IDs 1 and 2 already exist for student 1 (Terms 1 & 2)
    
    # Add semester results for Students 2 through 35 across Term 1 (Fall 2023) and Term 2 (Spring 2024)
    for stu_id in range(2, 36):
        # Base academic performance band
        base_gpa = round(min(9.85, max(6.20, 8.20 + random.gauss(0, 0.9))), 2)
        
        # Term 1
        t1_credits = random.choice([18, 20, 22])
        t1_sgpa = round(min(10.0, max(5.5, base_gpa + random.uniform(-0.4, 0.4))), 2)
        t1_cgpa = t1_sgpa
        sql.append(f"INSERT INTO semester_result (id, student_id, term_id, total_credits, sgpa, cgpa, computed_at) "
                   f"VALUES ({sem_id}, {stu_id}, 1, {t1_credits}, {t1_sgpa}, {t1_cgpa}, '2023-12-20 18:00:00');")
        sem_id += 1
        
        # Term 2
        t2_credits = random.choice([18, 20, 22])
        t2_sgpa = round(min(10.0, max(5.5, t1_sgpa + random.uniform(-0.3, 0.5))), 2)
        total_cr = t1_credits + t2_credits
        cum_cgpa = round(((t1_sgpa * t1_credits) + (t2_sgpa * t2_credits)) / total_cr, 2)
        sql.append(f"INSERT INTO semester_result (id, student_id, term_id, total_credits, sgpa, cgpa, computed_at) "
                   f"VALUES ({sem_id}, {stu_id}, 2, {t2_credits}, {t2_sgpa}, {cum_cgpa}, '2024-05-25 18:00:00');")
        sem_id += 1

    sql.append("\n-- End of Module 3 Extended Demo Seed\n")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql))
        
    print(f"Generated {output_path} successfully.")
    print(f"Total sessions generated: {session_id - 5}")
    print(f"Total exams generated: {exam_id - 2}")
    print(f"Total registrations generated: {reg_id - 6}")
    print(f"Total semester results generated: {sem_id - 3}")

if __name__ == "__main__":
    main()

