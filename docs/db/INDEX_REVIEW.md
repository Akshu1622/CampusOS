# Index Review

This document records the EXPLAIN output for major report views and list queries.

## RP-1 Dept Ranking
Query: `SELECT * FROM vw_dept_student_ranking;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived2>	NULL	ALL	NULL	NULL	NULL	NULL	2	100.00	NULL
2	DERIVED	<derived3>	NULL	ALL	NULL	NULL	NULL	NULL	2	100.00	Using temporary; Using filesort
2	DERIVED	s	NULL	eq_ref	PRIMARY,idx_student_program	PRIMARY	8	lc.student_id	1	100.00	NULL
2	DERIVED	p	NULL	eq_ref	PRIMARY,idx_program_department	PRIMARY	4	university_erp.s.program_id	1	100.00	NULL
2	DERIVED	d	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.p.department_id	1	100.00	NULL
3	DERIVED	semester_result	NULL	index	UK_student_term	UK_student_term	12	NULL	2	100.00	NULL
```

## RP-2 Program Ranking
Query: `SELECT * FROM vw_program_term_ranking;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived2>	NULL	ALL	NULL	NULL	NULL	NULL	2	100.00	NULL
2	DERIVED	at	NULL	ALL	PRIMARY	NULL	NULL	NULL	2	100.00	Using temporary; Using filesort
2	DERIVED	sr	NULL	ALL	UK_student_term,idx_sem_result_term	NULL	NULL	NULL	2	50.00	Using where; Using join buffer (hash join)
2	DERIVED	s	NULL	eq_ref	PRIMARY,idx_student_program	PRIMARY	8	university_erp.sr.student_id	1	100.00	NULL
2	DERIVED	p	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.s.program_id	1	100.00	NULL
```

## RP-3 Course Attendance
Query: `SELECT * FROM vw_course_attendance_summary;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	c	NULL	ALL	PRIMARY	NULL	NULL	NULL	50	100.00	NULL
1	PRIMARY	co	NULL	ref	UK_course_term_sec,idx_offering_term,idx_offering_faculty	UK_course_term_sec	4	university_erp.c.id	1	100.00	NULL
1	PRIMARY	at	NULL	ALL	PRIMARY	NULL	NULL	NULL	2	50.00	Using where; Using join buffer (hash join)
1	PRIMARY	e	NULL	eq_ref	PRIMARY	PRIMARY	8	university_erp.co.faculty_id	1	100.00	NULL
1	PRIMARY	<derived3>	NULL	ref	<auto_key0>	<auto_key0>	8	university_erp.co.id	2	100.00	NULL
3	DERIVED	<derived4>	NULL	ALL	NULL	NULL	NULL	NULL	15	100.00	Using temporary
4	DERIVED	s	NULL	index	PRIMARY	UK_offering_date_slot	213	NULL	5	100.00	Using index; Using temporary
4	DERIVED	ar	NULL	ref	PRIMARY	PRIMARY	8	university_erp.s.id	3	100.00	NULL
```

## RP-4 Fee Defaulters
Query: `SELECT * FROM vw_fee_defaulters;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	fc	NULL	ALL	PRIMARY,UK_struct_comp	NULL	NULL	NULL	1	100.00	Using where
1	SIMPLE	fs	NULL	eq_ref	PRIMARY,idx_fee_struct_term	PRIMARY	4	university_erp.fc.structure_id	1	100.00	NULL
1	SIMPLE	at	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.fs.term_id	1	100.00	NULL
1	SIMPLE	sf	NULL	ref	UK_student_comp,idx_student_fee_comp,idx_sf_status_amount	idx_student_fee_comp	4	university_erp.fc.id	2	66.67	Using where
1	SIMPLE	s	NULL	eq_ref	PRIMARY,idx_student_program	PRIMARY	8	university_erp.sf.student_id	1	100.00	NULL
1	SIMPLE	p	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.s.program_id	1	100.00	NULL
```

## RP-5 High Dues
Query: `SELECT * FROM vw_high_dues_students;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived5>	NULL	ALL	NULL	NULL	NULL	NULL	5	33.33	Using where
3	SUBQUERY	<derived5>	NULL	ALL	NULL	NULL	NULL	NULL	5	100.00	NULL
5	DERIVED	sf	NULL	ALL	UK_student_comp	NULL	NULL	NULL	5	100.00	Using temporary
5	DERIVED	s	NULL	eq_ref	PRIMARY,idx_student_program	PRIMARY	8	university_erp.sf.student_id	1	100.00	NULL
5	DERIVED	p	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.s.program_id	1	100.00	NULL
6	SUBQUERY	<derived5>	NULL	ALL	NULL	NULL	NULL	NULL	5	100.00	NULL
```

