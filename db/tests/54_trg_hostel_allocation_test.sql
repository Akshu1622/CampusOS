
SELECT 'Testing trg_hostel_allocation' AS Test;

-- Ensure beds available
UPDATE room SET available_beds = bed_capacity WHERE id = 1;
SELECT available_beds FROM room WHERE id = 1;

-- Success: Insert
INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (50, 1, CURDATE(), 'ACTIVE');
SELECT available_beds AS beds_after_insert FROM room WHERE id = 1;

DELIMITER //
CREATE PROCEDURE test_alloc_duplicate()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @msg = MESSAGE_TEXT;
        SELECT CONCAT('Caught error ', @errno, ': ', @msg) AS Error_Message;
    END;
    -- Try to insert again for same student
    INSERT INTO hostel_allocation (student_id, room_id, from_date, status) VALUES (50, 2, CURDATE(), 'ACTIVE');
END //
DELIMITER ;

CALL test_alloc_duplicate();

-- Success: Update Room
UPDATE hostel_allocation SET room_id = 2 WHERE student_id = 50 AND status = 'ACTIVE';
SELECT available_beds AS beds_room_1_after_change FROM room WHERE id = 1;
SELECT available_beds AS beds_room_2_after_change FROM room WHERE id = 2;

-- Success: Vacate
UPDATE hostel_allocation SET status = 'VACATED' WHERE student_id = 50 AND status = 'ACTIVE';
SELECT available_beds AS beds_room_2_after_vacate FROM room WHERE id = 2;
