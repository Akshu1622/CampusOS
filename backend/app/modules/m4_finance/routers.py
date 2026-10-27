from fastapi import APIRouter, Depends, status, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import io
import csv

from app.dependencies.db import get_db
from app.dependencies.auth import CurrentUser, require_role, require_permission
from app.modules.m4_finance.schemas import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse, FeeStructureListResponse,
    FeeComponentCreate, FeeComponentUpdate, FeeComponentResponse,
    LateFeeRuleCreate, LateFeeRuleUpdate, LateFeeRuleResponse,
    LateFeeCalculateRequest, LateFeeCalculateResponse,
    FeeAssignmentCreate, FeeAssignmentPreviewRequest, FeeAssignmentPreviewResponse, FeeAssignmentResultResponse,
    StudentFeeResponse, StudentDuesSummaryResponse,
    PaymentCreate, PaymentResponse, ReceiptResponse, ReceiptDetailResponse,
    PaymentLedgerItemResponse, PaymentLedgerSummaryResponse,
    DefaulterItemResponse, DefaulterSummaryResponse,
    FeeAuditLogResponse, PaginatedResponse,
    FeeCollectionSummaryItem, HighDuesStudentItem
)
from app.modules.m4_finance.service import M4Service

m4_router = APIRouter(tags=["Finance"])


def get_m4_service(db: Session = Depends(get_db)) -> M4Service:
    return M4Service(db)


def _is_admin(user: CurrentUser) -> bool:
    role_check = any(r.lower() in ("admin", "superadmin") for r in user.roles)
    perm_check = any(p in ("Finance_Admin", "Super_Admin", "Core_Admin") for p in user.permission_sets)
    return role_check or perm_check


# ─── Fee Structures (F-01) ────────────────────────────────────────────────────

