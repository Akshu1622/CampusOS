-- db/schema/90_deferred_foreign_keys.sql
-- Adds foreign keys that were deferred due to circular or forward dependencies across module files.

ALTER TABLE department 
ADD CONSTRAINT FK_department_head 
FOREIGN KEY (head_employee_id) REFERENCES employee(id) ON DELETE RESTRICT;

ALTER TABLE user_account 
ADD CONSTRAINT FK_user_account_employee 
FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE RESTRICT;

ALTER TABLE course_offering 
ADD CONSTRAINT FK_offering_faculty 
FOREIGN KEY (faculty_id) REFERENCES employee(id) ON DELETE RESTRICT;

ALTER TABLE hostel_fee_component_link 
ADD CONSTRAINT FK_hfcl_hostel 
FOREIGN KEY (hostel_id) REFERENCES hostel(id) ON DELETE CASCADE;
