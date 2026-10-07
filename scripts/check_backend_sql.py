import os
import ast
import glob
import subprocess

def find_sql_strings(node):
    sql_strings = []
    for child in ast.walk(node):
        if isinstance(child, ast.Call):
            if isinstance(child.func, ast.Name) and child.func.id == "text":
                if child.args and isinstance(child.args[0], (ast.Str, ast.Constant)):
                    val = child.args[0].s if hasattr(child.args[0], 's') else child.args[0].value
                    sql_strings.append(val)
                elif child.args and isinstance(child.args[0], ast.JoinedStr):
                    # It's an f-string, let's extract raw string parts
                    val = ""
                    for v in child.args[0].values:
                        if isinstance(v, ast.Constant) and isinstance(v.value, str):
                            val += v.value
                        elif isinstance(v, ast.Str):
                            val += v.s
                        elif isinstance(v, ast.FormattedValue):
                            val += "1" # dummy value for f-string format var
                    sql_strings.append(val)
    return sql_strings

def main():
    backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "modules")
    py_files = glob.glob(os.path.join(backend_dir, "**", "*.py"), recursive=True)

    errors_found = 0
    checked = 0
    for path in py_files:
        with open(path, "r", encoding="utf-8") as f:
            try:
                content = f.read()
                tree = ast.parse(content)
            except Exception as e:
                continue

        sqls = find_sql_strings(tree)
        for sql in sqls:
            checked += 1
            # Replace named parameters with ? or dummy
            import re
            # For MySQL EXPLAIN, we can just replace :var with 1 or '1'
            query = re.sub(r':[a-zA-Z_0-9]+', '1', sql)
            
            # Escape quotes
            query = query.replace('"', '\\"')

            if "CALL" in query.upper():
                # Cannot EXPLAIN CALL easily if it doesn't match EXPLAIN syntax exactly, just try to run it with dummy args?
                # Actually, EXPLAIN CALL is valid in MySQL 8? No, EXPLAIN doesn't work for CALL.
                # We can skip EXPLAIN for CALL, just check if routine exists
                routine_match = re.search(r'CALL\s+([a-zA-Z_0-9]+)', query, re.IGNORECASE)
                if routine_match:
                    routine = routine_match.group(1)
                    cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", "-prootpassword", "university_erp", "-e", f"SHOW CREATE PROCEDURE {routine};"]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode != 0:
                        print(f"[{os.path.basename(path)}] Routine not found: {routine}")
                        errors_found += 1
                continue

            # Run EXPLAIN
            explain_query = f"EXPLAIN {query}"
            cmd = ["docker", "compose", "exec", "-T", "db", "mysql", "-u", "root", "-prootpassword", "university_erp", "-e", explain_query]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"[{os.path.basename(path)}] Error in query:\n{query.strip()}\n{res.stderr.strip()}\n")
                errors_found += 1

    print(f"Checked {checked} queries.")
    if errors_found > 0:
        print(f"Found {errors_found} errors.")
    else:
        print("All SQL statements seem valid.")

if __name__ == "__main__":
    main()
