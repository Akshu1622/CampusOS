
SELECT 'Testing fn_late_fee_penalty' AS Test;
-- Rule 1: FLAT 500, Rule 2: PER_DAY 50 max 1000. 
-- Seed data might not have rule 2. Let's insert rules.
INSERT IGNORE INTO late_fee_rule (id, rule_type, penalty_amount, max_penalty) VALUES (1, 'FLAT', 500.00, NULL);
INSERT IGNORE INTO late_fee_rule (id, rule_type, penalty_amount, max_penalty) VALUES (2, 'PER_DAY', 50.00, 1000.00);

SELECT fn_late_fee_penalty(1, '2023-10-01', '2023-10-05') AS penalty_grace;
SELECT fn_late_fee_penalty(1, '2023-10-01', '2023-10-11') AS penalty_flat;
SELECT fn_late_fee_penalty(2, '2023-10-01', '2023-10-11') AS penalty_per_day;
SELECT fn_late_fee_penalty(999, '2023-10-01', '2023-10-11') AS penalty_invalid_rule;
