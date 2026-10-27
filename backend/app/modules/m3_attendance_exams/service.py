from sqlalchemy.orm import Session
from sqlalchemy import text
from app.modules.m3_attendance_exams.repository import M3Repository
from app.core.errors import APIError
from typing import Dict, Any, List

class M3Service:
    def __init__(self, db: Session):
        self.repo = M3Repository(db)

    # --- Grade Scale ---
    def get_grade_scales(self, skip: int, limit: int):
        rows = self.repo.get_grade_scales(skip, limit)
        total = self.repo.count_grade_scales()
        return rows, total

    def get_grade_scale(self, id: int):
        gs = self.repo.get_grade_scale_by_id(id)
        if not gs:
            raise APIError("NOT_FOUND", "Grade scale not found", 404)
        return gs

    def create_grade_scale(self, data: dict):
        existing = self.repo.get_grade_scale_by_grade(data["grade"])
        if existing:
            raise APIError("CONFLICT", "Grade scale already exists", 409)
        return self.repo.create_grade_scale(data)

    def update_grade_scale(self, id: int, data: dict):
        self.get_grade_scale(id)
        self.repo.update_grade_scale(id, data)

    def delete_grade_scale(self, id: int):
        self.get_grade_scale(id)
        self.repo.delete_grade_scale(id)

    # --- Attendance ---
    def get_attendance_sessions(self, skip: int, limit: int, offering_id: int = None, date_str: str = None):
        rows = self.repo.get_attendance_sessions(skip, limit, offering_id, date_str)
        total = self.repo.count_attendance_sessions(offering_id, date_str)
        return rows, total

    def mark_attendance(self, data: dict, acting_user: int, has_admin_override: bool):
        offering_id = data["offering_id"]
        if not has_admin_override and not self.repo.check_faculty_offering(offering_id, acting_user):
            raise APIError("FORBIDDEN", "You are not assigned to this offering", 403)

        existing = self.repo.get_attendance_session_unique(offering_id, str(data["session_date"]), data["slot"])
        if existing:
            raise APIError("CONFLICT", "Session already exists for this date and slot", 409)

        sid = self.repo.create_attendance_session(data, acting_user)
        self.repo.upsert_attendance_records(sid, data["records"])
        return sid

    def update_attendance_session(self, id: int, records: list, acting_user: int, has_admin_override: bool):
        sess = self.repo.get_attendance_session_by_id(id)
        if not sess:
            raise APIError("NOT_FOUND", "Session not found", 404)
        
        if not has_admin_override and not self.repo.check_faculty_offering(sess.offering_id, acting_user):
            raise APIError("FORBIDDEN", "You are not assigned to this offering", 403)

        self.repo.update_attendance_session(id, acting_user)
        self.repo.upsert_attendance_records(id, records)

    def _get_student_id(self, user_id: int) -> int:
        res = self.repo.db.execute(
            text("SELECT student_id FROM user_account WHERE id = :uid"), 
            {"uid": user_id}
        ).fetchone()
        if not res or not res[0]:
            raise APIError("FORBIDDEN", "No student profile linked to this user", 403)
        return res[0]

    def get_my_attendance(self, user_id: int):
        student_id = self._get_student_id(user_id)
        att = self.repo.get_student_attendance(student_id)
        res = []
        for a in att:
            elig = True
            pct = float(a.attendance_pct) if a.attendance_pct is not None else 0.0
            if pct < 75.0:
                elig = False
            res.append({
                "offering_id": a.offering_id,
                "course_code": a.course_code,
                "course_title": a.course_title,
                "credits": getattr(a, "credits", None),
                "sessions_held": a.sessions_held,
                "sessions_attended": a.sessions_attended,
                "attendance_pct": pct,
                "eligible_for_exam": elig
            })
        return res

    def get_attendance_shortage(self, skip: int, limit: int, threshold: float = 75.0, search: str = None):
        rows = self.repo.get_attendance_shortage(skip, limit, threshold, search)
        total = self.repo.count_attendance_shortage(threshold, search)
        return rows, total

    # --- Exams ---
    def get_exams(self, skip: int, limit: int, offering_id: int = None, term_id: int = None, search: str = None):
        rows = self.repo.get_exams(skip, limit, offering_id, term_id, search)
        total = self.repo.count_exams(offering_id, term_id, search)
        return rows, total

    def get_exam(self, id: int):
        e = self.repo.get_exam_by_id(id)
        if not e:
            raise APIError("NOT_FOUND", "Exam not found", 404)
        return e

    def create_exam(self, data: dict):
        existing = self.repo.get_exam_unique(data["offering_id"], data["exam_type"])
        if existing:
            raise APIError("CONFLICT", "Exam of this type already exists for the offering", 409)
        return self.repo.create_exam(data)

    def update_exam(self, id: int, data: dict):
        self.get_exam(id)
        self.repo.update_exam(id, data)

    def delete_exam(self, id: int):
        self.get_exam(id)
        try:
            self.repo.delete_exam(id)
        except Exception as e:
            from app.db.helpers import handle_db_error
            handle_db_error(e)

    # --- Exam Registration ---
    def get_exam_registration(self, exam_id: int, user_id: int):
        student_id = self._get_student_id(user_id)
        return self.repo.get_exam_registration(exam_id, student_id)

    def get_exam_registrations(self, skip: int, limit: int, exam_id: int = None, student_id: int = None, search: str = None):
        rows = self.repo.get_exam_registrations(skip, limit, exam_id, student_id, search)
        total = self.repo.count_exam_registrations(exam_id, student_id, search)
        return rows, total

    def get_blocked_exam_students(self, skip: int, limit: int, search: str = None):
        return self.repo.get_blocked_exam_students(skip, limit, search)

    def get_student_available_exams(self, user_id: int):
        student_id = self._get_student_id(user_id)
        return self.repo.get_student_available_exams(student_id)

    def register_for_exam(self, exam_id: int, user_id: int):
        student_id = self._get_student_id(user_id)
        self.get_exam(exam_id)
        
        # Check duplicate
        if self.repo.get_exam_registration(exam_id, student_id):
            raise APIError("EXAM_DUPLICATE_REGISTRATION", "The student is already registered for this exam.", 409)

        try:
            return self.repo.create_exam_registration(exam_id, student_id)
        except Exception as err:
            from app.db.helpers import handle_db_error
            handle_db_error(err)

    # --- Marks Entry & Results ---
    def enter_marks(self, exam_id: int, marks_data: list, acting_user: int, has_admin_override: bool):
        exam = self.get_exam(exam_id)
        
        if not has_admin_override and not self.repo.check_faculty_offering(exam.offering_id, acting_user):
            raise APIError("FORBIDDEN", "You are not assigned to this offering", 403)
            
        for m in marks_data:
            if m["marks"] > exam.max_marks:
                raise APIError("MARKS_OUT_OF_BOUNDS", f"Marks cannot exceed maximum {exam.max_marks}", 400)
            if m["marks"] < 0:
                raise APIError("MARKS_OUT_OF_BOUNDS", "Marks cannot be negative", 400)
            existing_mark = self.repo.get_mark_by_registration(m["registration_id"])
            if existing_mark and existing_mark.is_published:
                raise APIError("RESULT_ALREADY_PUBLISHED", "The result for this exam is already published and cannot be modified.", 409)

        self.repo.upsert_marks(marks_data)

    def get_marks(self, exam_id: int, acting_user: int, has_admin_override: bool):
        exam = self.get_exam(exam_id)
        if not has_admin_override and not self.repo.check_faculty_offering(exam.offering_id, acting_user):
            raise APIError("FORBIDDEN", "You are not assigned to this offering", 403)
        return self.repo.get_marks_for_exam(exam_id)

    def process_results(self, exam_id: int):
        self.get_exam(exam_id)
        self.repo.process_results(exam_id)

    def publish_results(self, exam_id: int):
        self.get_exam(exam_id)
        marks = self.repo.get_marks_for_exam(exam_id)
        if marks and all(m.is_published for m in marks):
            raise APIError("RESULT_ALREADY_PUBLISHED", "The result for this exam is already published and cannot be modified.", 409)
        self.repo.publish_results(exam_id)

    def get_my_results(self, user_id: int):
        student_id = self._get_student_id(user_id)
        res = self.repo.get_my_results(student_id)
        terms = {}
        for r in res:
            tid = r.term_id
            if tid not in terms:
                terms[tid] = {
                    "term_id": tid,
                    "term_label": r.term_label,
                    "sgpa": float(r.sgpa) if r.sgpa is not None else None,
                    "cgpa": float(r.cgpa) if r.cgpa is not None else None,
                    "courses": []
                }
            terms[tid]["courses"].append({
                "offering_id": r.offering_id,
                "course_code": r.course_code,
                "course_title": r.course_title,
                "credits": r.credits,
                "marks": float(r.marks) if r.marks is not None else None,
                "grade": r.grade,
                "grade_points": float(r.grade_points) if r.grade_points is not None else None,
            })
        return list(terms.values())

    def get_my_cgpa(self, user_id: int):
        student_id = self._get_student_id(user_id)
        cgpa = self.repo.compute_cgpa(student_id)
        return {"student_id": student_id, "cgpa": cgpa}

    def get_course_result_summary(self, exam_id: int):
        self.get_exam(exam_id)
        return self.repo.get_course_result_summary(exam_id)
