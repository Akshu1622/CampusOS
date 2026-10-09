import os
import pymysql

conn = pymysql.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", 3306)),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", "rootpassword"),
    database=os.getenv("DB_NAME", "university_erp"),
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cur:
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'university_erp' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    tables = [row["TABLE_NAME"] if "TABLE_NAME" in row else row["table_name"] for row in cur.fetchall()]
    print(f"| Table Name | Row Count |")
    print(f"| :--- | :--- |")
    total_rows = 0
    for t in tables:
        cur.execute(f"SELECT COUNT(*) as cnt FROM `{t}`")
        cnt = cur.fetchone()["cnt"]
        total_rows += cnt
        print(f"| `{t}` | {cnt} |")
    print(f"\nTotal tables: {len(tables)}, Total rows: {total_rows}")
conn.close()
