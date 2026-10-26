-- verify_seed.sql : run after loading the seed.  Every "violations" row must be 0.
USE university_erp;

-- ===== A. Integrity rules from PRD 11.4 (expect 0) =====
SELECT 'beds != capacity - active allocations' AS check_name, COUNT(*) AS violations FROM rooms r
  LEFT JOIN (SELECT room_id, COUNT(*) c FROM hostel_allocations WHERE status='ACTIVE' GROUP BY room_id) a ON a.room_id=r.room_id
  WHERE r.available_beds <> r.bed_capacity - COALESCE(a.c,0)
UNION ALL SELECT 'student with >1 active hostel allocation', COUNT(*) FROM
  (SELECT student_id FROM hostel_allocations WHERE status='ACTIVE' GROUP BY student_id HAVING COUNT(*)>1) x
UNION ALL SELECT 'hostel gender mismatch', COUNT(*) FROM hostel_allocations ha JOIN students s ON s.student_id=ha.student_id
  JOIN rooms r ON r.room_id=ha.room_id JOIN hostels h ON h.hostel_id=r.hostel_id
  WHERE (s.gender='M' AND h.hostel_type<>'BOYS') OR (s.gender='F' AND h.hostel_type<>'GIRLS')
UNION ALL SELECT 'payment allocation sum != payment amount - late fee', COUNT(*) FROM payments p
  LEFT JOIN (SELECT payment_id, SUM(amount_applied) a FROM payment_allocations GROUP BY payment_id) x ON x.payment_id=p.payment_id
  WHERE p.status='SUCCESS' AND ROUND(p.amount - p.late_fee,2) <> ROUND(COALESCE(x.a,0),2)
UNION ALL SELECT 'student_fees.amount_paid != sum(allocations)', COUNT(*) FROM student_fees f
  LEFT JOIN (SELECT fee_id, SUM(amount_applied) a FROM payment_allocations GROUP BY fee_id) x ON x.fee_id=f.fee_id
  WHERE ROUND(f.amount_paid,2) <> ROUND(COALESCE(x.a,0),2)
UNION ALL SELECT 'SUCCESS payment without receipt', COUNT(*) FROM payments p LEFT JOIN receipts r ON r.payment_id=p.payment_id
  WHERE p.status='SUCCESS' AND r.receipt_id IS NULL
UNION ALL SELECT 'registration while attendance < 75% (trigger rule)', COUNT(*) FROM exam_registrations er
  JOIN exams x ON x.exam_id=er.exam_id JOIN course_offerings o ON o.offering_id=x.offering_id AND o.term_id=7
  JOIN (SELECT ar.enrollment_id, 100*SUM(ar.status='P')/COUNT(*) pct FROM attendance_records ar GROUP BY ar.enrollment_id) t
    ON t.enrollment_id=er.enrollment_id WHERE t.pct < 75
UNION ALL SELECT 'enrollment over offering capacity', COUNT(*) FROM
  (SELECT e.offering_id FROM enrollments e JOIN course_offerings o ON o.offering_id=e.offering_id
   WHERE e.status<>'WITHDRAWN' GROUP BY e.offering_id, o.capacity HAVING COUNT(*) > o.capacity) x
UNION ALL SELECT 'marks above exam max', COUNT(*) FROM exam_marks m JOIN exam_registrations r ON r.registration_id=m.registration_id
  JOIN exams x ON x.exam_id=r.exam_id WHERE m.marks_obtained > x.max_marks
UNION ALL SELECT 'overlapping approved leave (same employee)', COUNT(*) FROM leave_applications a JOIN leave_applications b
  ON a.employee_id=b.employee_id AND a.leave_id<b.leave_id AND a.status='APPROVED' AND b.status='APPROVED'
  AND a.from_date<=b.to_date AND b.from_date<=a.to_date
UNION ALL SELECT 'approved leave exceeding yearly quota', COUNT(*) FROM
  (SELECT a.employee_id FROM leave_applications a JOIN leave_entitlements e
     ON e.employee_id=a.employee_id AND e.leave_type_id=a.leave_type_id AND e.leave_year=YEAR(a.from_date)
   WHERE a.status='APPROVED' GROUP BY a.employee_id, a.leave_type_id, e.leave_year, e.quota HAVING SUM(a.days) > e.quota) x
UNION ALL SELECT 'payslip net != gross - deductions', COUNT(*) FROM payslips WHERE ROUND(gross-total_deductions,2) <> net_pay
UNION ALL SELECT 'more than one current term', (SELECT COUNT(*) FROM academic_terms WHERE is_current=1) - 1;

-- ===== B. Row counts per module =====
SELECT 'M1 students' k, COUNT(*) n FROM students UNION ALL SELECT 'M1 users', COUNT(*) FROM users
UNION ALL SELECT 'M2 offerings', COUNT(*) FROM course_offerings UNION ALL SELECT 'M2 enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'M3 attendance records', COUNT(*) FROM attendance_records UNION ALL SELECT 'M3 exam registrations', COUNT(*) FROM exam_registrations
UNION ALL SELECT 'M3 blocked attempts', COUNT(*) FROM exam_registration_attempts WHERE outcome='BLOCKED'
UNION ALL SELECT 'M4 student fees', COUNT(*) FROM student_fees UNION ALL SELECT 'M4 payments', COUNT(*) FROM payments
UNION ALL SELECT 'M5 payslips', COUNT(*) FROM payslips UNION ALL SELECT 'M5 pending leaves', COUNT(*) FROM leave_applications WHERE status='PENDING'
UNION ALL SELECT 'M6 active allocations', COUNT(*) FROM hostel_allocations WHERE status='ACTIVE'
UNION ALL SELECT 'M6 pending hostel requests', COUNT(*) FROM hostel_requests WHERE status='PENDING';

