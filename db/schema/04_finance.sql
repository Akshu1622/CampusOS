-- db/schema/04_finance.sql
-- M4 Finance Module

-- 1. fee_structure
CREATE TABLE fee_structure (
    id INT NOT NULL AUTO_INCREMENT,
    program_id INT NOT NULL,
    term_id INT NOT NULL,
    structure_name VARCHAR(100) NOT NULL,
    CONSTRAINT PK_fee_structure PRIMARY KEY (id),
    CONSTRAINT UK_prog_term UNIQUE (program_id, term_id),
    CONSTRAINT FK_fee_struct_program FOREIGN KEY (program_id) REFERENCES program(id) ON DELETE RESTRICT,
    CONSTRAINT FK_fee_struct_term FOREIGN KEY (term_id) REFERENCES academic_term(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Defines fee groups (PRD §6.4, §11.2)';

CREATE INDEX idx_fee_struct_term ON fee_structure(term_id);

-- 2. fee_component
CREATE TABLE fee_component (
    id INT NOT NULL AUTO_INCREMENT,
    structure_id INT NOT NULL,
    component_name VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    CONSTRAINT PK_fee_component PRIMARY KEY (id),
    CONSTRAINT UK_struct_comp UNIQUE (structure_id, component_name),
    CONSTRAINT CHK_fee_comp_amount CHECK (amount >= 0),
    CONSTRAINT FK_fee_comp_struct FOREIGN KEY (structure_id) REFERENCES fee_structure(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual items in a fee structure (PRD §6.4, §11.2)';

-- 3. student_fee
CREATE TABLE student_fee (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    component_id INT NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT PK_student_fee PRIMARY KEY (id),
    CONSTRAINT UK_student_comp UNIQUE (student_id, component_id),
    CONSTRAINT CHK_student_fee_due CHECK (amount_due >= 0),
    CONSTRAINT CHK_student_fee_paid CHECK (amount_paid >= 0),
    CONSTRAINT FK_student_fee_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT,
    CONSTRAINT FK_student_fee_comp FOREIGN KEY (component_id) REFERENCES fee_component(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dues generated for a student (PRD §6.4, §11.2)';

CREATE INDEX idx_student_fee_comp ON student_fee(component_id);

-- 4. late_fee_rule
CREATE TABLE late_fee_rule (
    id INT NOT NULL AUTO_INCREMENT,
    rule_type ENUM('FLAT', 'PER_DAY') NOT NULL,
    penalty_amount DECIMAL(10,2) NOT NULL,
    max_penalty DECIMAL(10,2) NULL,
    CONSTRAINT PK_late_fee_rule PRIMARY KEY (id),
    CONSTRAINT CHK_late_fee_amt CHECK (penalty_amount >= 0),
    CONSTRAINT CHK_late_fee_max CHECK (max_penalty IS NULL OR max_penalty >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rules for calculating late fees (PRD §6.4, §11.2)';

-- 5. payment
CREATE TABLE payment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('CASH', 'ONLINE', 'DD') NOT NULL,
    reference_no VARCHAR(50) NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    CONSTRAINT PK_payment PRIMARY KEY (id),
    CONSTRAINT UK_payment_ref UNIQUE (reference_no),
    CONSTRAINT CHK_payment_amount CHECK (amount > 0),
    CONSTRAINT FK_payment_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student payments (PRD §6.4, §11.2)';

CREATE INDEX idx_payment_student ON payment(student_id);

-- 6. payment_allocation
CREATE TABLE payment_allocation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_id BIGINT NOT NULL,
    student_fee_id BIGINT NOT NULL,
    allocated_principal DECIMAL(10,2) NOT NULL DEFAULT 0,
    allocated_late_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT PK_payment_allocation PRIMARY KEY (id),
    CONSTRAINT UK_pay_fee UNIQUE (payment_id, student_fee_id),
    CONSTRAINT CHK_alloc_principal CHECK (allocated_principal >= 0),
    CONSTRAINT CHK_alloc_late CHECK (allocated_late_fee >= 0),
    CONSTRAINT FK_pay_alloc_payment FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE CASCADE,
    CONSTRAINT FK_pay_alloc_fee FOREIGN KEY (student_fee_id) REFERENCES student_fee(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Maps a payment to specific dues (PRD §6.4, §11.2)';

CREATE INDEX idx_pay_alloc_fee ON payment_allocation(student_fee_id);

-- 7. receipt
CREATE TABLE receipt (
    id BIGINT NOT NULL AUTO_INCREMENT,
    receipt_number VARCHAR(20) NOT NULL,
    payment_id BIGINT NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_receipt PRIMARY KEY (id),
    CONSTRAINT UK_receipt_num UNIQUE (receipt_number),
    CONSTRAINT UK_receipt_payment UNIQUE (payment_id),
    CONSTRAINT CHK_receipt_num_format CHECK (receipt_number REGEXP '^RCP-[0-9]{8}-[0-9]{5}$'),
    CONSTRAINT FK_receipt_payment FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generated receipts (PRD §6.4, §11.2)';

-- 8. fee_audit_log
CREATE TABLE fee_audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    old_value DECIMAL(10,2) NULL,
    new_value DECIMAL(10,2) NULL,
    changed_by VARCHAR(50) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_fee_audit_log PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audits changes to fee structures (PRD §6.4, §11.2)';

CREATE INDEX idx_fee_audit_entity ON fee_audit_log(entity_name, entity_id);

-- 9. hostel_fee_component_link
CREATE TABLE hostel_fee_component_link (
    id INT NOT NULL AUTO_INCREMENT,
    fee_component_id INT NOT NULL,
    hostel_id INT NOT NULL,
    CONSTRAINT PK_hostel_fee_comp PRIMARY KEY (id),
    CONSTRAINT UK_comp_hostel UNIQUE (fee_component_id, hostel_id),
    CONSTRAINT FK_hfcl_fee_comp FOREIGN KEY (fee_component_id) REFERENCES fee_component(id) ON DELETE CASCADE
    -- fk_hfcl_hostel deferred to 90_deferred_foreign_keys.sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hostel fee components link (PRD §4.1)';

CREATE INDEX idx_hfcl_hostel ON hostel_fee_component_link(hostel_id);
