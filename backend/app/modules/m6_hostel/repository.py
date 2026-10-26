from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import date
from . import schemas
from app.db.helpers import handle_db_error

# --- Hostel ---
def create_hostel(db: Session, data: schemas.HostelCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel (name, gender_block, total_capacity)
            VALUES (:name, :gender, :capacity)
        """)
        res = db.execute(query, {
            "name": data.name,
            "gender": data.gender_block.value,
            "capacity": data.total_capacity
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_hostel(db: Session, hostel_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM hostel WHERE id = :id")
        res = db.execute(query, {"id": hostel_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_hostels(db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        query = text("SELECT * FROM hostel LIMIT :limit OFFSET :skip")
        res = db.execute(query, {"limit": limit, "skip": skip}).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_hostel(db: Session, hostel_id: int, data: schemas.HostelUpdate):
    try:
        updates = []
        params = {"id": hostel_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            if isinstance(v, schemas.GenderBlock):
                v = v.value
            updates.append(f"{k} = :{k}")
            params[k] = v
        if updates:
            query = text(f"UPDATE hostel SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def delete_hostel(db: Session, hostel_id: int):
    try:
        query = text("DELETE FROM hostel WHERE id = :id")
        db.execute(query, {"id": hostel_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Room ---
def create_room(db: Session, data: schemas.RoomCreate) -> int:
    try:
        query = text("""
            INSERT INTO room (hostel_id, room_number, bed_capacity, available_beds)
            VALUES (:hid, :rnum, :cap, :cap)
        """)
        res = db.execute(query, {
            "hid": data.hostel_id,
            "rnum": data.room_number,
            "cap": data.bed_capacity
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_room(db: Session, room_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM room WHERE id = :id")
        res = db.execute(query, {"id": room_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_rooms(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        if hostel_id:
            query = text("SELECT * FROM room WHERE hostel_id = :hid LIMIT :limit OFFSET :skip")
            res = db.execute(query, {"hid": hostel_id, "limit": limit, "skip": skip}).mappings().all()
        else:
            query = text("SELECT * FROM room LIMIT :limit OFFSET :skip")
            res = db.execute(query, {"limit": limit, "skip": skip}).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_room(db: Session, room_id: int, data: schemas.RoomUpdate):
    try:
        updates = []
        params = {"id": room_id}
        
        # When updating capacity, we can't easily adjust available_beds blindly without potentially breaking constraints.
        # However, for simplicity, we let the DB trigger/check constraints handle violations.
        for k, v in data.model_dump(exclude_unset=True).items():
            updates.append(f"{k} = :{k}")
            params[k] = v
            
        if updates:
            # Note: if bed_capacity changes, a trigger should ideally adjust available_beds. 
            # If not, we might violate CHK_room_available if we lower it below active allocations.
            # The DB will throw an error.
            query = text(f"UPDATE room SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def delete_room(db: Session, room_id: int):
    try:
        query = text("DELETE FROM room WHERE id = :id")
        db.execute(query, {"id": room_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Allocation ---
def create_allocation(db: Session, data: schemas.HostelAllocationCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_allocation (student_id, room_id, from_date, to_date, status)
            VALUES (:sid, :rid, :fdate, :tdate, 'ACTIVE')
        """)
        res = db.execute(query, {
            "sid": data.student_id,
            "rid": data.room_id,
            "fdate": data.from_date,
            "tdate": data.to_date
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_allocation(db: Session, alloc_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM hostel_allocation WHERE id = :id")
        res = db.execute(query, {"id": alloc_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_active_allocation_by_student(db: Session, student_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM hostel_allocation WHERE student_id = :sid AND status = 'ACTIVE'")
        res = db.execute(query, {"sid": student_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def vacate_allocation(db: Session, alloc_id: int):
    try:
        query = text("UPDATE hostel_allocation SET status = 'VACATED', to_date = IFNULL(to_date, CURRENT_DATE) WHERE id = :id")
        db.execute(query, {"id": alloc_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_allocations(db: Session, status: Optional[str] = None, room_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        where_clauses = []
        params = {"limit": limit, "skip": skip}
        if status:
            where_clauses.append("ha.status = :status")
            params["status"] = status
        if room_id:
            where_clauses.append("ha.room_id = :room_id")
            params["room_id"] = room_id
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        
        query = text(f"""
            SELECT ha.id, ha.student_id, ha.room_id, ha.from_date, ha.to_date, ha.status,
                   s.first_name, s.last_name, s.global_student_id,
                   r.room_number, h.name as hostel_name
            FROM hostel_allocation ha
            JOIN student s ON ha.student_id = s.id
            JOIN room r ON ha.room_id = r.id
            JOIN hostel h ON r.hostel_id = h.id
            {where_sql}
            ORDER BY ha.id DESC
            LIMIT :limit OFFSET :skip
        """)
        res = db.execute(query, params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Occupancy ---
def get_occupancy(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM vw_hostel_occupancy")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Request ---
def create_request(db: Session, student_id: int, data: schemas.HostelRequestCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_request (student_id, request_type, details, status)
            VALUES (:sid, :rtype, :det, 'PENDING')
        """)
        res = db.execute(query, {
            "sid": student_id,
            "rtype": data.request_type.value,
            "det": data.details
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_request(db: Session, req_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM hostel_request WHERE id = :id")
        res = db.execute(query, {"id": req_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_requests(db: Session, student_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        q = "SELECT * FROM hostel_request WHERE 1=1"
        params = {"limit": limit, "skip": skip}
        
        if student_id:
            q += " AND student_id = :sid"
            params["sid"] = student_id
        if status:
            q += " AND status = :st"
            params["st"] = status
            
        q += " LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def decide_request(db: Session, req_id: int, admin_id: int, data: schemas.HostelRequestDecision):
    try:
        query = text("""
            UPDATE hostel_request 
            SET status = :st, decision_by = :admin, remark = :rem 
            WHERE id = :id
        """)
        db.execute(query, {
            "st": data.status.value,
            "admin": admin_id,
            "rem": data.remark,
            "id": req_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)
