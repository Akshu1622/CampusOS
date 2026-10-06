#!/usr/bin/env python3
import os
import subprocess
import sys

def run_query(query, db_name, root_pass, env):
    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", f"-p{root_pass}", db_name, "-e", query]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return res.stdout

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    env_path = os.path.join(project_root, '.env')
    
    env = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k] = v
                    
    root_pass = env.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env.get("MYSQL_DATABASE", "university_erp")
    sys_env = os.environ.copy()

    # Get Routines
    routines_query = f"""
    SELECT 
        ROUTINE_TYPE, 
        ROUTINE_NAME, 
        DATA_TYPE, 
        ROUTINE_COMMENT
    FROM information_schema.ROUTINES 
    WHERE ROUTINE_SCHEMA = '{db_name}'
    ORDER BY ROUTINE_TYPE, ROUTINE_NAME;
    """
    
    # Get parameters for routines
    params_query = f"""
    SELECT 
        SPECIFIC_NAME, 
        PARAMETER_MODE, 
        PARAMETER_NAME, 
        DTD_IDENTIFIER
    FROM information_schema.PARAMETERS 
    WHERE SPECIFIC_SCHEMA = '{db_name}'
    ORDER BY SPECIFIC_NAME, ORDINAL_POSITION;
    """
    
    # Get triggers
    triggers_query = f"""
    SELECT 
        TRIGGER_NAME, 
        EVENT_MANIPULATION, 
        EVENT_OBJECT_TABLE, 
        ACTION_TIMING
    FROM information_schema.TRIGGERS 
    WHERE TRIGGER_SCHEMA = '{db_name}'
    ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;
    """
    
    # Get Views
    views_query = f"""
    SELECT 
        TABLE_NAME 
    FROM information_schema.VIEWS 
    WHERE TABLE_SCHEMA = '{db_name}'
    ORDER BY TABLE_NAME;
    """
    
    routines_out = run_query(routines_query, db_name, root_pass, sys_env)
    params_out = run_query(params_query, db_name, root_pass, sys_env)
    triggers_out = run_query(triggers_query, db_name, root_pass, sys_env)
    views_out = run_query(views_query, db_name, root_pass, sys_env)
    
    out_file = os.path.join(project_root, "docs", "db", "DB_CONTRACT.md")
    
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# Database Contract (Backend Handoff)\n\n")
        f.write("This document specifies the database objects that the FastAPI backend must interact with.\n\n")
        
        f.write("## 1. Routines (Procedures and Functions)\n\n")
        f.write("| Type | Name | Return Type | Parameters (Mode, Name, Type) |\n")
        f.write("|---|---|---|---|\n")
        
        # Parse params
        params_dict = {}
        for line in params_out.split('\n'):
            if "Warning: " in line or "SPECIFIC_NAME" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 4:
                spec_name, mode, p_name, p_type = parts[0], parts[1], parts[2], parts[3]
                if spec_name not in params_dict:
                    params_dict[spec_name] = []
                if p_name and p_name != 'NULL':
                    params_dict[spec_name].append(f"{mode} {p_name} {p_type}")
                    
        # Parse routines
        for line in routines_out.split('\n'):
            if "Warning: " in line or "ROUTINE_TYPE" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 3:
                r_type, r_name, d_type = parts[0], parts[1], parts[2]
                if d_type == 'NULL' or not d_type:
                    d_type = 'void'
                
                params_str = ", ".join(params_dict.get(r_name, []))
                f.write(f"| {r_type} | {r_name} | {d_type} | {params_str} |\n")
                
        f.write("\n## 2. Triggers\n\n")
        f.write("| Name | Event | Timing | Table |\n")
        f.write("|---|---|---|---|\n")
        for line in triggers_out.split('\n'):
            if "Warning: " in line or "TRIGGER_NAME" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 4:
                t_name, event, table, timing = parts[0], parts[1], parts[2], parts[3]
                f.write(f"| {t_name} | {event} | {timing} | {table} |\n")
                
        f.write("\n## 3. Views\n\n")
        f.write("| Name |\n")
        f.write("|---|\n")
        for line in views_out.split('\n'):
            if "Warning: " in line or "TABLE_NAME" in line or not line.strip():
                continue
            v_name = line.split('\t')[0]
            f.write(f"| {v_name} |\n")
            
        f.write("\n## 4. API Session Variables\n\n")
        f.write("The API must set the following session variables for triggers (e.g. audit logs) to work correctly:\n")
        f.write("```sql\n")
        f.write("SET @app_user_id = 123;\n")
        f.write("```\n")
        
        f.write("\n## 5. Calling Procedures with OUT parameters\n\n")
        f.write("To call a procedure with an OUT parameter, use session variables:\n")
        f.write("```sql\n")
        f.write("CALL my_procedure(1, @out_param);\n")
        f.write("SELECT @out_param;\n")
        f.write("```\n")
        
        f.write("\n## 6. Error Codes and HTTP Mapping\n\n")
        f.write("| DB Error (SQLSTATE) | Description | HTTP Status |\n")
        f.write("|---|---|---|\n")
        f.write("| 45000 | Custom Business Rule Violation (SIGNAL) | 400 Bad Request |\n")
        f.write("| 23000 | Integrity Constraint Violation | 409 Conflict |\n")
        
        f.write("\n## 7. Transaction Rules\n\n")
        f.write("1. API must NOT manage transactions when calling Procedures that contain their own transaction control (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).\n")
        f.write("2. For multiple table updates not covered by a procedure, the API should wrap them in a transaction.\n")
        f.write("3. Read operations do not need explicit transaction management.\n")
        
    print(f"Generated {out_file}")

if __name__ == '__main__':
    main()
