from sqlalchemy.orm import Session
from fastapi import status
from typing import List, Optional, Dict, Any
from app.core.errors import APIError
from app.dependencies.auth import CurrentUser
from . import schemas, repository

# Dependency: get student_id for a given user
def get_student_id(db: Session, user_id: int) -> int:
    from sqlalchemy import text
    query = text("SELECT student_id FROM user_account WHERE id = :uid")
    res = db.execute(query, {"uid": user_id}).scalar()
    if not res:
        raise APIError("STUDENT_NOT_FOUND", "No student record found for this user account.", status.HTTP_404_NOT_FOUND)
    return res

# --- Hostel ---
def create_hostel(db: Session, data: schemas.HostelCreate) -> schemas.HostelResponse:
    try:
        h_id = repository.create_hostel(db, data)
        return get_hostel(db, h_id)
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_hostel_name" in str(e):
            raise APIError("DUPLICATE_HOSTEL", f"Hostel '{data.name}' already exists.", status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status.HTTP_400_BAD_REQUEST)

def get_hostel(db: Session, hostel_id: int) -> schemas.HostelResponse:
    h = repository.get_hostel(db, hostel_id)
    if not h:
        raise APIError("NOT_FOUND", f"Hostel with ID {hostel_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.HostelResponse(**h)

def get_hostels(db: Session, skip: int = 0, limit: int = 100) -> List[schemas.HostelResponse]:
    hs = repository.get_hostels(db, skip, limit)
    return [schemas.HostelResponse(**h) for h in hs]

def update_hostel(db: Session, hostel_id: int, data: schemas.HostelUpdate) -> schemas.HostelResponse:
    get_hostel(db, hostel_id)
    repository.update_hostel(db, hostel_id, data)
    return get_hostel(db, hostel_id)

def delete_hostel(db: Session, hostel_id: int):
    get_hostel(db, hostel_id)
    # Check if rooms exist
    rooms = repository.get_rooms(db, hostel_id=hostel_id, limit=1)
    if rooms:
        raise APIError("HOSTEL_HAS_ROOMS", "Cannot delete hostel that contains rooms. Remove or transfer rooms first.", status.HTTP_400_BAD_REQUEST)
    repository.delete_hostel(db, hostel_id)

# --- Room ---
def create_room(db: Session, data: schemas.RoomCreate) -> schemas.RoomResponse:
    get_hostel(db, data.hostel_id)
    try:
        r_id = repository.create_room(db, data)
        return get_room(db, r_id)
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_hostel_room" in str(e):
            raise APIError("DUPLICATE_ROOM", f"Room '{data.room_number}' already exists in this hostel.", status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status.HTTP_400_BAD_REQUEST)

def get_room(db: Session, room_id: int) -> schemas.RoomResponse:
    r = repository.get_room(db, room_id)
    if not r:
        raise APIError("NOT_FOUND", f"Room with ID {room_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.RoomResponse(**r)

def get_rooms(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 500) -> List[schemas.RoomResponse]:
    if hostel_id:
        get_hostel(db, hostel_id)
    rs = repository.get_rooms(db, hostel_id, skip, limit)
    return [schemas.RoomResponse(**r) for r in rs]

def update_room(db: Session, room_id: int, data: schemas.RoomUpdate) -> schemas.RoomResponse:
    get_room(db, room_id)
    if data.hostel_id:
        get_hostel(db, data.hostel_id)
    repository.update_room(db, room_id, data)
    return get_room(db, room_id)

def delete_room(db: Session, room_id: int):
    get_room(db, room_id)
    allocations = repository.get_allocations(db, room_id=room_id, status="ACTIVE", limit=1)
    if allocations:
        raise APIError("ROOM_OCCUPIED", "Cannot delete room with active residents. Vacate or transfer residents first.", status.HTTP_400_BAD_REQUEST)
    repository.delete_room(db, room_id)

# --- Allocation ---
def validate_student_eligibility(db: Session, student_id: int, hostel_gender_block: schemas.GenderBlock):
    student = repository.get_student_details(db, student_id)
    if not student:
        raise APIError("STUDENT_NOT_FOUND", f"Student with ID {student_id} not found.", status.HTTP_404_NOT_FOUND)

    if student.get("status") != "ACTIVE":
        raise APIError("STUDENT_NOT_ACTIVE", f"Student account is {student.get('status')}; only active students can receive hostel accommodation.", status.HTTP_422_UNPROCESSABLE_ENTITY)

    if not student.get("is_hostel_eligible", True):
        raise APIError("NOT_HOSTEL_ELIGIBLE", "Student is marked as ineligible for on-campus hostel accommodation.", status.HTTP_422_UNPROCESSABLE_ENTITY)

    student_gender = student.get("gender")
    if hostel_gender_block == schemas.GenderBlock.MALE:
        if student_gender is None:
            raise APIError("DEMOGRAPHICS_UNVERIFIED", "Student demographic profile (gender) is unverified. Cannot allocate to gender-segregated Male hostel.", status.HTTP_422_UNPROCESSABLE_ENTITY)
        if student_gender != "MALE":
            raise APIError("GENDER_MISMATCH", f"Gender mismatch: Student is recorded as {student_gender}, but selected hostel is a MALE block.", status.HTTP_422_UNPROCESSABLE_ENTITY)
    elif hostel_gender_block == schemas.GenderBlock.FEMALE:
        if student_gender is None:
            raise APIError("DEMOGRAPHICS_UNVERIFIED", "Student demographic profile (gender) is unverified. Cannot allocate to gender-segregated Female hostel.", status.HTTP_422_UNPROCESSABLE_ENTITY)
        if student_gender != "FEMALE":
            raise APIError("GENDER_MISMATCH", f"Gender mismatch: Student is recorded as {student_gender}, but selected hostel is a FEMALE block.", status.HTTP_422_UNPROCESSABLE_ENTITY)

def allocate_room(db: Session, data: schemas.HostelAllocationCreate, admin_user: CurrentUser) -> schemas.HostelAllocationResponse:
    room = get_room(db, data.room_id)
    hostel = get_hostel(db, room.hostel_id)

    # Enforce demographic and status eligibility
    validate_student_eligibility(db, data.student_id, hostel.gender_block)

    # Check bed capacity
    if room.available_beds <= 0:
        raise APIError("NO_BEDS_AVAILABLE", f"Room {room.room_number} in {hostel.name} has no available vacancies.", status.HTTP_409_CONFLICT)

    # Check active duplicate
    existing_alloc = repository.get_active_allocation_by_student(db, data.student_id)
    if existing_alloc:
        raise APIError("ACTIVE_ALLOCATION_EXISTS", "Student already holds an active hostel allocation. Execute a room transfer instead.", status.HTTP_409_CONFLICT)

    a_id = repository.create_allocation(db, data, allocated_by=admin_user.user_id)
    return get_allocation(db, a_id)

def get_allocation(db: Session, alloc_id: int) -> schemas.HostelAllocationResponse:
    a = repository.get_allocation(db, alloc_id)
    if not a:
        raise APIError("NOT_FOUND", f"Hostel allocation with ID {alloc_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.HostelAllocationResponse(**a)

def get_allocations(
    db: Session,
    hostel_id: Optional[int] = None,
    room_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200
) -> List[schemas.HostelAllocationResponse]:
    allocs = repository.get_allocations(db, hostel_id, room_id, status, search, skip, limit)
    return [schemas.HostelAllocationResponse(**a) for a in allocs]

def vacate_room(db: Session, alloc_id: int) -> schemas.HostelAllocationResponse:
    a = get_allocation(db, alloc_id)
    if a.status == schemas.AllocationStatus.VACATED:
        raise APIError("ALREADY_VACATED", "This allocation is already vacated.", status.HTTP_400_BAD_REQUEST)
    repository.vacate_allocation(db, alloc_id)
    return get_allocation(db, alloc_id)

def transfer_room(db: Session, alloc_id: int, data: schemas.HostelAllocationTransfer) -> schemas.HostelAllocationResponse:
    a = get_allocation(db, alloc_id)
    if a.status != schemas.AllocationStatus.ACTIVE:
        raise APIError("NOT_ACTIVE", "Only active allocations can be transferred.", status.HTTP_400_BAD_REQUEST)

    new_room = get_room(db, data.new_room_id)
    new_hostel = get_hostel(db, new_room.hostel_id)

    # Validate eligibility for new room/hostel
    validate_student_eligibility(db, a.student_id, new_hostel.gender_block)

    if new_room.available_beds <= 0:
        raise APIError("NO_BEDS_AVAILABLE", f"Target room {new_room.room_number} has no vacant beds.", status.HTTP_409_CONFLICT)

    repository.transfer_allocation(db, alloc_id, data.new_room_id, data.new_bed_number)
    return get_allocation(db, alloc_id)

def get_my_allocation(db: Session, current_user: CurrentUser) -> Optional[schemas.HostelAllocationResponse]:
    student_id = get_student_id(db, current_user.user_id)
    a = repository.get_active_allocation_by_student(db, student_id)
    if not a:
        return None
    return schemas.HostelAllocationResponse(**a)

# --- Occupancy ---
def get_occupancy(db: Session) -> List[schemas.HostelOccupancyResponse]:
    occ = repository.get_occupancy(db)
    return [schemas.HostelOccupancyResponse(**o) for o in occ]

# --- Request ---
def create_my_request(db: Session, current_user: CurrentUser, data: schemas.HostelRequestCreate) -> schemas.HostelRequestResponse:
    student_id = get_student_id(db, current_user.user_id)

    # Prevent duplicate pending requests
    pending_count = repository.count_pending_requests(db, student_id)
    if pending_count > 0:
        raise APIError("DUPLICATE_PENDING_REQUEST", "You already have a pending hostel request awaiting review.", status.HTTP_409_CONFLICT)

    active_alloc = repository.get_active_allocation_by_student(db, student_id)

    if data.request_type == schemas.RequestType.ALLOCATION and active_alloc:
        raise APIError("ALREADY_ALLOCATED", "You already hold an active hostel allocation. Submit a Room Transfer or Vacate application instead.", status.HTTP_400_BAD_REQUEST)

    if data.request_type in (schemas.RequestType.ROOM_CHANGE, schemas.RequestType.VACATE) and not active_alloc:
        raise APIError("NO_ACTIVE_ALLOCATION", f"You do not have an active allocation to request {data.request_type.value}.", status.HTTP_400_BAD_REQUEST)

    req_id = repository.create_request(db, student_id, data)
    return get_request(db, req_id)

def get_request(db: Session, req_id: int) -> schemas.HostelRequestResponse:
    r = repository.get_request(db, req_id)
    if not r:
        raise APIError("NOT_FOUND", f"Hostel request with ID {req_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.HostelRequestResponse(**r)

def get_my_requests(db: Session, current_user: CurrentUser, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelRequestResponse]:
    student_id = get_student_id(db, current_user.user_id)
    rs = repository.get_requests(db, student_id=student_id, status=status, skip=skip, limit=limit)
    return [schemas.HostelRequestResponse(**r) for r in rs]

def get_all_requests(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelRequestResponse]:
    rs = repository.get_requests(db, student_id=None, status=status, skip=skip, limit=limit)
    return [schemas.HostelRequestResponse(**r) for r in rs]

def decide_request(db: Session, current_user: CurrentUser, req_id: int, data: schemas.HostelRequestDecision) -> schemas.HostelRequestResponse:
    req = get_request(db, req_id)
    if req.status != schemas.RequestStatus.PENDING:
        raise APIError("INVALID_STATUS", "Only pending requests can be approved or rejected.", status.HTTP_400_BAD_REQUEST)

    repository.decide_request(db, req_id, current_user.user_id, data)

    # Automatic vacate execution if approved
    if data.status == schemas.RequestStatus.APPROVED and req.request_type == schemas.RequestType.VACATE:
        active_alloc = repository.get_active_allocation_by_student(db, req.student_id)
        if active_alloc:
            repository.vacate_allocation(db, active_alloc["id"])

    return get_request(db, req_id)

# --- Student Search for Allocation Console ---
def search_students(db: Session, query_str: str, limit: int = 20) -> List[dict]:
    return repository.search_students_for_allocation(db, query_str, limit)

# --- Complaints / Maintenance ---
def create_my_complaint(db: Session, current_user: CurrentUser, data: schemas.HostelComplaintCreate) -> schemas.HostelComplaintResponse:
    student_id = get_student_id(db, current_user.user_id)
    cid = repository.create_complaint(db, student_id, data)
    res = repository.get_complaint(db, cid)
    return schemas.HostelComplaintResponse(**res)

def get_my_complaints(db: Session, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> List[schemas.HostelComplaintResponse]:
    student_id = get_student_id(db, current_user.user_id)
    cs = repository.get_complaints(db, student_id=student_id, skip=skip, limit=limit)
    return [schemas.HostelComplaintResponse(**c) for c in cs]

def get_all_complaints(db: Session, hostel_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelComplaintResponse]:
    cs = repository.get_complaints(db, hostel_id=hostel_id, status=status, skip=skip, limit=limit)
    return [schemas.HostelComplaintResponse(**c) for c in cs]

def update_complaint_status(db: Session, complaint_id: int, data: schemas.HostelComplaintUpdate) -> schemas.HostelComplaintResponse:
    c = repository.get_complaint(db, complaint_id)
    if not c:
        raise APIError("NOT_FOUND", "Complaint ticket not found.", status.HTTP_404_NOT_FOUND)
    repository.update_complaint(db, complaint_id, data)
    res = repository.get_complaint(db, complaint_id)
    return schemas.HostelComplaintResponse(**res)

# --- Inspections ---
def create_inspection(db: Session, data: schemas.HostelInspectionCreate) -> schemas.HostelInspectionResponse:
    iid = repository.create_inspection(db, data)
    ins = repository.get_inspections(db, room_id=data.room_id, limit=1)
    return schemas.HostelInspectionResponse(**ins[0])

def get_inspections(db: Session, room_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelInspectionResponse]:
    ins = repository.get_inspections(db, room_id=room_id, skip=skip, limit=limit)
    return [schemas.HostelInspectionResponse(**i) for i in ins]

# --- Notices ---
def create_notice(db: Session, current_user: CurrentUser, data: schemas.HostelNoticeCreate) -> schemas.HostelNoticeResponse:
    nid = repository.create_notice(db, current_user.user_id, data)
    ns = repository.get_notices(db, limit=1)
    return schemas.HostelNoticeResponse(**ns[0])

def get_notices(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 50) -> List[schemas.HostelNoticeResponse]:
    ns = repository.get_notices(db, hostel_id=hostel_id, skip=skip, limit=limit)
    return [schemas.HostelNoticeResponse(**n) for n in ns]

# --- Outpasses ---
def create_my_outpass(db: Session, current_user: CurrentUser, data: schemas.HostelOutpassCreate) -> schemas.HostelOutpassResponse:
    student_id = get_student_id(db, current_user.user_id)
    if data.to_datetime <= data.from_datetime:
        raise APIError("INVALID_DATE_RANGE", "Return time must be after departure time.", status.HTTP_400_BAD_REQUEST)
    oid = repository.create_outpass(db, student_id, data)
    ops = repository.get_outpasses(db, student_id=student_id, limit=1)
    return schemas.HostelOutpassResponse(**ops[0])

def get_my_outpasses(db: Session, current_user: CurrentUser, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelOutpassResponse]:
    student_id = get_student_id(db, current_user.user_id)
    ops = repository.get_outpasses(db, student_id=student_id, status=status, skip=skip, limit=limit)
    return [schemas.HostelOutpassResponse(**op) for op in ops]

def get_all_outpasses(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelOutpassResponse]:
    ops = repository.get_outpasses(db, status=status, skip=skip, limit=limit)
    return [schemas.HostelOutpassResponse(**op) for op in ops]

def decide_outpass(db: Session, current_user: CurrentUser, outpass_id: int, data: schemas.HostelOutpassDecision) -> schemas.HostelOutpassResponse:
    repository.decide_outpass(db, outpass_id, current_user.user_id, data)
    ops = repository.get_outpasses(db, limit=1)
    return schemas.HostelOutpassResponse(**ops[0])

# --- SIGNATURE FEATURES SERVICES ---

# Feature A: Integrity Guardian
def run_integrity_guardian(db: Session) -> schemas.IntegrityGuardianReport:
    return repository.run_integrity_guardian_checks(db)

# Feature B: Smart Allocation Lab
def get_smart_allocation(db: Session, student_id: int, preferred_hostel_id: Optional[int] = None) -> schemas.SmartAllocationResponse:
    return repository.get_smart_allocation_recommendations(db, student_id, preferred_hostel_id)

# Feature C: Capacity What-If Simulator (Strict In-Memory Calculation Engine)
def simulate_capacity_what_if(db: Session, params: schemas.SimulatorParameter) -> schemas.CapacitySimulationResponse:
    occupancy = repository.get_occupancy(db)
    all_rooms = repository.get_rooms(db, limit=1000)

    male_surge = params.additional_male_applicants if params.additional_male_applicants != 0 else (params.extra_male_applicants or 0)
    female_surge = params.additional_female_applicants if params.additional_female_applicants != 0 else (params.extra_female_applicants or 0)
    closed_rooms = set(params.closed_room_ids or [])
    deltas = params.capacity_delta_by_room or {}

    hostel_data: List[dict] = []
    for occ in occupancy:
        h_id = occ["hostel_id"]
        gender_block = occ["gender_block"]
        base_capacity = int(occ["total_capacity"] or 0)
        base_available = int(occ["available_beds"] or 0)

        # Closed room impact
        closed_beds = sum(
            int(r["bed_capacity"]) for r in all_rooms
            if r["hostel_id"] == h_id and r["id"] in closed_rooms
        )
        closed_available = sum(
            int(r["available_beds"]) for r in all_rooms
            if r["hostel_id"] == h_id and r["id"] in closed_rooms
        )

        # Capacity deltas
        capacity_delta = sum(
            int(delta) for rid, delta in deltas.items()
            if any(r["id"] == rid and r["hostel_id"] == h_id for r in all_rooms)
        )

        sim_capacity = max(0, base_capacity - closed_beds + capacity_delta)
        sim_available = max(0, min(sim_capacity, base_available - closed_available + capacity_delta))

        hostel_data.append({
            "hostel_id": h_id,
            "hostel_name": occ["hostel_name"],
            "gender_block": gender_block,
            "base_capacity": base_capacity,
            "sim_capacity": sim_capacity,
            "base_available": base_available,
            "sim_available": sim_available,
            "shortage": 0
        })

    # Apply applicant surges
    total_shortage = 0
    if params.hostel_id:
        for h in hostel_data:
            if h["hostel_id"] == params.hostel_id:
                demand = male_surge if h["gender_block"] == schemas.GenderBlock.MALE else (
                    female_surge if h["gender_block"] == schemas.GenderBlock.FEMALE else (male_surge + female_surge)
                )
                if demand > h["sim_available"]:
                    h["shortage"] = demand - h["sim_available"]
                    h["sim_available"] = 0
                else:
                    h["shortage"] = 0
                    h["sim_available"] -= demand
                total_shortage = h["shortage"]
    else:
        # Campus-wide allocation: male applicants to MALE then COED
        rem_male = male_surge
        for h in hostel_data:
            if h["gender_block"] == schemas.GenderBlock.MALE and rem_male > 0:
                take = min(h["sim_available"], rem_male)
                h["sim_available"] -= take
                rem_male -= take

        for h in hostel_data:
            if h["gender_block"] == schemas.GenderBlock.COED and rem_male > 0:
                take = min(h["sim_available"], rem_male)
                h["sim_available"] -= take
                rem_male -= take

        # Female applicants to FEMALE then remaining COED
        rem_female = female_surge
        for h in hostel_data:
            if h["gender_block"] == schemas.GenderBlock.FEMALE and rem_female > 0:
                take = min(h["sim_available"], rem_female)
                h["sim_available"] -= take
                rem_female -= take

        for h in hostel_data:
            if h["gender_block"] == schemas.GenderBlock.COED and rem_female > 0:
                take = min(h["sim_available"], rem_female)
                h["sim_available"] -= take
                rem_female -= take

        total_shortage = rem_male + rem_female

    hostel_projections: List[schemas.SimulatedHostelMetric] = []
    for h in hostel_data:
        sim_occupied = h["sim_capacity"] - h["sim_available"]
        util_rate = round((float(sim_occupied) * 100.0) / float(h["sim_capacity"]), 1) if h["sim_capacity"] > 0 else 0.0

        hostel_projections.append(schemas.SimulatedHostelMetric(
            hostel_id=h["hostel_id"],
            hostel_name=h["hostel_name"],
            gender_block=h["gender_block"],
            current_capacity=h["base_capacity"],
            simulated_capacity=h["sim_capacity"],
            current_available=h["base_available"],
            simulated_available=h["sim_available"],
            projected_shortage=h["shortage"],
            utilization_rate=util_rate
        ))

    recommendations = []
    if total_shortage > 0:
        recommendations.append(f"Campus will experience an aggregate shortage of {total_shortage} beds under these parameters.")
        recommendations.append("Recommend delaying planned room closures or expanding COED block allowances.")
    else:
        total_remaining = sum(h["sim_available"] for h in hostel_data)
        recommendations.append(f"All projected applicants (+{male_surge} male, +{female_surge} female) can be comfortably accommodated with {total_remaining} vacancies remaining.")

    return schemas.CapacitySimulationResponse(
        is_simulation=True,
        parameters_applied=params,
        hostel_projections=hostel_projections,
        overall_campus_shortage=total_shortage,
        recommendations=recommendations
    )

# Feature D: Change Impact Radar (Analysis layer without data modification)
def analyze_change_impact(db: Session, req: schemas.ImpactRadarRequest) -> schemas.ImpactRadarResponse:
    target_rooms = req.target_room_ids or req.closed_room_ids or []
    affected: List[schemas.ImpactAffectedResident] = []
    capacity_loss = 0
    all_rooms = repository.get_rooms(db, limit=1000)

    # Track simulated available beds so alternate rooms aren't assigned beyond capacity
    sim_available_by_room = {
        r["id"]: int(r["available_beds"])
        for r in all_rooms
        if r["id"] not in target_rooms and int(r["available_beds"]) > 0
    }

    for rid in target_rooms:
        room = repository.get_room(db, rid)
        if not room:
            continue
        capacity_loss += int(room["bed_capacity"])

        allocs = repository.get_allocations(db, room_id=rid, status="ACTIVE", limit=50)
        for a in allocs:
            # 1. Look for vacancies in same hostel
            candidate = None
            for alt in all_rooms:
                if alt["hostel_id"] == room["hostel_id"] and alt["id"] not in target_rooms and sim_available_by_room.get(alt["id"], 0) > 0:
                    candidate = alt
                    sim_available_by_room[alt["id"]] -= 1
                    break

            # 2. Look for vacancies in compatible halls
            if not candidate:
                for alt in all_rooms:
                    if alt["id"] not in target_rooms and sim_available_by_room.get(alt["id"], 0) > 0:
                        if alt["gender_block"] == room["gender_block"] or alt["gender_block"] == "COED" or room["gender_block"] == "COED":
                            candidate = alt
                            sim_available_by_room[alt["id"]] -= 1
                            break

            affected.append(schemas.ImpactAffectedResident(
                student_id=a["student_id"],
                global_student_id=a["global_student_id"],
                student_name=a["student_name"],
                room_id=rid,
                room_number=room["room_number"],
                hostel_name=room["hostel_name"],
                suggested_alternate_room_id=candidate["id"] if candidate else None,
                suggested_alternate_room_number=candidate["room_number"] if candidate else None
            ))

    severity = "BLOCKING" if (len(affected) > 0 and any(a.suggested_alternate_room_id is None for a in affected)) else ("HIGH" if len(affected) > 0 else "LOW")

    mitigations = []
    if affected:
        mitigations.append(f"Action impacts {len(affected)} current residents across {len(target_rooms)} room(s).")
        if any(a.suggested_alternate_room_id is None for a in affected):
            mitigations.append("Warning: Insufficient vacancies in compatible halls to rehouse all displaced students.")
        else:
            mitigations.append("Safe relocation possible: Alternate rooms with vacancies identified for all residents.")
    else:
        mitigations.append("Selected rooms currently hold zero active residents. Planned maintenance can proceed safely.")

    return schemas.ImpactRadarResponse(
        action=req.target_action,
        severity_level=severity,
        displaced_residents_count=len(affected),
        capacity_loss=capacity_loss,
        affected_residents=affected,
        mitigation_options=mitigations
    )

# Feature E: Student Hostel Journey
def get_student_journey(db: Session, student_id: int) -> schemas.StudentJourneyResponse:
    return repository.get_student_journey(db, student_id)

# --- Operations: Waitlist ---
def create_waitlist_entry(db: Session, data: schemas.HostelWaitlistCreate) -> schemas.HostelWaitlistResponse:
    w_id = repository.create_waitlist(db, data)
    entries = repository.get_waitlist(db)
    found = next((e for e in entries if e["id"] == w_id), None)
    if not found:
        raise APIError("NOT_FOUND", "Failed to retrieve created waitlist entry.", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return schemas.HostelWaitlistResponse(**found)

def get_waitlist_entries(db: Session, hostel_id: Optional[int] = None, status_val: Optional[str] = None) -> List[schemas.HostelWaitlistResponse]:
    entries = repository.get_waitlist(db, hostel_id=hostel_id, status=status_val)
    return [schemas.HostelWaitlistResponse(**e) for e in entries]

def update_waitlist_entry(db: Session, waitlist_id: int, data: schemas.HostelWaitlistUpdate) -> schemas.HostelWaitlistResponse:
    repository.update_waitlist_status(db, waitlist_id, data.status.value, data.notes)
    entries = repository.get_waitlist(db)
    found = next((e for e in entries if e["id"] == waitlist_id), None)
    if not found:
        raise APIError("NOT_FOUND", f"Waitlist entry {waitlist_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.HostelWaitlistResponse(**found)

# --- Operations: Visitors ---
def register_visitor(db: Session, data: schemas.HostelVisitorCreate) -> schemas.HostelVisitorResponse:
    import random
    gate_pass = f"GP-{data.entry_time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    v_id = repository.create_visitor(db, data, gate_pass)
    visitors = repository.get_visitors(db, hostel_id=data.hostel_id)
    found = next((v for v in visitors if v["id"] == v_id), None)
    if not found:
        raise APIError("NOT_FOUND", "Failed to retrieve registered visitor.", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return schemas.HostelVisitorResponse(**found)

def record_visitor_departure(db: Session, visitor_id: int, exit_time: datetime) -> schemas.HostelVisitorResponse:
    repository.record_visitor_exit(db, visitor_id, exit_time)
    visitors = repository.get_visitors(db)
    found = next((v for v in visitors if v["id"] == visitor_id), None)
    if not found:
        raise APIError("NOT_FOUND", f"Visitor record {visitor_id} not found.", status.HTTP_404_NOT_FOUND)
    return schemas.HostelVisitorResponse(**found)

def get_visitors(db: Session, hostel_id: Optional[int] = None) -> List[schemas.HostelVisitorResponse]:
    visitors = repository.get_visitors(db, hostel_id=hostel_id)
    return [schemas.HostelVisitorResponse(**v) for v in visitors]

# --- Operations: CSV Demographics Import ---
def import_student_demographics_csv(db: Session, csv_content: str) -> schemas.StudentDemographicsCSVImportResponse:
    import csv
    import io
    import re

    clean_content = csv_content.lstrip('\ufeff').strip()
    reader = csv.DictReader(io.StringIO(clean_content))
    total = 0
    updated = 0
    skipped = 0
    errors = []
    samples = []

    for row_idx, raw_row in enumerate(reader, start=1):
        total += 1
        row = {re.sub(r'[^a-z0-9]', '_', k.strip().lower()): (v.strip() if v else '') for k, v in raw_row.items() if k}

        gid = row.get("global_student_id") or row.get("student_id") or row.get("roll_no") or row.get("id") or ""
        gid = gid.strip()
        if not gid:
            errors.append(f"Row {row_idx}: Missing 'global_student_id'.")
            skipped += 1
            continue

        if not re.match(r"^STU-[0-9]{4}-[0-9]{6}$", gid):
            errors.append(f"Row {row_idx}: Invalid student ID format '{gid}'. Expected STU-YYYY-NNNNNN.")
            skipped += 1
            continue

        raw_gender = (row.get("gender") or row.get("sex") or "").strip().upper()
        if raw_gender in ("M", "MALE"):
            valid_gender = "MALE"
        elif raw_gender in ("F", "FEMALE"):
            valid_gender = "FEMALE"
        elif raw_gender in ("O", "OTHER"):
            valid_gender = "OTHER"
        else:
            valid_gender = None

        raw_eligible = str(row.get("is_hostel_eligible") or row.get("eligible") or row.get("hostel_eligible") or "true").strip().lower()
        is_eligible = raw_eligible not in ("false", "0", "no", "f", "n")

        success = repository.update_student_demographics(db, gid, valid_gender, is_eligible)
        if success:
            updated += 1
            if len(samples) < 5:
                samples.append({
                    "global_student_id": gid,
                    "gender": valid_gender,
                    "is_hostel_eligible": is_eligible,
                    "status": "UPDATED"
                })
        else:
            errors.append(f"Row {row_idx}: Student '{gid}' not found in official ERP registry.")
            skipped += 1

    return schemas.StudentDemographicsCSVImportResponse(
        total_processed=total,
        updated_count=updated,
        skipped_count=skipped,
        errors=errors,
        sample_records=samples
    )

def import_rooms_csv(db: Session, csv_content: str) -> schemas.RoomInventoryCSVImportResponse:
    import csv
    import io
    import re

    clean_content = csv_content.lstrip('\ufeff').strip()
    reader = csv.DictReader(io.StringIO(clean_content))
    total = 0
    created = 0
    updated = 0
    skipped = 0
    errors = []
    samples = []

    for row_idx, raw_row in enumerate(reader, start=1):
        total += 1
        row = {re.sub(r'[^a-z0-9]', '_', k.strip().lower()): (v.strip() if v else '') for k, v in raw_row.items() if k}

        hostel_name = row.get("hostel_name") or row.get("hostel") or row.get("residence_hall") or row.get("name") or ""
        room_number = row.get("room_number") or row.get("room_no") or row.get("room") or ""
        gender_block = (row.get("gender_block") or row.get("gender") or row.get("block") or "COED").upper()
        raw_capacity = row.get("bed_capacity") or row.get("capacity") or row.get("beds") or "2"
        readiness_status = (row.get("readiness_status") or row.get("status") or "READY").upper()

        if not hostel_name:
            errors.append(f"Row {row_idx}: Missing 'Hostel Name'.")
            skipped += 1
            continue

        if not room_number:
            errors.append(f"Row {row_idx}: Missing 'Room Number'.")
            skipped += 1
            continue

        try:
            capacity = int(raw_capacity)
            if capacity < 1:
                raise ValueError("Capacity must be >= 1")
        except ValueError:
            errors.append(f"Row {row_idx}: Invalid bed capacity '{raw_capacity}' for Room {room_number}.")
            skipped += 1
            continue

        is_created, is_updated, err_msg = repository.upsert_room_inventory_row(
            db,
            hostel_name=hostel_name,
            room_number=room_number,
            bed_capacity=capacity,
            gender_block=gender_block,
            readiness_status=readiness_status
        )

        if err_msg:
            errors.append(f"Row {row_idx}: {err_msg}")
            skipped += 1
        elif is_created:
            created += 1
            if len(samples) < 5:
                samples.append({
                    "hostel_name": hostel_name,
                    "room_number": room_number,
                    "bed_capacity": capacity,
                    "action": "CREATED"
                })
        elif is_updated:
            updated += 1
            if len(samples) < 5:
                samples.append({
                    "hostel_name": hostel_name,
                    "room_number": room_number,
                    "bed_capacity": capacity,
                    "action": "UPDATED"
                })

    return schemas.RoomInventoryCSVImportResponse(
        total_processed=total,
        created_count=created,
        updated_count=updated,
        skipped_count=skipped,
        errors=errors,
        sample_records=samples
    )

# --- Reporting: Official Allocation Letter ---
def generate_allocation_letter(db: Session, allocation_id: int) -> schemas.AllocationLetterResponse:
    alloc = repository.get_allocation(db, allocation_id)
    if not alloc:
        raise APIError("NOT_FOUND", f"Allocation record {allocation_id} not found.", status.HTTP_404_NOT_FOUND)

    return schemas.AllocationLetterResponse(
        letter_id=f"HAL-{alloc['id']:06d}-2026",
        issued_date=alloc["created_at"].strftime("%d %B %Y") if alloc["created_at"] else "27 October 2026",
        academic_term="Academic Session 2026–27 (Fall Semester)",
        student={
            "student_id": alloc["student_id"],
            "global_student_id": alloc["global_student_id"],
            "full_name": alloc["student_name"],
            "email": alloc["student_email"],
            "gender": alloc["student_gender"] or "Verified"
        },
        accommodation={
            "hostel_name": alloc["hostel_name"],
            "gender_block": alloc["gender_block"],
            "room_number": alloc["room_number"],
            "bed_number": alloc["bed_number"] or "Standard Bed",
            "effective_from": alloc["from_date"].strftime("%d %b %Y"),
            "effective_to": alloc["to_date"].strftime("%d %b %Y") if alloc["to_date"] else "End of Academic Year"
        },
        rules_and_terms=[
            "Quiet study hours are strictly observed between 22:00 and 06:00.",
            "Room inventory and university fixtures must be preserved in clean condition.",
            "Campus gate curfew is 21:30. Overnight absences require warden-approved outpasses.",
            "Subletting or unauthorized overnight visitors are strictly prohibited under university ordinance."
        ]
    )

# --- Minimal Hostel Fee Management Service ---
def get_fee_configs(db: Session, hostel_id: Optional[int] = None) -> List[schemas.HostelFeeConfigResponse]:
    rows = repository.get_fee_configs(db, hostel_id=hostel_id)
    return [schemas.HostelFeeConfigResponse(**r) for r in rows]

def create_fee_config(db: Session, data: schemas.HostelFeeConfigCreate) -> schemas.HostelFeeConfigResponse:
    cfg_id = repository.create_fee_config(db, data)
    rows = repository.get_fee_configs(db)
    found = next((r for r in rows if r["id"] == cfg_id), None)
    if not found:
        raise APIError("NOT_FOUND", "Failed to retrieve created fee configuration", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return schemas.HostelFeeConfigResponse(**found)

def get_invoices(db: Session, student_id: Optional[int] = None, hostel_id: Optional[int] = None, status_val: Optional[str] = None) -> List[schemas.HostelInvoiceResponse]:
    rows = repository.get_invoices(db, student_id=student_id, hostel_id=hostel_id, status_val=status_val)
    return [schemas.HostelInvoiceResponse(**r) for r in rows]

def create_invoice(db: Session, data: schemas.HostelInvoiceCreate) -> schemas.HostelInvoiceResponse:
    inv_id = repository.create_invoice(db, data)
    inv = repository.get_invoice(db, inv_id)
    if not inv:
        raise APIError("NOT_FOUND", "Failed to retrieve created invoice", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return schemas.HostelInvoiceResponse(**inv)

def generate_batch_invoices(db: Session, fee_config_id: Optional[int] = None) -> dict:
    from datetime import date, timedelta
    allocs = repository.get_allocations(db, status="ACTIVE", limit=500)
    configs = repository.get_fee_configs(db)
    default_config = next((c for c in configs if c["id"] == fee_config_id), configs[0] if configs else None)

    fee_amount = float(default_config["amount"]) if default_config else 25000.0
    fee_title = default_config["fee_name"] if default_config else "Hostel Residential & Amenities Fee - Semester 1"
    due_days = default_config["due_days"] if default_config else 30
    due_date = date.today() + timedelta(days=due_days)

    generated = 0
    skipped = 0
    for a in allocs:
        existing = repository.get_invoices(db, student_id=a["student_id"])
        if any(inv["title"] == fee_title for inv in existing):
            skipped += 1
            continue

        repository.create_invoice(db, schemas.HostelInvoiceCreate(
            student_id=a["student_id"],
            hostel_id=a["hostel_id"],
            fee_config_id=default_config["id"] if default_config else None,
            title=fee_title,
            amount=fee_amount,
            due_date=due_date
        ))
        generated += 1

    return {
        "status": "COMPLETED",
        "invoices_generated": generated,
        "skipped_existing": skipped,
        "total_active_allocations": len(allocs)
    }

def submit_hostel_payment(db: Session, data: schemas.HostelPaymentSubmit, student_id: int) -> schemas.HostelPaymentResponse:
    inv = repository.get_invoice(db, data.invoice_id)
    if not inv:
        raise APIError("NOT_FOUND", "Invoice not found", status.HTTP_404_NOT_FOUND)
    if inv["student_id"] != student_id:
        raise APIError("FORBIDDEN", "Invoice does not belong to this student", status.HTTP_403_FORBIDDEN)
    if data.amount_paid > float(inv["balance"]):
        raise APIError("BAD_REQUEST", f"Payment amount ({data.amount_paid}) exceeds outstanding balance ({inv['balance']})", status.HTTP_400_BAD_REQUEST)

    pay_id = repository.create_payment(db, data, student_id)
    payments = repository.get_payments(db, invoice_id=data.invoice_id)
    found = next((p for p in payments if p["id"] == pay_id), None)
    if not found:
        raise APIError("NOT_FOUND", "Failed to retrieve recorded payment", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return schemas.HostelPaymentResponse(**found)

def verify_hostel_payment(db: Session, payment_id: int, verified_by: int, data: schemas.HostelPaymentVerify) -> dict:
    success = repository.verify_payment(db, payment_id, verified_by, data.status, data.verification_notes)
    if not success:
        raise APIError("NOT_FOUND", "Payment record not found or could not be updated", status.HTTP_404_NOT_FOUND)
    return {"status": "SUCCESS", "payment_id": payment_id, "verification_status": data.status}

def get_hostel_payments(db: Session, invoice_id: Optional[int] = None, student_id: Optional[int] = None, status_val: Optional[str] = None) -> List[schemas.HostelPaymentResponse]:
    rows = repository.get_payments(db, invoice_id=invoice_id, student_id=student_id, status_val=status_val)
    return [schemas.HostelPaymentResponse(**r) for r in rows]

def get_fee_summary(db: Session) -> schemas.HostelFeeSummary:
    stat = repository.get_fee_summary(db)
    return schemas.HostelFeeSummary(**stat)
