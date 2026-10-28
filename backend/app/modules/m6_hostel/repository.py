from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from datetime import date, datetime
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
        query = text("SELECT * FROM hostel ORDER BY id ASC LIMIT :limit OFFSET :skip")
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
        query = text("""
            SELECT r.*, h.name AS hostel_name, h.gender_block
            FROM room r
            JOIN hostel h ON r.hostel_id = h.id
            WHERE r.id = :id
        """)
        res = db.execute(query, {"id": room_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_rooms(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 500) -> List[dict]:
    try:
        q = """
            SELECT r.*, h.name AS hostel_name, h.gender_block
            FROM room r
            JOIN hostel h ON r.hostel_id = h.id
        """
        params = {"limit": limit, "skip": skip}
        if hostel_id:
            q += " WHERE r.hostel_id = :hid"
            params["hid"] = hostel_id
        q += " ORDER BY r.hostel_id, r.room_number LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_room(db: Session, room_id: int, data: schemas.RoomUpdate):
    try:
        current_room = db.execute(text("SELECT bed_capacity, available_beds FROM room WHERE id = :id"), {"id": room_id}).mappings().first()
        if not current_room:
            return None

        occupied = max(0, current_room["bed_capacity"] - current_room["available_beds"])
        new_capacity = data.bed_capacity if data.bed_capacity is not None else current_room["bed_capacity"]
        if new_capacity < occupied:
            raise Exception(f"Cannot reduce capacity ({new_capacity}) below currently occupied beds ({occupied}).")

        updates = []
        params = {"id": room_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            updates.append(f"{k} = :{k}")
            params[k] = v

        if data.bed_capacity is not None:
            new_available = new_capacity - occupied
            updates.append("available_beds = :avail")
            params["avail"] = new_available

        if updates:
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
def create_allocation(db: Session, data: schemas.HostelAllocationCreate, allocated_by: Optional[int] = None) -> int:
    try:
        query = text("""
            INSERT INTO hostel_allocation (student_id, room_id, from_date, to_date, bed_number, status, allocated_by)
            VALUES (:sid, :rid, :fdate, :tdate, :bnum, 'ACTIVE', :alloc_by)
        """)
        res = db.execute(query, {
            "sid": data.student_id,
            "rid": data.room_id,
            "fdate": data.from_date,
            "tdate": data.to_date,
            "bnum": data.bed_number,
            "alloc_by": allocated_by
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_allocation(db: Session, alloc_id: int) -> Optional[dict]:
    try:
        query = text("""
            SELECT
                ha.*,
                s.global_student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.email AS student_email,
                s.gender AS student_gender,
                r.room_number,
                h.id AS hostel_id,
                h.name AS hostel_name,
                h.gender_block
            FROM hostel_allocation ha
            JOIN student s ON ha.student_id = s.id
            JOIN room r ON ha.room_id = r.id
            JOIN hostel h ON r.hostel_id = h.id
            WHERE ha.id = :id
        """)
        res = db.execute(query, {"id": alloc_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_allocations(
    db: Session,
    hostel_id: Optional[int] = None,
    room_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200
) -> List[dict]:
    try:
        q = """
            SELECT
                ha.*,
                s.global_student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.email AS student_email,
                s.gender AS student_gender,
                r.room_number,
                h.id AS hostel_id,
                h.name AS hostel_name,
                h.gender_block
            FROM hostel_allocation ha
            JOIN student s ON ha.student_id = s.id
            JOIN room r ON ha.room_id = r.id
            JOIN hostel h ON r.hostel_id = h.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if hostel_id:
            q += " AND h.id = :hid"
            params["hid"] = hostel_id
        if room_id:
            q += " AND r.id = :rid"
            params["rid"] = room_id
        if status:
            q += " AND ha.status = :st"
            params["st"] = status
        if search:
            q += " AND (s.global_student_id LIKE :search OR s.first_name LIKE :search OR s.last_name LIKE :search OR r.room_number LIKE :search)"
            params["search"] = f"%{search}%"

        q += " ORDER BY ha.id DESC LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def get_active_allocation_by_student(db: Session, student_id: int) -> Optional[dict]:
    try:
        query = text("""
            SELECT
                ha.*,
                s.global_student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.email AS student_email,
                s.gender AS student_gender,
                r.room_number,
                h.id AS hostel_id,
                h.name AS hostel_name,
                h.gender_block
            FROM hostel_allocation ha
            JOIN student s ON ha.student_id = s.id
            JOIN room r ON ha.room_id = r.id
            JOIN hostel h ON r.hostel_id = h.id
            WHERE ha.student_id = :sid AND ha.status = 'ACTIVE'
        """)
        res = db.execute(query, {"sid": student_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def vacate_allocation(db: Session, alloc_id: int):
    try:
        query = text("""
            UPDATE hostel_allocation
            SET status = 'VACATED', to_date = IFNULL(to_date, CURRENT_DATE)
            WHERE id = :id AND status = 'ACTIVE'
        """)
        db.execute(query, {"id": alloc_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def transfer_allocation(db: Session, alloc_id: int, new_room_id: int, new_bed_number: Optional[str] = None):
    try:
        query = text("""
            UPDATE hostel_allocation
            SET room_id = :nrid, bed_number = :nbnum
            WHERE id = :id AND status = 'ACTIVE'
        """)
        db.execute(query, {
            "nrid": new_room_id,
            "nbnum": new_bed_number,
            "id": alloc_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Occupancy ---
def get_occupancy(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM vw_hostel_occupancy ORDER BY hostel_id ASC")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Request ---
def create_request(db: Session, student_id: int, data: schemas.HostelRequestCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_request (student_id, request_type, details, preferred_hostel_id, preferred_room_id, status)
            VALUES (:sid, :rtype, :det, :phid, :prid, 'PENDING')
        """)
        res = db.execute(query, {
            "sid": student_id,
            "rtype": data.request_type.value,
            "det": data.details,
            "phid": data.preferred_hostel_id,
            "prid": data.preferred_room_id
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def count_pending_requests(db: Session, student_id: int) -> int:
    try:
        query = text("SELECT COUNT(*) FROM hostel_request WHERE student_id = :sid AND status = 'PENDING'")
        return db.execute(query, {"sid": student_id}).scalar() or 0
    except Exception as e:
        handle_db_error(e)

def get_request(db: Session, req_id: int) -> Optional[dict]:
    try:
        query = text("""
            SELECT
                hr.*,
                s.global_student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.email AS student_email,
                s.gender AS student_gender,
                p.code AS program_code,
                ph.name AS preferred_hostel_name,
                pr.room_number AS preferred_room_number
            FROM hostel_request hr
            JOIN student s ON hr.student_id = s.id
            LEFT JOIN program p ON s.program_id = p.id
            LEFT JOIN hostel ph ON hr.preferred_hostel_id = ph.id
            LEFT JOIN room pr ON hr.preferred_room_id = pr.id
            WHERE hr.id = :id
        """)
        res = db.execute(query, {"id": req_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_requests(
    db: Session,
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    try:
        q = """
            SELECT
                hr.*,
                s.global_student_id,
                CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.email AS student_email,
                s.gender AS student_gender,
                p.code AS program_code,
                ph.name AS preferred_hostel_name,
                pr.room_number AS preferred_room_number
            FROM hostel_request hr
            JOIN student s ON hr.student_id = s.id
            LEFT JOIN program p ON s.program_id = p.id
            LEFT JOIN hostel ph ON hr.preferred_hostel_id = ph.id
            LEFT JOIN room pr ON hr.preferred_room_id = pr.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if student_id:
            q += " AND hr.student_id = :sid"
            params["sid"] = student_id
        if status:
            q += " AND hr.status = :st"
            params["st"] = status

        q += " ORDER BY hr.id DESC LIMIT :limit OFFSET :skip"
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

# --- Student Lookup Helper ---
def get_student_details(db: Session, student_id: int) -> Optional[dict]:
    try:
        query = text("""
            SELECT s.*, p.code AS program_code, p.name AS program_name
            FROM student s
            LEFT JOIN program p ON s.program_id = p.id
            WHERE s.id = :id
        """)
        res = db.execute(query, {"id": student_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def search_students_for_allocation(db: Session, query_str: str, limit: int = 20) -> List[dict]:
    try:
        query = text("""
            SELECT s.id, s.global_student_id, s.first_name, s.last_name, s.gender, s.is_hostel_eligible, s.status,
                   p.code AS program_code,
                   (SELECT COUNT(*) FROM hostel_allocation ha WHERE ha.student_id = s.id AND ha.status = 'ACTIVE') AS has_active_allocation
            FROM student s
            LEFT JOIN program p ON s.program_id = p.id
            WHERE s.global_student_id LIKE :q OR s.first_name LIKE :q OR s.last_name LIKE :q OR s.email LIKE :q
            ORDER BY s.id ASC
            LIMIT :lim
        """)
        res = db.execute(query, {"q": f"%{query_str}%", "lim": limit}).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Complaints / Maintenance ---
def create_complaint(db: Session, student_id: int, data: schemas.HostelComplaintCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_complaint (student_id, hostel_id, room_id, category, priority, title, description, status)
            VALUES (:sid, :hid, :rid, :cat, :prio, :title, :desc, 'SUBMITTED')
        """)
        res = db.execute(query, {
            "sid": student_id,
            "hid": data.hostel_id,
            "rid": data.room_id,
            "cat": data.category.value,
            "prio": data.priority.value,
            "title": data.title,
            "desc": data.description
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_complaint(db: Session, complaint_id: int) -> Optional[dict]:
    try:
        query = text("""
            SELECT c.*,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS hostel_name,
                   r.room_number
            FROM hostel_complaint c
            JOIN student s ON c.student_id = s.id
            JOIN hostel h ON c.hostel_id = h.id
            LEFT JOIN room r ON c.room_id = r.id
            WHERE c.id = :id
        """)
        res = db.execute(query, {"id": complaint_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_complaints(
    db: Session,
    student_id: Optional[int] = None,
    hostel_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    try:
        q = """
            SELECT c.*,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS hostel_name,
                   r.room_number
            FROM hostel_complaint c
            JOIN student s ON c.student_id = s.id
            JOIN hostel h ON c.hostel_id = h.id
            LEFT JOIN room r ON c.room_id = r.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if student_id:
            q += " AND c.student_id = :sid"
            params["sid"] = student_id
        if hostel_id:
            q += " AND c.hostel_id = :hid"
            params["hid"] = hostel_id
        if status:
            q += " AND c.status = :st"
            params["st"] = status

        q += " ORDER BY c.id DESC LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_complaint(db: Session, complaint_id: int, data: schemas.HostelComplaintUpdate):
    try:
        resolved_sql = ", resolved_at = CURRENT_TIMESTAMP" if data.status == schemas.ComplaintStatus.RESOLVED else ""
        priority_sql = ", priority = :prio" if data.priority else ""
        status_sql = "status = :st," if data.status else ""
        query = text(f"""
            UPDATE hostel_complaint
            SET {status_sql}
                assigned_to = COALESCE(:assigned, assigned_to),
                resolution_notes = COALESCE(:notes, resolution_notes)
                {priority_sql}
                {resolved_sql}
            WHERE id = :id
        """)
        db.execute(query, {
            "st": data.status.value if data.status else None,
            "prio": data.priority.value if data.priority else None,
            "assigned": data.assigned_to,
            "notes": data.resolution_notes,
            "id": complaint_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Inspections ---
def create_inspection(db: Session, data: schemas.HostelInspectionCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_inspection (room_id, student_id, inspection_type, cleanliness_rating, fixtures_condition, inventory_checked, remarks, inspector_name)
            VALUES (:rid, :sid, :itype, :crating, :fcond, :inv, :rem, :insp)
        """)
        res = db.execute(query, {
            "rid": data.room_id,
            "sid": data.student_id,
            "itype": data.inspection_type.value,
            "crating": data.cleanliness_rating,
            "fcond": data.fixtures_condition.value,
            "inv": 1 if data.inventory_checked else 0,
            "rem": data.remarks,
            "insp": data.inspector_name
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_inspections(db: Session, room_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        q = """
            SELECT ins.*,
                   r.room_number,
                   h.name AS hostel_name,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id
            FROM hostel_inspection ins
            JOIN room r ON ins.room_id = r.id
            JOIN hostel h ON r.hostel_id = h.id
            LEFT JOIN student s ON ins.student_id = s.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if room_id:
            q += " AND ins.room_id = :rid"
            params["rid"] = room_id
        q += " ORDER BY ins.id DESC LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Notices ---
def create_notice(db: Session, publisher_id: int, data: schemas.HostelNoticeCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_notice (hostel_id, title, content, priority, published_by)
            VALUES (:hid, :title, :content, :prio, :pub_by)
        """)
        res = db.execute(query, {
            "hid": data.hostel_id,
            "title": data.title,
            "content": data.content,
            "prio": data.priority.value,
            "pub_by": publisher_id
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_notices(db: Session, hostel_id: Optional[int] = None, skip: int = 0, limit: int = 50) -> List[dict]:
    try:
        q = """
            SELECT n.*,
                   h.name AS hostel_name,
                   u.username AS publisher_name
            FROM hostel_notice n
            LEFT JOIN hostel h ON n.hostel_id = h.id
            LEFT JOIN user_account u ON n.published_by = u.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if hostel_id:
            q += " AND (n.hostel_id = :hid OR n.hostel_id IS NULL)"
            params["hid"] = hostel_id
        q += " ORDER BY n.id DESC LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Outpasses ---
def create_outpass(db: Session, student_id: int, data: schemas.HostelOutpassCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_outpass (student_id, from_datetime, to_datetime, destination, reason, status)
            VALUES (:sid, :fdt, :tdt, :dest, :reason, 'PENDING')
        """)
        res = db.execute(query, {
            "sid": student_id,
            "fdt": data.from_datetime,
            "tdt": data.to_datetime,
            "dest": data.destination,
            "reason": data.reason
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_outpasses(db: Session, student_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    try:
        q = """
            SELECT op.*,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id
            FROM hostel_outpass op
            JOIN student s ON op.student_id = s.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {"limit": limit, "skip": skip}
        if student_id:
            q += " AND op.student_id = :sid"
            params["sid"] = student_id
        if status:
            q += " AND op.status = :st"
            params["st"] = status
        q += " ORDER BY op.id DESC LIMIT :limit OFFSET :skip"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def decide_outpass(db: Session, outpass_id: int, admin_id: int, data: schemas.HostelOutpassDecision):
    try:
        query = text("""
            UPDATE hostel_outpass
            SET status = :st, decision_by = :admin, decision_remark = :rem
            WHERE id = :id
        """)
        db.execute(query, {
            "st": data.status.value,
            "admin": admin_id,
            "rem": data.decision_remark,
            "id": outpass_id
        })
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- SIGNATURE FEATURES DATABASE QUERIES ---

# Feature A: Integrity Guardian Diagnostic Engine
def run_integrity_guardian_checks(db: Session) -> schemas.IntegrityGuardianReport:
    findings: List[schemas.IntegrityFinding] = []

    # 1. Bed count discrepancies: room.available_beds != room.bed_capacity - active_allocations
    bed_check = text("""
        SELECT r.id, r.room_number, r.bed_capacity, r.available_beds, h.name AS hostel_name,
               COALESCE(a.active_count, 0) AS real_active
        FROM room r
        JOIN hostel h ON r.hostel_id = h.id
        LEFT JOIN (
            SELECT room_id, COUNT(*) AS active_count
            FROM hostel_allocation
            WHERE status = 'ACTIVE'
            GROUP BY room_id
        ) a ON r.id = a.room_id
        WHERE r.available_beds != (r.bed_capacity - COALESCE(a.active_count, 0))
    """)
    rows = db.execute(bed_check).mappings().all()
    for row in rows:
        findings.append(schemas.IntegrityFinding(
            code="BED_COUNT_DESYNC",
            severity="HIGH",
            entity="room",
            record_id=row["id"],
            reference_key=f"{row['hostel_name']} - Room {row['room_number']}",
            description=f"Room reports {row['available_beds']} available beds, but actual active occupants is {row['real_active']} out of {row['bed_capacity']} capacity.",
            recommended_action=f"Recalculate available_beds to {row['bed_capacity'] - row['real_active']}."
        ))

    # 2. Over-capacity rooms
    overcap_check = text("""
        SELECT r.id, r.room_number, r.bed_capacity, h.name AS hostel_name, COUNT(ha.id) AS active_occupants
        FROM room r
        JOIN hostel h ON r.hostel_id = h.id
        JOIN hostel_allocation ha ON r.id = ha.room_id AND ha.status = 'ACTIVE'
        GROUP BY r.id, r.room_number, r.bed_capacity, h.name
        HAVING COUNT(ha.id) > r.bed_capacity
    """)
    rows = db.execute(overcap_check).mappings().all()
    for row in rows:
        findings.append(schemas.IntegrityFinding(
            code="OVER_CAPACITY_ROOM",
            severity="CRITICAL",
            entity="room",
            record_id=row["id"],
            reference_key=f"{row['hostel_name']} - Room {row['room_number']}",
            description=f"Room has {row['active_occupants']} active allocations, exceeding maximum capacity of {row['bed_capacity']}.",
            recommended_action="Relocate excess residents to vacant rooms."
        ))

    # 3. Incompatible gender allocations
    gender_check = text("""
        SELECT ha.id, s.id AS student_id, s.global_student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
               s.gender, h.name AS hostel_name, h.gender_block, r.room_number
        FROM hostel_allocation ha
        JOIN student s ON ha.student_id = s.id
        JOIN room r ON ha.room_id = r.id
        JOIN hostel h ON r.hostel_id = h.id
        WHERE ha.status = 'ACTIVE'
          AND h.gender_block != 'COED'
          AND s.gender IS NOT NULL
          AND s.gender != h.gender_block
    """)
    rows = db.execute(gender_check).mappings().all()
    for row in rows:
        findings.append(schemas.IntegrityFinding(
            code="GENDER_BLOCK_MISMATCH",
            severity="CRITICAL",
            entity="hostel_allocation",
            record_id=row["id"],
            reference_key=f"{row['global_student_id']} ({row['student_name']})",
            description=f"Student recorded as {row['gender']} is actively allocated in {row['hostel_name']} ({row['gender_block']} wing), Room {row['room_number']}.",
            recommended_action=f"Initiate room transfer to a {row['gender']} or COED residential block."
        ))

    # 4. Unverified demographics in gendered hostels
    unverified_check = text("""
        SELECT ha.id, s.global_student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
               h.name AS hostel_name, h.gender_block, r.room_number
        FROM hostel_allocation ha
        JOIN student s ON ha.student_id = s.id
        JOIN room r ON ha.room_id = r.id
        JOIN hostel h ON r.hostel_id = h.id
        WHERE ha.status = 'ACTIVE'
          AND h.gender_block != 'COED'
          AND s.gender IS NULL
    """)
    rows = db.execute(unverified_check).mappings().all()
    for row in rows:
        findings.append(schemas.IntegrityFinding(
            code="UNVERIFIED_DEMOGRAPHIC_ALLOCATION",
            severity="HIGH",
            entity="hostel_allocation",
            record_id=row["id"],
            reference_key=f"{row['global_student_id']} ({row['student_name']})",
            description=f"Student has unverified demographic information (gender IS NULL) while holding an active bed in gendered {row['hostel_name']} ({row['gender_block']}).",
            recommended_action="Registrar office must verify student demographic record."
        ))

    # 5. Inactive student holding active allocation
    inactive_check = text("""
        SELECT ha.id, s.global_student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.status AS student_status,
               h.name AS hostel_name, r.room_number
        FROM hostel_allocation ha
        JOIN student s ON ha.student_id = s.id
        JOIN room r ON ha.room_id = r.id
        JOIN hostel h ON r.hostel_id = h.id
        WHERE ha.status = 'ACTIVE' AND s.status != 'ACTIVE'
    """)
    rows = db.execute(inactive_check).mappings().all()
    for row in rows:
        findings.append(schemas.IntegrityFinding(
            code="INACTIVE_STUDENT_RESIDENT",
            severity="CRITICAL",
            entity="hostel_allocation",
            record_id=row["id"],
            reference_key=f"{row['global_student_id']} ({row['student_name']})",
            description=f"Student status is {row['student_status']} but allocation remains ACTIVE in {row['hostel_name']} Room {row['room_number']}.",
            recommended_action="Execute vacate clearance for graduated/dropped student."
        ))

    crit_count = sum(1 for f in findings if f.severity == 'CRITICAL')
    high_count = sum(1 for f in findings if f.severity == 'HIGH')
    med_count = sum(1 for f in findings if f.severity == 'MEDIUM')
    overall_status = "CRITICAL_ISSUES" if crit_count > 0 else ("WARNINGS" if high_count > 0 else "HEALTHY")

    return schemas.IntegrityGuardianReport(
        status=overall_status,
        total_checks_run=7,
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        findings=findings
    )

# Feature B: Smart Allocation Recommendations
def get_smart_allocation_recommendations(db: Session, student_id: int, preferred_hostel_id: Optional[int] = None) -> schemas.SmartAllocationResponse:
    student = get_student_details(db, student_id)
    if not student:
        raise ValueError("Student not found")

    gender = student.get("gender")
    is_eligible = bool(student.get("is_hostel_eligible", True))
    student_status = student.get("status", "ACTIVE")

    if student_status != "ACTIVE":
        return schemas.SmartAllocationResponse(
            student_id=student_id,
            global_student_id=student["global_student_id"],
            student_name=f"{student['first_name']} {student['last_name']}",
            gender=gender,
            is_eligible=False,
            eligibility_note=f"Ineligible: Student account is {student_status}.",
            recommended_rooms=[]
        )

    # Fetch available rooms
    q = """
        SELECT r.id AS room_id, r.room_number, r.bed_capacity, r.available_beds,
               h.id AS hostel_id, h.name AS hostel_name, h.gender_block
        FROM room r
        JOIN hostel h ON r.hostel_id = h.id
        WHERE r.available_beds > 0
    """
    params: Dict[str, Any] = {}
    if gender:
        q += " AND (h.gender_block = :gen OR h.gender_block = 'COED')"
        params["gen"] = gender
    else:
        # If gender unverified, only COED blocks are eligible
        q += " AND h.gender_block = 'COED'"

    rooms = db.execute(text(q), params).mappings().all()

    recommendations: List[schemas.RoomScoreDetail] = []
    for r in rooms:
        score = 50
        reasons = []

        # Preference matching
        if preferred_hostel_id and r["hostel_id"] == preferred_hostel_id:
            score += 30
            reasons.append("Matches student preferred residence hall (+30)")

        # Capacity balancing
        if r["available_beds"] > 1:
            score += 10
            reasons.append("Good capacity reserve (+10)")
        elif r["available_beds"] == 1:
            score += 5
            reasons.append("Fills last vacant bed (+5)")

        # Block alignment
        if gender and r["gender_block"] == gender:
            score += 10
            reasons.append(f"Dedicated {gender} residential wing (+10)")

        suggested_bed = f"Bed {r['bed_capacity'] - r['available_beds'] + 1}"

        recommendations.append(schemas.RoomScoreDetail(
            room_id=r["room_id"],
            room_number=r["room_number"],
            hostel_id=r["hostel_id"],
            hostel_name=r["hostel_name"],
            gender_block=r["gender_block"],
            bed_capacity=r["bed_capacity"],
            available_beds=r["available_beds"],
            score=score,
            eligible=True,
            reasons=reasons,
            suggested_bed=suggested_bed
        ))

    recommendations.sort(key=lambda x: x.score, reverse=True)

    elig_note = "Verified eligible for on-campus residential placement." if is_eligible else "Special hostel clearance required."
    if not gender:
        elig_note += " Note: Gender is unverified; restricted to COED residence halls."

    return schemas.SmartAllocationResponse(
        student_id=student_id,
        global_student_id=student["global_student_id"],
        student_name=f"{student['first_name']} {student['last_name']}",
        gender=gender,
        is_eligible=is_eligible,
        eligibility_note=elig_note,
        recommended_rooms=recommendations[:8]
    )

# Feature E: Student Hostel Journey
def get_student_journey(db: Session, student_id: int) -> schemas.StudentJourneyResponse:
    student = get_student_details(db, student_id)
    if not student:
        raise ValueError("Student record not found")

    events: List[schemas.JourneyEvent] = []

    # 1. Applications
    req_q = text("""
        SELECT hr.*, ph.name AS pref_hostel
        FROM hostel_request hr
        LEFT JOIN hostel ph ON hr.preferred_hostel_id = ph.id
        WHERE hr.student_id = :sid
        ORDER BY hr.id ASC
    """)
    for r in db.execute(req_q, {"sid": student_id}).mappings().all():
        req_type_label = r["request_type"].replace('_', ' ').title()
        events.append(schemas.JourneyEvent(
            event_type="APPLICATION",
            timestamp=r["created_at"],
            title=f"Submitted {req_type_label} Application",
            description=f"Applicant requested {req_type_label}. Notes: {r['details'] or 'None provided.'}",
            status_badge=r["status"],
            badge_variant="warning" if r["status"] == "PENDING" else ("success" if r["status"] == "APPROVED" else "error"),
            metadata={"request_id": r["id"], "type": r["request_type"], "remark": r["remark"]}
        ))
        if r["status"] in ("APPROVED", "REJECTED"):
            events.append(schemas.JourneyEvent(
                event_type="APPROVAL" if r["status"] == "APPROVED" else "REJECTION",
                timestamp=r["updated_at"] or r["created_at"],
                title=f"Application {r['status'].title()}",
                description=f"Warden decision recorded. Notes: {r['remark'] or 'No decision remarks.'}",
                status_badge=r["status"],
                badge_variant="success" if r["status"] == "APPROVED" else "error",
                metadata={"request_id": r["id"]}
            ))

    # 2. Allocations & Vacates
    alloc_q = text("""
        SELECT ha.*, r.room_number, h.name AS hostel_name
        FROM hostel_allocation ha
        JOIN room r ON ha.room_id = r.id
        JOIN hostel h ON r.hostel_id = h.id
        WHERE ha.student_id = :sid
        ORDER BY ha.id ASC
    """)
    current_hostel = None
    current_room = None
    for a in db.execute(alloc_q, {"sid": student_id}).mappings().all():
        events.append(schemas.JourneyEvent(
            event_type="ALLOCATION",
            timestamp=a["created_at"],
            title=f"Room Allotted: {a['hostel_name']} - Room {a['room_number']}",
            description=f"Official room allotment commenced from {a['from_date']}. Assigned bed: {a['bed_number'] or 'General'}.",
            status_badge="ACTIVE" if a["status"] == "ACTIVE" else "VACATED",
            badge_variant="success" if a["status"] == "ACTIVE" else "neutral",
            metadata={"allocation_id": a["id"], "room_number": a["room_number"], "hostel_name": a["hostel_name"]}
        ))
        if a["status"] == "ACTIVE":
            current_hostel = a["hostel_name"]
            current_room = a["room_number"]
        elif a["status"] == "VACATED" and a["to_date"]:
            events.append(schemas.JourneyEvent(
                event_type="VACATE",
                timestamp=datetime.combine(a["to_date"], datetime.min.time()),
                title=f"Vacated {a['hostel_name']} Room {a['room_number']}",
                description=f"Hostel clearance finalized on {a['to_date']}. Room key returned to warden desk.",
                status_badge="VACATED",
                badge_variant="neutral",
                metadata={"allocation_id": a["id"]}
            ))

    # 3. Complaints
    comp_q = text("""
        SELECT c.*, h.name AS hostel_name, r.room_number
        FROM hostel_complaint c
        JOIN hostel h ON c.hostel_id = h.id
        LEFT JOIN room r ON c.room_id = r.id
        WHERE c.student_id = :sid
        ORDER BY c.id ASC
    """)
    for c in db.execute(comp_q, {"sid": student_id}).mappings().all():
        events.append(schemas.JourneyEvent(
            event_type="COMPLAINT",
            timestamp=c["created_at"],
            title=f"Ticket #{c['id']}: {c['title']}",
            description=f"[{c['category']}] {c['description']} (Priority: {c['priority']})",
            status_badge=c["status"],
            badge_variant="success" if c["status"] in ("RESOLVED", "CLOSED") else "warning",
            metadata={"complaint_id": c["id"], "status": c["status"]}
        ))

    # 4. Inspections
    insp_q = text("""
        SELECT ins.*, r.room_number, h.name AS hostel_name
        FROM hostel_inspection ins
        JOIN room r ON ins.room_id = r.id
        JOIN hostel h ON r.hostel_id = h.id
        WHERE ins.student_id = :sid
        ORDER BY ins.id ASC
    """)
    for ins in db.execute(insp_q, {"sid": student_id}).mappings().all():
        events.append(schemas.JourneyEvent(
            event_type="INSPECTION",
            timestamp=ins["created_at"],
            title=f"Room Handover ({ins['inspection_type'].replace('_', ' ').title()})",
            description=f"Inspector: {ins['inspector_name']}. Cleanliness: {ins['cleanliness_rating']}/5. Fixtures: {ins['fixtures_condition']}. Remarks: {ins['remarks'] or 'None'}",
            status_badge=ins["fixtures_condition"],
            badge_variant="success" if ins["fixtures_condition"] in ("EXCELLENT", "GOOD") else "error",
            metadata={"inspection_id": ins["id"]}
        ))

    events.sort(key=lambda x: x.timestamp)

    curr_status = "RESIDENT" if current_room else "DAY_SCHOLAR"

    return schemas.StudentJourneyResponse(
        student_id=student_id,
        global_student_id=student["global_student_id"],
        student_name=f"{student['first_name']} {student['last_name']}",
        current_status=curr_status,
        current_hostel=current_hostel,
        current_room=current_room,
        events=events
    )

# --- Waitlist Operations ---
def create_waitlist(db: Session, data: schemas.HostelWaitlistCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_waitlist (student_id, preferred_hostel_id, preferred_room_id, priority_score, status, notes)
            VALUES (:student_id, :hostel_id, :room_id, :score, 'ACTIVE', :notes)
        """)
        res = db.execute(query, {
            "student_id": data.student_id,
            "hostel_id": data.preferred_hostel_id,
            "room_id": data.preferred_room_id,
            "score": data.priority_score,
            "notes": data.notes
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_waitlist(db: Session, hostel_id: Optional[int] = None, status: Optional[str] = None) -> List[dict]:
    try:
        clauses = []
        params = {}
        if hostel_id:
            clauses.append("w.preferred_hostel_id = :hostel_id")
            params["hostel_id"] = hostel_id
        if status:
            clauses.append("w.status = :status")
            params["status"] = status
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        query = text(f"""
            SELECT w.id, w.student_id, w.preferred_hostel_id, w.preferred_room_id,
                   w.priority_score, w.status, w.notes, w.created_at,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS preferred_hostel_name,
                   r.room_number AS preferred_room_number
            FROM hostel_waitlist w
            JOIN student s ON w.student_id = s.id
            JOIN hostel h ON w.preferred_hostel_id = h.id
            LEFT JOIN room r ON w.preferred_room_id = r.id
            {where_sql}
            ORDER BY w.priority_score DESC, w.created_at ASC
        """)
        return [dict(row) for row in db.execute(query, params).mappings().all()]
    except Exception as e:
        handle_db_error(e)

def update_waitlist_status(db: Session, waitlist_id: int, status: str, notes: Optional[str] = None):
    try:
        query = text("""
            UPDATE hostel_waitlist
            SET status = :status, notes = COALESCE(:notes, notes)
            WHERE id = :id
        """)
        db.execute(query, {"status": status, "notes": notes, "id": waitlist_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Visitor Tracking Operations ---
def create_visitor(db: Session, data: schemas.HostelVisitorCreate, gate_pass_number: str) -> int:
    try:
        query = text("""
            INSERT INTO hostel_visitor (
                hostel_id, student_id, visitor_name, relationship, id_proof_type,
                id_proof_number, entry_time, purpose, gate_pass_number
            )
            VALUES (
                :hostel_id, :student_id, :visitor_name, :relationship, :id_proof_type,
                :id_proof_number, :entry_time, :purpose, :gate_pass_number
            )
        """)
        res = db.execute(query, {
            "hostel_id": data.hostel_id,
            "student_id": data.student_id,
            "visitor_name": data.visitor_name,
            "relationship": data.relationship,
            "id_proof_type": data.id_proof_type,
            "id_proof_number": data.id_proof_number,
            "entry_time": data.entry_time,
            "purpose": data.purpose,
            "gate_pass_number": gate_pass_number
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def record_visitor_exit(db: Session, visitor_id: int, exit_time: datetime):
    try:
        query = text("""
            UPDATE hostel_visitor
            SET exit_time = :exit_time
            WHERE id = :id
        """)
        db.execute(query, {"exit_time": exit_time, "id": visitor_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_visitors(db: Session, hostel_id: Optional[int] = None) -> List[dict]:
    try:
        clauses = []
        params = {}
        if hostel_id:
            clauses.append("v.hostel_id = :hostel_id")
            params["hostel_id"] = hostel_id
        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        query = text(f"""
            SELECT v.id, v.hostel_id, v.student_id, v.visitor_name, v.relationship,
                   v.id_proof_type, v.id_proof_number, v.entry_time, v.exit_time,
                   v.purpose, v.gate_pass_number, v.created_at,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS hostel_name
            FROM hostel_visitor v
            JOIN student s ON v.student_id = s.id
            JOIN hostel h ON v.hostel_id = h.id
            {where_sql}
            ORDER BY v.entry_time DESC
        """)
        return [dict(row) for row in db.execute(query, params).mappings().all()]
    except Exception as e:
        handle_db_error(e)

# --- Student Demographics CSV Update ---
def update_student_demographics(db: Session, global_student_id: str, gender: Optional[str], is_hostel_eligible: bool) -> bool:
    try:
        check = db.execute(text("SELECT id FROM student WHERE global_student_id = :gid"), {"gid": global_student_id.strip()}).scalar()
        if not check:
            return False
        query = text("""
            UPDATE student
            SET gender = :gender,
                is_hostel_eligible = :eligible
            WHERE global_student_id = :gid
        """)
        db.execute(query, {
            "gender": gender,
            "eligible": 1 if is_hostel_eligible else 0,
            "gid": global_student_id.strip()
        })
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Room Inventory CSV Upsert ---
def get_hostel_by_name(db: Session, name: str) -> Optional[dict]:
    try:
        row = db.execute(
            text("SELECT id, name, gender_block, total_capacity FROM hostel WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name))"),
            {"name": name}
        ).mappings().first()
        return dict(row) if row else None
    except Exception as e:
        handle_db_error(e)

def upsert_room_inventory_row(
    db: Session,
    hostel_name: str,
    room_number: str,
    bed_capacity: int,
    gender_block: Optional[str] = None,
    readiness_status: str = "READY"
) -> tuple[bool, bool, Optional[str]]:
    try:
        hostel = get_hostel_by_name(db, hostel_name)
        if not hostel:
            valid_block = gender_block if gender_block in ("MALE", "FEMALE", "COED") else "COED"
            res = db.execute(
                text("INSERT INTO hostel (name, gender_block, total_capacity) VALUES (:name, :block, :cap)"),
                {"name": hostel_name.strip(), "block": valid_block, "cap": bed_capacity}
            )
            hostel_id = res.lastrowid
        else:
            hostel_id = hostel["id"]

        existing_room = db.execute(
            text("SELECT id, bed_capacity, available_beds FROM room WHERE hostel_id = :hid AND LOWER(TRIM(room_number)) = LOWER(TRIM(:rnum))"),
            {"hid": hostel_id, "rnum": room_number.strip()}
        ).mappings().first()

        valid_status = readiness_status.upper() if readiness_status.upper() in ("READY", "UNDER_MAINTENANCE", "NEEDS_CLEANING") else "READY"

        if existing_room:
            occupied = max(0, existing_room["bed_capacity"] - existing_room["available_beds"])
            if bed_capacity < occupied:
                return False, False, f"Cannot reduce capacity ({bed_capacity}) below active occupants ({occupied}) for Room {room_number}."
            new_available = bed_capacity - occupied
            db.execute(
                text("""
                    UPDATE room
                    SET bed_capacity = :cap,
                        available_beds = :avail,
                        readiness_status = :status
                    WHERE id = :rid
                """),
                {"cap": bed_capacity, "avail": new_available, "status": valid_status, "rid": existing_room["id"]}
            )
            db.execute(
                text("UPDATE hostel SET total_capacity = (SELECT COALESCE(SUM(bed_capacity), 0) FROM room WHERE hostel_id = :hid) WHERE id = :hid"),
                {"hid": hostel_id}
            )
            db.commit()
            return False, True, None
        else:
            db.execute(
                text("""
                    INSERT INTO room (hostel_id, room_number, bed_capacity, available_beds, readiness_status)
                    VALUES (:hid, :rnum, :cap, :cap, :status)
                """),
                {"hid": hostel_id, "rnum": room_number.strip(), "cap": bed_capacity, "status": valid_status}
            )
            db.execute(
                text("UPDATE hostel SET total_capacity = (SELECT COALESCE(SUM(bed_capacity), 0) FROM room WHERE hostel_id = :hid) WHERE id = :hid"),
                {"hid": hostel_id}
            )
            db.commit()
            return True, False, None
    except Exception as e:
        db.rollback()
        return False, False, str(e)


# --- Minimal Hostel Fee Management Repository ---
def get_fee_configs(db: Session, hostel_id: Optional[int] = None) -> List[dict]:
    try:
        q = """
            SELECT fc.*, h.name AS hostel_name
            FROM hostel_fee_config fc
            LEFT JOIN hostel h ON fc.hostel_id = h.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {}
        if hostel_id:
            q += " AND (fc.hostel_id = :hid OR fc.hostel_id IS NULL)"
            params["hid"] = hostel_id
        q += " ORDER BY fc.id DESC"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def create_fee_config(db: Session, data: schemas.HostelFeeConfigCreate) -> int:
    try:
        query = text("""
            INSERT INTO hostel_fee_config (hostel_id, fee_name, amount, academic_term, due_days)
            VALUES (:hid, :name, :amount, :term, :due_days)
        """)
        res = db.execute(query, {
            "hid": data.hostel_id,
            "name": data.fee_name.strip(),
            "amount": data.amount,
            "term": data.academic_term.strip(),
            "due_days": data.due_days
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_invoices(db: Session, student_id: Optional[int] = None, hostel_id: Optional[int] = None, status_val: Optional[str] = None) -> List[dict]:
    try:
        q = """
            SELECT inv.*,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS hostel_name
            FROM hostel_invoice inv
            JOIN student s ON inv.student_id = s.id
            JOIN hostel h ON inv.hostel_id = h.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {}
        if student_id:
            q += " AND inv.student_id = :sid"
            params["sid"] = student_id
        if hostel_id:
            q += " AND inv.hostel_id = :hid"
            params["hid"] = hostel_id
        if status_val:
            q += " AND inv.status = :st"
            params["st"] = status_val
        q += " ORDER BY inv.id DESC"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def get_invoice(db: Session, invoice_id: int) -> Optional[dict]:
    try:
        q = text("""
            SELECT inv.*,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id,
                   h.name AS hostel_name
            FROM hostel_invoice inv
            JOIN student s ON inv.student_id = s.id
            JOIN hostel h ON inv.hostel_id = h.id
            WHERE inv.id = :iid
        """)
        res = db.execute(q, {"iid": invoice_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def create_invoice(db: Session, data: schemas.HostelInvoiceCreate) -> int:
    try:
        import time
        import random
        inv_num = f"HOS-INV-{int(time.time())}-{random.randint(100, 999)}"
        query = text("""
            INSERT INTO hostel_invoice (invoice_number, student_id, hostel_id, fee_config_id, title, amount, amount_paid, balance, due_date, status)
            VALUES (:inv_num, :sid, :hid, :cid, :title, :amount, 0.00, :amount, :due_date, 'UNPAID')
        """)
        res = db.execute(query, {
            "inv_num": inv_num,
            "sid": data.student_id,
            "hid": data.hostel_id,
            "cid": data.fee_config_id,
            "title": data.title.strip(),
            "amount": data.amount,
            "due_date": data.due_date
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def create_payment(db: Session, data: schemas.HostelPaymentSubmit, student_id: int) -> int:
    try:
        import time
        import random
        pay_num = f"HOS-PAY-{int(time.time())}-{random.randint(100, 999)}"
        is_demo = (data.payment_method.upper() == 'DEMO')
        init_status = 'VERIFIED' if is_demo else 'PENDING_VERIFICATION'

        query = text("""
            INSERT INTO hostel_payment (payment_number, invoice_id, student_id, amount_paid, payment_method, payment_reference, upi_id, proof_notes, status, verified_at)
            VALUES (:pnum, :iid, :sid, :amount, :pmethod, :pref, 'campusos.hostel@icici', :notes, :status, :vat)
        """)
        res = db.execute(query, {
            "pnum": pay_num,
            "iid": data.invoice_id,
            "sid": student_id,
            "amount": data.amount_paid,
            "pmethod": data.payment_method.upper(),
            "pref": data.payment_reference.strip(),
            "notes": data.proof_notes or ("Instant verified demo payment" if is_demo else None),
            "status": init_status,
            "vat": datetime.utcnow() if is_demo else None
        })
        pay_id = res.lastrowid

        # Update invoice balance and status
        if is_demo:
            db.execute(text("""
                UPDATE hostel_invoice
                SET amount_paid = amount_paid + :amt,
                    balance = GREATEST(0.00, amount - amount_paid),
                    status = IF(amount - amount_paid <= 0.00, 'PAID', 'PARTIALLY_PAID')
                WHERE id = :iid
            """), {"amt": data.amount_paid, "iid": data.invoice_id})
        else:
            db.execute(text("""
                UPDATE hostel_invoice
                SET status = 'PENDING_VERIFICATION'
                WHERE id = :iid AND status = 'UNPAID'
            """), {"iid": data.invoice_id})

        db.commit()
        return pay_id
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_payments(db: Session, invoice_id: Optional[int] = None, student_id: Optional[int] = None, status_val: Optional[str] = None) -> List[dict]:
    try:
        q = """
            SELECT p.*,
                   inv.invoice_number,
                   CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                   s.global_student_id
            FROM hostel_payment p
            JOIN hostel_invoice inv ON p.invoice_id = inv.id
            JOIN student s ON p.student_id = s.id
            WHERE 1=1
        """
        params: Dict[str, Any] = {}
        if invoice_id:
            q += " AND p.invoice_id = :iid"
            params["iid"] = invoice_id
        if student_id:
            q += " AND p.student_id = :sid"
            params["sid"] = student_id
        if status_val:
            q += " AND p.status = :st"
            params["st"] = status_val
        q += " ORDER BY p.id DESC"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def verify_payment(db: Session, payment_id: int, verified_by: int, status_val: str, notes: Optional[str] = None) -> bool:
    try:
        pay = db.execute(text("SELECT * FROM hostel_payment WHERE id = :pid"), {"pid": payment_id}).mappings().first()
        if not pay:
            return False

        if status_val == 'VERIFIED' and pay["status"] != 'VERIFIED':
            # Update payment
            db.execute(text("""
                UPDATE hostel_payment
                SET status = 'VERIFIED',
                    verified_by = :vby,
                    verification_notes = :notes,
                    verified_at = NOW()
                WHERE id = :pid
            """), {"pid": payment_id, "vby": verified_by, "notes": notes})

            # Update invoice balance
            db.execute(text("""
                UPDATE hostel_invoice
                SET amount_paid = amount_paid + :amt,
                    balance = GREATEST(0.00, amount - amount_paid),
                    status = IF(amount - amount_paid <= 0.00, 'PAID', 'PARTIALLY_PAID')
                WHERE id = :iid
            """), {"amt": pay["amount_paid"], "iid": pay["invoice_id"]})
        elif status_val == 'REJECTED':
            db.execute(text("""
                UPDATE hostel_payment
                SET status = 'REJECTED',
                    verified_by = :vby,
                    verification_notes = :notes,
                    verified_at = NOW()
                WHERE id = :pid
            """), {"pid": payment_id, "vby": verified_by, "notes": notes})

            # Recalculate invoice status based on verified payments
            db.execute(text("""
                UPDATE hostel_invoice
                SET status = IF(balance <= 0.00, 'PAID', IF(amount_paid > 0.00, 'PARTIALLY_PAID', 'UNPAID'))
                WHERE id = :iid
            """), {"iid": pay["invoice_id"]})

        db.commit()
        return True
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_fee_summary(db: Session) -> dict:
    try:
        inv_stat = db.execute(text("""
            SELECT
                COALESCE(SUM(amount), 0.0) AS total_invoiced,
                COALESCE(SUM(amount_paid), 0.0) AS total_collected,
                COALESCE(SUM(balance), 0.0) AS total_pending,
                COUNT(*) AS invoices_count
            FROM hostel_invoice
        """)).mappings().first()

        pending_pays = db.execute(text("""
            SELECT COUNT(*) AS cnt FROM hostel_payment WHERE status = 'PENDING_VERIFICATION'
        """)).scalar() or 0

        return {
            "total_invoiced": float(inv_stat["total_invoiced"] if inv_stat else 0.0),
            "total_collected": float(inv_stat["total_collected"] if inv_stat else 0.0),
            "total_pending": float(inv_stat["total_pending"] if inv_stat else 0.0),
            "invoices_count": int(inv_stat["invoices_count"] if inv_stat else 0),
            "pending_verification_count": int(pending_pays)
        }
    except Exception as e:
        handle_db_error(e)
