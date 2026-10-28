from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import date, datetime

class GenderBlock(str, Enum):
    MALE = 'MALE'
    FEMALE = 'FEMALE'
    COED = 'COED'

class StudentGender(str, Enum):
    MALE = 'MALE'
    FEMALE = 'FEMALE'
    OTHER = 'OTHER'

class AllocationStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    VACATED = 'VACATED'

class RequestType(str, Enum):
    ALLOCATION = 'ALLOCATION'
    ROOM_CHANGE = 'ROOM_CHANGE'
    VACATE = 'VACATE'

class RequestStatus(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class ComplaintCategory(str, Enum):
    ELECTRICAL = 'ELECTRICAL'
    PLUMBING = 'PLUMBING'
    MESS_FOOD = 'MESS_FOOD'
    CLEANING_SANITATION = 'CLEANING_SANITATION'
    WATER_UTILITIES = 'WATER_UTILITIES'
    INTERNET_WIFI = 'INTERNET_WIFI'
    ROOM_FURNITURE = 'ROOM_FURNITURE'
    CARPENTRY = 'CARPENTRY'
    CLEANING = 'CLEANING'
    INTERNET = 'INTERNET'
    OTHER = 'OTHER'

class ComplaintPriority(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    EMERGENCY = 'EMERGENCY'

class ComplaintStatus(str, Enum):
    SUBMITTED = 'SUBMITTED'
    ASSIGNED = 'ASSIGNED'
    IN_PROGRESS = 'IN_PROGRESS'
    RESOLVED = 'RESOLVED'
    CLOSED = 'CLOSED'

class InspectionType(str, Enum):
    MOVE_IN = 'MOVE_IN'
    MOVE_OUT = 'MOVE_OUT'
    ROUTINE = 'ROUTINE'
    MAINTENANCE = 'MAINTENANCE'

class FixtureCondition(str, Enum):
    EXCELLENT = 'EXCELLENT'
    GOOD = 'GOOD'
    FAIR = 'FAIR'
    DAMAGED = 'DAMAGED'

class NoticePriority(str, Enum):
    NORMAL = 'NORMAL'
    IMPORTANT = 'IMPORTANT'
    URGENT = 'URGENT'

# --- Hostel ---
class HostelBase(BaseModel):
    name: str = Field(..., max_length=100)
    gender_block: GenderBlock
    total_capacity: int = Field(0, ge=0)

class HostelCreate(HostelBase):
    pass

class HostelUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    gender_block: Optional[GenderBlock] = None
    total_capacity: Optional[int] = Field(None, ge=0)

class HostelResponse(HostelBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Room ---
class RoomBase(BaseModel):
    hostel_id: int
    room_number: str = Field(..., max_length=20)
    bed_capacity: int = Field(..., gt=0)

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    hostel_id: Optional[int] = None
    room_number: Optional[str] = Field(None, max_length=20)
    bed_capacity: Optional[int] = Field(None, gt=0)

class RoomResponse(RoomBase):
    id: int
    available_beds: int = Field(..., ge=0)
    hostel_name: Optional[str] = None
    gender_block: Optional[GenderBlock] = None
    readiness_status: Optional[str] = 'READY'
    model_config = ConfigDict(from_attributes=True)

# --- Hostel Allocation ---
class HostelAllocationBase(BaseModel):
    student_id: int
    room_id: int
    from_date: date
    to_date: Optional[date] = None
    bed_number: Optional[str] = None

class HostelAllocationCreate(HostelAllocationBase):
    pass

class HostelAllocationTransfer(BaseModel):
    new_room_id: int
    new_bed_number: Optional[str] = None

class HostelAllocationUpdate(BaseModel):
    to_date: Optional[date] = None

class HostelAllocationResponse(HostelAllocationBase):
    id: int
    status: AllocationStatus
    global_student_id: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_gender: Optional[str] = None
    room_number: Optional[str] = None
    hostel_id: Optional[int] = None
    hostel_name: Optional[str] = None
    gender_block: Optional[GenderBlock] = None
    allocated_by: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Hostel Request ---
class HostelRequestBase(BaseModel):
    request_type: RequestType
    details: Optional[str] = None
    preferred_hostel_id: Optional[int] = None
    preferred_room_id: Optional[int] = None

class HostelRequestCreate(HostelRequestBase):
    pass

class HostelRequestDecision(BaseModel):
    status: RequestStatus
    remark: Optional[str] = None

class HostelRequestResponse(HostelRequestBase):
    id: int
    student_id: int
    status: RequestStatus
    decision_by: Optional[int] = None
    remark: Optional[str] = None
    global_student_id: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_gender: Optional[str] = None
    program_code: Optional[str] = None
    preferred_hostel_name: Optional[str] = None
    preferred_room_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Occupancy Dashboard ---
class HostelOccupancyResponse(BaseModel):
    hostel_id: int
    hostel_name: str
    gender_block: GenderBlock
    total_capacity: int
    occupied_beds: int
    available_beds: int
    occupancy_pct: Optional[float] = None

# --- Complaints / Maintenance ---
class HostelComplaintCreate(BaseModel):
    hostel_id: int
    room_id: Optional[int] = None
    category: ComplaintCategory
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    title: str = Field(..., max_length=150)
    description: str

class HostelComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class HostelComplaintResponse(BaseModel):
    id: int
    student_id: int
    hostel_id: int
    room_id: Optional[int] = None
    category: ComplaintCategory
    priority: ComplaintPriority
    title: str
    description: str
    status: ComplaintStatus
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    hostel_name: Optional[str] = None
    room_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Inspections ---
class HostelInspectionCreate(BaseModel):
    room_id: int
    student_id: Optional[int] = None
    inspection_type: InspectionType
    cleanliness_rating: int = Field(5, ge=1, le=5)
    fixtures_condition: FixtureCondition = FixtureCondition.GOOD
    inventory_checked: bool = True
    remarks: Optional[str] = None
    inspector_name: str = Field(..., max_length=100)

class HostelInspectionResponse(BaseModel):
    id: int
    room_id: int
    student_id: Optional[int] = None
    inspection_type: InspectionType
    cleanliness_rating: int
    fixtures_condition: FixtureCondition
    inventory_checked: bool
    remarks: Optional[str] = None
    inspector_name: str
    created_at: datetime
    room_number: Optional[str] = None
    hostel_name: Optional[str] = None
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Notices ---
class HostelNoticeCreate(BaseModel):
    hostel_id: Optional[int] = None
    title: str = Field(..., max_length=200)
    content: str
    priority: NoticePriority = NoticePriority.NORMAL

class HostelNoticeResponse(BaseModel):
    id: int
    hostel_id: Optional[int] = None
    title: str
    content: str
    priority: NoticePriority
    published_by: Optional[int] = None
    created_at: datetime
    hostel_name: Optional[str] = None
    publisher_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Outpasses ---
class HostelOutpassCreate(BaseModel):
    from_datetime: datetime
    to_datetime: datetime
    destination: str = Field(..., max_length=200)
    reason: str

class HostelOutpassDecision(BaseModel):
    status: RequestStatus
    decision_remark: Optional[str] = None

class HostelOutpassResponse(BaseModel):
    id: int
    student_id: int
    from_datetime: datetime
    to_datetime: datetime
    destination: str
    reason: str
    status: RequestStatus
    decision_by: Optional[int] = None
    decision_remark: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Signature Features Schemas ---

# Feature A: Hostel Data Integrity Guardian
class IntegrityFinding(BaseModel):
    code: str
    severity: str # 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'
    entity: str
    record_id: Optional[int] = None
    reference_key: Optional[str] = None
    description: str
    recommended_action: str

class IntegrityGuardianReport(BaseModel):
    status: str # 'HEALTHY' | 'WARNINGS' | 'CRITICAL_ISSUES'
    total_checks_run: int
    critical_count: int
    high_count: int
    medium_count: int
    findings: List[IntegrityFinding]

# Feature B: Explainable Smart Allocation Lab
class SmartAllocationRequest(BaseModel):
    student_id: int
    preferred_hostel_id: Optional[int] = None

class RoomScoreDetail(BaseModel):
    room_id: int
    room_number: str
    hostel_id: int
    hostel_name: str
    gender_block: GenderBlock
    bed_capacity: int
    available_beds: int
    score: int
    eligible: bool
    reasons: List[str]
    suggested_bed: str

class SmartAllocationResponse(BaseModel):
    student_id: int
    global_student_id: str
    student_name: str
    gender: Optional[str] = None
    is_eligible: bool
    eligibility_note: str
    recommended_rooms: List[RoomScoreDetail]

# Feature C: Capacity What-If Simulator
class SimulatorParameter(BaseModel):
    hostel_id: Optional[int] = None
    additional_male_applicants: int = 0
    additional_female_applicants: int = 0
    extra_male_applicants: Optional[int] = None
    extra_female_applicants: Optional[int] = None
    closed_room_ids: List[int] = []
    capacity_delta_by_room: Dict[int, int] = {} # room_id -> delta

class SimulatedHostelMetric(BaseModel):
    hostel_id: int
    hostel_name: str
    gender_block: GenderBlock
    current_capacity: int
    simulated_capacity: int
    current_available: int
    simulated_available: int
    projected_shortage: int
    utilization_rate: float

class CapacitySimulationResponse(BaseModel):
    is_simulation: bool = True
    parameters_applied: SimulatorParameter
    hostel_projections: List[SimulatedHostelMetric]
    overall_campus_shortage: int
    recommendations: List[str]

# Feature D: Hostel Change Impact Radar
class ImpactRadarRequest(BaseModel):
    target_action: str = 'CLOSE_ROOM' # 'CLOSE_ROOM' | 'CHANGE_CAPACITY' | 'CONVERT_BLOCK'
    target_room_ids: List[int] = []
    closed_room_ids: Optional[List[int]] = None
    target_hostel_id: Optional[int] = None
    new_gender_block: Optional[GenderBlock] = None

class ImpactAffectedResident(BaseModel):
    student_id: int
    global_student_id: str
    student_name: str
    room_id: int
    room_number: str
    hostel_name: str
    suggested_alternate_room_id: Optional[int] = None
    suggested_alternate_room_number: Optional[str] = None

class ImpactRadarResponse(BaseModel):
    action: str
    severity_level: str # 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING'
    displaced_residents_count: int
    capacity_loss: int
    affected_residents: List[ImpactAffectedResident]
    mitigation_options: List[str]

# Feature E: Student Hostel Journey
class JourneyEvent(BaseModel):
    event_type: str # 'APPLICATION' | 'APPROVAL' | 'REJECTION' | 'ALLOCATION' | 'TRANSFER' | 'INSPECTION' | 'COMPLAINT' | 'VACATE'
    timestamp: datetime
    title: str
    description: str
    status_badge: Optional[str] = None
    badge_variant: Optional[str] = None # 'success' | 'warning' | 'error' | 'neutral'
    metadata: Dict[str, Any] = {}

class StudentJourneyResponse(BaseModel):
    student_id: int
    global_student_id: str
    student_name: str
    current_status: str
    current_hostel: Optional[str] = None
    current_room: Optional[str] = None
    events: List[JourneyEvent]

# --- Waitlist Schemas ---
class WaitlistStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    ALLOTTED = 'ALLOTTED'
    CANCELLED = 'CANCELLED'

class HostelWaitlistCreate(BaseModel):
    student_id: int
    preferred_hostel_id: int
    preferred_room_id: Optional[int] = None
    priority_score: int = Field(50, ge=1, le=100)
    notes: Optional[str] = None

class HostelWaitlistUpdate(BaseModel):
    status: WaitlistStatus
    notes: Optional[str] = None

class HostelWaitlistResponse(BaseModel):
    id: int
    student_id: int
    preferred_hostel_id: int
    preferred_room_id: Optional[int] = None
    priority_score: int
    status: WaitlistStatus
    notes: Optional[str] = None
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    preferred_hostel_name: Optional[str] = None
    preferred_room_number: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Visitor Tracking Schemas ---
class HostelVisitorCreate(BaseModel):
    hostel_id: int
    student_id: int
    visitor_name: str = Field(..., max_length=100)
    relationship: str = Field('Parent', max_length=50)
    id_proof_type: str = Field('Government ID', max_length=50)
    id_proof_number: Optional[str] = None
    entry_time: datetime
    purpose: str = Field(..., max_length=255)

class HostelVisitorExit(BaseModel):
    exit_time: datetime

class HostelVisitorResponse(BaseModel):
    id: int
    hostel_id: int
    student_id: int
    visitor_name: str
    relationship: str
    id_proof_type: str
    id_proof_number: Optional[str] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    purpose: str
    gate_pass_number: Optional[str] = None
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    hostel_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- CSV Demographics Import Schemas ---
class StudentDemographicsCSVRow(BaseModel):
    global_student_id: str
    gender: Optional[str] = None
    is_hostel_eligible: Optional[bool] = True
    remarks: Optional[str] = None

class StudentDemographicsCSVImportResponse(BaseModel):
    total_processed: int
    updated_count: int
    skipped_count: int
    errors: List[str] = []
    sample_records: List[Dict[str, Any]] = []

class RoomInventoryCSVImportResponse(BaseModel):
    total_processed: int
    created_count: int
    updated_count: int
    skipped_count: int
    errors: List[str] = []
    sample_records: List[Dict[str, Any]] = []

# --- Allocation Letter Schema ---
class AllocationLetterResponse(BaseModel):
    letter_id: str
    issued_date: str
    academic_term: str
    student: Dict[str, Any]
    accommodation: Dict[str, Any]
    rules_and_terms: List[str]

# --- Minimal Hostel Fee Management Schemas ---
class HostelFeeConfigCreate(BaseModel):
    hostel_id: Optional[int] = None
    fee_name: str = Field(..., max_length=150)
    amount: float = Field(..., gt=0)
    academic_term: str = Field("AY-2026-27-SEM1", max_length=50)
    due_days: int = Field(30, ge=1, le=180)

class HostelFeeConfigResponse(BaseModel):
    id: int
    hostel_id: Optional[int] = None
    hostel_name: Optional[str] = None
    fee_name: str
    amount: float
    academic_term: str
    due_days: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HostelInvoiceCreate(BaseModel):
    student_id: int
    hostel_id: int
    fee_config_id: Optional[int] = None
    title: str = Field(..., max_length=150)
    amount: float = Field(..., gt=0)
    due_date: date

class HostelInvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    student_id: int
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    hostel_id: int
    hostel_name: Optional[str] = None
    fee_config_id: Optional[int] = None
    title: str
    amount: float
    amount_paid: float
    balance: float
    due_date: date
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HostelPaymentSubmit(BaseModel):
    invoice_id: int
    amount_paid: float = Field(..., gt=0)
    payment_method: str = Field("UPI", max_length=20) # 'UPI' | 'DEMO' | 'BANK_TRANSFER'
    payment_reference: str = Field(..., min_length=4, max_length=100) # UTR or Demo Ref
    proof_notes: Optional[str] = None

class HostelPaymentVerify(BaseModel):
    status: str = Field(..., pattern="^(VERIFIED|REJECTED)$")
    verification_notes: Optional[str] = None

class HostelPaymentResponse(BaseModel):
    id: int
    payment_number: str
    invoice_id: int
    invoice_number: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    amount_paid: float
    payment_method: str
    payment_reference: str
    upi_id: str
    proof_notes: Optional[str] = None
    status: str
    verified_by: Optional[int] = None
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HostelFeeSummary(BaseModel):
    total_invoiced: float
    total_collected: float
    total_pending: float
    invoices_count: int
    pending_verification_count: int
