from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import CurrentUser, require_role, require_permission
from app.modules.m4_finance.schemas import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse,
    LateFeeRuleCreate, LateFeeRuleUpdate, LateFeeRuleResponse,
    FeeAssignmentCreate, StudentFeeResponse,
    PaymentCreate, PaymentResponse, ReceiptResponse,
    FeeAuditLogResponse, PaginatedResponse
)
from app.modules.m4_finance.service import M4Service

m4_router = APIRouter(tags=["Finance"])

def get_m4_service(db: Session = Depends(get_db)):
    return M4Service(db)

# --- Fee Structures ---
@m4_router.post("/fee-structures", status_code=status.HTTP_201_CREATED)
def create_fee_structure(data: FeeStructureCreate, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    data_dict = data.model_dump(exclude={"components"})
    comps = [c.model_dump() for c in data.components]
    id = svc.create_fee_structure(data_dict, comps)
    return svc.get_fee_structure(id)

@m4_router.get("/fee-structures", response_model=PaginatedResponse)
def get_fee_structures(page: int = 1, page_size: int = 20, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    items = svc.get_fee_structures((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m4_router.get("/fee-structures/{id}")
def get_fee_structure(id: int, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    return svc.get_fee_structure(id)

@m4_router.put("/fee-structures/{id}")
def update_fee_structure(id: int, data: FeeStructureUpdate, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    svc.update_fee_structure(id, data.model_dump(exclude_unset=True))
    return svc.get_fee_structure(id)

@m4_router.delete("/fee-structures/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fee_structure(id: int, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    svc.delete_fee_structure(id)

# --- Late Fee Rules ---
@m4_router.post("/late-fee-rules", status_code=status.HTTP_201_CREATED, response_model=LateFeeRuleResponse)
def create_late_fee_rule(data: LateFeeRuleCreate, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    id = svc.create_late_fee_rule(data.model_dump())
    return svc.get_late_fee_rule(id)

@m4_router.get("/late-fee-rules", response_model=PaginatedResponse)
def get_late_fee_rules(page: int = 1, page_size: int = 20, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    items = svc.get_late_fee_rules((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m4_router.get("/late-fee-rules/{id}", response_model=LateFeeRuleResponse)
def get_late_fee_rule(id: int, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    return svc.get_late_fee_rule(id)

@m4_router.put("/late-fee-rules/{id}", response_model=LateFeeRuleResponse)
def update_late_fee_rule(id: int, data: LateFeeRuleUpdate, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    svc.update_late_fee_rule(id, data.model_dump(exclude_unset=True))
    return svc.get_late_fee_rule(id)

@m4_router.delete("/late-fee-rules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_late_fee_rule(id: int, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    svc.delete_late_fee_rule(id)

# --- Fee Assignments ---
@m4_router.post("/fee-assignments", status_code=status.HTTP_201_CREATED)
def assign_fees(data: FeeAssignmentCreate, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    svc.assign_fees(data.fee_structure_id, data.student_ids)
    return {"message": "Fees assigned successfully"}

# --- Student Dues and Payments ---
@m4_router.get("/me/dues")
def get_my_dues(svc: M4Service = Depends(get_m4_service), user: CurrentUser = Depends(require_role(["Student"]))):
    items = svc.get_my_dues(user.user_id)
    return [dict(i._mapping) for i in items]

@m4_router.post("/payments", status_code=status.HTTP_201_CREATED)
def pay_fee(data: PaymentCreate, svc: M4Service = Depends(get_m4_service), user: CurrentUser = Depends(require_role(["Student", "Admin"]))):
    return svc.pay_fee(user.user_id, data.due_ids, data.amount, data.payment_mode, data.reference_no)

@m4_router.get("/receipts/{id}")
def get_receipt(id: int, svc: M4Service = Depends(get_m4_service), user: CurrentUser = Depends(require_role(["Student", "Admin"]))):
    has_admin = "Admin" in user.permission_sets
    return svc.get_receipt(id, user.user_id, has_admin)

@m4_router.get("/me/payments")
def get_my_payments(svc: M4Service = Depends(get_m4_service), user: CurrentUser = Depends(require_role(["Student"]))):
    items = svc.get_my_payments(user.user_id)
    return [dict(i._mapping) for i in items]

@m4_router.get("/payments", response_model=PaginatedResponse)
def get_all_payments(page: int = 1, page_size: int = 20, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    items = svc.get_all_payments((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

# --- Reports & Audit ---
@m4_router.get("/fees/defaulters", response_model=PaginatedResponse)
def get_fee_defaulters(page: int = 1, page_size: int = 20, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    items = svc.get_fee_defaulters((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m4_router.get("/audit/fees", response_model=PaginatedResponse)
def get_fee_audit_logs(page: int = 1, page_size: int = 20, svc: M4Service = Depends(get_m4_service), _=Depends(require_permission(["Finance_Admin"]))):
    items = svc.get_fee_audit_logs((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}