## RP-6 Hostel Occupancy
Query: `SELECT * FROM vw_hostel_occupancy;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived2>	NULL	ALL	NULL	NULL	NULL	NULL	9	100.00	NULL
2	DERIVED	h	NULL	ALL	NULL	NULL	NULL	NULL	3	100.00	Using temporary
2	DERIVED	r	NULL	ALL	UK_hostel_room	NULL	NULL	NULL	3	100.00	Using where; Using join buffer (hash join)
```

## RP-7 Payroll Summary
Query: `SELECT * FROM vw_payroll_summary;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived2>	NULL	ALL	NULL	NULL	NULL	NULL	2	100.00	NULL
2	DERIVED	ps	NULL	ALL	UK_payslip_run_emp,idx_payslip_employee	NULL	NULL	NULL	1	100.00	Using temporary
2	DERIVED	pr	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.ps.run_id	1	100.00	NULL
2	DERIVED	e	NULL	eq_ref	PRIMARY,idx_employee_department	PRIMARY	8	university_erp.ps.employee_id	1	100.00	NULL
2	DERIVED	d	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.e.department_id	1	100.00	NULL
```

## RP-8 Faculty Leave
Query: `SELECT * FROM vw_faculty_leave_utilisation;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	lt	NULL	index	PRIMARY	UK_leave_type_name	202	NULL	4	100.00	Using index
1	SIMPLE	le	NULL	eq_ref	UK_type_emp	UK_type_emp	5	university_erp.lt.id,const	1	100.00	NULL
1	SIMPLE	e	NULL	ALL	idx_employee_department	NULL	NULL	NULL	30	25.00	Using where; Using join buffer (hash join)
1	SIMPLE	d	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.e.department_id	1	100.00	NULL
```

## RP-9 Course Pass %
Query: `SELECT * FROM vw_course_pass_percentage;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	PRIMARY	<derived2>	NULL	ALL	NULL	NULL	NULL	NULL	2	100.00	NULL
2	DERIVED	ex	NULL	index	PRIMARY,UK_offering_type	UK_offering_type	210	NULL	1	100.00	Using index; Using temporary
2	DERIVED	emr	NULL	index	PRIMARY	idx_emr_grade	12	NULL	5	20.00	Using where; Using index; Using join buffer (hash join)
2	DERIVED	er	NULL	eq_ref	PRIMARY,UK_exam_student	PRIMARY	8	university_erp.emr.registration_id	1	50.00	Using where
2	DERIVED	co	NULL	eq_ref	PRIMARY,UK_course_term_sec,idx_offering_term,idx_offering_faculty	PRIMARY	8	university_erp.ex.offering_id	1	100.00	NULL
2	DERIVED	at	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.co.term_id	1	100.00	NULL
2	DERIVED	e	NULL	eq_ref	PRIMARY	PRIMARY	8	university_erp.co.faculty_id	1	100.00	NULL
2	DERIVED	c	NULL	eq_ref	PRIMARY	PRIMARY	4	university_erp.co.course_id	1	100.00	NULL
```

## RP-10 Exam Blocked
Query: `SELECT * FROM vw_exam_blocked_students;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	c	NULL	ALL	PRIMARY	NULL	NULL	NULL	50	100.00	NULL
1	SIMPLE	co	NULL	ref	PRIMARY,UK_course_term_sec,idx_offering_term	UK_course_term_sec	4	university_erp.c.id	1	100.00	Using index
1	SIMPLE	at	NULL	ALL	PRIMARY	NULL	NULL	NULL	2	50.00	Using where; Using join buffer (hash join)
1	SIMPLE	e	NULL	ref	UK_student_offering,idx_enrollment_offering,idx_enrollment_status	idx_enrollment_offering	8	university_erp.co.id	19	99.90	Using where
1	SIMPLE	s	NULL	eq_ref	PRIMARY	PRIMARY	8	university_erp.e.student_id	1	100.00	NULL
```

## Student Enrollments
Query: `SELECT * FROM enrollment WHERE student_id = 1;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	enrollment	NULL	ref	UK_student_offering	UK_student_offering	8	const	1	100.00	NULL
```

## Student Fees
Query: `SELECT * FROM student_fee WHERE student_id = 1;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	student_fee	NULL	ref	UK_student_comp	UK_student_comp	8	const	2	100.00	NULL
```

## Student Payments
Query: `SELECT * FROM payment WHERE student_id = 1;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	payment	NULL	ref	idx_payment_student	idx_payment_student	8	const	2	100.00	NULL
```

## Student Attendances
Query: `SELECT * FROM attendance_record WHERE enrollment_id = 1;`

```text
id	select_type	table	partitions	type	possible_keys	key	key_len	ref	rows	filtered	Extra
1	SIMPLE	attendance_record	NULL	ref	idx_att_record_enrollment	idx_att_record_enrollment	8	const	4	100.00	NULL
```