@m4_router.post("/fee-structures", status_code=status.HTTP_201_CREATED, response_model=FeeStructureResponse)
def create_fee_structure(
    data: FeeStructureCreate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    data_dict = data.model_dump(exclude={"components"})
    comps = [c.model_dump() for c in data.components]
    return svc.create_fee_structure(data_dict, comps, acting_user=user.user_id)


@m4_router.get("/fee-structures", response_model=PaginatedResponse)
def get_fee_structures(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    program_id: Optional[int] = None,
    term_id: Optional[int] = None,
    search: Optional[str] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_fee_structures(skip, page_size, program_id, term_id, search)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@m4_router.get("/fee-structures/{id}", response_model=FeeStructureResponse)
def get_fee_structure(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.get_fee_structure(id)


@m4_router.put("/fee-structures/{id}", response_model=FeeStructureResponse)
def update_fee_structure(
    id: int,
    data: FeeStructureUpdate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    data_dict = data.model_dump(exclude_unset=True, exclude={"components"})
    comps = [c.model_dump() for c in data.components] if data.components is not None else None
    return svc.update_fee_structure(id, data_dict, comps, acting_user=user.user_id)


@m4_router.delete("/fee-structures/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee_structure(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    svc.delete_fee_structure(id, acting_user=user.user_id)


# ─── Fee Components (F-01 Drawer & Repeater) ──────────────────────────────────

@m4_router.post("/fee-structures/{id}/components", status_code=status.HTTP_201_CREATED, response_model=FeeComponentResponse)
def add_fee_component(
    id: int,
    data: FeeComponentCreate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    return svc.add_fee_component(id, data.model_dump(), acting_user=user.user_id)


@m4_router.put("/fee-components/{id}", response_model=FeeComponentResponse)
def update_fee_component(
    id: int,
    data: FeeComponentUpdate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    return svc.update_fee_component(id, data.model_dump(exclude_unset=True), acting_user=user.user_id)


@m4_router.delete("/fee-components/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee_component(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    svc.delete_fee_component(id, acting_user=user.user_id)


# ─── Late Fee Rules & Calculator (F-03) ───────────────────────────────────────

@m4_router.post("/late-fee-rules", status_code=status.HTTP_201_CREATED, response_model=LateFeeRuleResponse)
def create_late_fee_rule(
    data: LateFeeRuleCreate,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.create_late_fee_rule(data.model_dump())


@m4_router.get("/late-fee-rules", response_model=PaginatedResponse)
def get_late_fee_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_late_fee_rules(skip, page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@m4_router.get("/late-fee-rules/{id}", response_model=LateFeeRuleResponse)
def get_late_fee_rule(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.get_late_fee_rule(id)


@m4_router.put("/late-fee-rules/{id}", response_model=LateFeeRuleResponse)
def update_late_fee_rule(
    id: int,
    data: LateFeeRuleUpdate,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.update_late_fee_rule(id, data.model_dump(exclude_unset=True))


@m4_router.delete("/late-fee-rules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_late_fee_rule(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    svc.delete_late_fee_rule(id)


@m4_router.post("/late-fee-rules/calculate", response_model=LateFeeCalculateResponse)
def calculate_late_fee_simulation(
    data: LateFeeCalculateRequest,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.calculate_late_fee_simulation(
        rule_id=data.rule_id,
        due_date=data.due_date,
        as_of_date=data.as_of_date,
        principal_amount=data.principal_amount
    )


# ─── Fee Assignments & Invoicing (F-02) ───────────────────────────────────────

@m4_router.post("/fee-assignments/preview", response_model=FeeAssignmentPreviewResponse)
def preview_fee_assignment(
    data: FeeAssignmentPreviewRequest,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.preview_fee_assignment(
        fee_structure_id=data.fee_structure_id,
        student_ids=data.student_ids,
        program_id=data.program_id,
        term_id=data.term_id
    )


@m4_router.post("/fee-assignments", status_code=status.HTTP_201_CREATED, response_model=FeeAssignmentResultResponse)
def assign_fees(
    data: FeeAssignmentCreate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_permission(["Finance_Admin"]))
):
    return svc.assign_fees(
        fee_structure_id=data.fee_structure_id,
        student_ids=data.student_ids,
        program_id=data.program_id,
        term_id=data.term_id,
        skip_existing=data.skip_existing,
        acting_user=user.user_id
    )


# ─── Student Dues (F-04) ──────────────────────────────────────────────────────

@m4_router.get("/me/dues", response_model=StudentDuesSummaryResponse)
def get_my_dues(
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_role(["Student"]))
):
    return svc.get_my_dues(user.user_id)


@m4_router.get("/students/{id}/dues", response_model=StudentDuesSummaryResponse)
def get_student_dues(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.get_student_dues_admin(id)


# ─── Payment Processing & Concurrency (F-05) ──────────────────────────────────

@m4_router.post("/payments", status_code=status.HTTP_201_CREATED)
def pay_fee(
    data: PaymentCreate,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_role(["Student", "Admin", "SuperAdmin"]))
):
    has_admin = _is_admin(user)
    return svc.pay_fee(
        current_user_id=user.user_id,
        due_ids=data.due_ids,
        amount=data.amount,
        mode=data.payment_mode.value,
        reference_no=data.reference_no,
        requested_student_id=data.student_id,
        has_admin=has_admin
    )


# ─── Receipts (F-06, F-07) ────────────────────────────────────────────────────

@m4_router.get("/receipts/{id}", response_model=ReceiptDetailResponse)
def get_receipt(
    id: int,
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_role(["Student", "Admin", "SuperAdmin"]))
):
    has_admin = _is_admin(user)
    return svc.get_receipt(id, user.user_id, has_admin)


@m4_router.get("/me/receipts")
def get_my_receipts(
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_role(["Student"]))
):
    return svc.get_student_receipts(user.user_id)


@m4_router.get("/me/payments")
def get_my_payments(
    svc: M4Service = Depends(get_m4_service),
    user: CurrentUser = Depends(require_role(["Student"]))
):
    return svc.get_student_receipts(user.user_id)


@m4_router.get("/receipts", response_model=PaginatedResponse)
def get_all_receipts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    payment_mode: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_all_receipts(skip, page_size, search, payment_mode, start_date, end_date)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ─── Payment Ledger (F-08) ────────────────────────────────────────────────────

@m4_router.get("/payments", response_model=PaginatedResponse)
def get_payment_ledger(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    term_id: Optional[int] = None,
    payment_mode: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_payment_ledger(
        skip, page_size, search, program_id, term_id, payment_mode, status, start_date, end_date
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@m4_router.get("/payments/summary", response_model=PaymentLedgerSummaryResponse)
def get_payment_ledger_summary(
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.get_payment_ledger_summary()


@m4_router.get("/payments/export", response_class=PlainTextResponse)
def export_payment_ledger(
    program_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    items, _ = svc.get_payment_ledger(
        skip=0, limit=10000, program_id=program_id, start_date=start_date, end_date=end_date
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Receipt No", "Student ID", "Student Name", "Program", "Amount", "Mode", "Reference", "Date", "Status"])

    total_amount = 0.0
    for row in items:
        amt = float(row.get("amount") or 0.0)
        total_amount += amt
        writer.writerow([
            row.get("receipt_number") or "",
            row.get("global_student_id") or "",
            row.get("student_name") or "",
            row.get("program_name") or "",
            f"{amt:.2f}",
            row.get("payment_mode") or "",
            row.get("reference_no") or "",
            str(row.get("payment_date") or ""),
            row.get("status") or ""
        ])

    writer.writerow([])
    writer.writerow(["TOTAL", "", "", "", f"{total_amount:.2f}", "", "", "", ""])

    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="payment_ledger.csv"'}
    )


# ─── Defaulters (F-09) ────────────────────────────────────────────────────────

@m4_router.get("/fees/defaulters", response_model=PaginatedResponse)
def get_fee_defaulters(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = None,
    program_id: Optional[int] = None,
    term_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_fee_defaulters(skip, page_size, search, program_id, term_id, min_amount)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@m4_router.get("/fees/defaulters/summary", response_model=DefaulterSummaryResponse)
def get_defaulter_summary(
    program_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    return svc.get_defaulter_summary(program_id, min_amount)


@m4_router.get("/fees/defaulters/export", response_class=PlainTextResponse)
def export_fee_defaulters(
    program_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    items, _ = svc.get_fee_defaulters(skip=0, limit=10000, program_id=program_id, min_amount=min_amount)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Student Name", "Program", "Component", "Term", "Due Date", "Overdue Days", "Amount Due", "Amount Paid", "Late Fee", "Total Balance"])

    total_balance = 0.0
    for row in items:
        bal = float(row.get("total_balance") or 0.0)
        total_balance += bal
        writer.writerow([
            row.get("global_student_id") or "",
            row.get("student_name") or "",
            row.get("program_name") or "",
            row.get("component_name") or "",
            row.get("term_label") or "",
            str(row.get("due_date") or ""),
            row.get("overdue_days") or 0,
            f"{float(row.get('amount_due') or 0.0):.2f}",
            f"{float(row.get('amount_paid') or 0.0):.2f}",
            f"{float(row.get('late_fee') or 0.0):.2f}",
            f"{bal:.2f}"
        ])

    writer.writerow([])
    writer.writerow(["TOTAL OUTSTANDING", "", "", "", "", "", "", "", "", "", f"{total_balance:.2f}"])

    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="fee_defaulters.csv"'}
    )


# ─── Fee Change Audit Log (F-10) ──────────────────────────────────────────────

@m4_router.get("/audit/fees", response_model=PaginatedResponse)
def get_fee_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    entity_name: Optional[str] = None,
    changed_by: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    skip = (page - 1) * page_size
    items, total = svc.get_fee_audit_logs(skip, page_size, entity_name, changed_by, start_date, end_date)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ─── Reports & Touchpoints (RP-4, RP-5) ───────────────────────────────────────

@m4_router.get("/reports/fee-collection-summary", response_model=List[FeeCollectionSummaryItem])
def get_fee_collection_summary(
    threshold: float = Query(1000.0, ge=0),
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    """RP-4: Fee collection summary by program and term counting defaulters above threshold."""
    return svc.get_fee_collection_summary(threshold)


@m4_router.get("/reports/high-dues-students", response_model=List[HighDuesStudentItem])
def get_high_dues_students(
    svc: M4Service = Depends(get_m4_service),
    _=Depends(require_permission(["Finance_Admin"]))
):
    """RP-5: Students whose dues exceed the institutional average dues."""
    return svc.get_high_dues_students()
