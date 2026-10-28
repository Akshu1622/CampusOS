-- Migration 21: Hostel Operations Enhancements
-- Adds waitlist, visitor tracking, expanded complaint categories, and room readiness status

-- 1. Create hostel_waitlist table
CREATE TABLE IF NOT EXISTS `hostel_waitlist` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `preferred_hostel_id` int NOT NULL,
  `preferred_room_id` int DEFAULT NULL,
  `priority_score` int NOT NULL DEFAULT 50,
  `status` enum('ACTIVE', 'ALLOTTED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_waitlist_hostel` (`preferred_hostel_id`),
  KEY `idx_waitlist_student` (`student_id`),
  CONSTRAINT `FK_waitlist_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_waitlist_hostel` FOREIGN KEY (`preferred_hostel_id`) REFERENCES `hostel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create hostel_visitor table
CREATE TABLE IF NOT EXISTS `hostel_visitor` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hostel_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `visitor_name` varchar(100) NOT NULL,
  `relationship` varchar(50) NOT NULL DEFAULT 'Parent',
  `id_proof_type` varchar(50) NOT NULL DEFAULT 'Government ID',
  `id_proof_number` varchar(50) DEFAULT NULL,
  `entry_time` datetime NOT NULL,
  `exit_time` datetime DEFAULT NULL,
  `purpose` varchar(255) NOT NULL,
  `gate_pass_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visitor_hostel` (`hostel_id`),
  KEY `idx_visitor_student` (`student_id`),
  CONSTRAINT `FK_visitor_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostel` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_visitor_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Stored procedure to safely expand complaint categories and add room readiness_status
DELIMITER //
CREATE PROCEDURE sp_migrate_m6_operations()
BEGIN
  -- Expand hostel_complaint.category
  IF EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_complaint' AND COLUMN_NAME = 'category') THEN
    ALTER TABLE `hostel_complaint` MODIFY COLUMN `category` ENUM(
      'ELECTRICAL', 'PLUMBING', 'MESS_FOOD', 'CLEANING_SANITATION',
      'WATER_UTILITIES', 'INTERNET_WIFI', 'ROOM_FURNITURE', 'CARPENTRY',
      'CLEANING', 'INTERNET', 'OTHER'
    ) NOT NULL;
  END IF;

  -- Add readiness_status to room if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'room' AND COLUMN_NAME = 'readiness_status') THEN
    ALTER TABLE `room` ADD COLUMN `readiness_status` ENUM('READY', 'UNDER_MAINTENANCE', 'NEEDS_CLEANING') NOT NULL DEFAULT 'READY';
  END IF;
END //
DELIMITER ;

CALL sp_migrate_m6_operations();
DROP PROCEDURE IF EXISTS sp_migrate_m6_operations;

-- 4. Grant privileges to app user
GRANT ALL PRIVILEGES ON `university_erp`.* TO 'app'@'%';
FLUSH PRIVILEGES;
