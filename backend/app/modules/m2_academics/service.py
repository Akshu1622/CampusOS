from sqlalchemy.orm import Session
from app.modules.m2_academics.repository import M2Repository
from app.core.errors import APIError
import json

class M2Service:
    def __init__(self, db: Session):
        self.repo = M2Repository(db)

    # --- Course ---
    def get_courses(self, skip: int, limit: int, department_id: int = None):
        return self.repo.get_courses(skip, limit, department_id)

    def get_course(self, id: int):
        c = self.repo.get_course_by_id(id)
        if not c:
            raise APIError("NOT_FOUND", "Course not found", 404)
        return c

    def create_course(self, data: dict, acting_user: int, ip_address: str):
        existing = self.repo.get_course_by_code(data["code"])
        if existing:
            raise APIError("CONFLICT", "Course code already exists", 409)
        cid = self.repo.create_course(data)
        return cid

    def update_course(self, id: int, data: dict, acting_user: int, ip_address: str):
        old = self.repo.get_course_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Course not found", 404)
        self.repo.update_course(id, data)

    def delete_course(self, id: int):
        old = self.repo.get_course_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Course not found", 404)
        self.repo.delete_course(id)

    # --- Curriculum Mapping ---
    def get_curriculum(self, skip: int, limit: int, program_id: int = None, semester: int = None):
        return self.repo.get_curriculum(skip, limit, program_id, semester)

    def get_curriculum_by_id(self, id: int):
        c = self.repo.get_curriculum_by_id(id)
        if not c:
            raise APIError("NOT_FOUND", "Curriculum mapping not found", 404)
        return c

    def create_curriculum(self, data: dict, acting_user: int, ip_address: str):
        existing = self.repo.get_curriculum_by_unique(data["program_id"], data["semester"], data["course_id"])
        if existing:
            raise APIError("CONFLICT", "Curriculum mapping already exists", 409)
        cid = self.repo.create_curriculum(data)
        return cid

    def update_curriculum(self, id: int, type: str, acting_user: int, ip_address: str):
        old = self.repo.get_curriculum_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Curriculum mapping not found", 404)
        self.repo.update_curriculum(id, type)

    def delete_curriculum(self, id: int, acting_user: int, ip_address: str):
        old = self.repo.get_curriculum_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Curriculum mapping not found", 404)
        self.repo.delete_curriculum(id)

    # --- Course Offering ---
    def get_offerings(self, skip: int, limit: int, term_id: int = None, course_id: int = None):
        return self.repo.get_offerings(skip, limit, term_id, course_id)

    def get_offering(self, id: int):
        o = self.repo.get_offering_by_id(id)
        if not o:
            raise APIError("NOT_FOUND", "Course offering not found", 404)
        return o

    def create_offering(self, data: dict, acting_user: int, ip_address: str):
        existing = self.repo.get_offering_by_unique(data["course_id"], data["term_id"], data["section"])
        if existing:
            raise APIError("CONFLICT", "Course offering section already exists for this term", 409)
        oid = self.repo.create_offering(data)
        return oid

    def update_offering(self, id: int, data: dict, acting_user: int, ip_address: str):
        old = self.repo.get_offering_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Course offering not found", 404)
        self.repo.update_offering(id, data)

    def delete_offering(self, id: int, acting_user: int, ip_address: str):
        old = self.repo.get_offering_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Course offering not found", 404)
        self.repo.delete_offering(id)

    def get_offering_roster(self, offering_id: int):
        return self.repo.get_offering_roster(offering_id)

    # --- Enrollment ---
    def get_enrollments(self, skip: int, limit: int, student_id: int = None, offering_id: int = None):
        return self.repo.get_enrollments(skip, limit, student_id, offering_id)

    def get_enrollment(self, id: int):
        e = self.repo.get_enrollment_by_id(id)
        if not e:
            raise APIError("NOT_FOUND", "Enrollment not found", 404)
        return e

    def create_enrollment(self, data: dict, acting_user: int, ip_address: str):
        offering_id = data["offering_id"]
        student_id = data["student_id"]
        
        # Validation 1: Term open
        term_id = self.repo.get_term_id_by_offering(offering_id)
        if not term_id:
            raise APIError("NOT_FOUND", "Offering not found", 404)
        if not self.repo.get_term_is_current(term_id):
            raise APIError("TERM_NOT_OPEN", "The academic term is not open for this operation.", 400)
            
        # Validation 2: Duplicate
        existing = self.repo.get_enrollment_by_unique(student_id, offering_id)
        if existing:
            raise APIError("DUPLICATE_ENROLLMENT", "The student is already enrolled in this course offering.", 409)

        # Validation 3: Capacity
        o = self.repo.get_offering_by_id(offering_id)
        enrolled_count = self.repo.get_enrolled_count(offering_id)
        if enrolled_count >= o.capacity:
            raise APIError("ENROLLMENT_CAPACITY_FULL", "The enrollment capacity for this course offering is full.", 409)
                
        # Validation 4: Student in curriculum
        prog_id = self.repo.get_student_program(student_id)
        if prog_id:
            from sqlalchemy import text
            has_curriculum = self.repo.db.execute(
                text("SELECT COUNT(*) FROM curriculum_mapping WHERE program_id = :pid"),
                {"pid": prog_id}
            ).scalar()
            if has_curriculum > 0:
                is_mapped = self.repo.db.execute(
                    text("""
                        SELECT COUNT(*) FROM curriculum_mapping cm
                        JOIN course_offering co ON cm.course_id = co.course_id
                        WHERE cm.program_id = :pid AND co.id = :oid
                    """),
                    {"pid": prog_id, "oid": offering_id}
                ).scalar()
                if not is_mapped:
                    raise APIError("STUDENT_NOT_IN_CURRICULUM", "The student is not in the required program curriculum for this course.", 400)
        
        eid = self.repo.create_enrollment(data)
        return eid

    def withdraw_enrollment(self, id: int, acting_user: int, ip_address: str):
        old = self.repo.get_enrollment_by_id(id)
        if not old:
            raise APIError("NOT_FOUND", "Enrollment not found", 404)
        if old.status != 'ENROLLED':
            raise APIError("BAD_REQUEST", f"Cannot withdraw from {old.status} enrollment", 400)
        self.repo.update_enrollment_status(id, "WITHDRAWN")

    # --- Bulk Enrollment ---
    def run_bulk_enrollment(self, payload: list, policy: str, dry_run: bool, acting_user: int, ip_address: str):
        # Call the SP
        payload_json = json.dumps(payload)
        res = self.repo.call_bulk_enrollment(payload_json, policy, dry_run, acting_user)
        return res

    # --- My Courses ---
    def get_my_courses(self, student_id: int):
        return self.repo.get_student_courses(student_id)

    # --- My Teaching ---
    def get_my_teaching(self, faculty_id: int):
        return self.repo.get_faculty_offerings(faculty_id)
