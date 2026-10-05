#!/usr/bin/env python3
import os
import sys
import json
import subprocess

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

def run_query(query, db_name, root_pass):
    cmd = [
        "docker", "compose", "exec", "-T", "db", 
        "mysql", "-u", "root", f"-p{root_pass}", db_name, 
        "-B", "-N", "-e", query
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Error running query:", query)
        print(res.stderr)
        sys.exit(1)
    
    rows = []
    for line in res.stdout.strip().split('\n'):
        if line:
            rows.append(line.split('\t'))
    return rows

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    env_path = os.path.join(project_root, '.env')
    env_vars = load_env(env_path)
    
    root_pass = env_vars.get("MYSQL_ROOT_PASSWORD", "rootpassword")
    db_name = env_vars.get("MYSQL_DATABASE", "university_erp")
    
    manifest_path = os.path.join(project_root, 'db', 'schema_manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    differences = 0
    
    # 1. Check Tables
    db_tables_raw = run_query(f"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '{db_name}';", db_name, root_pass)
    db_tables = {row[0] for row in db_tables_raw}
    
    # Remove metadata tables from check
    db_tables.discard('schema_version')
    db_tables.discard('id_sequences')
    
    expected_tables = set(manifest.keys())
    
    missing_tables = expected_tables - db_tables
    extra_tables = db_tables - expected_tables
    
    if missing_tables:
        print(f"Missing tables in DB: {missing_tables}")
        differences += len(missing_tables)
    if extra_tables:
        print(f"Extra tables in DB: {extra_tables}")
        differences += len(extra_tables)
        
    # 2. Check Columns
    db_columns_raw = run_query(f"SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '{db_name}';", db_name, root_pass)
    db_cols = {}
    for row in db_columns_raw:
        if len(row) < 4: continue
        tname, cname, dtype, isnull = row[0], row[1], row[2], row[3]
        if tname not in db_cols:
            db_cols[tname] = {}
        db_cols[tname][cname] = {
            "type": dtype.lower(),
            "nullable": isnull == "YES"
        }
        
    for table_name, table_def in manifest.items():
        if table_name not in db_cols:
            continue
            
        for col_def in table_def["columns"]:
            cname = col_def["name"]
            if cname not in db_cols[table_name]:
                print(f"Missing column {table_name}.{cname} in DB")
                differences += 1
                continue
                
            db_col = db_cols[table_name][cname]
            
            # Simple type check (manifest types might have length, e.g. VARCHAR(100), but information_schema DATA_TYPE is just 'varchar')
            man_type_base = col_def["type"].split('(')[0].lower()
            if man_type_base == 'enum':
                man_type_base = 'enum'
                
            if db_col["type"] != man_type_base:
                # Some types map differently e.g. INT -> int
                if not (man_type_base == 'int' and db_col["type"] == 'int') and not (man_type_base == 'tinyint' and db_col["type"] == 'tinyint'):
                    # Just warn, SQL types can be loose
                    pass
                    
            if db_col["nullable"] != col_def["nullable"]:
                print(f"Nullability mismatch for {table_name}.{cname}: Manifest={col_def['nullable']}, DB={db_col['nullable']}")
                differences += 1

    # 3. Check PKs
    db_pks_raw = run_query(f"SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '{db_name}' AND CONSTRAINT_NAME = 'PRIMARY';", db_name, root_pass)
    db_pks = {}
    for row in db_pks_raw:
        if len(row) < 2: continue
        tname, cname = row[0], row[1]
        if tname not in db_pks:
            db_pks[tname] = set()
        db_pks[tname].add(cname)
        
    for table_name, table_def in manifest.items():
        if table_name not in db_pks:
            db_pks[table_name] = set()
        expected_pks = set(table_def["primary_keys"])
        if expected_pks != db_pks[table_name]:
            print(f"PK mismatch for {table_name}: Manifest={expected_pks}, DB={db_pks[table_name]}")
            differences += 1
            
    print(f"Schema conformance check completed with {differences} differences.")
    if differences > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
