
SELECT 'Testing fn_attendance_pct' AS Test;
SELECT fn_attendance_pct(1, 1) AS att_pct_stu_1_off_1;
SELECT fn_attendance_pct(999, 1) AS att_pct_not_enrolled;
