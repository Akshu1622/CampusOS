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

    # Query information_schema.COLUMNS
    query = f"""
    SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        COLUMN_TYPE, 
        IS_NULLABLE, 
        COLUMN_KEY, 
        COLUMN_DEFAULT, 
        COLUMN_COMMENT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '{db_name}'
    ORDER BY TABLE_NAME, ORDINAL_POSITION;
    """
    
    out_file = os.path.join(project_root, "docs", "db", "DATA_DICTIONARY.md")
    
    output = run_query(query, db_name, root_pass, sys_env)
    
    lines = output.split('\n')
    
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# Data Dictionary\n\n")
        
        current_table = ""
        
        # Skip the header line output by MySQL, also skip the warning line
        for line in lines:
            if "Warning: Using a password on the command line interface can be insecure." in line:
                continue
            if "TABLE_NAME" in line and "COLUMN_NAME" in line:
                continue
            if not line.strip():
                continue
                
            parts = line.split('\t')
            if len(parts) >= 7:
                table_name = parts[0]
                col_name = parts[1]
                col_type = parts[2]
                nullable = parts[3]
                col_key = parts[4]
                col_default = parts[5] if parts[5] != 'NULL' else ''
                col_comment = parts[6]
                
                if table_name != current_table:
                    if current_table != "":
                        f.write("\n")
                    f.write(f"## Table: {table_name}\n\n")
                    f.write("| Column Name | Type | Nullable | Key | Default | Comment |\n")
                    f.write("|---|---|---|---|---|---|\n")
                    current_table = table_name
                
                f.write(f"| {col_name} | {col_type} | {nullable} | {col_key} | {col_default} | {col_comment} |\n")

    print(f"Data dictionary generated at {out_file}")

if __name__ == '__main__':
    main()
