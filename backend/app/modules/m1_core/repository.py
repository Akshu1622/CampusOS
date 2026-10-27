from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any, Tuple
from app.db.helpers import call_function, call_procedure
from app.core.security import get_password_hash
from datetime import date


class M1Repository:
    def __init__(self, db: Session):
        self.db = db

    # ─── Auth ─────────────────────────────────────────────────────────────────

    def get_user_by_username(self, username: str):
        query = text("""
            SELECT id, username, password_hash, status, student_id, employee_id, last_login
            FROM user_account
            WHERE username = :username
        """)
        return self.db.execute(query, {"username": username}).fetchone()

    def get_user_by_id(self, user_id: int):
        query = text("""
            SELECT id, username, status, student_id, employee_id, last_login
            FROM user_account WHERE id = :uid
        """)
        return self.db.execute(query, {"uid": user_id}).fetchone()

    def update_last_login(self, user_id: int):
        self.db.execute(text("UPDATE user_account SET last_login = NOW() WHERE id = :uid"), {"uid": user_id})
        self.db.commit()

    def set_user_locked(self, user_id: int):
        """Lock the account after repeated failures."""
        self.db.execute(text("UPDATE user_account SET status = 'LOCKED' WHERE id = :uid"), {"uid": user_id})
        self.db.commit()

    def get_user_roles_and_perms(self, user_id: int) -> Tuple[List[str], List[str]]:
        role_query = text("""
            SELECT r.name
            FROM role_assignment ra
            JOIN role r ON ra.role_id = r.id
            WHERE ra.user_id = :user_id
        """)
        roles = [row.name for row in self.db.execute(role_query, {"user_id": user_id}).fetchall()]

        perm_query = text("""
            SELECT p.name
            FROM admin_permission_set_assignment apsa
            JOIN permission_set p ON apsa.permission_set_id = p.id
            WHERE apsa.user_id = :user_id
        """)
        perms = [row.name for row in self.db.execute(perm_query, {"user_id": user_id}).fetchall()]
        return roles, perms

    def create_refresh_token(self, user_id: int, token_hash: str, expires_at: str):
        query = text("""
            INSERT INTO refresh_token (user_id, token_hash, expires_at)
            VALUES (:user_id, :token_hash, :expires_at)
        """)
        self.db.execute(query, {"user_id": user_id, "token_hash": token_hash, "expires_at": expires_at})
        self.db.commit()

    def revoke_refresh_token(self, token_hash: str):
        self.db.execute(text("UPDATE refresh_token SET is_revoked = 1 WHERE token_hash = :token_hash"), {"token_hash": token_hash})
        self.db.commit()

    def get_session_by_token(self, token_hash: str):
        query = text("SELECT user_id, expires_at, is_revoked FROM refresh_token WHERE token_hash = :token_hash")
        return self.db.execute(query, {"token_hash": token_hash}).fetchone()

    def record_login_attempt(self, username: str, ip: str, success: bool):
        query = text("INSERT INTO login_attempt (username, success) VALUES (:username, :success)")
        self.db.execute(query, {"username": username, "success": int(success)})
        self.db.commit()

    def get_recent_failed_logins(self, username: str, window_minutes: int) -> int:
        query = text("""
            SELECT COUNT(*)
            FROM login_attempt
            WHERE username = :username
              AND success = 0
              AND attempt_time >= DATE_SUB(NOW(), INTERVAL :mins MINUTE)
        """)
        res = self.db.execute(query, {"username": username, "mins": window_minutes}).scalar()
        return res or 0

    def log_audit(self, user_id: Optional[int], action: str, table: str, record_id: int, details: str, ip: str):
        """Write security/business events to general_audit_log."""
        import json
        payload = json.dumps({"details": details, "ip": ip})
        query = text("""
            INSERT INTO general_audit_log (actor_user_id, action, entity_name, entity_id, after_state)
            VALUES (:uid, :act, :tbl, :rec, :det)
        """)
        self.db.execute(query, {"uid": user_id, "act": action, "tbl": table, "rec": str(record_id), "det": payload})
        self.db.commit()

    # ─── User Management ──────────────────────────────────────────────────────

    def get_users(self, skip: int, limit: int, search: Optional[str] = None,
                  role: Optional[str] = None, status: Optional[str] = None) -> Tuple[list, int]:
        """Paginated user list with optional search and filters."""
        conditions = ["1=1"]
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if search:
            conditions.append("(ua.username LIKE :search OR CONCAT(COALESCE(s.first_name,''), ' ', COALESCE(s.last_name,'')) LIKE :search OR CONCAT(COALESCE(e.first_name,''), ' ', COALESCE(e.last_name,'')) LIKE :search)")
            params["search"] = f"%{search}%"
        if status:
            conditions.append("ua.status = :status")
            params["status"] = status
        if role:
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM role_assignment ra2
                    JOIN role r2 ON ra2.role_id = r2.id
                    WHERE ra2.user_id = ua.id AND r2.name = :role
                )
            """)
            params["role"] = role

        where = " AND ".join(conditions)
        count_q = text(f"""
            SELECT COUNT(DISTINCT ua.id)
            FROM user_account ua
            LEFT JOIN student s ON ua.student_id = s.id
            LEFT JOIN employee e ON ua.employee_id = e.id
            WHERE {where}
        """)
        total = self.db.execute(count_q, params).scalar() or 0

        q = text(f"""
            SELECT
                ua.id, ua.username, ua.status, ua.last_login,
                ua.student_id, ua.employee_id,
                COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(e.first_name, ' ', e.last_name)) AS full_name,
                COALESCE(s.email, CONCAT(LOWER(e.first_name), '.', LOWER(e.last_name), '@campus.edu')) AS email,
                CASE WHEN ua.student_id IS NOT NULL THEN 'student'
                     WHEN ua.employee_id IS NOT NULL THEN 'employee'
                     ELSE NULL END AS linked_type
            FROM user_account ua
            LEFT JOIN student s ON ua.student_id = s.id
            LEFT JOIN employee e ON ua.employee_id = e.id
            WHERE {where}
            ORDER BY ua.id
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    def get_user_detail(self, user_id: int):
        """Fetch a user with linked student/employee profile detail."""
        q = text("""
            SELECT
                ua.id, ua.username, ua.status, ua.last_login,
                ua.student_id, ua.employee_id,
                COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(e.first_name, ' ', e.last_name)) AS full_name,
                COALESCE(s.email, CONCAT(LOWER(e.first_name), '.', LOWER(e.last_name), '@campus.edu')) AS email,
                s.phone AS phone,
                CASE WHEN ua.student_id IS NOT NULL THEN 'student'
                     WHEN ua.employee_id IS NOT NULL THEN 'employee'
                     ELSE NULL END AS linked_type,
                s.global_student_id, e.employee_id AS employee_code,
                p.name AS program_name,
                d.name AS department_name
            FROM user_account ua
            LEFT JOIN student s ON ua.student_id = s.id
            LEFT JOIN employee e ON ua.employee_id = e.id
            LEFT JOIN program p ON s.program_id = p.id
            LEFT JOIN department d ON (p.department_id = d.id OR e.department_id = d.id)
            WHERE ua.id = :uid
        """)
        return self.db.execute(q, {"uid": user_id}).fetchone()

    def create_user(self, username: str, password_hash: str, student_id: Optional[int], employee_id: Optional[int]) -> int:
        query = text("""
            INSERT INTO user_account (username, password_hash, student_id, employee_id, status)
            VALUES (:un, :pw, :sid, :eid, 'ACTIVE')
        """)
        res = self.db.execute(query, {"un": username, "pw": password_hash, "sid": student_id, "eid": employee_id})
        self.db.commit()
        return res.lastrowid

    def update_password(self, user_id: int, new_hash: str):
        self.db.execute(text("UPDATE user_account SET password_hash = :hash WHERE id = :uid"), {"hash": new_hash, "uid": user_id})
        self.db.commit()

    def update_user_status(self, user_id: int, status: str):
        self.db.execute(text("UPDATE user_account SET status = :st WHERE id = :uid"), {"st": status, "uid": user_id})
        self.db.commit()

    def assign_user_role(self, user_id: int, role_name: str):
        role_id = self.db.execute(text("SELECT id FROM role WHERE name = :r"), {"r": role_name}).scalar()
        if role_id:
            self.db.execute(text("INSERT IGNORE INTO role_assignment (user_id, role_id) VALUES (:uid, :rid)"), {"uid": user_id, "rid": role_id})
            self.db.commit()

    def clear_user_roles(self, user_id: int):
        self.db.execute(text("DELETE FROM role_assignment WHERE user_id = :uid"), {"uid": user_id})
        self.db.commit()

    def assign_user_permission(self, user_id: int, perm_name: str):
        perm_id = self.db.execute(text("SELECT id FROM permission_set WHERE name = :n"), {"n": perm_name}).scalar()
        if perm_id:
            self.db.execute(text("INSERT IGNORE INTO admin_permission_set_assignment (user_id, permission_set_id) VALUES (:uid, :pid)"), {"uid": user_id, "pid": perm_id})
            self.db.commit()

    def clear_user_permissions(self, user_id: int):
        self.db.execute(text("DELETE FROM admin_permission_set_assignment WHERE user_id = :uid"), {"uid": user_id})
        self.db.commit()

    # ─── Roles & Permissions ──────────────────────────────────────────────────

    def get_roles(self) -> list:
        query = text("""
            SELECT r.id, r.name AS role_name,
                   (SELECT COUNT(DISTINCT ra.user_id) FROM role_assignment ra WHERE ra.role_id = r.id) AS user_count
            FROM role r
            ORDER BY r.id
        """)
        roles = self.db.execute(query).fetchall()
        result = []
        for r in roles:
            perm_q = text("""
                SELECT p.name FROM permission_set p
                WHERE p.id IN (
                    SELECT permission_set_id FROM admin_permission_set_assignment apsa
                    JOIN role_assignment ra ON ra.user_id = apsa.user_id
                    WHERE ra.role_id = :rid
                    GROUP BY apsa.permission_set_id
                )
            """)
            # For roles, permission sets are user-level, not role-level; return empty list per role
            result.append({
                "id": r.id,
                "role_name": r.role_name,
                "description": None,
                "permission_sets": [],
                "user_count": r.user_count,
            })
        return result

    def get_permissions(self) -> list:
        query = text("""
            SELECT p.id, p.name,
                   (SELECT COUNT(*) FROM admin_permission_set_assignment apsa WHERE apsa.permission_set_id = p.id) AS user_count
            FROM permission_set p
            ORDER BY p.id
        """)
        return self.db.execute(query).fetchall()

    # ─── Departments ──────────────────────────────────────────────────────────

    def get_departments(self, skip: int = 0, limit: int = 1000, search: Optional[str] = None):
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        cond = "1=1"
        if search:
            cond = "(d.name LIKE :search OR d.code LIKE :search)"
            params["search"] = f"%{search}%"

        count_q = text(f"SELECT COUNT(*) FROM department d WHERE {cond}")
        total = self.db.execute(count_q, params).scalar() or 0

        q = text(f"""
            SELECT
                d.id, d.code, d.name,
                d.head_employee_id,
                CASE WHEN d.head_employee_id IS NOT NULL
                     THEN CONCAT(e.first_name, ' ', e.last_name)
                     ELSE 'Not assigned' END AS head,
                (SELECT COUNT(*) FROM program p WHERE p.department_id = d.id) AS programs_count,
                (SELECT COUNT(*) FROM course c WHERE c.department_id = d.id) AS courses_count,
                CASE
                    WHEN (SELECT COUNT(*) FROM program p WHERE p.department_id = d.id) = 0
                     AND (SELECT COUNT(*) FROM course c WHERE c.department_id = d.id) = 0
                    THEN 'INACTIVE'
                    ELSE 'ACTIVE'
                END AS status
            FROM department d
            LEFT JOIN employee e ON d.head_employee_id = e.id
            WHERE {cond}
            ORDER BY d.code
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    def get_department_by_id(self, dept_id: int):
        q = text("""
            SELECT d.id, d.code, d.name, d.head_employee_id,
                   CONCAT(e.first_name, ' ', e.last_name) AS head
            FROM department d
            LEFT JOIN employee e ON d.head_employee_id = e.id
            WHERE d.id = :id
        """)
        return self.db.execute(q, {"id": dept_id}).fetchone()

    def create_department(self, code: str, name: str, head_id: Optional[int]):
        q = text("INSERT INTO department (code, name, head_employee_id) VALUES (:c, :n, :h)")
        res = self.db.execute(q, {"c": code, "n": name, "h": head_id})
        self.db.commit()
        return res.lastrowid

    def update_department(self, dept_id: int, name: Optional[str], head_id: Optional[int], clear_head: bool = False):
        parts = []
        params: Dict[str, Any] = {"id": dept_id}
        if name is not None:
            parts.append("name = :name")
            params["name"] = name
        if clear_head:
            parts.append("head_employee_id = NULL")
        elif head_id is not None:
            parts.append("head_employee_id = :head_id")
            params["head_id"] = head_id
        if not parts:
            return
        self.db.execute(text(f"UPDATE department SET {', '.join(parts)} WHERE id = :id"), params)
        self.db.commit()

    # ─── Programs ─────────────────────────────────────────────────────────────

    def get_programs(self, skip: int = 0, limit: int = 1000, search: Optional[str] = None,
                     department_id: Optional[int] = None):
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        conditions = ["1=1"]
        if search:
            conditions.append("(p.name LIKE :search OR p.code LIKE :search)")
            params["search"] = f"%{search}%"
        if department_id:
            conditions.append("p.department_id = :dept_id")
            params["dept_id"] = department_id
        where = " AND ".join(conditions)

        total = self.db.execute(text(f"SELECT COUNT(*) FROM program p WHERE {where}"), params).scalar() or 0
        q = text(f"""
            SELECT p.id, p.department_id, d.name AS department_name,
                   p.code, p.name, p.duration_years, p.credits_required,
                   p.credits_required AS total_credits,
                   (SELECT COUNT(*) FROM student s WHERE s.program_id = p.id AND s.status = 'ACTIVE') AS students_count
            FROM program p
            JOIN department d ON p.department_id = d.id
            WHERE {where}
            ORDER BY p.code
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    def get_program_by_id(self, program_id: int):
        return self.db.execute(text("""
            SELECT p.id, p.department_id, d.name AS department_name,
                   p.code, p.name, p.duration_years, p.credits_required, p.credits_required AS total_credits
            FROM program p JOIN department d ON p.department_id = d.id
            WHERE p.id = :id
        """), {"id": program_id}).fetchone()

    def create_program(self, code: str, name: str, dept_id: int, duration: int, credits: int):
        q = text("INSERT INTO program (code, name, department_id, duration_years, credits_required) VALUES (:c, :n, :d, :dy, :cr)")
        res = self.db.execute(q, {"c": code, "n": name, "d": dept_id, "dy": duration, "cr": credits})
        self.db.commit()
        return res.lastrowid

    def update_program(self, program_id: int, name: Optional[str], department_id: Optional[int],
                       duration_years: Optional[int], total_credits: Optional[int]):
        parts = []
        params: Dict[str, Any] = {"id": program_id}
        if name is not None:
            parts.append("name = :name"); params["name"] = name
        if department_id is not None:
            parts.append("department_id = :dept_id"); params["dept_id"] = department_id
        if duration_years is not None:
            parts.append("duration_years = :dur"); params["dur"] = duration_years
        if total_credits is not None:
            parts.append("credits_required = :cr"); params["cr"] = total_credits
        if not parts:
            return
        self.db.execute(text(f"UPDATE program SET {', '.join(parts)} WHERE id = :id"), params)
        self.db.commit()

    # ─── Terms ────────────────────────────────────────────────────────────────

    def get_terms(self):
        return self.db.execute(text("""
            SELECT id, term_year AS year, term_label AS label, start_date, end_date, is_current
            FROM academic_term ORDER BY start_date DESC
        """)).fetchall()

    def get_term_by_id(self, term_id: int):
        return self.db.execute(text("""
            SELECT id, term_year AS year, term_label AS label, start_date, end_date, is_current
            FROM academic_term WHERE id = :id
        """), {"id": term_id}).fetchone()

    def create_term(self, year: int, label: str, start_date: date, end_date: date, is_current: bool):
        identifier = f"{year}-{label}"
        if is_current:
            self.db.execute(text("UPDATE academic_term SET is_current = 0"))
        q = text("INSERT INTO academic_term (term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES (:id, :y, :l, :sd, :ed, :ic)")
        res = self.db.execute(q, {"id": identifier, "y": year, "l": label, "sd": start_date, "ed": end_date, "ic": 1 if is_current else 0})
        self.db.commit()
        return res.lastrowid

    def update_term(self, term_id: int, year: Optional[int], label: Optional[str],
                    start_date: Optional[date], end_date: Optional[date], is_current: Optional[bool]):
        parts = []
        params: Dict[str, Any] = {"id": term_id}
        if year is not None:
            parts.append("term_year = :year"); params["year"] = year
        if label is not None:
            parts.append("term_label = :label"); params["label"] = label
        if start_date is not None:
            parts.append("start_date = :sd"); params["sd"] = start_date
        if end_date is not None:
            parts.append("end_date = :ed"); params["ed"] = end_date
        if is_current is not None:
            if is_current:
                self.db.execute(text("UPDATE academic_term SET is_current = 0"))
            parts.append("is_current = :ic"); params["ic"] = 1 if is_current else 0
        # Recompute identifier if year or label changed
        if year is not None or label is not None:
            # Fetch current values to compose identifier
            cur = self.get_term_by_id(term_id)
            new_year = year if year is not None else cur.year
            new_label = label if label is not None else cur.label
            new_ident = f"{new_year}-{new_label}"
            parts.append("term_identifier = :ident"); params["ident"] = new_ident
        if not parts:
            return
        self.db.execute(text(f"UPDATE academic_term SET {', '.join(parts)} WHERE id = :id"), params)
        self.db.commit()

    # ─── Students ─────────────────────────────────────────────────────────────

    def generate_student_id(self, admission_year: int) -> str:
        return call_function(self.db, "fn_generate_student_id", [str(admission_year)])

    def get_students(self, skip: int, limit: int, search: Optional[str] = None,
                     program_id: Optional[int] = None, batch_year: Optional[int] = None,
                     status: Optional[str] = None) -> Tuple[list, int]:
        conditions = ["1=1"]
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if search:
            conditions.append("(s.first_name LIKE :search OR s.last_name LIKE :search OR s.email LIKE :search OR s.global_student_id LIKE :search)")
            params["search"] = f"%{search}%"
        if program_id:
            conditions.append("s.program_id = :prog_id")
            params["prog_id"] = program_id
        if batch_year:
            conditions.append("s.batch_year = :batch")
            params["batch"] = batch_year
        if status:
            conditions.append("s.status = :status")
            params["status"] = status
        where = " AND ".join(conditions)

        total = self.db.execute(text(f"SELECT COUNT(*) FROM student s WHERE {where}"), params).scalar() or 0
        q = text(f"""
            SELECT s.id, s.global_student_id, s.first_name, s.last_name,
                   s.email, s.phone, s.batch_year, s.program_id, s.status,
                   s.caste_category,
                   p.name AS program_name,
                   d.name AS department_name
            FROM student s
            JOIN program p ON s.program_id = p.id
            JOIN department d ON p.department_id = d.id
            WHERE {where}
            ORDER BY s.id
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(q, params).fetchall()
        return rows, total

    def get_student_by_id(self, student_id: int):
        """Full student detail including linked user account."""
        q = text("""
            SELECT s.id, s.global_student_id, s.first_name, s.last_name,
                   s.email, s.phone, s.batch_year, s.program_id, s.status,
                   s.caste_category,
                   p.name AS program_name,
                   d.name AS department_name,
                   ua.id AS user_id,
                   CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_user_account
            FROM student s
            JOIN program p ON s.program_id = p.id
            JOIN department d ON p.department_id = d.id
            LEFT JOIN user_account ua ON ua.student_id = s.id
            WHERE s.id = :id
        """)
        return self.db.execute(q, {"id": student_id}).fetchone()

    def get_student_by_global_id(self, global_id: str):
        return self.db.execute(text("SELECT id FROM student WHERE global_student_id = :gid"), {"gid": global_id}).fetchone()

    def create_student(self, global_id: str, data: dict) -> int:
        q = text("""
            INSERT INTO student (global_student_id, first_name, last_name, email, phone, batch_year, program_id, caste_category, status)
            VALUES (:gid, :fn, :ln, :em, :ph, :ay, :pid, :caste, 'ACTIVE')
        """)
        res = self.db.execute(q, {
            "gid": global_id, "fn": data['first_name'], "ln": data['last_name'],
            "em": data['email'], "ph": data.get('phone'), "ay": data['batch_year'],
            "pid": data['program_id'], "caste": data.get('caste_category', 'GENERAL')
        })
        self.db.commit()
        return res.lastrowid

    def update_student(self, student_id: int, data: dict):
        parts = []
        params: Dict[str, Any] = {"id": student_id}
        field_map = {
            "first_name": "first_name", "last_name": "last_name",
            "email": "email", "phone": "phone",
            "batch_year": "batch_year", "program_id": "program_id",
            "caste_category": "caste_category", "status": "status"
        }
        for key, col in field_map.items():
            if key in data and data[key] is not None:
                parts.append(f"{col} = :{key}")
                params[key] = data[key]
        if not parts:
            return
        self.db.execute(text(f"UPDATE student SET {', '.join(parts)} WHERE id = :id"), params)
        self.db.commit()

    def update_student_contact(self, student_id: int, email: Optional[str], phone: Optional[str]):
        """Update contact-only fields for /me profile edit."""
        parts = []
        params: Dict[str, Any] = {"id": student_id}
        if email is not None:
            parts.append("email = :email"); params["email"] = email
        if phone is not None:
            parts.append("phone = :phone"); params["phone"] = phone
        if not parts:
            return
        self.db.execute(text(f"UPDATE student SET {', '.join(parts)} WHERE id = :id"), params)
        self.db.commit()

    def update_employee_contact(self, employee_id: int, email: Optional[str], phone: Optional[str]):
        """Update contact-only fields for faculty /me profile edit."""
        # Employee master schema (05_hr.sql) does not store email/phone
        return
