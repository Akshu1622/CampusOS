from pydantic import BaseModel, Field, constr
from typing import List, Optional, Any, Dict
from datetime import date, datetime
from enum import Enum


class RuleType(str, Enum):
    FLAT = "FLAT"
    PER_DAY = "PER_DAY"


class FeeStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


class PaymentMode(str, Enum):
    CASH = "CASH"
    ONLINE = "ONLINE"
    DD = "DD"


class PaymentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


# ─── Fee Component Schemas ────────────────────────────────────────────────────

class FeeComponentBase(BaseModel):
    component_name: constr(max_length=50)
    amount: float = Field(..., ge=0)
    due_date: date


class FeeComponentCreate(FeeComponentBase):
    pass


class FeeComponentUpdate(BaseModel):
    component_name: Optional[constr(max_length=50)] = None
    amount: Optional[float] = Field(None, ge=0)
    due_date: Optional[date] = None


class FeeComponentResponse(FeeComponentBase):
    id: int
    structure_id: int

    class Config:
        from_attributes = True


# ─── Fee Structure Schemas (F-01) ─────────────────────────────────────────────

class FeeStructureBase(BaseModel):
    program_id: int
    term_id: int
    structure_name: constr(max_length=100)


class FeeStructureCreate(FeeStructureBase):
    components: List[FeeComponentCreate] = []


class FeeStructureUpdate(BaseModel):
    structure_name: Optional[constr(max_length=100)] = None
    components: Optional[List[FeeComponentCreate]] = None


class FeeStructureListResponse(BaseModel):
    id: int
    program_id: int
    program_name: Optional[str] = None
    program_code: Optional[str] = None
    term_id: int
    term_label: Optional[str] = None
    structure_name: str
    components_count: int = 0
    total_amount: float = 0.0
    earliest_due_date: Optional[date] = None
    latest_due_date: Optional[date] = None
    status: str = "Active"

    class Config:
        from_attributes = True


class FeeStructureResponse(FeeStructureBase):
    id: int
    program_name: Optional[str] = None
    program_code: Optional[str] = None
    term_label: Optional[str] = None
    total_amount: float = 0.0
    components: List[FeeComponentResponse] = []

    class Config:
        from_attributes = True


# ─── Late Fee Rule Schemas (F-03) ─────────────────────────────────────────────

class LateFeeRuleBase(BaseModel):
    rule_type: RuleType
    penalty_amount: float = Field(..., ge=0)
    max_penalty: Optional[float] = Field(None, ge=0)


class LateFeeRuleCreate(LateFeeRuleBase):
    pass


class LateFeeRuleUpdate(BaseModel):
    rule_type: Optional[RuleType] = None
    penalty_amount: Optional[float] = Field(None, ge=0)
    max_penalty: Optional[float] = Field(None, ge=0)


class LateFeeRuleResponse(LateFeeRuleBase):
    id: int

    class Config:
        from_attributes = True


class LateFeeCalculateRequest(BaseModel):
    rule_id: Optional[int] = None
    due_date: date
    as_of_date: Optional[date] = None
    principal_amount: Optional[float] = None


class LateFeeCalculateResponse(BaseModel):
    rule_id: int
    rule_type: str
    penalty_amount: float
    max_penalty: Optional[float] = None
    due_date: date
    as_of_date: date
    days_late: int
    grace_days: int = 7
    computed_penalty: float
    projected_total: Optional[float] = None


# ─── Fee Assignment Schemas (F-02) ────────────────────────────────────────────

class FeeAssignmentCreate(BaseModel):
    fee_structure_id: int
    student_ids: Optional[List[int]] = None
    program_id: Optional[int] = None
    term_id: Optional[int] = None
    skip_existing: bool = True


class FeeAssignmentPreviewRequest(BaseModel):
    fee_structure_id: int
    student_ids: Optional[List[int]] = None
    program_id: Optional[int] = None
    term_id: Optional[int] = None


class FeeAssignmentPreviewResponse(BaseModel):
    fee_structure_id: int
    structure_name: str
    per_student_amount: float
    components_count: int
    total_students_in_scope: int
    already_assigned_count: int
    to_assign_count: int
    total_projected_amount: float
    sample_students: List[Dict[str, Any]] = []


