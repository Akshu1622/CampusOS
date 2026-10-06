from pydantic import BaseModel, Field, constr
from typing import List, Optional
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

class FeeStructureBase(BaseModel):
    program_id: int
    term_id: int
    structure_name: constr(max_length=100)

class FeeStructureCreate(FeeStructureBase):
    components: List[FeeComponentCreate] = []

class FeeStructureUpdate(BaseModel):
    structure_name: Optional[constr(max_length=100)] = None

class FeeStructureResponse(FeeStructureBase):
    id: int
    components: List[FeeComponentResponse] = []

    class Config:
        from_attributes = True

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

class FeeAssignmentCreate(BaseModel):
    fee_structure_id: int
    student_ids: List[int] = Field(..., min_items=1)

class StudentFeeResponse(BaseModel):
    id: int
    student_id: int
    component_id: int
    component_name: str
    due_date: date
    amount_due: float
    amount_paid: float
    status: FeeStatus
    computed_late_fee: float = 0.0

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    due_ids: List[int] = Field(..., min_items=1)
    amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    reference_no: Optional[constr(max_length=50)] = None

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

class ReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    payment_id: int
    generated_at: datetime
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True

class FeeAuditLogResponse(BaseModel):
    id: int
    entity_name: str
    entity_id: int
    old_value: Optional[float] = None
    new_value: Optional[float] = None
    changed_by: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
