from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any

def enrich_admin_dashboard(db: Session, base: Dict[str, Any]) -> Dict[str, Any]:
    # Blocked exams today
    base['blocked_exams_today'] = db.execute(text("SELECT COUNT(*) FROM vw_exam_blocked_students")).scalar() or 0
    
    # Overdue fees today
    base['overdue_fees_today'] = db.execute(text("SELECT COUNT(*) FROM vw_fee_defaulters")).scalar() or 0
    
    # Fee collection donut
    donut = db.execute(text("""
        SELECT 
            SUM(CASE WHEN sf.status = 'PAID' THEN sf.amount_paid ELSE 0 END) AS paid,
            SUM(CASE WHEN sf.status = 'PARTIAL' THEN sf.amount_paid ELSE 0 END) AS partial,
            SUM(CASE WHEN sf.status != 'PAID' AND fc.due_date >= CURDATE() THEN (sf.amount_due - sf.amount_paid) ELSE 0 END) AS due,
            SUM(CASE WHEN sf.status != 'PAID' AND fc.due_date < CURDATE() THEN (sf.amount_due - sf.amount_paid) ELSE 0 END) AS overdue
        FROM student_fee sf
        JOIN fee_component fc ON sf.component_id = fc.id
        JOIN fee_structure fs ON fc.structure_id = fs.id
        JOIN academic_term at ON fs.term_id = at.id
        WHERE at.is_current = 1
    """)).mappings().first()
    
    base['fee_collection_donut'] = {
        'paid': float(donut['paid'] or 0),
        'partial': float(donut['partial'] or 0),
        'due': float(donut['due'] or 0),
        'overdue': float(donut['overdue'] or 0)
    } if donut else {}
    
    # Collection trend
    trend = db.execute(text("""
        SELECT 
            DATE_FORMAT(p.payment_date, '%Y-%m') as month,
            SUM(CASE WHEN at.is_current = 1 THEN pa.allocated_principal + pa.allocated_late_fee ELSE 0 END) as current_term,
            SUM(CASE WHEN at.is_current = 0 THEN pa.allocated_principal + pa.allocated_late_fee ELSE 0 END) as previous_term
        FROM payment p
        JOIN payment_allocation pa ON p.id = pa.payment_id
        JOIN student_fee sf ON pa.student_fee_id = sf.id
        JOIN fee_component fc ON sf.component_id = fc.id
        JOIN fee_structure fs ON fc.structure_id = fs.id
        JOIN academic_term at ON fs.term_id = at.id
        WHERE p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
    """)).mappings().all()
    base['collection_trend'] = [dict(r) for r in trend]
    
    # Enrollment by department
    depts = db.execute(text("""
        SELECT d.code as department, COUNT(e.id) as count
        FROM enrollment e
        JOIN student s ON e.student_id = s.id
        JOIN program p ON s.program_id = p.id
        JOIN department d ON p.department_id = d.id
        WHERE e.status = 'ENROLLED'
        GROUP BY d.code
    """)).mappings().all()
    base['enrollment_by_department'] = [dict(r) for r in depts]
    
    return base

