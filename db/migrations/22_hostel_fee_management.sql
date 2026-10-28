-- Migration 22: Minimal Hostel Fee Management
-- Module 6 self-contained fee configuration, student invoices, and verified UPI/demo payments

CREATE TABLE IF NOT EXISTS `hostel_fee_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hostel_id` INT NULL,
  `fee_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `academic_term` VARCHAR(50) NOT NULL DEFAULT 'AY-2026-27-SEM1',
  `due_days` INT NOT NULL DEFAULT 30,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hostel_fee_config_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hostel_invoice` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(64) UNIQUE NOT NULL,
  `student_id` BIGINT NOT NULL,
  `hostel_id` INT NOT NULL,
  `fee_config_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `amount_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `balance` DECIMAL(10, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PENDING_VERIFICATION', 'PAID') NOT NULL DEFAULT 'UNPAID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hostel_invoice_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hostel_invoice_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostel` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hostel_invoice_config` FOREIGN KEY (`fee_config_id`) REFERENCES `hostel_fee_config` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hostel_payment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_number` VARCHAR(64) UNIQUE NOT NULL,
  `invoice_id` INT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `amount_paid` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('UPI', 'DEMO', 'BANK_TRANSFER') NOT NULL DEFAULT 'UPI',
  `payment_reference` VARCHAR(100) NOT NULL,
  `upi_id` VARCHAR(100) DEFAULT 'campusos.hostel@icici',
  `proof_notes` TEXT NULL,
  `status` ENUM('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `verified_by` BIGINT NULL,
  `verification_notes` TEXT NULL,
  `verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hostel_payment_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `hostel_invoice` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hostel_payment_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
