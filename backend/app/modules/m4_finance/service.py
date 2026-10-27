from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional, Tuple
from datetime import date, datetime
from app.modules.m4_finance.repository import M4Repository
from app.core.errors import APIError
from app.db.helpers import handle_db_error
from sqlalchemy.exc import DBAPIError


class M4Service:
    def __init__(self, db: Session):
        self.repo = M4Repository(db)

    def _get_student_id_for_user(self, user_id: int) -> int:
        res = self.repo.db.execute(
            text("SELECT student_id FROM user_account WHERE id = :uid"), 
            {"uid": user_id}
        ).fetchone()
        if not res or not res[0]:
            raise APIError("FORBIDDEN", "Current user is not linked to a student account", 403)
        return res[0]

    def _resolve_target_student(
        self,
        current_user_id: int,
        requested_student_id: Optional[int],
        has_admin: bool
    ) -> int:
        if requested_student_id is not None:
            if not has_admin:
                raise APIError("FORBIDDEN", "Only finance administrators can record payments for other students", 403)
            exists = self.repo.db.execute(
                text("SELECT id FROM student WHERE id = :sid"),
                {"sid": requested_student_id}
            ).fetchone()
            if not exists:
                raise APIError("NOT_FOUND", f"Student with ID {requested_student_id} not found", 404)
            return requested_student_id

        return self._get_student_id_for_user(current_user_id)

    # ─── Fee Structures (F-01) ────────────────────────────────────────────────

    def get_fee_structures(
        self,
        skip: int = 0,
        limit: int = 20,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_fee_structures(skip, limit, program_id, term_id, search)

    def get_fee_structure(self, structure_id: int) -> Dict[str, Any]:
        fs = self.repo.get_fee_structure_by_id(structure_id)
        if not fs:
            raise APIError("NOT_FOUND", "Fee structure not found", 404)
        comps = self.repo.get_fee_components_for_structure(structure_id)
        fs["components"] = comps
        return fs

    def create_fee_structure(
        self,
        data: dict,
        components: list,
        acting_user: Optional[int] = None
    ) -> Dict[str, Any]:
        prog = self.repo.db.execute(text("SELECT id FROM program WHERE id = :pid"), {"pid": data["program_id"]}).fetchone()
        if not prog:
            raise APIError("NOT_FOUND", f"Program {data['program_id']} not found", 404)
        term = self.repo.db.execute(text("SELECT id FROM academic_term WHERE id = :tid"), {"tid": data["term_id"]}).fetchone()
        if not term:
            raise APIError("NOT_FOUND", f"Academic term {data['term_id']} not found", 404)

        try:
            new_id = self.repo.create_fee_structure(data, components, acting_user)
            return self.get_fee_structure(new_id)
        except DBAPIError as e:
            handle_db_error(e)

    def update_fee_structure(
        self,
        structure_id: int,
        data: dict,
        components: Optional[list] = None,
        acting_user: Optional[int] = None
    ) -> Dict[str, Any]:
        self.get_fee_structure(structure_id)
        try:
            self.repo.update_fee_structure(structure_id, data, components, acting_user)
            return self.get_fee_structure(structure_id)
        except DBAPIError as e:
            handle_db_error(e)

    def delete_fee_structure(self, structure_id: int, acting_user: Optional[int] = None):
        self.get_fee_structure(structure_id)
        has_dues = self.repo.db.execute(text("""
            SELECT 1 FROM student_fee sf
            JOIN fee_component fc ON sf.component_id = fc.id
            WHERE fc.structure_id = :sid LIMIT 1
        """), {"sid": structure_id}).fetchone()
        if has_dues:
            raise APIError("CONFLICT", "Cannot delete fee structure that already has student invoices assigned", 409)

        try:
            self.repo.delete_fee_structure(structure_id, acting_user)
        except DBAPIError as e:
            handle_db_error(e)

    # ─── Fee Components (F-01) ────────────────────────────────────────────────

    def add_fee_component(self, structure_id: int, comp_data: dict, acting_user: Optional[int] = None) -> Dict[str, Any]:
        self.get_fee_structure(structure_id)
        try:
            cid = self.repo.add_fee_component(structure_id, comp_data, acting_user)
            comp = self.repo.db.execute(text("""
                SELECT id, structure_id, component_name, amount, due_date,
                       COALESCE(caste_category, 'ALL') AS caste_category
                FROM fee_component WHERE id = :id
            """), {"id": cid}).fetchone()
            return dict(comp._mapping)
        except DBAPIError as e:
            handle_db_error(e)

    def update_fee_component(self, component_id: int, comp_data: dict, acting_user: Optional[int] = None) -> Dict[str, Any]:
        comp = self.repo.db.execute(text("SELECT id FROM fee_component WHERE id = :id"), {"id": component_id}).fetchone()
        if not comp:
            raise APIError("NOT_FOUND", "Fee component not found", 404)
        try:
            self.repo.update_fee_component(component_id, comp_data, acting_user)
            updated = self.repo.db.execute(text("""
                SELECT id, structure_id, component_name, amount, due_date,
                       COALESCE(caste_category, 'ALL') AS caste_category
                FROM fee_component WHERE id = :id
            """), {"id": component_id}).fetchone()
            return dict(updated._mapping)
        except DBAPIError as e:
            handle_db_error(e)

    def delete_fee_component(self, component_id: int, acting_user: Optional[int] = None):
        comp = self.repo.db.execute(text("SELECT id FROM fee_component WHERE id = :id"), {"id": component_id}).fetchone()
        if not comp:
            raise APIError("NOT_FOUND", "Fee component not found", 404)
        has_dues = self.repo.db.execute(text("SELECT 1 FROM student_fee WHERE component_id = :cid LIMIT 1"), {"cid": component_id}).fetchone()
        if has_dues:
            raise APIError("CONFLICT", "Cannot delete fee component with active student dues", 409)
        try:
            self.repo.delete_fee_component(component_id, acting_user)
        except DBAPIError as e:
            handle_db_error(e)

    # ─── Late Fee Rules & Calculator (F-03) ───────────────────────────────────

    def get_late_fee_rules(self, skip: int = 0, limit: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_late_fee_rules(skip, limit)

    def get_late_fee_rule(self, rule_id: int) -> Dict[str, Any]:
        r = self.repo.get_late_fee_rule_by_id(rule_id)
        if not r:
            raise APIError("NOT_FOUND", "Late fee rule not found", 404)
        return r

    def create_late_fee_rule(self, data: dict) -> Dict[str, Any]:
        try:
            new_id = self.repo.create_late_fee_rule(data)
            return self.get_late_fee_rule(new_id)
        except DBAPIError as e:
            handle_db_error(e)

    def update_late_fee_rule(self, rule_id: int, data: dict) -> Dict[str, Any]:
        self.get_late_fee_rule(rule_id)
        try:
            self.repo.update_late_fee_rule(rule_id, data)
            return self.get_late_fee_rule(rule_id)
        except DBAPIError as e:
            handle_db_error(e)

    def delete_late_fee_rule(self, rule_id: int):
        self.get_late_fee_rule(rule_id)
        try:
            self.repo.delete_late_fee_rule(rule_id)
        except DBAPIError as e:
            handle_db_error(e)

    def calculate_late_fee_simulation(
        self,
        rule_id: Optional[int],
        due_date: date,
        as_of_date: Optional[date] = None,
        principal_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        as_of = as_of_date or date.today()
        if not rule_id:
            rule_row = self.repo.db.execute(text("SELECT id FROM late_fee_rule ORDER BY id ASC LIMIT 1")).fetchone()
            if not rule_row:
                raise APIError("NOT_FOUND", "No late fee rule configured in the system", 404)
            rule_id = rule_row[0]

        rule = self.get_late_fee_rule(rule_id)
        penalty = self.repo.calculate_late_fee(rule_id, due_date, as_of)

        days_late = max(0, (as_of - due_date).days)
        projected = (principal_amount + penalty) if principal_amount is not None else None

        return {
            "rule_id": rule_id,
            "rule_type": rule["rule_type"],
            "penalty_amount": float(rule["penalty_amount"]),
            "max_penalty": float(rule["max_penalty"]) if rule.get("max_penalty") is not None else None,
            "due_date": due_date,
            "as_of_date": as_of,
            "days_late": days_late,
            "grace_days": 7,
            "computed_penalty": penalty,
            "projected_total": projected
        }

    # ─── Fee Assignment & Invoicing Castewise (F-02) ───────────────────────────

    def preview_fee_assignment(
        self,
        fee_structure_id: int,
        student_ids: Optional[List[int]] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None
    ) -> Dict[str, Any]:
        self.get_fee_structure(fee_structure_id)
        return self.repo.preview_fee_assignment(
            fee_structure_id, student_ids, program_id, term_id, caste_category
        )

    def assign_fees(
        self,
        fee_structure_id: int,
        student_ids: Optional[List[int]] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        skip_existing: bool = True,
        acting_user: Optional[int] = None
    ) -> Dict[str, Any]:
        structure = self.get_fee_structure(fee_structure_id)
        try:
            assigned, skipped, total_amt = self.repo.assign_fees(
                fee_structure_id=fee_structure_id,
                student_ids=student_ids,
                program_id=program_id,
                term_id=term_id,
                caste_category=caste_category,
                skip_existing=skip_existing,
                acting_user=acting_user
            )
            caste_desc = f" [{caste_category}]" if caste_category else ""
            return {
                "fee_structure_id": fee_structure_id,
                "structure_name": structure["structure_name"],
                "assigned_count": assigned,
                "skipped_count": skipped,
                "total_assigned_amount": total_amt,
                "message": f"Successfully generated fee dues for {assigned} student(s){caste_desc}. {skipped} student(s) already assigned and skipped."
            }
        except DBAPIError as e:
            handle_db_error(e)

    # ─── Student Dues (F-04) ──────────────────────────────────────────────────

    def get_my_dues(self, current_user_id: int) -> Dict[str, Any]:
        student_id = self._get_student_id_for_user(current_user_id)
        dues = self.repo.get_student_dues(student_id)

        tot_due = sum(d["amount_due"] for d in dues)
        tot_paid = sum(d["amount_paid"] for d in dues)
        tot_balance = sum(d["balance"] for d in dues)
        tot_late = sum(d["computed_late_fee"] for d in dues)

        caste = dues[0]["student_caste_category"] if dues and "student_caste_category" in dues[0] else "GENERAL"

        return {
            "student_caste_category": caste,
            "total_payable": tot_balance + tot_late,
            "total_paid": tot_paid,
            "total_outstanding": tot_balance,
            "total_late_fee": tot_late,
            "dues": dues
        }

    def get_student_dues_admin(self, student_id: int) -> Dict[str, Any]:
        s = self.repo.db.execute(text("SELECT id, caste_category FROM student WHERE id = :sid"), {"sid": student_id}).fetchone()
        if not s:
            raise APIError("NOT_FOUND", f"Student with ID {student_id} not found", 404)

        dues = self.repo.get_student_dues(student_id)
        tot_due = sum(d["amount_due"] for d in dues)
        tot_paid = sum(d["amount_paid"] for d in dues)
        tot_balance = sum(d["balance"] for d in dues)
        tot_late = sum(d["computed_late_fee"] for d in dues)

        caste = s.caste_category if hasattr(s, "caste_category") and s.caste_category else "GENERAL"

        return {
            "student_caste_category": caste,
            "total_payable": tot_balance + tot_late,
            "total_paid": tot_paid,
            "total_outstanding": tot_balance,
            "total_late_fee": tot_late,
            "dues": dues
        }

    # ─── Payment Processing (F-05) ────────────────────────────────────────────

    def pay_fee(
        self,
        current_user_id: int,
        due_ids: List[int],
        amount: float,
        mode: str,
        reference_no: Optional[str] = None,
        requested_student_id: Optional[int] = None,
        has_admin: bool = False
    ) -> Dict[str, Any]:
        student_id = self._resolve_target_student(current_user_id, requested_student_id, has_admin)

        if amount <= 0:
            raise APIError("BAD_REQUEST", "Payment amount must be greater than zero", 400)
        if not due_ids:
            raise APIError("BAD_REQUEST", "At least one fee due must be selected for payment", 400)

        try:
            receipt = self.repo.pay_fee(
                student_id=student_id,
                due_ids=due_ids,
                amount=amount,
                mode=mode,
                reference_no=reference_no,
                acting_user=current_user_id
            )
            if receipt and "receipt_id" in receipt:
                detail = self.repo.get_receipt_detail(receipt["receipt_id"])
                return detail or receipt
            return receipt
        except DBAPIError as e:
            handle_db_error(e)

    # ─── Receipts & Ledger (F-06, F-07, F-08 Castewise) ───────────────────────

    def get_receipt(self, receipt_id: int, current_user_id: int, has_admin: bool) -> Dict[str, Any]:
        receipt = self.repo.get_receipt_detail(receipt_id)
        if not receipt:
            raise APIError("NOT_FOUND", "Receipt not found", 404)

        if not has_admin:
            student_id = self._get_student_id_for_user(current_user_id)
            if receipt["student_id"] != student_id:
                raise APIError("FORBIDDEN", "You do not have permission to view another student's receipt", 403)

        return receipt

    def get_student_receipts(self, current_user_id: int) -> List[Dict[str, Any]]:
        student_id = self._get_student_id_for_user(current_user_id)
        return self.repo.get_student_receipts(student_id)

    def get_all_receipts(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        payment_mode: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_all_receipts(skip, limit, search, payment_mode, start_date, end_date)

    def get_payment_ledger(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        payment_mode: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_payment_ledger(
            skip, limit, search, program_id, term_id, caste_category, payment_mode, status, start_date, end_date
        )

    def get_payment_ledger_summary(self) -> Dict[str, Any]:
        return self.repo.get_payment_ledger_summary()

    # ─── Defaulters (F-09 Castewise) ──────────────────────────────────────────

    def get_fee_defaulters(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        min_amount: Optional[float] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_fee_defaulters(skip, limit, search, program_id, term_id, caste_category, min_amount)

    def get_defaulter_summary(
        self,
        program_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        min_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        return self.repo.get_defaulter_summary(program_id, caste_category, min_amount)

    # ─── Castewise Summary Report ─────────────────────────────────────────────

    def get_castewise_summary(
        self,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None
    ) -> Dict[str, Any]:
        return self.repo.get_castewise_summary(program_id, term_id)

    # ─── Fee Change Audit Log (F-10) ──────────────────────────────────────────

    def get_fee_audit_logs(
        self,
        skip: int = 0,
        limit: int = 20,
        entity_name: Optional[str] = None,
        changed_by: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        return self.repo.get_fee_audit_logs(skip, limit, entity_name, changed_by, start_date, end_date)

    # ─── Reports (RP-4, RP-5) ─────────────────────────────────────────────────

    def get_fee_collection_summary(self, threshold: float = 1000.0) -> List[Dict[str, Any]]:
        return self.repo.get_fee_collection_summary_report(threshold)

    def get_high_dues_students(self) -> List[Dict[str, Any]]:
        return self.repo.get_high_dues_students_report()
