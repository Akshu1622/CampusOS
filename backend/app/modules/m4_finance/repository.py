from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional, Tuple
from datetime import date, datetime
import json
import uuid


class M4Repository:
    def __init__(self, db: Session):
        self.db = db

    def _set_acting_user(self, user_id: Optional[int]):
        """Set session variable so DB triggers attribute changes correctly."""
        val = str(user_id) if user_id is not None else "SYSTEM"
        self.db.execute(text("SET @acting_user_id = :u"), {"u": val})

    # ─── Fee Structures (F-01) ────────────────────────────────────────────────

    def get_fee_structures(
        self,
        skip: int = 0,
        limit: int = 20,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        filters = []
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if program_id:
            filters.append("fs.program_id = :program_id")
            params["program_id"] = program_id
        if term_id:
            filters.append("fs.term_id = :term_id")
            params["term_id"] = term_id
        if search:
            filters.append("(fs.structure_name LIKE :search OR p.name LIKE :search OR p.code LIKE :search)")
            params["search"] = f"%{search}%"

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        count_query = text(f"""
            SELECT COUNT(DISTINCT fs.id)
            FROM fee_structure fs
            JOIN program p ON fs.program_id = p.id
            JOIN academic_term at ON fs.term_id = at.id
            {where_clause}
        """)
        total = self.db.execute(count_query, params).scalar() or 0

        query = text(f"""
            SELECT fs.id, fs.program_id, p.name AS program_name, p.code AS program_code,
                   fs.term_id, at.term_label, fs.structure_name,
                   COUNT(fc.id) AS components_count,
                   COALESCE(SUM(fc.amount), 0.0) AS total_amount,
                   MIN(fc.due_date) AS earliest_due_date,
                   MAX(fc.due_date) AS latest_due_date,
                   'Active' AS status
            FROM fee_structure fs
            JOIN program p ON fs.program_id = p.id
            JOIN academic_term at ON fs.term_id = at.id
            LEFT JOIN fee_component fc ON fs.id = fc.structure_id
            {where_clause}
            GROUP BY fs.id, fs.program_id, p.name, p.code, fs.term_id, at.term_label, fs.structure_name
            ORDER BY fs.id DESC
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(query, params).fetchall()
        return [dict(r._mapping) for r in rows], total

    def get_fee_structure_by_id(self, structure_id: int) -> Optional[Dict[str, Any]]:
        query = text("""
            SELECT fs.id, fs.program_id, p.name AS program_name, p.code AS program_code,
                   fs.term_id, at.term_label, fs.structure_name,
                   COALESCE(SUM(fc.amount), 0.0) AS total_amount
            FROM fee_structure fs
            JOIN program p ON fs.program_id = p.id
            JOIN academic_term at ON fs.term_id = at.id
            LEFT JOIN fee_component fc ON fs.id = fc.structure_id
            WHERE fs.id = :id
            GROUP BY fs.id, fs.program_id, p.name, p.code, fs.term_id, at.term_label, fs.structure_name
        """)
        row = self.db.execute(query, {"id": structure_id}).fetchone()
        return dict(row._mapping) if row else None

    def get_fee_components_for_structure(self, structure_id: int) -> List[Dict[str, Any]]:
        query = text("""
            SELECT id, structure_id, component_name, amount, due_date,
                   COALESCE(caste_category, 'ALL') AS caste_category
            FROM fee_component
            WHERE structure_id = :sid
            ORDER BY due_date ASC, id ASC
        """)
        rows = self.db.execute(query, {"sid": structure_id}).fetchall()
        return [dict(r._mapping) for r in rows]

    def create_fee_structure(self, data: dict, components: list, acting_user: Optional[int] = None) -> int:
        self._set_acting_user(acting_user)
        res = self.db.execute(text("""
            INSERT INTO fee_structure (program_id, term_id, structure_name)
            VALUES (:pid, :tid, :name)
        """), {"pid": data["program_id"], "tid": data["term_id"], "name": data["structure_name"]})
        structure_id = res.lastrowid

        for c in components:
            caste = c.get("caste_category") or "ALL"
            self.db.execute(text("""
                INSERT INTO fee_component (structure_id, component_name, amount, due_date, caste_category)
                VALUES (:sid, :name, :amt, :dd, :caste)
            """), {
                "sid": structure_id,
                "name": c["component_name"],
                "amt": c["amount"],
                "dd": c["due_date"],
                "caste": caste
            })

        self.db.commit()
        return structure_id

    def update_fee_structure(
        self,
        structure_id: int,
        data: dict,
        components: Optional[list] = None,
        acting_user: Optional[int] = None
    ):
        self._set_acting_user(acting_user)
        if data:
            set_clauses = [f"{k} = :{k}" for k in data.keys()]
            params = {**data, "id": structure_id}
            self.db.execute(text(f"UPDATE fee_structure SET {', '.join(set_clauses)} WHERE id = :id"), params)

        if components is not None:
            self.db.execute(text("DELETE FROM fee_component WHERE structure_id = :sid"), {"sid": structure_id})
            for c in components:
                caste = c.get("caste_category") or "ALL"
                self.db.execute(text("""
                    INSERT INTO fee_component (structure_id, component_name, amount, due_date, caste_category)
                    VALUES (:sid, :name, :amt, :dd, :caste)
                """), {
                    "sid": structure_id,
                    "name": c["component_name"],
                    "amt": c["amount"],
                    "dd": c["due_date"],
                    "caste": caste
                })

        self.db.commit()

    def delete_fee_structure(self, structure_id: int, acting_user: Optional[int] = None):
        self._set_acting_user(acting_user)
        self.db.execute(text("DELETE FROM fee_structure WHERE id = :id"), {"id": structure_id})
        self.db.commit()

    # ─── Fee Components (F-01 Drawer & Repeater) ──────────────────────────────

    def add_fee_component(self, structure_id: int, comp_data: dict, acting_user: Optional[int] = None) -> int:
        self._set_acting_user(acting_user)
        caste = comp_data.get("caste_category") or "ALL"
        res = self.db.execute(text("""
            INSERT INTO fee_component (structure_id, component_name, amount, due_date, caste_category)
            VALUES (:sid, :name, :amt, :dd, :caste)
        """), {
            "sid": structure_id,
            "name": comp_data["component_name"],
            "amt": comp_data["amount"],
            "dd": comp_data["due_date"],
            "caste": caste
        })
        self.db.commit()
        return res.lastrowid

    def update_fee_component(self, component_id: int, comp_data: dict, acting_user: Optional[int] = None):
        self._set_acting_user(acting_user)
        if not comp_data:
            return
        set_clauses = [f"{k} = :{k}" for k in comp_data.keys()]
        params = {**comp_data, "id": component_id}
        self.db.execute(text(f"UPDATE fee_component SET {', '.join(set_clauses)} WHERE id = :id"), params)
        self.db.commit()

    def delete_fee_component(self, component_id: int, acting_user: Optional[int] = None):
        self._set_acting_user(acting_user)
        self.db.execute(text("DELETE FROM fee_component WHERE id = :id"), {"id": component_id})
        self.db.commit()

    # ─── Late Fee Rules (F-03) ────────────────────────────────────────────────

    def get_late_fee_rules(self, skip: int = 0, limit: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        total = self.db.execute(text("SELECT COUNT(*) FROM late_fee_rule")).scalar() or 0
        rows = self.db.execute(text("""
            SELECT id, rule_type, penalty_amount, max_penalty
            FROM late_fee_rule
            ORDER BY id ASC
            LIMIT :limit OFFSET :skip
        """), {"limit": limit, "skip": skip}).fetchall()
        return [dict(r._mapping) for r in rows], total

    def get_late_fee_rule_by_id(self, rule_id: int) -> Optional[Dict[str, Any]]:
        row = self.db.execute(text("""
            SELECT id, rule_type, penalty_amount, max_penalty
            FROM late_fee_rule WHERE id = :id
        """), {"id": rule_id}).fetchone()
        return dict(row._mapping) if row else None

    def create_late_fee_rule(self, data: dict) -> int:
        res = self.db.execute(text("""
            INSERT INTO late_fee_rule (rule_type, penalty_amount, max_penalty)
            VALUES (:rt, :pa, :mp)
        """), {"rt": data["rule_type"], "pa": data["penalty_amount"], "mp": data.get("max_penalty")})
        self.db.commit()
        return res.lastrowid

    def update_late_fee_rule(self, rule_id: int, data: dict):
        if not data:
            return
        set_clauses = [f"{k} = :{k}" for k in data.keys()]
        params = {**data, "id": rule_id}
        self.db.execute(text(f"UPDATE late_fee_rule SET {', '.join(set_clauses)} WHERE id = :id"), params)
        self.db.commit()

    def delete_late_fee_rule(self, rule_id: int):
        self.db.execute(text("DELETE FROM late_fee_rule WHERE id = :id"), {"id": rule_id})
        self.db.commit()

    def calculate_late_fee(
        self,
        rule_id: int,
        due_date: date,
        as_of_date: date
    ) -> float:
        res = self.db.execute(text("""
            SELECT fn_late_fee_penalty(:rid, :due_date, :as_of_date) AS penalty
        """), {"rid": rule_id, "due_date": due_date, "as_of_date": as_of_date}).scalar()
        return float(res or 0.0)

    # ─── Fee Assignment & Invoicing Castewise (F-02) ───────────────────────────

    def preview_fee_assignment(
        self,
        fee_structure_id: int,
        student_ids: Optional[List[int]] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None
    ) -> Dict[str, Any]:
        structure = self.get_fee_structure_by_id(fee_structure_id)
        if not structure:
            return {}

        components = self.get_fee_components_for_structure(fee_structure_id)
        per_student_amt = sum(c["amount"] for c in components)
        comp_ids = [c["id"] for c in components]

        # Determine target students, with optional caste_category filter
        caste_filter = "AND caste_category = :caste" if caste_category else ""
        caste_params = {"caste": caste_category} if caste_category else {}

        if student_ids and len(student_ids) > 0:
            students_query = text(f"""
                SELECT id, global_student_id, CONCAT(first_name, ' ', last_name) AS student_name,
                       program_id, COALESCE(caste_category, 'GENERAL') AS caste_category
                FROM student
                WHERE id IN :sids AND status = 'ENROLLED' {caste_filter}
            """)
            target_students = [dict(r._mapping) for r in self.db.execute(students_query, {"sids": tuple(student_ids), **caste_params}).fetchall()]
        else:
            prog = program_id or structure["program_id"]
            students_query = text(f"""
                SELECT id, global_student_id, CONCAT(first_name, ' ', last_name) AS student_name,
                       program_id, COALESCE(caste_category, 'GENERAL') AS caste_category
                FROM student
                WHERE program_id = :pid AND status = 'ENROLLED' {caste_filter}
            """)
            target_students = [dict(r._mapping) for r in self.db.execute(students_query, {"pid": prog, **caste_params}).fetchall()]

        total_students = len(target_students)
        if total_students == 0 or len(comp_ids) == 0:
            return {
                "fee_structure_id": fee_structure_id,
                "structure_name": structure["structure_name"],
                "per_student_amount": per_student_amt,
                "components_count": len(components),
                "total_students_in_scope": total_students,
                "already_assigned_count": 0,
                "to_assign_count": 0,
                "total_projected_amount": 0.0,
                "caste_breakdown": {},
                "sample_students": []
            }

        # Check who already has any component assigned
        target_sids = [s["id"] for s in target_students]
        check_query = text("""
            SELECT DISTINCT student_id
            FROM student_fee
            WHERE student_id IN :sids AND component_id IN :cids
        """)
        assigned_sids = set(r.student_id for r in self.db.execute(check_query, {
            "sids": tuple(target_sids),
            "cids": tuple(comp_ids)
        }).fetchall())

        already_count = len(assigned_sids)
        to_assign_count = total_students - already_count

        # Compute castewise breakdown and projected amount according to applicable components
        caste_breakdown: Dict[str, int] = {}
        total_projected = 0.0

        for s in target_students:
            caste = s["caste_category"]
            caste_breakdown[caste] = caste_breakdown.get(caste, 0) + 1
            if s["id"] not in assigned_sids:
                # Add sum of components applicable to this student's caste
                applicable_sum = sum(
                    c["amount"] for c in components 
                    if c.get("caste_category") in ("ALL", caste) or not c.get("caste_category")
                )
                total_projected += applicable_sum

        sample = []
        for s in target_students[:10]:
            sample.append({
                "student_id": s["id"],
                "global_student_id": s["global_student_id"],
                "student_name": s["student_name"],
                "caste_category": s["caste_category"],
                "is_already_assigned": s["id"] in assigned_sids
            })

        return {
            "fee_structure_id": fee_structure_id,
            "structure_name": structure["structure_name"],
            "per_student_amount": per_student_amt,
            "components_count": len(components),
            "total_students_in_scope": total_students,
            "already_assigned_count": already_count,
            "to_assign_count": to_assign_count,
            "total_projected_amount": total_projected,
            "caste_breakdown": caste_breakdown,
            "sample_students": sample
        }

    def assign_fees(
        self,
        fee_structure_id: int,
        student_ids: Optional[List[int]] = None,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        skip_existing: bool = True,
        acting_user: Optional[int] = None
    ) -> Tuple[int, int, float]:
        self._set_acting_user(acting_user)
        structure = self.get_fee_structure_by_id(fee_structure_id)
        if not structure:
            return 0, 0, 0.0

        components = self.get_fee_components_for_structure(fee_structure_id)
        if not components:
            return 0, 0, 0.0

        comp_ids = [c["id"] for c in components]

        # Determine target students
        caste_filter = "AND caste_category = :caste" if caste_category else ""
        caste_params = {"caste": caste_category} if caste_category else {}

        if student_ids and len(student_ids) > 0:
            target_students_query = text(f"""
                SELECT id, COALESCE(caste_category, 'GENERAL') AS caste_category 
                FROM student 
                WHERE id IN :sids AND status = 'ENROLLED' {caste_filter}
            """)
            target_students = self.db.execute(target_students_query, {"sids": tuple(student_ids), **caste_params}).fetchall()
        else:
            prog = program_id or structure["program_id"]
            target_students_query = text(f"""
                SELECT id, COALESCE(caste_category, 'GENERAL') AS caste_category 
                FROM student 
                WHERE program_id = :pid AND status = 'ENROLLED' {caste_filter}
            """)
            target_students = self.db.execute(target_students_query, {"pid": prog, **caste_params}).fetchall()

        if not target_students:
            return 0, 0, 0.0

        target_sids = [r.id for r in target_students]
        assigned_count = 0
        skipped_count = 0
        total_assigned_amount = 0.0

        # Query existing assignments for deduplication
        existing_check = text("""
            SELECT DISTINCT student_id
            FROM student_fee
            WHERE student_id IN :sids AND component_id IN :cids
        """)
        already_assigned_sids = set(r.student_id for r in self.db.execute(existing_check, {
            "sids": tuple(target_sids),
            "cids": tuple(comp_ids)
        }).fetchall())

        for st in target_students:
            sid = st.id
            caste = st.caste_category

            if sid in already_assigned_sids:
                if skip_existing:
                    skipped_count += 1
                    continue

            # Assign components matching ALL or student's caste
            applicable_comps = [
                c for c in components 
                if c.get("caste_category") in ("ALL", caste) or not c.get("caste_category")
            ]

            for comp in applicable_comps:
                self.db.execute(text("""
                    INSERT IGNORE INTO student_fee (student_id, component_id, amount_due, amount_paid, status)
                    VALUES (:sid, :cid, :amt, 0.00, 'PENDING')
                """), {"sid": sid, "cid": comp["id"], "amt": comp["amount"]})
                total_assigned_amount += float(comp["amount"])

            assigned_count += 1

        self.db.commit()
        return assigned_count, skipped_count, total_assigned_amount

    # ─── Student Dues (F-04) ──────────────────────────────────────────────────

    def get_student_dues(self, student_id: int) -> List[Dict[str, Any]]:
        query = text("""
            SELECT sf.id, sf.student_id, sf.component_id, fc.component_name,
                   fc.caste_category, s.caste_category AS student_caste_category,
                   fs.structure_name, at.term_label, fc.due_date,
                   sf.amount_due, sf.amount_paid,
                   (sf.amount_due - sf.amount_paid) AS balance,
                   sf.status,
                   GREATEST(0, fn_late_fee_penalty(
                       IFNULL((SELECT MIN(id) FROM late_fee_rule), 1),
                       fc.due_date,
                       CURDATE()
                   ) - IFNULL((SELECT SUM(allocated_late_fee) FROM payment_allocation WHERE student_fee_id = sf.id), 0)) AS computed_late_fee
            FROM student_fee sf
            JOIN student s ON sf.student_id = s.id
            JOIN fee_component fc ON sf.component_id = fc.id
            JOIN fee_structure fs ON fc.structure_id = fs.id
            JOIN academic_term at ON fs.term_id = at.id
            WHERE sf.student_id = :sid
            ORDER BY fc.due_date ASC, sf.id ASC
        """)
        rows = self.db.execute(query, {"sid": student_id}).fetchall()
        results = []
        for r in rows:
            d = dict(r._mapping)
            d["computed_late_fee"] = float(d["computed_late_fee"] or 0.0)
            d["total_payable"] = float(d["balance"]) + d["computed_late_fee"]
            results.append(d)
        return results

    # ─── Payments & Stored Procedure (F-05) ───────────────────────────────────

    def pay_fee(
        self,
        student_id: int,
        due_ids: List[int],
        amount: float,
        mode: str,
        reference_no: Optional[str],
        acting_user: Optional[int] = None
    ) -> Dict[str, Any]:
        self._set_acting_user(acting_user)

        ref = reference_no
        if not ref or not ref.strip():
            ref = f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:6].upper()}"

        proc_query = text("""
            CALL sp_fee_payment(:sid, :due_ids, :amt, :mode, :ref, :uid)
        """)
        res = self.db.execute(proc_query, {
            "sid": student_id,
            "due_ids": json.dumps(due_ids),
            "amt": amount,
            "mode": mode,
            "ref": ref,
            "uid": acting_user or 1
        }).fetchone()

        self.db.commit()

        if res:
            return dict(res._mapping)

        fallback_query = text("""
            SELECT r.id AS receipt_id, r.receipt_number, r.generated_at, p.amount, p.payment_mode, p.reference_no
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            WHERE p.student_id = :sid
            ORDER BY r.generated_at DESC, r.id DESC
            LIMIT 1
        """)
        fallback = self.db.execute(fallback_query, {"sid": student_id}).fetchone()
        return dict(fallback._mapping) if fallback else {}

    # ─── Receipts (F-06, F-07) ────────────────────────────────────────────────

    def get_receipt_detail(self, receipt_id: int) -> Optional[Dict[str, Any]]:
        query = text("""
            SELECT r.id, r.receipt_number, r.payment_id, r.generated_at,
                   p.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id, s.email AS student_email,
                   COALESCE(s.caste_category, 'GENERAL') AS caste_category,
                   pr.name AS program_name,
                   p.amount, p.payment_mode, p.reference_no, p.payment_date, p.status
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            JOIN student s ON p.student_id = s.id
            LEFT JOIN program pr ON s.program_id = pr.id
            WHERE r.id = :id
        """)
        row = self.db.execute(query, {"id": receipt_id}).fetchone()
        if not row:
            return None

        result = dict(row._mapping)

        alloc_query = text("""
            SELECT fc.component_name, fc.due_date,
                   pa.allocated_principal, pa.allocated_late_fee,
                   (pa.allocated_principal + pa.allocated_late_fee) AS total_allocated
            FROM payment_allocation pa
            JOIN student_fee sf ON pa.student_fee_id = sf.id
            JOIN fee_component fc ON sf.component_id = fc.id
            WHERE pa.payment_id = :pid
            ORDER BY fc.due_date ASC
        """)
        allocs = self.db.execute(alloc_query, {"pid": result["payment_id"]}).fetchall()
        result["line_items"] = [dict(a._mapping) for a in allocs]
        result["total_principal"] = sum(float(a["allocated_principal"]) for a in result["line_items"])
        result["total_late_fee"] = sum(float(a["allocated_late_fee"]) for a in result["line_items"])

        return result

    def get_student_receipts(self, student_id: int) -> List[Dict[str, Any]]:
        query = text("""
            SELECT r.id, r.receipt_number, r.payment_id, r.generated_at,
                   p.amount, p.payment_mode, p.reference_no, p.payment_date, p.status
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            WHERE p.student_id = :sid
            ORDER BY r.generated_at DESC, r.id DESC
        """)
        rows = self.db.execute(query, {"sid": student_id}).fetchall()
        return [dict(r._mapping) for r in rows]

    def get_all_receipts(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        payment_mode: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        filters = []
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if search:
            filters.append("(r.receipt_number LIKE :search OR s.first_name LIKE :search OR s.last_name LIKE :search OR s.global_student_id LIKE :search)")
            params["search"] = f"%{search}%"
        if payment_mode:
            filters.append("p.payment_mode = :mode")
            params["mode"] = payment_mode
        if start_date:
            filters.append("DATE(r.generated_at) >= :start_date")
            params["start_date"] = start_date
        if end_date:
            filters.append("DATE(r.generated_at) <= :end_date")
            params["end_date"] = end_date

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        total_query = text(f"""
            SELECT COUNT(r.id)
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            JOIN student s ON p.student_id = s.id
            {where_clause}
        """)
        total = self.db.execute(total_query, params).scalar() or 0

        query = text(f"""
            SELECT r.id, r.receipt_number, r.payment_id, r.generated_at,
                   p.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id, COALESCE(s.caste_category, 'GENERAL') AS caste_category,
                   p.amount, p.payment_mode, p.reference_no, p.payment_date, p.status
            FROM receipt r
            JOIN payment p ON r.payment_id = p.id
            JOIN student s ON p.student_id = s.id
            {where_clause}
            ORDER BY r.generated_at DESC, r.id DESC
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(query, params).fetchall()
        return [dict(r._mapping) for r in rows], total

    # ─── Payment Ledger (F-08 Castewise) ──────────────────────────────────────

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
        filters = []
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if search:
            filters.append("(r.receipt_number LIKE :search OR p.reference_no LIKE :search OR s.first_name LIKE :search OR s.last_name LIKE :search OR s.global_student_id LIKE :search)")
            params["search"] = f"%{search}%"
        if program_id:
            filters.append("s.program_id = :program_id")
            params["program_id"] = program_id
        if caste_category:
            filters.append("s.caste_category = :caste_category")
            params["caste_category"] = caste_category
        if payment_mode:
            filters.append("p.payment_mode = :payment_mode")
            params["payment_mode"] = payment_mode
        if status:
            filters.append("p.status = :status")
            params["status"] = status
        if start_date:
            filters.append("DATE(p.payment_date) >= :start_date")
            params["start_date"] = start_date
        if end_date:
            filters.append("DATE(p.payment_date) <= :end_date")
            params["end_date"] = end_date

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        count_query = text(f"""
            SELECT COUNT(p.id)
            FROM payment p
            JOIN student s ON p.student_id = s.id
            LEFT JOIN receipt r ON r.payment_id = p.id
            {where_clause}
        """)
        total = self.db.execute(count_query, params).scalar() or 0

        query = text(f"""
            SELECT p.id, r.id AS receipt_id, r.receipt_number,
                   p.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id, COALESCE(s.caste_category, 'GENERAL') AS caste_category,
                   pr.name AS program_name,
                   p.amount, p.payment_mode, p.reference_no, p.payment_date, p.status
            FROM payment p
            JOIN student s ON p.student_id = s.id
            LEFT JOIN program pr ON s.program_id = pr.id
            LEFT JOIN receipt r ON r.payment_id = p.id
            {where_clause}
            ORDER BY p.payment_date DESC, p.id DESC
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(query, params).fetchall()
        return [dict(r._mapping) for r in rows], total

    def get_payment_ledger_summary(self) -> Dict[str, Any]:
        query = text("""
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(payment_date) = CURDATE() AND status = 'SUCCESS' THEN amount ELSE 0 END), 0.0) AS collected_today,
                COALESCE(SUM(CASE WHEN YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE()) AND status = 'SUCCESS' THEN amount ELSE 0 END), 0.0) AS collected_this_month,
                COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.0) AS total_collected,
                COUNT(id) AS total_transactions
            FROM payment
        """)
        row = self.db.execute(query).fetchone()
        return dict(row._mapping) if row else {
            "collected_today": 0.0,
            "collected_this_month": 0.0,
            "total_collected": 0.0,
            "total_transactions": 0
        }

    # ─── Fee Defaulters (F-09 Castewise) ──────────────────────────────────────

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
        filters = []
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if search:
            filters.append("(v.student_name LIKE :search OR v.global_student_id LIKE :search OR v.program_name LIKE :search)")
            params["search"] = f"%{search}%"
        if program_id:
            filters.append("s.program_id = :program_id")
            params["program_id"] = program_id
        if caste_category:
            filters.append("s.caste_category = :caste_category")
            params["caste_category"] = caste_category
        if min_amount is not None:
            filters.append("v.total_balance >= :min_amount")
            params["min_amount"] = min_amount

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        count_query = text(f"""
            SELECT COUNT(*)
            FROM vw_fee_defaulters v
            JOIN student s ON v.student_id = s.id
            {where_clause}
        """)
        try:
            total = self.db.execute(count_query, params).scalar() or 0
        except Exception:
            total = 0

        query = text(f"""
            SELECT v.student_id, v.global_student_id, v.student_name,
                   COALESCE(s.caste_category, 'GENERAL') AS caste_category,
                   v.program_name, v.component_name, v.term_label, v.due_date,
                   DATEDIFF(CURDATE(), v.due_date) AS overdue_days,
                   v.amount_due, v.amount_paid, v.late_fee, v.total_balance
            FROM vw_fee_defaulters v
            JOIN student s ON v.student_id = s.id
            {where_clause}
            ORDER BY v.total_balance DESC, v.due_date ASC
            LIMIT :limit OFFSET :skip
        """)
        try:
            rows = self.db.execute(query, params).fetchall()
            return [dict(r._mapping) for r in rows], total
        except Exception:
            return [], 0

    def get_defaulter_summary(
        self,
        program_id: Optional[int] = None,
        caste_category: Optional[str] = None,
        min_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        filters = []
        params: Dict[str, Any] = {}

        if program_id:
            filters.append("s.program_id = :program_id")
            params["program_id"] = program_id
        if caste_category:
            filters.append("s.caste_category = :caste_category")
            params["caste_category"] = caste_category
        if min_amount is not None:
            filters.append("v.total_balance >= :min_amount")
            params["min_amount"] = min_amount

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        query = text(f"""
            SELECT 
                COUNT(DISTINCT v.student_id) AS total_defaulters,
                COALESCE(SUM(v.total_balance), 0.0) AS total_outstanding,
                COALESCE(MAX(DATEDIFF(CURDATE(), v.due_date)), 0) AS oldest_overdue_days,
                COALESCE(AVG(v.total_balance), 0.0) AS average_overdue_amount
            FROM vw_fee_defaulters v
            JOIN student s ON v.student_id = s.id
            {where_clause}
        """)
        try:
            row = self.db.execute(query, params).fetchone()
            return dict(row._mapping) if row else {
                "total_defaulters": 0,
                "total_outstanding": 0.0,
                "oldest_overdue_days": 0,
                "average_overdue_amount": 0.0
            }
        except Exception:
            return {
                "total_defaulters": 0,
                "total_outstanding": 0.0,
                "oldest_overdue_days": 0,
                "average_overdue_amount": 0.0
            }

    # ─── Castewise Summary Report (New Feature) ───────────────────────────────

    def get_castewise_summary(
        self,
        program_id: Optional[int] = None,
        term_id: Optional[int] = None
    ) -> Dict[str, Any]:
        filters = []
        params: Dict[str, Any] = {}

        if program_id:
            filters.append("s.program_id = :program_id")
            params["program_id"] = program_id
        if term_id:
            filters.append("fs.term_id = :term_id")
            params["term_id"] = term_id

        where_clause = f"AND {' AND '.join(filters)}" if filters else ""

        query = text(f"""
            SELECT 
                COALESCE(s.caste_category, 'GENERAL') AS caste_category,
                COUNT(DISTINCT s.id) AS total_students,
                COALESCE(SUM(sf.amount_due), 0.0) AS total_due,
                COALESCE(SUM(sf.amount_paid), 0.0) AS total_paid,
                COALESCE(SUM(sf.amount_due - sf.amount_paid), 0.0) AS total_balance,
                COUNT(DISTINCT CASE WHEN (sf.amount_due - sf.amount_paid) > 0 AND fc.due_date < CURDATE() THEN s.id END) AS defaulters_count
            FROM student s
            LEFT JOIN student_fee sf ON s.id = sf.student_id
            LEFT JOIN fee_component fc ON sf.component_id = fc.id
            LEFT JOIN fee_structure fs ON fc.structure_id = fs.id
            WHERE s.status IN ('ACTIVE', 'ENROLLED') {where_clause}
            GROUP BY COALESCE(s.caste_category, 'GENERAL')
            ORDER BY FIELD(COALESCE(s.caste_category, 'GENERAL'), 'GENERAL', 'OBC', 'SC', 'ST', 'EWS')
        """)
        rows = self.db.execute(query, params).fetchall()

        all_categories = ["GENERAL", "OBC", "SC", "ST", "EWS"]
        cat_map = {r.caste_category: dict(r._mapping) for r in rows}

        items = []
        tot_students = 0
        tot_due = 0.0
        tot_paid = 0.0
        tot_balance = 0.0

        for cat in all_categories:
            data = cat_map.get(cat, {
                "caste_category": cat,
                "total_students": 0,
                "total_due": 0.0,
                "total_paid": 0.0,
                "total_balance": 0.0,
                "defaulters_count": 0
            })
            td = float(data["total_due"] or 0.0)
            tp = float(data["total_paid"] or 0.0)
            tb = float(data["total_balance"] or 0.0)
            ts = int(data["total_students"] or 0)
            pct = round((tp / td * 100), 2) if td > 0 else 0.0

            items.append({
                "caste_category": cat,
                "total_students": ts,
                "total_due": td,
                "total_paid": tp,
                "total_balance": tb,
                "defaulters_count": int(data["defaulters_count"] or 0),
                "collection_percentage": pct
            })

            tot_students += ts
            tot_due += td
            tot_paid += tp
            tot_balance += tb

        overall_pct = round((tot_paid / tot_due * 100), 2) if tot_due > 0 else 0.0

        return {
            "categories": items,
            "total_students": tot_students,
            "total_due": tot_due,
            "total_paid": tot_paid,
            "total_balance": tot_balance,
            "overall_collection_percentage": overall_pct
        }

    # ─── Fee Audit Log (F-10) ─────────────────────────────────────────────────

    def get_fee_audit_logs(
        self,
        skip: int = 0,
        limit: int = 20,
        entity_name: Optional[str] = None,
        changed_by: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        filters = []
        params: Dict[str, Any] = {"limit": limit, "skip": skip}

        if entity_name:
            filters.append("entity_name = :entity_name")
            params["entity_name"] = entity_name
        if changed_by:
            filters.append("changed_by LIKE :changed_by")
            params["changed_by"] = f"%{changed_by}%"
        if start_date:
            filters.append("DATE(changed_at) >= :start_date")
            params["start_date"] = start_date
        if end_date:
            filters.append("DATE(changed_at) <= :end_date")
            params["end_date"] = end_date

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        count_query = text(f"SELECT COUNT(*) FROM fee_audit_log {where_clause}")
        total = self.db.execute(count_query, params).scalar() or 0

        query = text(f"""
            SELECT id, entity_name, entity_id, old_value, new_value, changed_by, changed_at
            FROM fee_audit_log
            {where_clause}
            ORDER BY changed_at DESC, id DESC
            LIMIT :limit OFFSET :skip
        """)
        rows = self.db.execute(query, params).fetchall()
        results = []
        for r in rows:
            d = dict(r._mapping)
            if isinstance(d["old_value"], str):
                try: d["old_value"] = json.loads(d["old_value"])
                except Exception: pass
            if isinstance(d["new_value"], str):
                try: d["new_value"] = json.loads(d["new_value"])
                except Exception: pass
            results.append(d)
        return results, total

    # ─── Touchpoints & Reports (RP-4, RP-5) ───────────────────────────────────

    def get_fee_collection_summary_report(self, threshold: float = 1000.0) -> List[Dict[str, Any]]:
        """Call sp_fee_collection_summary (RP-4)"""
        try:
            rows = self.db.execute(text("CALL sp_fee_collection_summary(:threshold)"), {
                "threshold": threshold
            }).fetchall()
            self.db.commit()
            return [dict(r._mapping) for r in rows]
        except Exception:
            return []

    def get_high_dues_students_report(self) -> List[Dict[str, Any]]:
        """Query vw_high_dues_students (RP-5)"""
        try:
            rows = self.db.execute(text("SELECT * FROM vw_high_dues_students ORDER BY total_dues DESC")).fetchall()
            return [dict(r._mapping) for r in rows]
        except Exception:
            return []
