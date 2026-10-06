from sqlalchemy.orm import Session
from sqlalchemy import text
from app.modules.m4_finance.repository import M4Repository
from app.core.errors import APIError
from sqlalchemy.exc import DBAPIError

class M4Service:
    def __init__(self, db: Session):
        self.repo = M4Repository(db)

    def _get_student_id(self, user_id: int) -> int:
        res = self.repo.db.execute(
            text("SELECT student_id FROM user_account WHERE id = :uid"), 
            {"uid": user_id}
        ).fetchone()
        if not res or not res[0]:
            raise APIError("FORBIDDEN", "Not a student", 403)
        return res[0]

    # --- Fee Structure ---
    def get_fee_structures(self, skip: int, limit: int):
        return self.repo.get_fee_structures(skip, limit)

    def get_fee_structure(self, id: int):
        fs = self.repo.get_fee_structure_by_id(id)
        if not fs:
            raise APIError("NOT_FOUND", "Fee structure not found", 404)
        fs_dict = dict(fs._mapping)
        comps = self.repo.get_fee_components_for_structure(id)
        fs_dict["components"] = [dict(c._mapping) for c in comps]
        return fs_dict

    def create_fee_structure(self, data: dict, components: list):
        try:
            id = self.repo.create_fee_structure(data, components)
            return id
        except DBAPIError as e:
            raise APIError("BAD_REQUEST", f"Database error: {e.orig}", 400)

    def update_fee_structure(self, id: int, data: dict):
        self.get_fee_structure(id)
        self.repo.update_fee_structure(id, data)

    def delete_fee_structure(self, id: int):
        self.get_fee_structure(id)
        self.repo.delete_fee_structure(id)

    # --- Late Fee Rule ---
    def get_late_fee_rules(self, skip: int, limit: int):
        return self.repo.get_late_fee_rules(skip, limit)

    def get_late_fee_rule(self, id: int):
        r = self.repo.get_late_fee_rule_by_id(id)
        if not r:
            raise APIError("NOT_FOUND", "Late fee rule not found", 404)
        return dict(r._mapping)

    def create_late_fee_rule(self, data: dict):
        return self.repo.create_late_fee_rule(data)

    def update_late_fee_rule(self, id: int, data: dict):
        self.get_late_fee_rule(id)
        self.repo.update_late_fee_rule(id, data)

    def delete_late_fee_rule(self, id: int):
        self.get_late_fee_rule(id)
        self.repo.delete_late_fee_rule(id)

    # --- Fee Assignment ---
    def assign_fees(self, fee_structure_id: int, student_ids: list):
        self.get_fee_structure(fee_structure_id)
        try:
            self.repo.assign_fees(fee_structure_id, student_ids)
        except DBAPIError as e:
            if "Duplicate entry" in str(e.orig) or "1062" in str(e.orig):
                raise APIError("CONFLICT", "Fees already assigned for some students", 409)
            raise APIError("BAD_REQUEST", str(e.orig), 400)

    # --- Dues and Payments ---
    def get_my_dues(self, user_id: int):
        student_id = self._get_student_id(user_id)
        return self.repo.get_my_dues(student_id)

    def pay_fee(self, user_id: int, due_ids: list, amount: float, mode: str, reference_no: str):
        student_id = self._get_student_id(user_id)
        try:
            self.repo.pay_fee(student_id, due_ids, amount, mode, reference_no, user_id)
        except DBAPIError as e:
            orig = str(e.orig)
            if "45000" in orig:
                raise APIError("BAD_REQUEST", "Payment rule violated (e.g., overpayment)", 400)
            raise APIError("BAD_REQUEST", f"Payment failed: {orig}", 400)
            
        # Get the latest receipt for this payment. SP creates payment then receipt.
        # We can find the latest receipt for this student.
        receipt = self.repo.db.execute(text("""
            SELECT r.id, r.receipt_number, r.payment_id, r.generated_at
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            WHERE p.student_id = :sid
            ORDER BY r.generated_at DESC LIMIT 1
        """), {"sid": student_id}).fetchone()
        return dict(receipt._mapping) if receipt else None

    def get_receipt(self, receipt_id: int, user_id: int, has_admin: bool):
        receipt = self.repo.get_receipt(receipt_id)
        if not receipt:
            raise APIError("NOT_FOUND", "Receipt not found", 404)
            
        if not has_admin:
            student_id = self._get_student_id(user_id)
            payment = self.repo.db.execute(text("SELECT student_id FROM payment WHERE id = :pid"), {"pid": receipt.payment_id}).fetchone()
            if not payment or payment.student_id != student_id:
                raise APIError("FORBIDDEN", "Not your receipt", 403)
                
        return dict(receipt._mapping)

    def get_my_payments(self, user_id: int):
        student_id = self._get_student_id(user_id)
        return self.repo.get_my_payments(student_id)

    def get_all_payments(self, skip: int, limit: int):
        return self.repo.get_all_payments(skip, limit)

    def get_fee_defaulters(self, skip: int, limit: int):
        return self.repo.get_fee_defaulters(skip, limit)

    def get_fee_audit_logs(self, skip: int, limit: int):
        return self.repo.get_fee_audit_logs(skip, limit)
