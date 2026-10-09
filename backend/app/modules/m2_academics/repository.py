from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime

class M2Repository:
    def __init__(self, db: Session):
        self.db = db

    # --- Course ---
    def get_course_by_code(self, code: str) -> Optional[Any]:
        q = text("SELECT id, code, title, credits, department_id, status FROM course WHERE code = :code")
        return self.db.execute(q, {"code": code}).fetchone()

    def get_course_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT id, code, title, credits, department_id, status FROM course WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()

    def create_course(self, data: dict) -> int:
        q = text("""
            INSERT INTO course (code, title, credits, department_id, status)
            VALUES (:code, :title, :credits, :department_id, 'ACTIVE')
        """)
        res = self.db.execute(q, data)
        self.db.commit()
        return res.lastrowid

    def update_course(self, id: int, data: dict):
        updates = []
        for k in data:
            if data[k] is not None:
                updates.append(f"{k} = :{k}")
        if not updates:
            return
        updates_str = ", ".join(updates)
        q = text(f"UPDATE course SET {updates_str} WHERE id = :id")
        data["id"] = id
        self.db.execute(q, data)
    def delete_course(self, id: int):
        q = text("DELETE FROM course WHERE id = :id")
        self.db.execute(q, {"id": id})
        self.db.commit()

    def get_courses(self, skip: int, limit: int, department_id: Optional[int] = None) -> Tuple[List[Any], int]:
        filters = "WHERE 1=1"
        params = {"skip": skip, "limit": limit}
        if department_id is not None:
            filters += " AND department_id = :dept_id"
            params["dept_id"] = department_id
            
        count_q = text(f"SELECT COUNT(*) FROM course {filters}")
        total = self.db.execute(count_q, params).scalar()
        
        q = text(f"SELECT id, code, title, credits, department_id, status FROM course {filters} ORDER BY code LIMIT :limit OFFSET :skip")
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    # --- Curriculum Mapping ---
    def get_curriculum(self, skip: int, limit: int, program_id: Optional[int] = None, semester: Optional[int] = None) -> Tuple[List[Any], int]:
        filters = "WHERE 1=1"
        params = {"skip": skip, "limit": limit}
        if program_id is not None:
            filters += " AND program_id = :prog_id"
            params["prog_id"] = program_id
        if semester is not None:
            filters += " AND semester = :sem"
            params["sem"] = semester
            
        count_q = text(f"SELECT COUNT(*) FROM curriculum_mapping {filters}")
        total = self.db.execute(count_q, params).scalar()
        
        q = text(f"SELECT id, program_id, semester, course_id, type FROM curriculum_mapping {filters} ORDER BY program_id, semester LIMIT :limit OFFSET :skip")
        rows = self.db.execute(q, params).fetchall()
        return rows, total
        
    def get_curriculum_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT id, program_id, semester, course_id, type FROM curriculum_mapping WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()

    def get_curriculum_by_unique(self, program_id: int, semester: int, course_id: int) -> Optional[Any]:
        q = text("SELECT id FROM curriculum_mapping WHERE program_id = :pid AND semester = :sem AND course_id = :cid")
        return self.db.execute(q, {"pid": program_id, "sem": semester, "cid": course_id}).fetchone()

    def create_curriculum(self, data: dict) -> int:
        q = text("""
            INSERT INTO curriculum_mapping (program_id, semester, course_id, type)
            VALUES (:program_id, :semester, :course_id, :type)
        """)
        res = self.db.execute(q, data)
        self.db.commit()
        return res.lastrowid

    def update_curriculum(self, id: int, type: str):
        q = text("UPDATE curriculum_mapping SET type = :type WHERE id = :id")
        self.db.execute(q, {"type": type, "id": id})
        self.db.commit()
        
    def delete_curriculum(self, id: int):
        q = text("DELETE FROM curriculum_mapping WHERE id = :id")
        self.db.execute(q, {"id": id})
        self.db.commit()

    # --- Course Offering ---
    def get_offering_by_unique(self, course_id: int, term_id: int, section: str) -> Optional[Any]:
        q = text("SELECT id FROM course_offering WHERE course_id = :cid AND term_id = :tid AND section = :sec")
        return self.db.execute(q, {"cid": course_id, "tid": term_id, "sec": section}).fetchone()

    def get_offering_by_id(self, id: int) -> Optional[Any]:
        q = text("""
            SELECT id, course_id, term_id, faculty_id, section, capacity,
                   (SELECT COUNT(*) FROM enrollment e WHERE e.offering_id = course_offering.id AND e.status = 'ENROLLED') as enrolled_count
            FROM course_offering WHERE id = :id
        """)
        return self.db.execute(q, {"id": id}).fetchone()

    def create_offering(self, data: dict) -> int:
        q = text("""
            INSERT INTO course_offering (course_id, term_id, faculty_id, section, capacity)
            VALUES (:course_id, :term_id, :faculty_id, :section, :capacity)
        """)
        res = self.db.execute(q, data)
        self.db.commit()
        return res.lastrowid
        
    def update_offering(self, id: int, data: dict):
        updates = []
        for k in data:
            if data[k] is not None:
                updates.append(f"{k} = :{k}")
        if not updates:
            return
        updates_str = ", ".join(updates)
        q = text(f"UPDATE course_offering SET {updates_str} WHERE id = :id")
        data["id"] = id
        self.db.execute(q, data)
        self.db.commit()

    def delete_offering(self, id: int):
        q = text("DELETE FROM course_offering WHERE id = :id")
        self.db.execute(q, {"id": id})
        self.db.commit()

    def get_offerings(self, skip: int, limit: int, term_id: Optional[int] = None, course_id: Optional[int] = None) -> Tuple[List[Any], int]:
        filters = "WHERE 1=1"
        params = {"skip": skip, "limit": limit}
        if term_id is not None:
            filters += " AND term_id = :tid"
            params["tid"] = term_id
        if course_id is not None:
            filters += " AND course_id = :cid"
            params["cid"] = course_id
            
        count_q = text(f"SELECT COUNT(*) FROM course_offering {filters}")
        total = self.db.execute(count_q, params).scalar()
        
        q = text(f"""
            SELECT o.id, o.course_id, o.term_id, o.faculty_id, o.section, o.capacity,
                   (SELECT COUNT(*) FROM enrollment e WHERE e.offering_id = o.id AND e.status = 'ENROLLED') as enrolled_count
            FROM course_offering o
            {filters}
            ORDER BY o.id LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    # --- Enrollment ---
    def get_enrollment_by_unique(self, student_id: int, offering_id: int) -> Optional[Any]:
        q = text("SELECT id, status FROM enrollment WHERE student_id = :sid AND offering_id = :oid")
        return self.db.execute(q, {"sid": student_id, "oid": offering_id}).fetchone()

    def get_enrollment_by_id(self, id: int) -> Optional[Any]:
        q = text("SELECT id, student_id, offering_id, status, enrolled_date FROM enrollment WHERE id = :id")
        return self.db.execute(q, {"id": id}).fetchone()

    def create_enrollment(self, data: dict) -> int:
        q = text("""
            INSERT INTO enrollment (student_id, offering_id, status)
            VALUES (:student_id, :offering_id, 'ENROLLED')
        """)
        res = self.db.execute(q, data)
        self.db.commit()
        return res.lastrowid

    def update_enrollment_status(self, id: int, status: str):
        q = text("UPDATE enrollment SET status = :status WHERE id = :id")
        self.db.execute(q, {"status": status, "id": id})
        self.db.commit()

    def get_enrollments(self, skip: int, limit: int, student_id: Optional[int] = None, offering_id: Optional[int] = None) -> Tuple[List[Any], int]:
        filters = "WHERE 1=1"
        params = {"skip": skip, "limit": limit}
        if student_id is not None:
            filters += " AND student_id = :sid"
            params["sid"] = student_id
        if offering_id is not None:
            filters += " AND offering_id = :oid"
            params["oid"] = offering_id
            
        count_q = text(f"SELECT COUNT(*) FROM enrollment {filters}")
        total = self.db.execute(count_q, params).scalar()
        
        q = text(f"SELECT id, student_id, offering_id, status, enrolled_date FROM enrollment {filters} ORDER BY id LIMIT :limit OFFSET :skip")
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    # --- Student verification ---
    def get_student_program(self, student_id: int) -> Optional[int]:
        q = text("SELECT program_id FROM student WHERE id = :sid")
        res = self.db.execute(q, {"sid": student_id}).fetchone()
        return res[0] if res else None

    # --- Term verification ---
    def get_term_is_current(self, term_id: int) -> Optional[bool]:
        q = text("SELECT is_current FROM academic_term WHERE id = :tid")
        res = self.db.execute(q, {"tid": term_id}).fetchone()
        return bool(res[0]) if res else None

    def get_term_id_by_offering(self, offering_id: int) -> Optional[int]:
        q = text("SELECT term_id FROM course_offering WHERE id = :oid")
        res = self.db.execute(q, {"oid": offering_id}).fetchone()
        return res[0] if res else None

    # --- My Courses (Student) ---
    def get_student_courses(self, student_id: int) -> List[Any]:
        q = text("""
            SELECT e.id as enrollment_id, o.id as offering_id, c.code as course_code, c.title as course_title,
                   o.term_id, o.faculty_id, o.section, c.credits, e.status
            FROM enrollment e
            JOIN course_offering o ON e.offering_id = o.id
            JOIN course c ON o.course_id = c.id
            WHERE e.student_id = :sid
        """)
        return self.db.execute(q, {"sid": student_id}).fetchall()

    # --- My Teaching (Faculty) ---
    def get_faculty_offerings(self, faculty_id: int) -> List[Any]:
        q = text("""
            SELECT o.id as offering_id, c.code as course_code, c.title as course_title,
                   o.term_id, o.section, o.capacity,
                   (SELECT COUNT(*) FROM enrollment e WHERE e.offering_id = o.id AND e.status = 'ENROLLED') as enrolled_count
            FROM course_offering o
            JOIN course c ON o.course_id = c.id
            WHERE o.faculty_id = :fid
        """)
        return self.db.execute(q, {"fid": faculty_id}).fetchall()

    # --- Course Roster ---
    def get_offering_roster(self, offering_id: int) -> List[Any]:
        q = text("""
            SELECT s.id as student_id, s.global_student_id, s.first_name, s.last_name, e.status as enrollment_status, e.enrolled_date
            FROM enrollment e
            JOIN student s ON e.student_id = s.id
            WHERE e.offering_id = :oid
            ORDER BY s.global_student_id
        """)
        return self.db.execute(q, {"oid": offering_id}).fetchall()

    def get_enrolled_count(self, offering_id: int) -> int:
        q = text("SELECT COUNT(*) FROM enrollment WHERE offering_id = :oid AND status = 'ENROLLED'")
        return self.db.execute(q, {"oid": offering_id}).scalar() or 0

    # --- Bulk Enrollment ---
    def call_bulk_enrollment(self, payload: str, policy: str, dry_run: bool, acting_user: int) -> dict:
        raw_conn = self.db.connection().connection
        cursor = raw_conn.cursor()
        try:
            cursor.execute("CALL sp_bulk_enrollment(%s, %s, %s, %s)", (payload, policy, 1 if dry_run else 0, acting_user))
            summary = cursor.fetchone()
            if isinstance(summary, (list, tuple)):
                tot_p, tot_s, tot_f, tot_sk = summary[0], summary[1], summary[2], summary[3]
            elif isinstance(summary, dict):
                tot_p = summary.get("total_processed", 0)
                tot_s = summary.get("total_success", 0)
                tot_f = summary.get("total_failed", 0)
                tot_sk = summary.get("total_skipped", 0)
            else:
                tot_p, tot_s, tot_f, tot_sk = 0, 0, 0, 0

            row_results = []
            if cursor.nextset():
                rows = cursor.fetchall()
                for r in rows:
                    if isinstance(r, (list, tuple)):
                        row_results.append({
                            "student_id": r[0],
                            "offering_id": r[1],
                            "status": r[2],
                            "message": r[3]
                        })
                    elif isinstance(r, dict):
                        row_results.append(r)

            raw_conn.commit()

            batch_id = "DRY-RUN"
            if not dry_run:
                latest_q = text("SELECT batch_id FROM bulk_enrollment_batch WHERE run_by = :uid ORDER BY id DESC LIMIT 1")
                b_res = self.db.execute(latest_q, {"uid": acting_user}).fetchone()
                if b_res:
                    batch_id = b_res[0]

            return {
                "batch_id": batch_id,
                "total_processed": int(tot_p or 0),
                "total_success": int(tot_s or 0),
                "total_failed": int(tot_f or 0),
                "total_skipped": int(tot_sk or 0),
                "message": "Bulk enrollment completed" if not dry_run else "Validation dry-run completed",
                "row_results": row_results
            }
        except Exception as e:
            raw_conn.rollback()
            raise e
        finally:
            cursor.close()
