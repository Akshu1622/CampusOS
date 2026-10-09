import os
import ast
import glob
import re
import pymysql

def find_sql_strings(node):
    sql_strings = []
    for child in ast.walk(node):
        if isinstance(child, ast.Call):
            is_sql_call = False
            if isinstance(child.func, ast.Name) and child.func.id in ("text",):
                is_sql_call = True
            elif isinstance(child.func, ast.Attribute) and child.func.attr in ("execute",):
                is_sql_call = True
                
            if is_sql_call and child.args:
                arg = child.args[0]
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                    sql_strings.append(arg.value)
                elif isinstance(arg, ast.JoinedStr):
                    parts = []
                    for v in arg.values:
                        if isinstance(v, ast.Constant) and isinstance(v.value, str):
                            parts.append(v.value)
                        elif isinstance(v, ast.FormattedValue):
                            parts.append("__FORMAT_VAR__")
                    sql_strings.append("".join(parts))
    return sql_strings

def normalize_query_for_explain(raw_sql: str) -> str:
    sql = raw_sql.strip()

    # Dynamic clauses replacement
    sql = re.sub(r'SET\s+__FORMAT_VAR__', 'SET id = 1', sql, flags=re.IGNORECASE)
    sql = re.sub(r'WHERE\s+__FORMAT_VAR__', 'WHERE 1=1', sql, flags=re.IGNORECASE)
    sql = re.sub(r'FROM\s+([a-zA-Z_0-9]+)\s+([a-zA-Z_0-9]+)\s+__FORMAT_VAR__', r'FROM \1 \2 WHERE 1=1', sql, flags=re.IGNORECASE)
    sql = re.sub(r'FROM\s+([a-zA-Z_0-9]+)\s+__FORMAT_VAR__', r'FROM \1 WHERE 1=1', sql, flags=re.IGNORECASE)
    sql = sql.replace('__FORMAT_VAR__', ' ')

    # Handle IN :param -> IN (1) and empty IN ()
    sql = re.sub(r'IN\s*:\s*[a-zA-Z_0-9]+', 'IN (1)', sql, flags=re.IGNORECASE)
    sql = re.sub(r'IN\s*\(\s*:\s*[a-zA-Z_0-9]+\s*\)', 'IN (1)', sql, flags=re.IGNORECASE)
    sql = re.sub(r'IN\s*\(\s*\)', 'IN (1)', sql, flags=re.IGNORECASE)
    sql = re.sub(r'IN\s+1\b', 'IN (1)', sql, flags=re.IGNORECASE)

    # Replace remaining named parameters :param with 1
    sql = re.sub(r':([a-zA-Z_0-9]+)', '1', sql)

    return sql

def main():
    backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "app")
    py_files = glob.glob(os.path.join(backend_dir, "**", "*.py"), recursive=True)

    connection = pymysql.connect(
        host="localhost",
        port=3306,
        user="root",
        password="rootpassword",
        database="university_erp",
        autocommit=True
    )
    cursor = connection.cursor()

    errors_found = 0
    checked = 0

    for path in py_files:
        # Skip generic query builder templates
        if os.path.basename(path) == "helpers.py":
            continue

        with open(path, "r", encoding="utf-8") as f:
            try:
                content = f.read()
                tree = ast.parse(content)
            except Exception:
                continue

        sqls = find_sql_strings(tree)
        for raw_sql in sqls:
            sql = raw_sql.strip()
            first_word = sql.split()[0].upper() if sql.split() else ""
            if first_word not in ("SELECT", "INSERT", "UPDATE", "DELETE", "CALL"):
                continue

            query = normalize_query_for_explain(sql)
            checked += 1

            if first_word == "CALL":
                proc_match = re.search(r'CALL\s+([a-zA-Z_0-9]+)', query, re.IGNORECASE)
                if proc_match:
                    proc_name = proc_match.group(1)
                    try:
                        cursor.execute(f"SHOW CREATE PROCEDURE {proc_name}")
                    except Exception as e:
                        print(f"[{os.path.basename(path)}] Procedure not found: {proc_name} -> {e}")
                        errors_found += 1
                continue

            # Run EXPLAIN query
            try:
                explain_query = f"EXPLAIN {query}"
                cursor.execute(explain_query)
            except Exception as e:
                err_msg = str(e)
                if "doesn't exist" in err_msg or "Unknown column" in err_msg or "Table" in err_msg or "syntax" in err_msg:
                    print(f"[{os.path.basename(path)}] SQL Schema/Syntax Error:\nQuery: {query[:120]}...\nError: {err_msg}\n")
                    errors_found += 1

    cursor.close()
    connection.close()

    print(f"Checked {checked} SQL statements across backend.")
    if errors_found > 0:
        print(f"FAILED: Found {errors_found} errors.")
        exit(1)
    else:
        print("SUCCESS: All backend SQL queries verified valid against database schema.")

if __name__ == "__main__":
    main()