-- ===== C. Students touching each module (should be a large share of the 1000) =====
SELECT 'enrolled in current term' k, COUNT(DISTINCT e.student_id) students FROM enrollments e JOIN course_offerings o ON o.offering_id=e.offering_id WHERE o.term_id=7 AND e.status='ENROLLED'
UNION ALL SELECT 'have attendance records', COUNT(DISTINCT e.student_id) FROM attendance_records a JOIN enrollments e ON e.enrollment_id=a.enrollment_id
UNION ALL SELECT 'have fee dues', COUNT(DISTINCT student_id) FROM student_fees
UNION ALL SELECT 'have a successful payment', COUNT(DISTINCT student_id) FROM payments WHERE status='SUCCESS'
UNION ALL SELECT 'have a published CGPA', COUNT(DISTINCT student_id) FROM semester_results
UNION ALL SELECT 'ever hosteller (active or vacated)', COUNT(DISTINCT student_id) FROM hostel_allocations
UNION ALL SELECT 'below 75% in >=1 course', COUNT(DISTINCT e.student_id) FROM enrollments e JOIN
   (SELECT enrollment_id, 100*SUM(status='P')/COUNT(*) p FROM attendance_records GROUP BY enrollment_id) t ON t.enrollment_id=e.enrollment_id WHERE t.p<75
UNION ALL SELECT 'fee defaulters (overdue balance)', COUNT(DISTINCT student_id) FROM student_fees WHERE status<>'PAID' AND due_date < '2026-10-26';

-- ===== D. Smoke-test the PRD reports (each must return rows) =====
-- RP-1 department-wise ranking by CGPA  (JOIN + RANK + PARTITION BY)
SELECT * FROM (
  SELECT d.dept_code, s.student_id, s.full_name, sr.cgpa,
         RANK() OVER (PARTITION BY d.department_id ORDER BY sr.cgpa DESC) AS dept_rank
  FROM students s JOIN programs p ON p.program_id=s.program_id JOIN departments d ON d.department_id=p.department_id
  JOIN semester_results sr ON sr.student_id=s.student_id
  WHERE sr.term_id = (SELECT MAX(term_id) FROM semester_results x WHERE x.student_id=s.student_id)) r
WHERE dept_rank <= 3 ORDER BY dept_code, dept_rank LIMIT 18;

-- RP-3 courses with average attendance below threshold (GROUP BY + HAVING)
SELECT c.course_code, c.title, ROUND(AVG(100*(a.status='P')),1) avg_att_pct
FROM attendance_records a JOIN enrollments e ON e.enrollment_id=a.enrollment_id
JOIN course_offerings o ON o.offering_id=e.offering_id JOIN courses c ON c.course_id=o.course_id
GROUP BY c.course_id HAVING avg_att_pct < 78 ORDER BY avg_att_pct LIMIT 10;

-- RP-5 students whose dues exceed the average dues (subquery)
SELECT COUNT(*) AS students_above_avg_due FROM (
  SELECT student_id, SUM(amount_due-amount_paid) bal FROM student_fees GROUP BY student_id
  HAVING bal > (SELECT AVG(b) FROM (SELECT SUM(amount_due-amount_paid) b FROM student_fees GROUP BY student_id) q)) z;

-- RP-6 hostel occupancy
SELECT h.name, SUM(r.bed_capacity) total_beds, SUM(r.bed_capacity-r.available_beds) occupied, SUM(r.available_beds) available
FROM hostels h JOIN rooms r ON r.hostel_id=h.hostel_id GROUP BY h.hostel_id;

-- RP-7 payroll summary by department / month
SELECT d.dept_code, pr.pay_month, COUNT(*) emps, ROUND(SUM(ps.net_pay)) total_net
FROM payslips ps JOIN payroll_runs pr ON pr.run_id=ps.run_id JOIN employees e ON e.employee_id=ps.employee_id
JOIN departments d ON d.department_id=e.department_id WHERE pr.pay_month IN (8,9) GROUP BY d.dept_code, pr.pay_month ORDER BY pr.pay_month, d.dept_code;

-- RP-9 grade distribution, latest published term
SELECT m.grade, COUNT(*) cnt FROM exam_marks m JOIN exam_registrations r ON r.registration_id=m.registration_id
JOIN exams x ON x.exam_id=r.exam_id JOIN course_offerings o ON o.offering_id=x.offering_id
WHERE o.term_id=5 AND m.is_published=1 GROUP BY m.grade ORDER BY MIN(m.grade_points) DESC;

-- RP-10 blocked exam registrations (sample)
SELECT a.attempt_id, e.student_id, a.attendance_pct, a.reason FROM exam_registration_attempts a
JOIN enrollments e ON e.enrollment_id=a.enrollment_id WHERE a.outcome='BLOCKED' ORDER BY a.attendance_pct LIMIT 5;