def enrich_faculty_dashboard(db: Session, base: Dict[str, Any], faculty_id: int) -> Dict[str, Any]:
    # Sessions marked today
    base['sessions_to_mark'] = db.execute(text("""
        SELECT COUNT(*) 
        FROM attendance_session a
        JOIN course_offering co ON a.offering_id = co.id
        WHERE co.faculty_id = :faculty_id AND a.session_date = CURDATE()
    """), {"faculty_id": faculty_id}).scalar() or 0
    
    # Today sessions
    sessions = db.execute(text("""
        SELECT a.id, c.code as course_code, co.section, a.slot as time_slot, 'MARKED' as status
        FROM attendance_session a
        JOIN course_offering co ON a.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        WHERE co.faculty_id = :faculty_id AND a.session_date = CURDATE()
        ORDER BY a.slot
    """), {"faculty_id": faculty_id}).mappings().all()
    base['today_sessions'] = [dict(r) for r in sessions]
    
    # Attendance by offering
    att = db.execute(text("""
        SELECT c.code as offering, v.avg_attendance_pct as avg_pct
        FROM vw_course_attendance_summary v
        JOIN course_offering co ON v.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        JOIN academic_term at ON co.term_id = at.id
        WHERE co.faculty_id = :faculty_id AND at.is_current = 1
    """), {"faculty_id": faculty_id}).mappings().all()
    base['attendance_by_offering'] = [dict(r) for r in att]
    
    # Result snapshot
    res = db.execute(text("""
        SELECT 
            grade_calc.grade,
            COUNT(*) as count
        FROM (
            SELECT 
                CASE 
                    WHEN emr.marks >= 90 THEN 'A+'
                    WHEN emr.marks >= 80 THEN 'A'
                    WHEN emr.marks >= 70 THEN 'B'
                    WHEN emr.marks >= 60 THEN 'C'
                    ELSE 'F'
                END as grade
            FROM exam_marks_result emr
            JOIN exam_registration er ON emr.registration_id = er.id
            JOIN exam ex ON er.exam_id = ex.id
            JOIN course_offering co ON ex.offering_id = co.id
            WHERE co.faculty_id = :faculty_id AND emr.is_published = 1
        ) grade_calc
        GROUP BY grade_calc.grade
    """), {"faculty_id": faculty_id}).mappings().all()
    base['result_snapshot'] = [dict(r) for r in res]
    
    # Students below 75
    low_att = db.execute(text("""
        SELECT s.first_name as name, c.code as course, fn_attendance_pct(e.student_id, e.offering_id) as attendance_pct
        FROM enrollment e
        JOIN student s ON e.student_id = s.id
        JOIN course_offering co ON e.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        JOIN academic_term at ON co.term_id = at.id
        WHERE co.faculty_id = :faculty_id AND at.is_current = 1 AND e.status = 'ENROLLED'
        HAVING attendance_pct < 75.00
        ORDER BY attendance_pct ASC
        LIMIT 5
    """), {"faculty_id": faculty_id}).mappings().all()
    base['students_below_75'] = [dict(r) for r in low_att]
    
    return base

def enrich_student_dashboard(db: Session, base: Dict[str, Any], student_id: int) -> Dict[str, Any]:
    # Exam registrations
    exams = db.execute(text("""
        SELECT 
            c.code as course_code, 
            ex.exam_date, 
            ex.reg_end_date,
            (fn_attendance_pct(:student_id, co.id) >= 75.00) as eligible,
            fn_attendance_pct(:student_id, co.id) as attendance
        FROM exam ex
        JOIN course_offering co ON ex.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        JOIN academic_term at ON co.term_id = at.id
        JOIN enrollment e ON e.offering_id = co.id
        LEFT JOIN exam_registration er ON er.exam_id = ex.id AND er.student_id = :student_id
        WHERE e.student_id = :student_id 
          AND e.status = 'ENROLLED' 
          AND at.is_current = 1
          AND er.id IS NULL
          AND CURDATE() BETWEEN ex.reg_start_date AND ex.reg_end_date
    """), {"student_id": student_id}).mappings().all()
    base['exam_registrations'] = [dict(r) for r in exams]
    
    # Classes today
    classes = db.execute(text("""
        SELECT c.code as course_code, co.section, a.slot as time_slot
        FROM attendance_session a
        JOIN course_offering co ON a.offering_id = co.id
        JOIN course c ON co.course_id = c.id
        JOIN enrollment e ON e.offering_id = co.id
        WHERE e.student_id = :student_id AND e.status = 'ENROLLED' AND a.session_date = CURDATE()
        ORDER BY a.slot
    """), {"student_id": student_id}).mappings().all()
    base['classes_today'] = [dict(r) for r in classes]
    
    # CGPA trend
    trend = db.execute(text("""
        SELECT at.term_label as term, tr.sgpa, tr.cgpa
        FROM semester_result tr
        JOIN academic_term at ON tr.term_id = at.id
        WHERE tr.student_id = :student_id
        ORDER BY at.start_date ASC
    """), {"student_id": student_id}).mappings().all()
    base['cgpa_trend'] = [dict(r) for r in trend]
    
    # Upcoming deadlines
    deadlines = db.execute(text("""
        SELECT 
            'Fee Due' as title, 
            fc.due_date as date, 
            'fee' as type
        FROM student_fee sf
        JOIN fee_component fc ON sf.component_id = fc.id
        WHERE sf.student_id = :student_id AND sf.status != 'PAID' AND fc.due_date >= CURDATE()
        ORDER BY date ASC
        LIMIT 3
    """), {"student_id": student_id}).mappings().all()
    # Convert dates to strings for JSON
    base['upcoming_deadlines'] = [{'title': r['title'], 'date': str(r['date']), 'type': r['type']} for r in deadlines]
    
    return base
