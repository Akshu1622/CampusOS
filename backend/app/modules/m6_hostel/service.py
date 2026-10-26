from sqlalchemy.orm import Session
from fastapi import status
from typing import List, Optional
from app.core.errors import APIError
from app.dependencies.auth import CurrentUser
from . import schemas, repository

# Dependency: get student_id for a given user
def get_student_id(db: Session, user_id: int) -> int:
    from sqlalchemy import text
    query = text("SELECT student_id FROM user_account WHERE id = :uid")
    res = db.execute(query, {"uid": user_id}).scalar()
    if not res:
        raise APIError("STUDENT_NOT_FOUND", "No student record found for this user.", status.HTTP_404_NOT_FOUND)
    return res

# --- Hostel ---
def create_hostel(db: Session, data: schemas.HostelCreate) -> schemas.HostelResponse:
    try:
        h_id = repository.create_hostel(db, data)
        return get_hostel(db, h_id)
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_hostel_name" in str(e):
            raise APIError("DUPLICATE_HOSTEL", f"Hostel '{data.name}' already exists", status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status.HTTP_400_BAD_REQUEST)

def get_hostel(db: Session, hostel_id: int) -> schemas.HostelResponse:
    h = repository.get_hostel(db, hostel_id)
    if not h:
        raise APIError("NOT_FOUND", "Hostel not found", status.HTTP_404_NOT_FOUND)
    return schemas.HostelResponse(**h)

def get_hostels(db: Session, skip: int = 0, limit: int = 100) -> List[schemas.HostelResponse]:
    hs = repository.get_hostels(db, skip, limit)
    return [schemas.HostelResponse(**h) for h in hs]

def update_hostel(db: Session, hostel_id: int, data: schemas.HostelUpdate) -> schemas.HostelResponse:
    get_hostel(db, hostel_id) # ensure exists
    repository.update_hostel(db, hostel_id, data)
    return get_hostel(db, hostel_id)

def delete_hostel(db: Session, hostel_id: int):
    get_hostel(db, hostel_id)
    repository.delete_hostel(db, hostel_id)

# --- Room ---
def create_room(db: Session, data: schemas.RoomCreate) -> schemas.RoomResponse:
    get_hostel(db, data.hostel_id)
    try:
        r_id = repository.create_room(db, data)
        return get_room(db, r_id)
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_hostel_room" in str(e):
            raise APIError("DUPLICATE_ROOM", f"Room '{data.room_number}' already exists in this hostel", status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status.HTTP_400_BAD_REQUEST)

def get_room(db: Session, room_id: int) -> schemas.RoomResponse:
    r = repository.get_room(db, room_id)
    if not r:
        raise APIError("NOT_FOUND", "Room not found", status.HTTP_404_NOT_FOUND)
    return schemas.RoomResponse(**r)

def get_rooms(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[schemas.RoomResponse]:
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
    repository.delete_room(db, room_id)

# --- Allocation ---
def allocate_room(db: Session, data: schemas.HostelAllocationCreate) -> schemas.HostelAllocationResponse:
    get_room(db, data.room_id)
    # the DB trigger prevents duplicate active allocation and checks bed capacity
    a_id = repository.create_allocation(db, data)
    return get_allocation(db, a_id)

def get_allocation(db: Session, alloc_id: int) -> schemas.HostelAllocationResponse:
    a = repository.get_allocation(db, alloc_id)
    if not a:
        raise APIError("NOT_FOUND", "Allocation not found", status.HTTP_404_NOT_FOUND)
    return schemas.HostelAllocationResponse(**a)

def vacate_room(db: Session, alloc_id: int) -> schemas.HostelAllocationResponse:
    a = get_allocation(db, alloc_id)
    if a.status == schemas.AllocationStatus.VACATED:
        raise APIError("ALREADY_VACATED", "Allocation is already vacated", status.HTTP_400_BAD_REQUEST)
    repository.vacate_allocation(db, alloc_id)
    return get_allocation(db, alloc_id)

def get_my_allocation(db: Session, current_user: CurrentUser) -> schemas.HostelAllocationResponse:
    student_id = get_student_id(db, current_user.user_id)
    a = repository.get_active_allocation_by_student(db, student_id)
    if not a:
        raise APIError("NOT_FOUND", "Active allocation not found", status.HTTP_404_NOT_FOUND)
    return schemas.HostelAllocationResponse(**a)

def get_allocations(db: Session, status: Optional[str] = None, room_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[schemas.HostelAllocationResponse]:
    allocs = repository.get_allocations(db, status=status, room_id=room_id, skip=skip, limit=limit)
    return [schemas.HostelAllocationResponse(**a) for a in allocs]

# --- Occupancy ---
def get_occupancy(db: Session) -> List[schemas.HostelOccupancyResponse]:
    occ = repository.get_occupancy(db)
    return [schemas.HostelOccupancyResponse(**o) for o in occ]

# --- Request ---
def create_my_request(db: Session, current_user: CurrentUser, data: schemas.HostelRequestCreate) -> schemas.HostelRequestResponse:
    student_id = get_student_id(db, current_user.user_id)
    req_id = repository.create_request(db, student_id, data)
    return get_request(db, req_id)

def get_request(db: Session, req_id: int) -> schemas.HostelRequestResponse:
    r = repository.get_request(db, req_id)
    if not r:
        raise APIError("NOT_FOUND", "Request not found", status.HTTP_404_NOT_FOUND)
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
        raise APIError("INVALID_STATUS", "Only pending requests can be decided", status.HTTP_400_BAD_REQUEST)
    
    repository.decide_request(db, req_id, current_user.user_id, data)
    return get_request(db, req_id)
