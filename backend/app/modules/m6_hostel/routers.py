from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission
from . import schemas, service

router = APIRouter(prefix="/api/v1", tags=["Hostel"])

# Admin access setup: Enforce Hostel_Admin or Super_Admin permission set
hostel_admin_perm = Depends(require_permission(["Hostel_Admin", "Super_Admin"]))
student_only = Depends(require_role(["Student"]))
student_or_admin = Depends(require_role(["Student", "Admin"]))

# --- Hostel ---
@router.post("/hostels", response_model=schemas.HostelResponse, status_code=status.HTTP_201_CREATED)
def create_hostel(data: schemas.HostelCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_hostel(db, data)

@router.get("/hostels", response_model=List[schemas.HostelResponse])
def get_hostels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = student_or_admin):
    return service.get_hostels(db, skip, limit)

@router.get("/hostels/occupancy", response_model=List[schemas.HostelOccupancyResponse])
def get_hostels_occupancy(db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_occupancy(db)

@router.get("/hostels/{hostel_id}", response_model=schemas.HostelResponse)
def get_hostel(hostel_id: int, db: Session = Depends(get_db), user: CurrentUser = student_or_admin):
    return service.get_hostel(db, hostel_id)

@router.put("/hostels/{hostel_id}", response_model=schemas.HostelResponse)
def update_hostel(hostel_id: int, data: schemas.HostelUpdate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.update_hostel(db, hostel_id, data)

@router.delete("/hostels/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hostel(hostel_id: int, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    service.delete_hostel(db, hostel_id)

# --- Room ---
@router.post("/rooms", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(data: schemas.RoomCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_room(db, data)

@router.get("/rooms", response_model=List[schemas.RoomResponse])
def get_rooms(hostel_id: Optional[int] = None, skip: int = 0, limit: int = 500, db: Session = Depends(get_db), user: CurrentUser = student_or_admin):
    return service.get_rooms(db, hostel_id, skip, limit)

@router.get("/rooms/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_room(db, room_id)

@router.put("/rooms/{room_id}", response_model=schemas.RoomResponse)
@router.patch("/rooms/{room_id}", response_model=schemas.RoomResponse)
def update_room(room_id: int, data: schemas.RoomUpdate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.update_room(db, room_id, data)

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    service.delete_room(db, room_id)

# --- Allocation & Roster ---
@router.post("/hostel-allocations", response_model=schemas.HostelAllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_room(data: schemas.HostelAllocationCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.allocate_room(db, data, user)

@router.get("/hostel-allocations", response_model=List[schemas.HostelAllocationResponse])
def get_allocations(
    hostel_id: Optional[int] = None,
    room_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    user: CurrentUser = hostel_admin_perm
):
    return service.get_allocations(db, hostel_id, room_id, status, search, skip, limit)

@router.patch("/hostel-allocations/{alloc_id}/vacate", response_model=schemas.HostelAllocationResponse)
def vacate_room(alloc_id: int, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.vacate_room(db, alloc_id)

@router.post("/hostel-allocations/{alloc_id}/transfer", response_model=schemas.HostelAllocationResponse)
def transfer_room(alloc_id: int, data: schemas.HostelAllocationTransfer, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.transfer_room(db, alloc_id, data)

@router.get("/me/hostel", response_model=Optional[schemas.HostelAllocationResponse])
def get_my_hostel(db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_allocation(db, user)

# --- Student Search for Allocation ---
@router.get("/hostel-students/search")
def search_students_for_hostel(q: str = Query(..., min_length=1), limit: int = 20, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.search_students(db, q, limit)

# --- Requests ---
@router.post("/hostel-requests", response_model=schemas.HostelRequestResponse, status_code=status.HTTP_201_CREATED)
def create_hostel_request(data: schemas.HostelRequestCreate, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.create_my_request(db, user, data)

@router.get("/me/hostel-requests", response_model=List[schemas.HostelRequestResponse])
def get_my_hostel_requests(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_requests(db, user, status, skip, limit)

@router.get("/hostel-requests", response_model=List[schemas.HostelRequestResponse])
def get_all_hostel_requests(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_all_requests(db, status, skip, limit)

@router.patch("/hostel-requests/{req_id}/decision", response_model=schemas.HostelRequestResponse)
def decide_hostel_request(req_id: int, data: schemas.HostelRequestDecision, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.decide_request(db, user, req_id, data)

# --- Complaints / Maintenance Tickets ---
@router.post("/hostel-complaints", response_model=schemas.HostelComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(data: schemas.HostelComplaintCreate, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.create_my_complaint(db, user, data)

@router.get("/me/hostel-complaints", response_model=List[schemas.HostelComplaintResponse])
def get_my_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_complaints(db, user, skip, limit)

@router.get("/hostel-complaints", response_model=List[schemas.HostelComplaintResponse])
def get_all_complaints(hostel_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_all_complaints(db, hostel_id, status, skip, limit)

@router.patch("/hostel-complaints/{complaint_id}/status", response_model=schemas.HostelComplaintResponse)
@router.patch("/hostel-complaints/{complaint_id}", response_model=schemas.HostelComplaintResponse)
def update_complaint_status(complaint_id: int, data: schemas.HostelComplaintUpdate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.update_complaint_status(db, complaint_id, data)

# --- Inspections ---
@router.post("/hostel-inspections", response_model=schemas.HostelInspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(data: schemas.HostelInspectionCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_inspection(db, data)

@router.get("/hostel-inspections", response_model=List[schemas.HostelInspectionResponse])
def get_inspections(room_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_inspections(db, room_id, skip, limit)

# --- Notices ---
@router.post("/hostel-notices", response_model=schemas.HostelNoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(data: schemas.HostelNoticeCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_notice(db, user, data)

@router.get("/hostel-notices", response_model=List[schemas.HostelNoticeResponse])
def get_notices(hostel_id: Optional[int] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db), user: CurrentUser = student_or_admin):
    return service.get_notices(db, hostel_id, skip, limit)

# --- Outpasses ---
@router.post("/hostel-outpasses", response_model=schemas.HostelOutpassResponse, status_code=status.HTTP_201_CREATED)
def create_outpass(data: schemas.HostelOutpassCreate, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.create_my_outpass(db, user, data)

@router.get("/me/hostel-outpasses", response_model=List[schemas.HostelOutpassResponse])
def get_my_outpasses(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_outpasses(db, user, status, skip, limit)

@router.get("/hostel-outpasses", response_model=List[schemas.HostelOutpassResponse])
def get_all_outpasses(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_all_outpasses(db, status, skip, limit)

@router.patch("/hostel-outpasses/{outpass_id}/decision", response_model=schemas.HostelOutpassResponse)
def decide_outpass(outpass_id: int, data: schemas.HostelOutpassDecision, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.decide_outpass(db, user, outpass_id, data)

# --- SIGNATURE FEATURES ENDPOINTS ---

# Feature A: Hostel Data Integrity Guardian
@router.get("/hostel-integrity/guardian", response_model=schemas.IntegrityGuardianReport)
def get_integrity_guardian_report(db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.run_integrity_guardian(db)

# Feature B: Explainable Smart Allocation Lab
@router.post("/hostel-lab/smart-allocation", response_model=schemas.SmartAllocationResponse)
def get_smart_allocation_recommendations(req: schemas.SmartAllocationRequest, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_smart_allocation(db, req.student_id, req.preferred_hostel_id)

# Feature C: Capacity What-If Simulator
@router.post("/hostel-simulator/capacity-what-if", response_model=schemas.CapacitySimulationResponse)
def simulate_capacity_what_if(params: schemas.SimulatorParameter, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.simulate_capacity_what_if(db, params)

# Feature D: Hostel Change Impact Radar
@router.post("/hostel-radar/change-impact", response_model=schemas.ImpactRadarResponse)
def analyze_change_impact(req: schemas.ImpactRadarRequest, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.analyze_change_impact(db, req)

# Feature E: Student Hostel Journey
@router.get("/me/hostel-journey", response_model=schemas.StudentJourneyResponse)
def get_my_hostel_journey(db: Session = Depends(get_db), user: CurrentUser = student_only):
    student_id = service.get_student_id(db, user.user_id)
    return service.get_student_journey(db, student_id)

@router.get("/hostel-journey/{student_id}", response_model=schemas.StudentJourneyResponse)
def get_student_hostel_journey(student_id: int, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_student_journey(db, student_id)

# --- Waitlist Endpoints ---
@router.post("/hostel-waitlist", response_model=schemas.HostelWaitlistResponse, status_code=status.HTTP_201_CREATED)
def create_waitlist_entry(data: schemas.HostelWaitlistCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_waitlist_entry(db, data)

@router.get("/hostel-waitlist", response_model=List[schemas.HostelWaitlistResponse])
def get_waitlist_entries(hostel_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_waitlist_entries(db, hostel_id, status)

@router.patch("/hostel-waitlist/{waitlist_id}/status", response_model=schemas.HostelWaitlistResponse)
def update_waitlist_entry(waitlist_id: int, data: schemas.HostelWaitlistUpdate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.update_waitlist_entry(db, waitlist_id, data)

# --- Visitor Endpoints ---
@router.post("/hostel-visitors", response_model=schemas.HostelVisitorResponse, status_code=status.HTTP_201_CREATED)
def register_visitor(data: schemas.HostelVisitorCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.register_visitor(db, data)

@router.get("/hostel-visitors", response_model=List[schemas.HostelVisitorResponse])
def get_visitors(hostel_id: Optional[int] = None, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_visitors(db, hostel_id)

@router.patch("/hostel-visitors/{visitor_id}/exit", response_model=schemas.HostelVisitorResponse)
def record_visitor_departure(visitor_id: int, data: schemas.HostelVisitorExit, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.record_visitor_departure(db, visitor_id, data.exit_time)

# --- CSV Demographics Import ---
class CSVUploadPayload(schemas.BaseModel):
    csv_content: str

@router.post("/hostel/students/import-demographics-csv", response_model=schemas.StudentDemographicsCSVImportResponse)
def import_student_demographics_csv(payload: CSVUploadPayload, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.import_student_demographics_csv(db, payload.csv_content)

@router.post("/hostel/rooms/import-csv", response_model=schemas.RoomInventoryCSVImportResponse)
def import_rooms_csv(payload: CSVUploadPayload, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.import_rooms_csv(db, payload.csv_content)

# --- Allocation Letter Download/Print ---
@router.get("/hostel-allocations/{allocation_id}/letter", response_model=schemas.AllocationLetterResponse)
def get_allocation_letter(allocation_id: int, db: Session = Depends(get_db), user: CurrentUser = student_or_admin):
    return service.generate_allocation_letter(db, allocation_id)

# --- Minimal Hostel Fee Management Endpoints ---
@router.get("/hostel-fees/summary", response_model=schemas.HostelFeeSummary)
def get_fee_summary(db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_fee_summary(db)

@router.get("/hostel-fees/configs", response_model=List[schemas.HostelFeeConfigResponse])
def get_fee_configs(hostel_id: Optional[int] = None, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.get_fee_configs(db, hostel_id)

@router.post("/hostel-fees/configs", response_model=schemas.HostelFeeConfigResponse, status_code=status.HTTP_201_CREATED)
def create_fee_config(data: schemas.HostelFeeConfigCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_fee_config(db, data)

@router.get("/hostel-fees/invoices", response_model=List[schemas.HostelInvoiceResponse])
def get_hostel_invoices(
    student_id: Optional[int] = None,
    hostel_id: Optional[int] = None,
    status_val: Optional[str] = None,
    db: Session = Depends(get_db),
    user: CurrentUser = hostel_admin_perm
):
    return service.get_invoices(db, student_id, hostel_id, status_val)

@router.post("/hostel-fees/invoices", response_model=schemas.HostelInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_hostel_invoice(data: schemas.HostelInvoiceCreate, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.create_invoice(db, data)

@router.post("/hostel-fees/invoices/generate-batch")
def generate_batch_invoices(fee_config_id: Optional[int] = None, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.generate_batch_invoices(db, fee_config_id)

@router.get("/hostel-fees/payments", response_model=List[schemas.HostelPaymentResponse])
def get_all_hostel_payments(
    invoice_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status_val: Optional[str] = None,
    db: Session = Depends(get_db),
    user: CurrentUser = hostel_admin_perm
):
    return service.get_hostel_payments(db, invoice_id, student_id, status_val)

@router.post("/hostel-fees/payments/{payment_id}/verify")
def verify_hostel_payment(payment_id: int, data: schemas.HostelPaymentVerify, db: Session = Depends(get_db), user: CurrentUser = hostel_admin_perm):
    return service.verify_hostel_payment(db, payment_id, user.user_id, data)

# --- Student Hostel Fee Endpoints ---
@router.get("/me/hostel-fees/invoices", response_model=List[schemas.HostelInvoiceResponse])
def get_my_hostel_invoices(db: Session = Depends(get_db), user: CurrentUser = student_only):
    student_id = service.get_student_id(db, user.user_id)
    return service.get_invoices(db, student_id=student_id)

@router.post("/me/hostel-fees/pay", response_model=schemas.HostelPaymentResponse, status_code=status.HTTP_201_CREATED)
def pay_my_hostel_fee(data: schemas.HostelPaymentSubmit, db: Session = Depends(get_db), user: CurrentUser = student_only):
    student_id = service.get_student_id(db, user.user_id)
    return service.submit_hostel_payment(db, data, student_id)

@router.get("/me/hostel-fees/payments", response_model=List[schemas.HostelPaymentResponse])
def get_my_hostel_payments(db: Session = Depends(get_db), user: CurrentUser = student_only):
    student_id = service.get_student_id(db, user.user_id)
    return service.get_hostel_payments(db, student_id=student_id)
