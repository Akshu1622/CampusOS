from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import date

class GenderBlock(str, Enum):
    MALE = 'MALE'
    FEMALE = 'FEMALE'
    COED = 'COED'

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

    model_config = {"from_attributes": True}

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

    model_config = {"from_attributes": True}

# --- Hostel Allocation ---
class HostelAllocationBase(BaseModel):
    student_id: int
    room_id: int
    from_date: date
    to_date: Optional[date] = None

class HostelAllocationCreate(HostelAllocationBase):
    pass

class HostelAllocationUpdate(BaseModel):
    to_date: Optional[date] = None

class HostelAllocationResponse(HostelAllocationBase):
    id: int
    status: AllocationStatus
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    global_student_id: Optional[str] = None
    room_number: Optional[str] = None
    hostel_name: Optional[str] = None

    model_config = {"from_attributes": True}

# --- Hostel Request ---
class HostelRequestBase(BaseModel):
    request_type: RequestType
    details: Optional[str] = None

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

    model_config = {"from_attributes": True}

# --- Occupancy Dashboard ---
class HostelOccupancyResponse(BaseModel):
    hostel_id: int
    hostel_name: str
    gender_block: GenderBlock
    total_capacity: int
    occupied_beds: int
    available_beds: int
    occupancy_pct: Optional[float] = None
