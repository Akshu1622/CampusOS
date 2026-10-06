#!/usr/bin/env python3
import os
import subprocess
import sys

def load_env(env_path):
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k] = v
    return env

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    migrator_pass = env_vars.get("MYSQL_MIGRATOR_PASSWORD", "migratorpass123")
    app_pass = env_vars.get("MYSQL_APP_PASSWORD", "apppass123")
    
    sys_env = os.environ.copy()

    sql = f"""
    -- Migrator Account (DDL privileges)
    DROP USER IF EXISTS 'migrator'@'%';
    CREATE USER 'migrator'@'%' IDENTIFIED BY '{migrator_pass}';
    GRANT ALL PRIVILEGES ON {db_name}.* TO 'migrator'@'%';

    -- App Account (DML privileges only)
    DROP USER IF EXISTS 'app'@'%';
    CREATE USER 'app'@'%' IDENTIFIED BY '{app_pass}';
    
    -- Revoke everything first just in case
    REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'app'@'%';
    
    -- M1 Core
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.user_account TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.role TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.permission_set TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.role_assignment TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.admin_permission_set_assignment TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.department TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.program TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.academic_term TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.student TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.login_attempt TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.refresh_token TO 'app'@'%';
    
    -- M2 Academics
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.course TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.curriculum_mapping TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.course_offering TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.enrollment TO 'app'@'%';
    
    -- M3 Attendance and Exams
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.attendance_session TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.attendance_record TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.exam TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.exam_registration TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.exam_marks_result TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.grade_scale TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.semester_result TO 'app'@'%';
    
    -- M4 Finance
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.fee_structure TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.fee_component TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.student_fee TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.late_fee_rule TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.payment TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.payment_allocation TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.receipt TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.hostel_fee_component_link TO 'app'@'%';
    
    -- M5 HR
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.employee TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.designation TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.leave_type TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.leave_entitlement TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.leave_application TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.salary_structure TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.payroll_run TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.payslip TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.payslip_line TO 'app'@'%';
    
    -- M6 Hostel
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.hostel TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.room TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.hostel_allocation TO 'app'@'%';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {db_name}.hostel_request TO 'app'@'%';
    
    -- Read-only tables
    GRANT SELECT ON {db_name}.general_audit_log TO 'app'@'%';
    GRANT SELECT ON {db_name}.fee_audit_log TO 'app'@'%';
    GRANT SELECT ON {db_name}.bulk_enrollment_batch TO 'app'@'%';
    GRANT SELECT ON {db_name}.bulk_enrollment_batch_log TO 'app'@'%';
    GRANT SELECT ON {db_name}.id_sequences TO 'app'@'%';
    GRANT SELECT ON {db_name}.schema_version TO 'app'@'%';

    -- Views
    GRANT SELECT ON {db_name}.vw_admin_dashboard TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_attendance_shortage TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_audit_log_unified TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_course_attendance_summary TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_course_pass_percentage TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_course_result_summary TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_dept_student_ranking TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_enrollment_roster TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_exam_blocked_students TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_faculty_leave_utilisation TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_fee_defaulters TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_high_dues_students TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_hostel_occupancy TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_payroll_register TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_payroll_summary TO 'app'@'%';
    GRANT SELECT ON {db_name}.vw_program_term_ranking TO 'app'@'%';

    -- Routines
    GRANT EXECUTE ON {db_name}.* TO 'app'@'%';
    
    FLUSH PRIVILEGES;
    """

    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name]
    res = subprocess.run(cmd, input=sql, text=True, capture_output=True, env=sys_env)
    if res.returncode != 0:
        print("Error creating users and grants:")
        print(res.stderr)
        sys.exit(1)
    
    print("Users migrator and app created successfully with appropriate grants.")

if __name__ == '__main__':
    main()
