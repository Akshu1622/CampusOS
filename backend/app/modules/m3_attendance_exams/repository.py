from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import json

class M3Repository:
    def __init__(self, db: Session):
        self.db = db

    # --- Grade Scale ---
    def get_grade_scales(self, skip: int, limit: int) -> List[Any]:
        q = text("SELECT * FROM grade_scale ORDER BY min_marks_pct DESC LIMIT :limit OFFSET :skip")
        return self.db.execute(q, {"limit": limit, "skip": skip}).fetchall()

    def get_grade_scale_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT * FROM grade_scale WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()

    def get_grade_scale_by_grade(self, grade: str) -> Optional[Any]:
        q = text("SELECT * FROM grade_scale WHERE grade = :grade")
        return self.db.execute(q, {"grade": grade}).fetchone()

    def create_grade_scale(self, data: dict) -> int:
        q = text("""
            INSERT INTO grade_scale (grade, min_marks_pct, max_marks_pct, grade_points)
            VALUES (:grade, :min_pct, :max_pct, :pts)
        """)
        res = self.db.execute(q, {
            "grade": data["grade"],
            "min_pct": data["min_marks_pct"],
            "max_pct": data["max_marks_pct"],
            "pts": data["grade_points"]
        })
        self.db.commit()
        return res.lastrowid

    def update_grade_scale(self, id: int, data: dict):
        updates = []
        for k in data:
            if data[k] is not None:
                updates.append(f"{k} = :{k}")
        if not updates:
            return
        updates_str = ", ".join(updates)
        q = text(f"UPDATE grade_scale SET {updates_str} WHERE id = :id")
        data["id"] = id
        self.db.execute(q, data)
        self.db.commit()

    def delete_grade_scale(self, id: int):
        q = text("DELETE FROM grade_scale WHERE id = :id")
        self.db.execute(q, {"id": id})
        self.db.commit()

    # --- Attendance ---
    def get_attendance_sessions(self, skip: int, limit: int, offering_id: int = None) -> List[Any]:
        if offering_id:
            q = text("SELECT * FROM attendance_session WHERE offering_id = :oid ORDER BY session_date DESC, slot ASC LIMIT :limit OFFSET :skip")
            params = {"limit": limit, "skip": skip, "oid": offering_id}
        else:
            q = text("SELECT * FROM attendance_session ORDER BY session_date DESC, slot ASC LIMIT :limit OFFSET :skip")
            params = {"limit": limit, "skip": skip}
        return self.db.execute(q, params).fetchall()

    def get_attendance_session_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT * FROM attendance_session WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()

    def get_attendance_session_unique(self, offering_id: int, session_date: str, slot: str) -> Optional[Any]:
        q = text("SELECT * FROM attendance_session WHERE offering_id = :oid AND session_date = :dt AND slot = :slot")
        return self.db.execute(q, {"oid": offering_id, "dt": session_date, "slot": slot}).fetchone()

    def create_attendance_session(self, data: dict, marked_by: int) -> int:
        q = text("""
            INSERT INTO attendance_session (offering_id, session_date, slot, marked_by)
            VALUES (:oid, :dt, :slot, :mb)
        """)
        res = self.db.execute(q, {
            "oid": data["offering_id"], "dt": data["session_date"],
            "slot": data["slot"], "mb": marked_by
        })
        self.db.commit()
        return res.lastrowid

    def update_attendance_session(self, id: int, marked_by: int):
        q = text("UPDATE attendance_session SET marked_by = :mb, marked_at = CURRENT_TIMESTAMP WHERE id = :id")
        self.db.execute(q, {"id": id, "mb": marked_by})
        self.db.commit()

    def upsert_attendance_records(self, session_id: int, records: list):
        q = text("""
            INSERT INTO attendance_record (session_id, enrollment_id, status)
            VALUES (:sid, :eid, :status)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        """)
        for r in records:
            self.db.execute(q, {"sid": session_id, "eid": r["enrollment_id"], "status": r["status"]})
        self.db.commit()

    def get_attendance_records(self, session_id: int) -> List[Any]:
        q = text("""
            SELECT ar.enrollment_id, ar.status, s.id as student_id, s.first_name, s.last_name
            FROM attendance_record ar
            JOIN enrollment e ON ar.enrollment_id = e.id
            JOIN student s ON e.student_id = s.id
            WHERE ar.session_id = :sid
        """)
        return self.db.execute(q, {"sid": session_id}).fetchall()

    def get_student_attendance(self, student_id: int) -> List[Any]:
        # Returns courses and attendance stats for the student
        q = text("""
            SELECT 
                o.id as offering_id, c.code as course_code, c.title as course_title,
                (SELECT COUNT(*) FROM attendance_session a_s WHERE a_s.offering_id = o.id) as sessions_held,
                (SELECT COUNT(*) FROM attendance_record ar 
                 JOIN attendance_session a_s ON ar.session_id = a_s.id 
                 WHERE a_s.offering_id = o.id AND ar.enrollment_id = e.id AND ar.status = 'PRESENT') as sessions_attended,
                fn_attendance_pct(s.id, o.id) as attendance_pct
            FROM enrollment e
            JOIN course_offering o ON e.offering_id = o.id
            JOIN course c ON o.course_id = c.id
            JOIN student s ON e.student_id = s.id
            WHERE e.student_id = :sid AND e.status = 'ENROLLED'
        """)
        return self.db.execute(q, {"sid": student_id}).fetchall()

    def get_attendance_shortage(self, skip: int, limit: int, threshold: float = 75.0) -> List[Any]:
        # Uses the DB view
        q = text("""
            SELECT * FROM vw_attendance_shortage 
            WHERE attendance_pct < :thresh 
            ORDER BY student_id, offering_id
            LIMIT :limit OFFSET :skip
        """)
        return self.db.execute(q, {"thresh": threshold, "limit": limit, "skip": skip}).fetchall()

    # --- Exams ---
    def get_exams(self, skip: int, limit: int, offering_id: int = None) -> List[Any]:
        if offering_id:
            q = text("SELECT * FROM exam WHERE offering_id = :oid ORDER BY exam_date DESC LIMIT :limit OFFSET :skip")
            params = {"limit": limit, "skip": skip, "oid": offering_id}
        else:
            q = text("SELECT * FROM exam ORDER BY exam_date DESC LIMIT :limit OFFSET :skip")
            params = {"limit": limit, "skip": skip}
        return self.db.execute(q, params).fetchall()

    def get_exam_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT * FROM exam WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()
        
    def get_exam_unique(self, offering_id: int, exam_type: str) -> Optional[Any]:
        q = text("SELECT * FROM exam WHERE offering_id = :oid AND exam_type = :typ")
        return self.db.execute(q, {"oid": offering_id, "typ": exam_type}).fetchone()

    def create_exam(self, data: dict) -> int:
        q = text("""
            INSERT INTO exam (offering_id, exam_type, exam_date, max_marks, reg_start_date, reg_end_date)
            VALUES (:oid, :typ, :dt, :maxm, :rs, :re)
        """)
        res = self.db.execute(q, {
            "oid": data["offering_id"], "typ": data["exam_type"],
            "dt": data["exam_date"], "maxm": data["max_marks"],
            "rs": data["reg_start_date"], "re": data["reg_end_date"]
        })
        self.db.commit()
        return res.lastrowid

    def update_exam(self, id: int, data: dict):
        updates = []
        for k in data:
            if data[k] is not None:
                updates.append(f"{k} = :{k}")
        if not updates:
            return
        updates_str = ", ".join(updates)
        q = text(f"UPDATE exam SET {updates_str} WHERE id = :id")
        data["id"] = id
        self.db.execute(q, data)
        self.db.commit()

    def delete_exam(self, id: int):
        q = text("DELETE FROM exam WHERE id = :id")
        self.db.execute(q, {"id": id})
        self.db.commit()

    # --- Exam Registration ---
    def get_exam_registration(self, exam_id: int, student_id: int) -> Optional[Any]:
        q = text("SELECT * FROM exam_registration WHERE exam_id = :eid AND student_id = :sid")
        return self.db.execute(q, {"eid": exam_id, "sid": student_id}).fetchone()

    def get_exam_registrations(self, skip: int, limit: int, exam_id: int = None, student_id: int = None) -> List[Any]:
        conds = []
        params = {"limit": limit, "skip": skip}
        if exam_id:
            conds.append("exam_id = :eid")
            params["eid"] = exam_id
        if student_id:
            conds.append("student_id = :sid")
            params["sid"] = student_id
        
        where = "WHERE " + " AND ".join(conds) if conds else ""
        q = text(f"SELECT * FROM exam_registration {where} ORDER BY registered_at DESC LIMIT :limit OFFSET :skip")
        return self.db.execute(q, params).fetchall()

    def create_exam_registration(self, exam_id: int, student_id: int) -> int:
        q = text("""
            INSERT INTO exam_registration (exam_id, student_id, status)
            VALUES (:eid, :sid, 'REGISTERED')
        """)
        res = self.db.execute(q, {"eid": exam_id, "sid": student_id})
        self.db.commit()
        return res.lastrowid
        
    # --- Marks Entry & Results ---
    def get_marks_for_exam(self, exam_id: int) -> List[Any]:
        q = text("""
            SELECT r.id as registration_id, r.student_id, s.first_name, s.last_name,
                   m.marks, m.grade, m.grade_points, m.is_published
            FROM exam_registration r
            JOIN student s ON r.student_id = s.id
            LEFT JOIN exam_marks_result m ON r.id = m.registration_id
            WHERE r.exam_id = :eid AND r.status = 'REGISTERED'
        """)
        return self.db.execute(q, {"eid": exam_id}).fetchall()

    def get_mark_by_registration(self, registration_id: int) -> Optional[Any]:
        q = text("SELECT * FROM exam_marks_result WHERE registration_id = :rid")
        return self.db.execute(q, {"rid": registration_id}).fetchone()

    def upsert_marks(self, marks: list):
        q = text("""
            INSERT INTO exam_marks_result (registration_id, marks, is_published)
            VALUES (:rid, :marks, 0)
            ON DUPLICATE KEY UPDATE marks = VALUES(marks)
        """)
        for m in marks:
            self.db.execute(q, {"rid": m["registration_id"], "marks": m["marks"]})
        self.db.commit()

    def process_results(self, exam_id: int):
        # Calculate grade and grade points for all unpublished marks for this exam
        q = text("""
            UPDATE exam_marks_result emr
            JOIN exam_registration r ON emr.registration_id = r.id
            JOIN exam e ON r.exam_id = e.id
            JOIN grade_scale gs ON (emr.marks / e.max_marks * 100) BETWEEN gs.min_marks_pct AND gs.max_marks_pct
            SET emr.grade = gs.grade, emr.grade_points = gs.grade_points
            WHERE r.exam_id = :eid AND emr.is_published = 0
        """)
        self.db.execute(q, {"eid": exam_id})
        self.db.commit()

    def publish_results(self, exam_id: int):
        q = text("""
            UPDATE exam_marks_result emr
            JOIN exam_registration r ON emr.registration_id = r.id
            SET emr.is_published = 1
            WHERE r.exam_id = :eid AND emr.is_published = 0
        """)
        self.db.execute(q, {"eid": exam_id})
        self.db.commit()

    def get_my_results(self, student_id: int) -> List[Any]:
        # Note: We need a view or complex query to get term-wise results.
        # This gets published marks for a student, grouped by term
        q = text("""
            SELECT 
                t.id as term_id, t.term_label,
                o.id as offering_id, c.code as course_code, c.title as course_title, c.credits,
                emr.marks, emr.grade, emr.grade_points,
                sr.sgpa, sr.cgpa
            FROM exam_registration r
            JOIN exam e ON r.exam_id = e.id
            JOIN course_offering o ON e.offering_id = o.id
            JOIN academic_term t ON o.term_id = t.id
            JOIN course c ON o.course_id = c.id
            JOIN exam_marks_result emr ON r.id = emr.registration_id
            LEFT JOIN semester_result sr ON sr.student_id = r.student_id AND sr.term_id = t.id
            WHERE r.student_id = :sid AND emr.is_published = 1
            ORDER BY t.start_date DESC, c.code ASC
        """)
        return self.db.execute(q, {"sid": student_id}).fetchall()
        
    def compute_cgpa(self, student_id: int) -> float:
        q = text("SELECT fn_student_cgpa(:sid) as cgpa")
        res = self.db.execute(q, {"sid": student_id}).fetchone()
        return float(res.cgpa) if res and res.cgpa is not None else 0.0

    def get_course_result_summary(self, exam_id: int) -> Optional[Any]:
        # Using vw_course_result_summary if it exists, else direct query
        q = text("""
            SELECT 
                r.exam_id,
                COUNT(r.id) as total_registered,
                SUM(CASE WHEN gs.grade_points > 0 THEN 1 ELSE 0 END) as total_passed,
                AVG(emr.marks) as average_marks
            FROM exam_registration r
            LEFT JOIN exam_marks_result emr ON r.id = emr.registration_id
            LEFT JOIN grade_scale gs ON emr.grade = gs.grade
            WHERE r.exam_id = :eid
            GROUP BY r.exam_id
        """)
        return self.db.execute(q, {"eid": exam_id}).fetchone()
        
    # Helpers
    def check_faculty_offering(self, offering_id: int, user_id: int) -> bool:
        q = text("""
            SELECT 1 FROM course_offering o
            JOIN user_account u ON u.id = :uid
            WHERE o.id = :oid AND o.faculty_id = u.employee_id
        """)
        res = self.db.execute(q, {"oid": offering_id, "uid": user_id}).fetchone()
        return res is not None
