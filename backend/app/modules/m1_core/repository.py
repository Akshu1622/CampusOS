from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from app.db.helpers import call_function, call_procedure
from app.core.security import get_password_hash
from datetime import date
class M1Repository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_user_by_username(self, username: str):
        query = text("""
            SELECT id, username, password_hash, status, student_id, employee_id 
            FROM user_account 
            WHERE username = :username
        """)
        return self.db.execute(query, {"username": username}).fetchone()
        
    def get_user_roles_and_perms(self, user_id: int):
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
        query = text("UPDATE refresh_token SET is_revoked = 1 WHERE token_hash = :token_hash")
        self.db.execute(query, {"token_hash": token_hash})
        self.db.commit()
        
    def get_session_by_token(self, token_hash: str):
        query = text("SELECT user_id, expires_at, is_revoked FROM refresh_token WHERE token_hash = :token_hash")
        return self.db.execute(query, {"token_hash": token_hash}).fetchone()
        
    def log_audit(self, user_id: Optional[int], action: str, table: str, record_id: int, details: str, ip: str):
        # We can insert into audit_log manually, though triggers handle most data changes.
        # This is for security events explicitly requested (login failure, password reset).
        query = text("""
            INSERT INTO general_audit_log (actor_user_id, action, entity_name, entity_id, after_state)
            VALUES (:uid, :act, :tbl, :rec, :det)
        """)
        self.db.execute(query, {"uid": user_id, "act": action, "tbl": table, "rec": str(record_id), "det": f'{{"details": "{details}", "ip": "{ip}"}}'})
        self.db.commit()

    def record_login_attempt(self, username: str, ip: str, success: bool):
        query = text("""
            INSERT INTO login_attempt (username, success)
            VALUES (:username, :success)
        """)
        self.db.execute(query, {"username": username, "success": int(success)})
        self.db.commit()
        
    def get_recent_failed_logins(self, username: str, window_minutes: int):
        query = text("""
            SELECT COUNT(*) 
            FROM login_attempt 
            WHERE username = :username 
              AND success = 0 
              AND attempt_time >= DATE_SUB(NOW(), INTERVAL :mins MINUTE)
        """)
        res = self.db.execute(query, {"username": username, "mins": window_minutes}).scalar()
        return res or 0
        
    def update_password(self, user_id: int, new_hash: str):
        self.db.execute(text("UPDATE user_account SET password_hash = :hash WHERE id = :uid"), {"hash": new_hash, "uid": user_id})
        self.db.commit()

    def get_user_by_id(self, user_id: int):
        query = text("SELECT id, username, status, student_id, employee_id FROM user_account WHERE id = :uid")
        return self.db.execute(query, {"uid": user_id}).fetchone()
        
    def get_users(self, skip: int, limit: int):
        count_q = text("SELECT COUNT(*) FROM user_account")
        total = self.db.execute(count_q).scalar()
        
        q = text("SELECT id, username, status, student_id, employee_id FROM user_account ORDER BY id LIMIT :limit OFFSET :skip")
        rows = self.db.execute(q, {"limit": limit, "skip": skip}).fetchall()
        return rows, total
        
    def create_user(self, username: str, password_hash: str, student_id: int, employee_id: int):
        query = text("""
            INSERT INTO user_account (username, password_hash, student_id, employee_id, status)
            VALUES (:un, :pw, :sid, :eid, 'ACTIVE')
        """)
        res = self.db.execute(query, {"un": username, "pw": password_hash, "sid": student_id, "eid": employee_id})
        self.db.commit()
        return res.lastrowid
        
    def assign_user_role(self, user_id: int, role_name: str):
        role_q = text("SELECT id FROM role WHERE name = :r")
        role_id = self.db.execute(role_q, {"r": role_name}).scalar()
        if role_id:
            self.db.execute(text("INSERT IGNORE INTO role_assignment (user_id, role_id) VALUES (:uid, :rid)"), {"uid": user_id, "rid": role_id})
            self.db.commit()
            
    def clear_user_roles(self, user_id: int):
        self.db.execute(text("DELETE FROM role_assignment WHERE user_id = :uid"), {"uid": user_id})
        self.db.commit()
        
    def update_user_status(self, user_id: int, status: str):
        self.db.execute(text("UPDATE user_account SET status = :st WHERE id = :uid"), {"st": status, "uid": user_id})
        self.db.commit()

    def get_roles(self):
        query = text("SELECT id, name AS role_name FROM role ORDER BY id")
        roles = self.db.execute(query).fetchall()
        result = []
        for r in roles:
            result.append({
                "id": r.id,
                "role_name": r.role_name,
                "description": None,
                "permission_sets": []
            })
        return result

    def get_departments(self):
        return self.db.execute(text("SELECT id, code, name, CAST(head_employee_id AS CHAR) as head FROM department ORDER BY code")).fetchall()

    def create_department(self, code: str, name: str, head_id: Optional[int]):
        q = text("INSERT INTO department (code, name, head_employee_id) VALUES (:c, :n, :h)")
        self.db.execute(q, {"c": code, "n": name, "h": head_id})
        self.db.commit()

    def get_programs(self):
        return self.db.execute(text("SELECT id, department_id, code, name, duration_years, credits_required AS total_credits FROM program ORDER BY code")).fetchall()

    def create_program(self, code: str, name: str, dept_id: int, duration: int, credits: int):
        q = text("INSERT INTO program (code, name, department_id, duration_years, credits_required) VALUES (:c, :n, :d, :dy, :cr)")
        self.db.execute(q, {"c": code, "n": name, "d": dept_id, "dy": duration, "cr": credits})
        self.db.commit()

    def get_terms(self):
        return self.db.execute(text("SELECT id, term_year AS year, term_label AS label, start_date, end_date, is_current FROM academic_term ORDER BY start_date DESC")).fetchall()

    def create_term(self, year: int, label: str, start_date: date, end_date: date, is_current: bool):
        identifier = f"{year}-{label}"
        if is_current:
            self.db.execute(text("UPDATE academic_term SET is_current = 0"))
        
        q = text("INSERT INTO academic_term (term_identifier, term_year, term_label, start_date, end_date, is_current) VALUES (:id, :y, :l, :sd, :ed, :ic)")
        self.db.execute(q, {"id": identifier, "y": year, "l": label, "sd": start_date, "ed": end_date, "ic": 1 if is_current else 0})
        self.db.commit()

    def generate_student_id(self, admission_year: int) -> str:
        # Call the DB function
        return call_function(self.db, "fn_generate_student_id", [str(admission_year)])
        
    def create_student(self, global_id: str, data: dict):
        q = text("""
            INSERT INTO student (global_student_id, first_name, last_name, email, phone, batch_year, program_id, status)
            VALUES (:gid, :fn, :ln, :em, :ph, :ay, :pid, 'ACTIVE')
        """)
        res = self.db.execute(q, {
            "gid": global_id,
            "fn": data['first_name'],
            "ln": data['last_name'],
            "em": data['email'],
            "ph": data['phone'],
            "ay": data['batch_year'],
            "pid": data['program_id']
        })
        self.db.commit()
        return res.lastrowid
        
    def get_students(self, skip: int, limit: int):
        count_q = text("SELECT COUNT(*) FROM student")
        total = self.db.execute(count_q).scalar()
        
        q = text("SELECT id, global_student_id, first_name, last_name, email, phone, batch_year, program_id, status FROM student ORDER BY id LIMIT :limit OFFSET :skip")
        rows = self.db.execute(q, {"limit": limit, "skip": skip}).fetchall()
        return rows, total
