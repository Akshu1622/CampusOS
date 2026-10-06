from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission
from . import schemas, service

router = APIRouter(prefix="/api/v1", tags=["Hostel"])

# Admin access setup: Any admin with Hostel_Admin permission or Super_Admin
def hostel_admin(user=Depends(require_permission(["Hostel_Admin", "Super_Admin"]))):
    return user

# A dependency for general Admin that we already have is just require_role(["Admin"])
admin_only = Depends(require_role(["Admin"]))
student_only = Depends(require_role(["Student"]))
student_or_admin = Depends(require_role(["Student", "Admin"]))

# --- Hostel ---
@router.post("/hostels", response_model=schemas.HostelResponse, status_code=status.HTTP_201_CREATED)
def create_hostel(data: schemas.HostelCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.create_hostel(db, data)

@router.get("/hostels", response_model=List[schemas.HostelResponse])
def get_hostels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_hostels(db, skip, limit)

@router.get("/hostels/occupancy", response_model=List[schemas.HostelOccupancyResponse])
def get_hostels_occupancy(db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_occupancy(db)

@router.get("/hostels/{hostel_id}", response_model=schemas.HostelResponse)
def get_hostel(hostel_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_hostel(db, hostel_id)

@router.put("/hostels/{hostel_id}", response_model=schemas.HostelResponse)
def update_hostel(hostel_id: int, data: schemas.HostelUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.update_hostel(db, hostel_id, data)

@router.delete("/hostels/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hostel(hostel_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    service.delete_hostel(db, hostel_id)

# --- Room ---
@router.post("/rooms", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(data: schemas.RoomCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.create_room(db, data)

@router.get("/rooms", response_model=List[schemas.RoomResponse])
def get_rooms(hostel_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_rooms(db, hostel_id, skip, limit)

@router.get("/rooms/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_room(db, room_id)

@router.put("/rooms/{room_id}", response_model=schemas.RoomResponse)
def update_room(room_id: int, data: schemas.RoomUpdate, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.update_room(db, room_id, data)

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    service.delete_room(db, room_id)

# --- Allocation ---
@router.post("/hostel-allocations", response_model=schemas.HostelAllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_room(data: schemas.HostelAllocationCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.allocate_room(db, data)

@router.patch("/hostel-allocations/{alloc_id}/vacate", response_model=schemas.HostelAllocationResponse)
def vacate_room(alloc_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.vacate_room(db, alloc_id)

@router.get("/me/hostel", response_model=schemas.HostelAllocationResponse)
def get_my_hostel(db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_allocation(db, user)

# --- Requests ---
@router.post("/hostel-requests", response_model=schemas.HostelRequestResponse, status_code=status.HTTP_201_CREATED)
def create_hostel_request(data: schemas.HostelRequestCreate, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.create_my_request(db, user, data)

@router.get("/me/hostel-requests", response_model=List[schemas.HostelRequestResponse])
def get_my_hostel_requests(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = student_only):
    return service.get_my_requests(db, user, status, skip, limit)

@router.get("/hostel-requests", response_model=List[schemas.HostelRequestResponse])
def get_all_hostel_requests(status: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.get_all_requests(db, status, skip, limit)

@router.patch("/hostel-requests/{req_id}/decision", response_model=schemas.HostelRequestResponse)
def decide_hostel_request(req_id: int, data: schemas.HostelRequestDecision, db: Session = Depends(get_db), user: CurrentUser = Depends(hostel_admin)):
    return service.decide_request(db, user, req_id, data)
