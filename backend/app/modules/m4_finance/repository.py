from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

class M4Repository:
    def __init__(self, db: Session):
        self.db = db

    def get_fee_structures(self, skip: int, limit: int):
        return self.db.execute(text("""
            SELECT id, program_id, term_id, structure_name
            FROM fee_structure LIMIT :limit OFFSET :skip
        """), {"limit": limit, "skip": skip}).fetchall()

    def get_fee_structure_by_id(self, id: int):
        return self.db.execute(text("""
            SELECT id, program_id, term_id, structure_name
            FROM fee_structure WHERE id = :id
        """), {"id": id}).fetchone()

    def get_fee_components_for_structure(self, structure_id: int):
        return self.db.execute(text("""
            SELECT id, structure_id, component_name, amount, due_date
            FROM fee_component WHERE structure_id = :sid
        """), {"sid": structure_id}).fetchall()

    def create_fee_structure(self, data: dict, components: list):
        res = self.db.execute(text("""
            INSERT INTO fee_structure (program_id, term_id, structure_name)
            VALUES (:pid, :tid, :name)
        """), {"pid": data["program_id"], "tid": data["term_id"], "name": data["structure_name"]})
        structure_id = res.lastrowid
        
        for c in components:
            self.db.execute(text("""
                INSERT INTO fee_component (structure_id, component_name, amount, due_date)
                VALUES (:sid, :name, :amt, :dd)
            """), {"sid": structure_id, "name": c["component_name"], "amt": c["amount"], "dd": c["due_date"]})
            
        self.db.commit()
        return structure_id

    def update_fee_structure(self, id: int, data: dict):
        if not data: return
        set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
        data["id"] = id
        self.db.execute(text(f"UPDATE fee_structure SET {set_clause} WHERE id = :id"), data)
        self.db.commit()

    def delete_fee_structure(self, id: int):
        self.db.execute(text("DELETE FROM fee_structure WHERE id = :id"), {"id": id})
        self.db.commit()

    def get_late_fee_rules(self, skip: int, limit: int):
        return self.db.execute(text("""
            SELECT id, rule_type, penalty_amount, max_penalty
            FROM late_fee_rule LIMIT :limit OFFSET :skip
        """), {"limit": limit, "skip": skip}).fetchall()

    def get_late_fee_rule_by_id(self, id: int):
        return self.db.execute(text("""
            SELECT id, rule_type, penalty_amount, max_penalty
            FROM late_fee_rule WHERE id = :id
        """), {"id": id}).fetchone()

    def create_late_fee_rule(self, data: dict):
        res = self.db.execute(text("""
            INSERT INTO late_fee_rule (rule_type, penalty_amount, max_penalty)
            VALUES (:rt, :pa, :mp)
        """), {"rt": data["rule_type"], "pa": data["penalty_amount"], "mp": data.get("max_penalty")})
        self.db.commit()
        return res.lastrowid

    def update_late_fee_rule(self, id: int, data: dict):
        if not data: return
        set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
        data["id"] = id
        self.db.execute(text(f"UPDATE late_fee_rule SET {set_clause} WHERE id = :id"), data)
        self.db.commit()

    def delete_late_fee_rule(self, id: int):
        self.db.execute(text("DELETE FROM late_fee_rule WHERE id = :id"), {"id": id})
        self.db.commit()

    def assign_fees(self, fee_structure_id: int, student_ids: List[int]):
        for sid in student_ids:
            self.db.execute(text("""
                INSERT INTO student_fee (student_id, component_id, amount_due, amount_paid, status)
                SELECT :sid, id, amount, 0, 'PENDING'
                FROM fee_component WHERE structure_id = :fsid
            """), {"sid": sid, "fsid": fee_structure_id})
        self.db.commit()

    def get_my_dues(self, student_id: int):
        return self.db.execute(text("""
            SELECT sf.id, sf.student_id, sf.component_id, fc.component_name, fc.due_date, 
                   sf.amount_due, sf.amount_paid, sf.status,
                   fn_late_fee_penalty(
                       (SELECT COALESCE(MAX(id), 1) FROM late_fee_rule), 
                       fc.due_date, 
                       CURRENT_DATE
                   ) as computed_late_fee
            FROM student_fee sf
            JOIN fee_component fc ON sf.component_id = fc.id
            WHERE sf.student_id = :sid
        """), {"sid": student_id}).fetchall()

    def pay_fee(self, student_id: int, due_ids: List[int], amount: float, mode: str, reference_no: str, acting_user: int):
        import json
        self.db.execute(text("""
            CALL sp_fee_payment(:sid, :due_ids, :amt, :mode, :ref, :uid)
        """), {
            "sid": student_id,
            "due_ids": json.dumps(due_ids),
            "amt": amount,
            "mode": mode,
            "ref": reference_no,
            "uid": acting_user
        })
        self.db.commit()

    def get_receipt(self, receipt_id: int):
        return self.db.execute(text("""
            SELECT id, receipt_number, payment_id, generated_at
            FROM receipt WHERE id = :id
        """), {"id": receipt_id}).fetchone()

    def get_my_payments(self, student_id: int):
        return self.db.execute(text("""
            SELECT id, student_id, amount, payment_mode, reference_no, payment_date, status
            FROM payment WHERE student_id = :sid ORDER BY payment_date DESC
        """), {"sid": student_id}).fetchall()

    def get_all_payments(self, skip: int, limit: int):
        return self.db.execute(text("""
            SELECT id, student_id, amount, payment_mode, reference_no, payment_date, status
            FROM payment ORDER BY payment_date DESC LIMIT :limit OFFSET :skip
        """), {"limit": limit, "skip": skip}).fetchall()

    def get_fee_defaulters(self, skip: int, limit: int):
        try:
            return self.db.execute(text("""
                SELECT * FROM vw_fee_defaulters LIMIT :limit OFFSET :skip
            """), {"limit": limit, "skip": skip}).fetchall()
        except Exception:
            return []

    def get_fee_audit_logs(self, skip: int, limit: int):
        return self.db.execute(text("""
            SELECT id, entity_name, entity_id, old_value, new_value, changed_by, changed_at
            FROM fee_audit_log ORDER BY changed_at DESC LIMIT :limit OFFSET :skip
        """), {"limit": limit, "skip": skip}).fetchall()