class FeeAssignmentResultResponse(BaseModel):
    fee_structure_id: int
    structure_name: str
    assigned_count: int
    skipped_count: int
    total_assigned_amount: float
    message: str


# ─── Student Dues Schemas (F-04) ──────────────────────────────────────────────

class StudentFeeResponse(BaseModel):
    id: int
    student_id: int
    component_id: int
    component_name: str
    structure_name: Optional[str] = None
    term_label: Optional[str] = None
    due_date: date
    amount_due: float
    amount_paid: float
    balance: float
    status: FeeStatus
    computed_late_fee: float = 0.0
    total_payable: float = 0.0

    class Config:
        from_attributes = True


class StudentDuesSummaryResponse(BaseModel):
    total_payable: float = 0.0
    total_paid: float = 0.0
    total_outstanding: float = 0.0
    total_late_fee: float = 0.0
    dues: List[StudentFeeResponse] = []


# ─── Payment & Receipt Schemas (F-05, F-06, F-07, F-08) ──────────────────────

class PaymentCreate(BaseModel):
    due_ids: List[int] = Field(..., min_items=1)
    amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    reference_no: Optional[constr(max_length=50)] = None
    student_id: Optional[int] = None  # Populated for Admin recording on behalf of student


class PaymentResponse(BaseModel):
    id: int
    student_id: int
    amount: float
    payment_mode: PaymentMode
    reference_no: Optional[str] = None
    payment_date: datetime
    status: PaymentStatus

    class Config:
        from_attributes = True


class ReceiptLineItem(BaseModel):
    component_name: str
    due_date: date
    allocated_principal: float
    allocated_late_fee: float
    total_allocated: float


class ReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    payment_id: int
    generated_at: datetime
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True


class ReceiptDetailResponse(BaseModel):
    id: int
    receipt_number: str
    payment_id: int
    generated_at: datetime
    student_id: int
    student_name: str
    global_student_id: str
    student_email: Optional[str] = None
    program_name: Optional[str] = None
    amount: float
    payment_mode: str
    reference_no: Optional[str] = None
    payment_date: datetime
    line_items: List[ReceiptLineItem] = []
    total_principal: float = 0.0
    total_late_fee: float = 0.0


class PaymentLedgerItemResponse(BaseModel):
    id: int
    receipt_id: Optional[int] = None
    receipt_number: Optional[str] = None
    student_id: int
    student_name: str
    global_student_id: str
    program_name: Optional[str] = None
    amount: float
    payment_mode: str
    reference_no: Optional[str] = None
    payment_date: datetime
    status: str

    class Config:
        from_attributes = True


class PaymentLedgerSummaryResponse(BaseModel):
    collected_today: float = 0.0
    collected_this_month: float = 0.0
    total_collected: float = 0.0
    total_transactions: int = 0


# ─── Defaulters Schemas (F-09) ────────────────────────────────────────────────

class DefaulterItemResponse(BaseModel):
    student_id: int
    global_student_id: str
    student_name: str
    program_name: str
    component_name: str
    term_label: str
    due_date: date
    overdue_days: int
    amount_due: float
    amount_paid: float
    late_fee: float
    total_balance: float

    class Config:
        from_attributes = True


class DefaulterSummaryResponse(BaseModel):
    total_defaulters: int = 0
    total_outstanding: float = 0.0
    oldest_overdue_days: int = 0
    average_overdue_amount: float = 0.0


# ─── Fee Change Audit Log (F-10) ──────────────────────────────────────────────

class FeeAuditLogResponse(BaseModel):
    id: int
    entity_name: str
    entity_id: int
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    changed_by: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True


# ─── Reports (RP-4, RP-5) ─────────────────────────────────────────────────────

class FeeCollectionSummaryItem(BaseModel):
    program_name: str
    term_label: str
    total_due: float
    total_paid: float
    total_balance: float
    defaulters_count: int


class HighDuesStudentItem(BaseModel):
    student_id: int
    global_student_id: str
    first_name: str
    last_name: str
    program_name: str
    total_dues: float
    average_dues: float


# ─── Generic Pagination ───────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
