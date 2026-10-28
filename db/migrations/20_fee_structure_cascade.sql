-- Migration 20: Enable cascade deletion on fee components and student fee allocations
-- Resolves test idempotency and deletion blocks when re-running test suites

ALTER TABLE payment_allocation DROP FOREIGN KEY FK_pay_alloc_fee;
ALTER TABLE payment_allocation ADD CONSTRAINT FK_pay_alloc_fee FOREIGN KEY (student_fee_id) REFERENCES student_fee(id) ON DELETE CASCADE;

ALTER TABLE student_fee DROP FOREIGN KEY FK_student_fee_comp;
ALTER TABLE student_fee ADD CONSTRAINT FK_student_fee_comp FOREIGN KEY (component_id) REFERENCES fee_component(id) ON DELETE CASCADE;
