-- db/programs/triggers/01_trg_hostel_allocation.sql
-- Name: trg_hostel_allocation_bi, trg_hostel_allocation_bu, trg_hostel_allocation_bd
-- Purpose: Keep room.available_beds correct on insert, update, and delete. Reject invalid allocations.
-- Exact Signature: Triggers on hostel_allocation (BEFORE INSERT, BEFORE UPDATE, BEFORE DELETE)
-- Algorithm:
--   INSERT:
--     If NEW.status = 'ACTIVE':
--       Check for existing ACTIVE allocation (signal 56002).
--       Select available_beds FOR UPDATE. If <= 0, signal 56001.
--       Decrement available_beds.
--   UPDATE:
--     If turning ACTIVE (from inactive):
--       Check for existing ACTIVE allocation (signal 56002).
--       Check available_beds FOR UPDATE. If <= 0, signal 56001.
--       Decrement NEW room.
--     If turning INACTIVE (from active):
--       Increment OLD room.
--     If staying ACTIVE but changing room:
--       Check NEW room available_beds FOR UPDATE. If <= 0, signal 56001.
--       Decrement NEW room, increment OLD room.
--   DELETE:
--     If OLD.status = 'ACTIVE':
--       Increment OLD room.
-- Errors Raised: 56001 NO_BEDS_AVAILABLE, 56002 ACTIVE_ALLOCATION_EXISTS
-- Transaction/Locking: Acquires row locks on room table (FOR UPDATE) to prevent race conditions.
-- Idempotency/Edge cases:
--   - Room change to the same room: Handled by NEW.room_id != OLD.room_id check.
--   - Changing an inactive allocation to another room stays inactive: No bed impact.
--   - Virtual unique index on student_id/active might catch duplicate active first, but explicitly checked here for custom error code.

DELIMITER //

CREATE TRIGGER trg_hostel_allocation_bi
BEFORE INSERT ON hostel_allocation
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT DEFAULT 0;
    DECLARE v_beds INT DEFAULT 0;

    IF NEW.status = 'ACTIVE' THEN
        -- Check duplicate
        SELECT COUNT(*) INTO v_active_count FROM hostel_allocation WHERE student_id = NEW.student_id AND status = 'ACTIVE';
        IF v_active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 56002, MESSAGE_TEXT = 'The student already has an active hostel allocation.';
        END IF;

        -- Check beds
        SELECT available_beds INTO v_beds FROM room WHERE id = NEW.room_id FOR UPDATE;
        IF v_beds <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 56001, MESSAGE_TEXT = 'There are no beds available in the requested hostel/room.';
        END IF;

        -- Update room
        UPDATE room SET available_beds = available_beds - 1 WHERE id = NEW.room_id;
    END IF;
END //

CREATE TRIGGER trg_hostel_allocation_bu
BEFORE UPDATE ON hostel_allocation
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT DEFAULT 0;
    DECLARE v_beds INT DEFAULT 0;

    -- Case 1: Turning ACTIVE from INACTIVE
    IF NEW.status = 'ACTIVE' AND OLD.status != 'ACTIVE' THEN
        SELECT COUNT(*) INTO v_active_count FROM hostel_allocation WHERE student_id = NEW.student_id AND status = 'ACTIVE' AND id != NEW.id;
        IF v_active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 56002, MESSAGE_TEXT = 'The student already has an active hostel allocation.';
        END IF;

        SELECT available_beds INTO v_beds FROM room WHERE id = NEW.room_id FOR UPDATE;
        IF v_beds <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 56001, MESSAGE_TEXT = 'There are no beds available in the requested hostel/room.';
        END IF;
        UPDATE room SET available_beds = available_beds - 1 WHERE id = NEW.room_id;

    -- Case 2: Turning INACTIVE from ACTIVE
    ELSEIF NEW.status != 'ACTIVE' AND OLD.status = 'ACTIVE' THEN
        UPDATE room SET available_beds = available_beds + 1 WHERE id = OLD.room_id;

    -- Case 3: Staying ACTIVE but changing room
    ELSEIF NEW.status = 'ACTIVE' AND OLD.status = 'ACTIVE' AND NEW.room_id != OLD.room_id THEN
        SELECT available_beds INTO v_beds FROM room WHERE id = NEW.room_id FOR UPDATE;
        IF v_beds <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 56001, MESSAGE_TEXT = 'There are no beds available in the requested hostel/room.';
        END IF;
        UPDATE room SET available_beds = available_beds - 1 WHERE id = NEW.room_id;
        UPDATE room SET available_beds = available_beds + 1 WHERE id = OLD.room_id;
    END IF;
END //

CREATE TRIGGER trg_hostel_allocation_bd
BEFORE DELETE ON hostel_allocation
FOR EACH ROW
BEGIN
    IF OLD.status = 'ACTIVE' THEN
        UPDATE room SET available_beds = available_beds + 1 WHERE id = OLD.room_id;
    END IF;
END //

DELIMITER ;
