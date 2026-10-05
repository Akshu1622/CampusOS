#!/usr/bin/env python3
import os
import json
import re

def parse_logical_schema(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    tables = {}
    current_table = None
    in_columns = False
    
    for line in lines:
        line = line.strip()
        
        # New table
        m = re.match(r'^###\s+\d+\.\s+([a-zA-Z_0-9]+)$', line)
        if m:
            current_table = m.group(1)
            tables[current_table] = {
                "columns": [],
                "primary_keys": [],
                "foreign_keys": [],
                "uniques": [],
                "checks": []
            }
            in_columns = False
            continue
            
        if not current_table:
            continue
            
        if line.startswith("- **Columns**:"):
            in_columns = True
            continue
            
        if in_columns:
            if line.startswith("| Name |") or line.startswith("|---|"):
                continue
            if line.startswith("|"):
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 9:
                    col_name = parts[1]
                    data_type = parts[2]
                    nullability = parts[3]
                    default = parts[4]
                    key_role = parts[5]
                    referenced = parts[6]
                    check_rule = parts[7]
                    
                    tables[current_table]["columns"].append({
                        "name": col_name,
                        "type": data_type,
                        "nullable": nullability == "NULL"
                    })
                    
                    if "PK" in key_role:
                        tables[current_table]["primary_keys"].append(col_name)
                    
                    if referenced and referenced != "-":
                        ref_parts = referenced.split('.')
                        if len(ref_parts) == 2:
                            tables[current_table]["foreign_keys"].append({
                                "column": col_name,
                                "ref_table": ref_parts[0],
                                "ref_column": ref_parts[1]
                            })
                            
                    if check_rule and check_rule != "-":
                        tables[current_table]["checks"].append({
                            "column": col_name,
                            "rule": check_rule
                        })
                        
            elif line.startswith("- **Unique Constraints**:"):
                in_columns = False
                unq = line.split(":", 1)[1].strip()
                if unq and unq != "None":
                    # Handle multiple UKs
                    # e.g. `UK_name` (name)
                    # Use regex to find `ConstraintName` (col1, col2)
                    # but the requirement just says "Unique Constraints: `UK_...` (cols)"
                    # Let's just store the whole string for now, or parse it better:
                    matches = re.findall(r'`([^`]+)`\s*\(([^)]+)\)', unq)
                    for m_unq in matches:
                        tables[current_table]["uniques"].append({
                            "name": m_unq[0],
                            "columns": [c.strip() for c in m_unq[1].split(',')]
                        })
                        
    return tables

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    md_path = os.path.join(project_root, 'docs', 'db', 'LOGICAL_SCHEMA.md')
    out_path = os.path.join(project_root, 'db', 'schema_manifest.json')
    
    tables = parse_logical_schema(md_path)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(tables, f, indent=2)
        
    print(f"Generated {out_path} from LOGICAL_SCHEMA.md")

if __name__ == '__main__':
    main()
