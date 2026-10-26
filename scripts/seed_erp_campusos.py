#!/usr/bin/env python3
"""
seed_erp_campusos.py - Deterministic 1,000-student seed data generator adapted for CampusOS.
Adheres strictly to the CampusOS DDL schema (db/schema/*.sql), reference lookups,
surrogate BIGINT/INT keys, Argon2 password hashes, and format CHECK constraints.

Usage:
    python scripts/seed_erp_campusos.py --students 1000 --seed 2026 --out seed_data_campusos.sql
"""

import argparse
import datetime as dt
import math
import random
import sys
import uuid

D = dt.date
TODAY = D(2026, 10, 26)
CUR = 7  # current term id (2026-FALL)
rnd = random.Random()

def clip(x, lo, hi):
    return max(lo, min(hi, x))

def pick_w(items):
    tot = sum(w for _, w in items)
    r = rnd.random() * tot
    acc = 0
    for v, w in items:
        acc += w
        if r <= acc:
            return v
    return items[-1][0]

def rtime(d, lo=9, hi=17):
    return dt.datetime(d.year, d.month, d.day, rnd.randint(lo, hi), rnd.randint(0, 59), rnd.randint(0, 59))

def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return f"{v:.2f}"
    if isinstance(v, dt.datetime):
        return "'" + v.strftime("%Y-%m-%d %H:%M:%S") + "'"
    if isinstance(v, dt.date):
        return "'" + v.isoformat() + "'"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"

class W:
    def __init__(self, f):
        self.f = f
        self.counts = {}

    def emit(self, table, cols, rows, batch=400, ignore=False):
        rows = list(rows)
        verb = "INSERT IGNORE INTO" if ignore else "INSERT INTO"
        for i in range(0, len(rows), batch):
            chunk = rows[i:i + batch]
            self.f.write(f"{verb} `{table}` (`" + "`,`".join(cols) + "`) VALUES\n")
            self.f.write(",\n".join("(" + ",".join(q(v) for v in r) + ")" for r in chunk) + ";\n")
        self.counts[table] = self.counts.get(table, 0) + len(rows)

# ----------------------------------------------------------------- Names bank
MALE = ("Aarav Aditya Akash Amit Arjun Atharva Chetan Deepak Dhruv Gaurav Harsh Ishaan Jayesh Kunal Mihir Nikhil Om Omkar "
        "Pranav Prathamesh Rahul Rohan Sahil Sandeep Saurabh Shivam Siddharth Soham Swapnil Tanmay Tushar Uday Varun Vedant "
        "Vikram Vishal Yash Yogesh Rushikesh Shubham Aniket Abhishek Ajinkya Ketan Mayur Nilesh Pratik Sagar").split()
FEMALE = ("Aaradhya Aditi Akshata Ananya Anjali Ankita Apoorva Archana Bhakti Chaitali Dipali Disha Gauri Isha Janhavi Kavya "
          "Komal Mansi Meera Neha Nikita Pooja Prachi Pranali Priya Radhika Riya Rutuja Sakshi Sanika Shreya Shruti Sneha "
          "Snehal Tanvi Trupti Vaishnavi Vidya Yashashree Aishwarya").split()
SURN = ("Patil Deshmukh Kulkarni Joshi Jadhav Pawar Shinde More Gaikwad Kale Chavan Bhosale Sawant Salunkhe Deshpande Ghule "
        "Phadke Apte Gokhale Kelkar Naik Mane Thakur Shah Mehta Gupta Sharma Verma Iyer Nair Reddy Rao Singh Yadav Mishra "
        "Tiwari Chaudhari Kadam Wagh Pande Bhat Menon Khan Shaikh Sayyed Fernandes Lokhande Borse Nikam Dhumal Londhe "
        "Shelke Jagtap Raut Kamble Dange Thorat Garg Agarwal").split()
CITIES = [("Pune", "Maharashtra", 35), ("Mumbai", "Maharashtra", 8), ("Nashik", "Maharashtra", 7), ("Nagpur", "Maharashtra", 5),
          ("Kolhapur", "Maharashtra", 5), ("Satara", "Maharashtra", 4), ("Solapur", "Maharashtra", 5),
          ("Ahmednagar", "Maharashtra", 5), ("Aurangabad", "Maharashtra", 4), ("Jalgaon", "Maharashtra", 3),
          ("Sangli", "Maharashtra", 3), ("Indore", "Madhya Pradesh", 2), ("Ahmedabad", "Gujarat", 2),
          ("Hyderabad", "Telangana", 2), ("Bengaluru", "Karnataka", 2), ("Delhi", "Delhi", 2),
          ("Lucknow", "Uttar Pradesh", 2), ("Panaji", "Goa", 2), ("Patna", "Bihar", 1), ("Raipur", "Chhattisgarh", 1)]

def person_name(gender):
    first = rnd.choice(MALE if gender == "M" else FEMALE)
    last = rnd.choice(SURN)
    return first, last

def phone():
    return f"{rnd.choice('6789')}{rnd.randint(0, 999999999):09d}"

# ----------------------------------------------------------------- Reference Data
# Dep code must be 2-4 chars to satisfy course code regex: ^[A-Z]{2,4}[0-9]{3,4}$
DEPTS = [
    ("CSE", "Computer Science & Engineering", 0.26, 14, 98000, 0.55),
    ("IT", "Information Technology", 0.16, 9, 95000, 0.50),
    ("ENTC", "Electronics & Telecommunication", 0.22, 13, 92000, 0.62),
    ("MECH", "Mechanical Engineering", 0.14, 9, 88000, 0.85),
    ("CIV", "Civil Engineering", 0.10, 7, 85000, 0.78),
    ("EE", "Electrical Engineering", 0.12, 8, 90000, 0.75)
]
ND = len(DEPTS)
BATCH_START = {2023: 1, 2024: 3, 2025: 5, 2026: 7}
BATCH_SHARE = {2023: 0.25, 2024: 0.26, 2025: 0.25, 2026: 0.24}

# Term identifier must match ^[0-9]{4}-(FALL|SPRING|SUMMER|WINTER)$
TERMS = [
    (1, "2023-FALL", 2023, "2023-24-ODD", D(2023, 7, 17), D(2023, 12, 15)),
    (2, "2024-SPRING", 2024, "2023-24-EVEN", D(2024, 1, 8), D(2024, 5, 31)),
    (3, "2024-FALL", 2024, "2024-25-ODD", D(2024, 7, 15), D(2024, 12, 14)),
    (4, "2025-SPRING", 2025, "2024-25-EVEN", D(2025, 1, 6), D(2025, 5, 30)),
    (5, "2025-FALL", 2025, "2025-26-ODD", D(2025, 7, 14), D(2025, 12, 13)),
    (6, "2026-SPRING", 2026, "2025-26-EVEN", D(2026, 1, 5), D(2026, 5, 29)),
    (7, "2026-FALL", 2026, "2026-27-ODD", D(2026, 7, 20), D(2026, 12, 18))
]
TERM = {t[0]: t for t in TERMS}
LAST_PUBLISHED = 5

SEM12 = {
    1: ["Engineering Mathematics I", "Engineering Physics", "Basic Electrical & Electronics", "Physics Laboratory", "Communication Skills"],
    2: ["Engineering Mathematics II", "Engineering Chemistry", "Programming for Problem Solving", "Programming Laboratory", "Engineering Graphics"]
}
T = {
    "CSE": {
        3: "Discrete Mathematics;Data Structures;Computer Organization;Data Structures Lab;Object Oriented Programming",
        4: "Design & Analysis of Algorithms;Database Management Systems;Operating Systems;DBMS Lab;Probability & Statistics",
        5: "Computer Networks;Theory of Computation;Software Engineering;Networks Lab;Elective I: Machine Learning",
        6: "Compiler Design;Web Technologies;Information Security;Web Technologies Lab;Elective II: Cloud Computing",
        7: "Distributed Systems;Artificial Intelligence;Big Data Analytics;AI Lab;Elective III: Blockchain Technology",
        8: "Deep Learning;Human Computer Interaction;Project Management;Project Lab;Elective IV: Quantum Computing"
    },
    "IT": {
        3: "Discrete Structures;Data Structures & Algorithms;Digital Logic;DSA Lab;Python Programming",
        4: "Database Systems;Operating Systems;Computer Networks;Database Lab;Statistics for IT",
        5: "Software Engineering;Web Development;Information Systems;Web Lab;Elective I: Data Mining",
        6: "Cyber Security;Mobile Application Development;Cloud Infrastructure;Mobile App Lab;Elective II: DevOps",
        7: "Machine Learning;Internet of Things;Business Intelligence;ML Lab;Elective III: Natural Language Processing",
        8: "Enterprise Architecture;Software Testing;IT Project Management;Capstone Lab;Elective IV: AR/VR Systems"
    },
    "ENTC": {
        3: "Signals & Systems;Analog Circuits;Digital Electronics;Analog Circuits Lab;Electronic Measurements",
        4: "Network Theory;Electromagnetic Fields;Microcontrollers;Microcontrollers Lab;Control Systems",
        5: "Digital Signal Processing;Analog Communication;Antennas & Wave Propagation;Communication Lab;Elective I: Embedded Systems",
        6: "Digital Communication;VLSI Design;Microwave Engineering;VLSI Lab;Elective II: Image Processing",
        7: "Mobile Communication;Optical Fibre Communication;Information Theory & Coding;Wireless Lab;Elective III: IoT Systems",
        8: "Satellite Communication;Radar Engineering;Telecom Networks;Project Lab;Elective IV: 5G Technologies"
    },
    "MECH": {
        3: "Thermodynamics;Strength of Materials;Fluid Mechanics;Materials Testing Lab;Manufacturing Processes",
        4: "Kinematics of Machinery;Heat Transfer;Machine Drawing;CAD Lab;Metrology",
        5: "Dynamics of Machinery;Design of Machine Elements;IC Engines;Thermal Lab;Elective I: Mechatronics",
        6: "Refrigeration & Air Conditioning;CAD/CAM;Industrial Engineering;CAM Lab;Elective II: Robotics",
        7: "Finite Element Analysis;Power Plant Engineering;Operations Research;FEA Lab;Elective III: Additive Manufacturing",
        8: "Automobile Engineering;Production Management;Renewable Energy Systems;Project Lab;Elective IV: Industry 4.0"
    },
    "CIV": {
        3: "Surveying;Building Materials;Structural Analysis I;Surveying Lab;Fluid Mechanics",
        4: "Structural Analysis II;Geotechnical Engineering;Concrete Technology;Concrete Lab;Hydrology",
        5: "Design of RC Structures;Transportation Engineering;Environmental Engineering;Geotech Lab;Elective I: Remote Sensing & GIS",
        6: "Design of Steel Structures;Water Resources Engineering;Foundation Engineering;Structural Design Lab;Elective II: Construction Management",
        7: "Advanced Structural Design;Estimating & Costing;Highway Engineering;Transportation Lab;Elective III: Earthquake Engineering",
        8: "Bridge Engineering;Quantity Surveying;Environmental Impact Assessment;Project Lab;Elective IV: Smart Cities"
    },
    "EE": {
        3: "Network Analysis;Electrical Machines I;Electromagnetic Theory;Machines Lab I;Analog Electronics",
        4: "Electrical Machines II;Power Systems I;Control Systems;Machines Lab II;Measurements & Instrumentation",
        5: "Power Electronics;Power Systems II;Microprocessors;Power Electronics Lab;Elective I: Renewable Energy",
        6: "Electric Drives;Switchgear & Protection;Digital Signal Processing;Drives Lab;Elective II: Smart Grids",
        7: "HVDC & FACTS;Power System Operation;Industrial Automation;Automation Lab;Elective III: Electric Vehicles",
        8: "Energy Management;Power Quality;Utilization of Electrical Energy;Project Lab;Elective IV: Energy Storage"
    }
}
CREDITS = {1: 4, 2: 4, 3: 3, 4: 2, 5: 3}

# Grade Scale matching CampusOS db/seed/reference/01_reference_data.sql
GRADES = [
    ("S", 90.00, 100.00, 10.0),
    ("A", 80.00, 89.99, 9.0),
    ("B", 70.00, 79.99, 8.0),
    ("C", 60.00, 69.99, 7.0),
    ("D", 50.00, 59.99, 6.0),
    ("E", 40.00, 49.99, 5.0),
    ("F", 0.00, 39.99, 0.0)
]

def grade_of(m):
    for g, lo, hi, gp in GRADES:
        if m >= lo:
            return g, gp
    return "F", 0.0

DESIG = [
    (1, "Professor", 5),
    (2, "Associate Professor", 4),
    (3, "Assistant Professor", 3),
    (4, "Lecturer", 2),
    (5, "Lab Assistant", 1),
    (6, "Clerk", 1),
    (7, "Accountant", 2),
    (8, "Hostel Warden", 2),
    (9, "Administrative Officer", 3)
]

SALARY = {1: 150000, 2: 120000, 3: 85000, 4: 60000, 5: 32000, 6: 28000, 7: 45000, 8: 40000, 9: 70000}

# Leave Types in CampusOS: 1: Casual Leave, 2: Sick Leave, 3: Earned Leave, 4: Leave Without Pay
LEAVE_TYPES = [
    (1, "Casual Leave", 12, True),
    (2, "Sick Leave", 10, True),
    (3, "Earned Leave", 30, True),
    (4, "Leave Without Pay", 30, False)
]

# Admin Permission Sets in CampusOS: 1: Core_Admin, 2: Academics_Admin, 3: Exams_Admin, 4: Finance_Admin, 5: HR_Admin, 6: Hostel_Admin, 7: Super_Admin
PERM_SETS = [
    ("Core_Admin", 1),
    ("Academics_Admin", 2),
    ("Exams_Admin", 3),
    ("Finance_Admin", 4),
    ("HR_Admin", 5),
    ("Hostel_Admin", 6),
    ("Super_Admin", 7)
]

# Standard Argon2 hash for "Password@123"
DEFAULT_ARGON2_HASH = "$argon2id$v=19$m=65536,t=3,p=4$POcc4/xfizFGKIXQGiPkHA$VXtYxgJPBGBqqjIkC5dCDnkPSor7jaBLxhEQAyispvM"

def main():
    ap = argparse.ArgumentParser(description="Generate 1,000-student seed SQL for CampusOS")
    ap.add_argument("--students", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--out", default="seed_data_campusos.sql")
    ap.add_argument("--password-hash", default=DEFAULT_ARGON2_HASH)
    ap.add_argument("--sessions", type=int, default=13)
    a = ap.parse_args()

    rnd.seed(a.seed)
    NS = a.sessions
    PW = a.password_hash

    # 1. Departments & Programs
    dept_rows = [(i + 1, d[0], d[1], None) for i, d in enumerate(DEPTS)]
    prog_rows = [(i + 1, f"{d[0]}-B", f"B.Tech in {d[1]}", i + 1, 4, 128) for i, d in enumerate(DEPTS)]
    term_rows = [(t[0], t[1], t[2], t[3], t[4], t[5], 1 if t[0] == CUR else 0) for t in TERMS]

    # 2. Employees (60 Faculty + 20 Staff)
    employees, fac_by_dept, emp_seq = [], {i: [] for i in range(ND)}, 0
    def new_emp(dept_i, desig, etype, join, gender=None):
        nonlocal emp_seq
        emp_seq += 1
        g = gender or ("M" if rnd.random() < 0.6 else "F")
        fname, lname = person_name(g)
        if desig <= 2 and etype == "FACULTY":
            fname = "Dr. " + fname
        # CampusOS regex: ^EMP-[0-9]{4}-[0-9]{4}$
        eid_str = f"EMP-{join.year}-{emp_seq:04d}"
        username = f"emp{emp_seq:04d}"
        e = dict(
            id=emp_seq,
            eid_str=eid_str,
            username=username,
            fname=fname,
            lname=lname,
            gender=g,
            dept_id=dept_i + 1,
            desig_id=desig,
            emp_type=etype,
            join_date=join,
            status="ACTIVE",
            email=f"{username}@erp.example.edu",
            phone=phone()
        )
        employees.append(e)
        return e

    for i, d in enumerate(DEPTS):
        for k in range(d[3]):
            desig = 1 if k == 0 else pick_w([(1, 12), (2, 28), (3, 45), (4, 15)])
            join_y = rnd.randint(2005, 2023)
            fac_by_dept[i].append(new_emp(i, desig, "FACULTY", D(join_y, rnd.randint(1, 12), rnd.randint(1, 28))))

    staff_plan = [6, 6, 6, 6, 6, 6, 7, 7, 7, 5, 5, 5, 5, 8, 8, 8, 8, 9, 9, 9]
    for k, desig in enumerate(staff_plan):
        join_y = 2026 if k in (2, 11, 17) else rnd.randint(2008, 2024)
        new_emp(rnd.randrange(ND), desig, "STAFF", D(join_y, rnd.randint(1, 12), rnd.randint(1, 28)))

    # Department heads (first faculty of each department is HOD)
    heads = [fac_by_dept[i][0]["id"] for i in range(ND)]
    wardens = [e for e in employees if e["desig_id"] == 8]

    # 3. Students
    total = a.students
    bsize = {b: int(round(total * s)) for b, s in BATCH_SHARE.items()}
    bsize[2026] += total - sum(bsize.values())

    students, cohorts = [], {}
    stu_counter = 0

    for batch in sorted(bsize):
        counts = [int(round(bsize[batch] * d[2])) for d in DEPTS]
        counts[0] += bsize[batch] - sum(counts)
        for di, c in enumerate(counts):
            cohorts[(di, batch)] = []
            for _ in range(c):
                stu_counter += 1
                g = "M" if rnd.random() < DEPTS[di][5] else "F"
                fname, lname = person_name(g)
                # CampusOS student ID regex: ^STU-[0-9]{4}-[0-9]{6}$
                global_id = f"STU-{batch}-{stu_counter:06d}"
                username = f"s{batch % 100:02d}{DEPTS[di][0].lower()}{stu_counter:04d}"
                st0 = TERM[BATCH_START[batch]][4]
                s = dict(
                    id=stu_counter,
                    global_id=global_id,
                    username=username,
                    fname=fname,
                    lname=lname,
                    gender=g,
                    prog_id=di + 1,
                    batch_year=batch,
                    start=BATCH_START[batch],
                    sem=CUR - BATCH_START[batch] + 1,
                    status="ACTIVE",
                    phone=phone(),
                    email=f"{username}@students.erp.example.edu",
                    att=(clip(rnd.gauss(0.915, 0.04), 0.75, 0.99) if (r := rnd.random()) < 0.84 else
                         clip(rnd.gauss(0.74, 0.04), 0.60, 0.85) if r < 0.95 else clip(rnd.gauss(0.62, 0.05), 0.50, 0.72)),
                    ab=clip(rnd.gauss(0.66, 0.12), 0.35, 0.90)
                )
                students.append(s)
                cohorts[(di, batch)].append(s)

    # Detained / Dropped
    for s in rnd.sample([x for x in students if x["batch_year"] != 2026], min(8, total // 100)):
        s["status"] = "DROPPED"

    # 4. Users, Role Assignments, Admin Permission Assignments
    users, role_assignments, admin_perm_assignments = [], [], []
    user_id_seq = 0

    def add_user(username, role_id, student_id=None, employee_id=None, status="ACTIVE", perms=None):
        nonlocal user_id_seq
        user_id_seq += 1
        ll = rtime(TODAY - dt.timedelta(days=rnd.randint(0, 30))) if status == "ACTIVE" and rnd.random() < 0.85 else None
        users.append((user_id_seq, username, PW, status, ll, student_id, employee_id))
        role_assignments.append((user_id_seq, role_id))
        if perms:
            for pid in perms:
                admin_perm_assignments.append((user_id_seq, pid))
        return user_id_seq

    # Standard Admin Accounts (linked to administrative staff employees)
    SUPER = add_user("super.admin", 1, employee_id=78, perms=[1, 2, 3, 4, 5, 6, 7])
    # Also add standard admin_core alias
    add_user("admin_core", 1, employee_id=79, perms=[1, 2, 3, 4, 5, 6, 7])
    ACAD = add_user("academics.admin", 1, employee_id=80, perms=[2])
    EXAM = add_user("exams.admin", 1, employee_id=61, perms=[3])
    FIN = add_user("finance.admin", 1, employee_id=70, perms=[4])
    add_user("admin_finance", 1, employee_id=71, perms=[4])
    HR = add_user("hr.admin", 1, employee_id=62, perms=[5])
    add_user("admin_hr", 1, employee_id=63, perms=[5])
    HOST = add_user("hostel.admin", 1, employee_id=74, perms=[6])
    add_user("admin_hostel", 1, employee_id=75, perms=[6])

    # Standard Demo Test Accounts (faculty1..3, student1..5)
    for i in range(1, 4):
        add_user(f"faculty{i}", 2, employee_id=i)
    for i in range(1, 6):
        add_user(f"student{i}", 3, student_id=i)

    # Faculty users
    emp_user_ids = {}
    for e in employees:
        if e["emp_type"] == "FACULTY":
            uid = add_user(e["username"], 2, employee_id=e["id"])
            emp_user_ids[e["id"]] = uid

    # Student users
    stu_user_ids = {}
    locked_students = set(rnd.sample([s["id"] for s in students if s["status"] == "ACTIVE"], 4))
    for s in students:
        st = "INACTIVE" if s["status"] == "DROPPED" else ("LOCKED" if s["id"] in locked_students else "ACTIVE")
        uid = add_user(s["username"], 3, student_id=s["id"], status=st)
        stu_user_ids[s["id"]] = uid

    # 5. M2 Courses, Curriculum Mapping, Offerings, Enrollments
    courses, curriculum, course_id = [], [], {}
    for di, d in enumerate(DEPTS):
        for sem in range(1, 9):
            titles = SEM12[sem] if sem <= 2 else T[d[0]][sem].split(";")
            for n in range(1, 6):
                cid = len(courses) + 1
                course_id[(di, sem, n)] = cid
                ctype = "LAB" if n == 4 else ("ELECTIVE" if (n == 5 and sem >= 5) else "THEORY")
                code = f"{d[0]}{sem}{n:02d}"
                courses.append((cid, code, titles[n - 1], CREDITS[n], di + 1, "ACTIVE"))
                curriculum.append((cid, di + 1, sem, cid, "ELECTIVE" if ctype == "ELECTIVE" else "CORE"))
    course_credit = {c[0]: c[3] for c in courses}

    offerings, off_map = [], {}
    for t in TERMS:
        for di in range(ND):
            for batch, start in BATCH_START.items():
                if start > t[0] or not cohorts[(di, batch)]:
                    continue
                sem = t[0] - start + 1
                nsec = max(1, math.ceil(len(cohorts[(di, batch)]) / 60))
                fac = fac_by_dept[di]
                for n in range(1, 6):
                    for sec in range(nsec):
                        oid = len(offerings) + 1
                        assigned_fac = fac[(sem * 7 + n * 3 + sec + t[0]) % len(fac)]["id"]
                        o = dict(id=oid, term_id=t[0], course_id=course_id[(di, sem, n)], di=di, sem=sem, n=n,
                                 faculty_id=assigned_fac, section=chr(65 + sec), capacity=70)
                        offerings.append(o)
                        off_map[(t[0], di, sem, n, sec)] = o

    enrollments, enr_by_off = [], {}
    withdraw_one = {s["id"]: rnd.randint(1, 5) for s in rnd.sample([x for x in students if x["status"] == "ACTIVE" and x["start"] < CUR + 1], min(12, total // 80))}

    for t in TERMS:
        for batch, start in BATCH_START.items():
            if start > t[0]:
                continue
            sem = t[0] - start + 1
            for di in range(ND):
                coh = cohorts[(di, batch)]
                nsec = max(1, math.ceil(len(coh) / 60))
                for j, s in enumerate(coh):
                    for n in range(1, 6):
                        o = off_map[(t[0], di, sem, n, j % nsec)]
                        enr_id = len(enrollments) + 1
                        st = "ENROLLED"
                        if t[0] == CUR:
                            if s["status"] == "DROPPED":
                                st = "WITHDRAWN"
                            elif withdraw_one.get(s["id"]) == n:
                                st = "WITHDRAWN"
                        e = dict(id=enr_id, student=s, offering=o, term=t[0], status=st,
                                 enrolled_date=rtime(t[4] + dt.timedelta(days=rnd.randint(0, 7))))
                        enrollments.append(e)
                        enr_by_off.setdefault(o["id"], []).append(e)

    # Bulk enrollment batches
    # Format: ^BAT-[0-9]{8}-[0-9]{4}$
    bulk_batches, bulk_logs = [], []
    batch_seq = 0
    for tid, batch in ((5, 2025), (7, 2026)):
        for di in range(ND):
            n_ok = len(cohorts[(di, batch)]) * 5
            if not n_ok:
                continue
            batch_seq += 1
            bid_str = f"BAT-{TERM[tid][4].strftime('%Y%m%d')}-{batch_seq:04d}"
            skip, fail = rnd.randint(0, 4), rnd.randint(0, 3)
            tot_proc = n_ok + skip + fail
            bulk_batches.append((batch_seq, bid_str, ACAD, rtime(TERM[tid][4] + dt.timedelta(days=rnd.randint(0, 4))), tot_proc, n_ok, fail))
            for k in range(skip + fail):
                st_code = "SKIPPED" if k < skip else "FAILED"
                msg = "Duplicate enrollment attempt" if k < skip else "Program mapping check failed"
                bulk_logs.append((len(bulk_logs) + 1, batch_seq, None, None, st_code, msg))

    # 6. M3 Attendance Sessions & Records (Current Term Only)
    sessions, att_rows = [], []
    for o in [x for x in offerings if x["term_id"] == CUR]:
        om = rnd.gauss(0, 0.02) - (0.08 if rnd.random() < 0.06 else 0)
        dow, slot = rnd.randint(0, 4), f"S{rnd.randint(1, 4)}"
        sids = []
        for i in range(NS):
            sid = len(sessions) + 1
            sids.append(sid)
            s_date = D(2026, 7, 27) + dt.timedelta(days=7 * i + dow)
            # marked_by references user_account id
            fac_user_id = emp_user_ids.get(o["faculty_id"], SUPER)
            sessions.append((sid, o["id"], s_date, slot, fac_user_id, rtime(s_date, 17, 18)))
        for e in enr_by_off[o["id"]]:
            if e["status"] != "ENROLLED":
                continue
            p = clip(e["student"]["att"] + rnd.gauss(0, 0.025) + om, 0.40, 0.99)
            pres = [rnd.random() < p for _ in range(NS)]
            att_rows += [(sid, e["id"], "PRESENT" if pr else "ABSENT") for sid, pr in zip(sids, pres)]
            e["att_pct"] = round(100.0 * sum(pres) / NS, 2)

    # 7. Exams, Registrations, Marks
    exams, regs, marks = [], [], []
    exam_of = {}
    for o in offerings:
        t = TERM[o["term_id"]]
        xid = len(exams) + 1
        exam_of[o["id"]] = xid
        if o["term_id"] == CUR:
            ed = D(2026, 12, rnd.randint(1, 12))
            ro, rc = dt.datetime(2026, 10, 15, 9, 0, 0), dt.datetime(2026, 11, 15, 23, 59, 59)
        else:
            ed = t[5] - dt.timedelta(days=rnd.randint(5, 12))
            ro = dt.datetime(ed.year, ed.month, ed.day) - dt.timedelta(days=40)
            rc = dt.datetime(ed.year, ed.month, ed.day) - dt.timedelta(days=15)
        exams.append((xid, o["id"], "END_SEM", ed, 100.00, ro, rc))

    EX = {x[0]: x for x in exams}
    pub_time = {tid: rtime(TERM[tid][5] + dt.timedelta(days=20)) for tid in range(1, LAST_PUBLISHED + 1)}

    for e in enrollments:
        xid = exam_of[e["offering"]["id"]]
        x = EX[xid]
        if e["term"] < CUR:
            rid = len(regs) + 1
            regs.append((rid, xid, e["student"]["id"], "REGISTERED", rtime(x[5].date() + dt.timedelta(days=rnd.randint(0, 20)))))
            m = round(2.0 * clip(100.0 * (e["student"]["ab"] + rnd.gauss(0, 0.08)), 12.0, 99.5)) / 2.0
            g, gp = grade_of(m)
            if e["term"] <= LAST_PUBLISHED:
                marks.append((rid, float(m), g, float(gp), 1))
            else:
                marks.append((rid, float(m), None, None, 0))
            e["m"], e["rid"] = m, rid
        elif e["status"] == "ENROLLED":
            pct = e.get("att_pct", 85.0)
            when = rtime(D(2026, 10, rnd.randint(15, 25)))
            if pct >= 75.0:
                if rnd.random() < 0.82:
                    rid = len(regs) + 1
                    regs.append((rid, xid, e["student"]["id"], "REGISTERED", when))

    # Semester results + Running CGPA (Terms 1..5)
    sem_results, per_st = [], {}
    for e in enrollments:
        if e["term"] <= LAST_PUBLISHED and "m" in e:
            gp = grade_of(e["m"])[1]
            cr = course_credit[e["offering"]["course_id"]]
            per_st.setdefault(e["student"]["id"], {}).setdefault(e["term"], []).append((cr, gp))

    for sid, by_t in per_st.items():
        tc = tp = 0
        for tid in sorted(by_t):
            cr = sum(c for c, _ in by_t[tid])
            pts = sum(c * g for c, g in by_t[tid])
            tc += cr
            tp += pts
            sgpa = round(pts / cr, 2)
            cgpa = round(tp / tc, 2)
            sem_results.append((len(sem_results) + 1, sid, tid, tc, sgpa, cgpa, pub_time[tid]))

    # 8. M6 Hostel
    hostel_defs = [
        ("Aryabhatta Hostel", "MALE", "A"),
        ("Bhaskara Hostel", "MALE", "B"),
        ("Gargi Hostel", "FEMALE", "G"),
        ("Maitreyi Hostel", "FEMALE", "M")
    ]
    rooms, room_by_type = [], {"MALE": [], "FEMALE": []}
    for hi, (hn, ht, code) in enumerate(hostel_defs):
        k = 0
        for fl, cnt in enumerate([9, 9, 9, 8], start=1):
            for r in range(1, cnt + 1):
                k += 1
                cap = [2, 3, 3, 4][k % 4]
                rm = dict(id=len(rooms) + 1, h=hi + 1, no=f"{code}-{fl}{r:02d}", cap=cap, used=0)
                rooms.append(rm)
                room_by_type[ht].append(rm)

    alloc, res_range = [], {}
    for gender, htype in (("M", "MALE"), ("F", "FEMALE")):
        beds = sum(r["cap"] for r in room_by_type[htype])
        cands = sorted([s for s in students if s["gender"] == gender and s["status"] == "ACTIVE"],
                       key=lambda s: rnd.random())
        queue = cands[:int(0.72 * beds)]
        for rm in room_by_type[htype]:
            if not queue:
                break
            if rnd.random() < 0.12:
                continue
            take = rm["cap"] if rnd.random() < 0.70 else max(1, rm["cap"] - 1)
            for _ in range(take):
                if not queue:
                    break
                s = queue.pop(0)
                rm["used"] += 1
                ft = s["start"] if rnd.random() < 0.80 or s["start"] + 2 > CUR else s["start"] + 2
                res_range[s["id"]] = (ft, CUR)
                alloc.append((len(alloc) + 1, s["id"], rm["id"], TERM[ft][4] + dt.timedelta(days=rnd.randint(0, 10)), None, "ACTIVE"))

    vac_pool = [s for s in students if s["id"] not in res_range and s["start"] <= 5 and s["status"] == "ACTIVE"]
    vacated = rnd.sample(vac_pool, min(40, len(vac_pool)))
    for s in vacated:
        last = rnd.randint(s["start"], min(6, s["start"] + 3))
        res_range[s["id"]] = (s["start"], last)
        rm = rnd.choice(room_by_type["MALE" if s["gender"] == "M" else "FEMALE"])
        alloc.append((len(alloc) + 1, s["id"], rm["id"], TERM[s["start"]][4] + dt.timedelta(days=rnd.randint(0, 10)), TERM[last][5], "VACATED"))

    hostel_rows = [(i + 1, hn, ht, sum(r["cap"] for r in rooms if r["h"] == i + 1)) for i, (hn, ht, _) in enumerate(hostel_defs)]
    room_rows = [(r["id"], r["h"], r["no"], r["cap"], r["cap"] - r["used"]) for r in rooms]

    # Hostel Requests
    hreq = []
    active_res = [x for x in alloc if x[5] == "ACTIVE"]
    for x in rnd.sample(active_res, min(60, len(active_res))):
        when = rtime(x[3] - dt.timedelta(days=rnd.randint(10, 25)))
        hreq.append((len(hreq) + 1, x[1], "ALLOCATION", "Request for hostel accommodation", "APPROVED", HOST, "Bed allotted"))
    for x in rnd.sample(active_res, min(30, len(active_res))):
        st = pick_w([("PENDING", 2), ("APPROVED", 1), ("REJECTED", 1)])
        hreq.append((len(hreq) + 1, x[1], "ROOM_CHANGE", "Wants a room closer to quiet block", st, HOST if st != "PENDING" else None, "Reviewed" if st != "PENDING" else None))
    for s in vacated:
        hreq.append((len(hreq) + 1, s["id"], "VACATE", "Moving out of hostel", "APPROVED", HOST, "Vacated after clearance"))
    nonres = [s for s in students if s["id"] not in res_range and s["status"] == "ACTIVE"]
    for s in rnd.sample(nonres, min(80, len(nonres))):
        st = pick_w([("PENDING", 6), ("REJECTED", 4)])
        hreq.append((len(hreq) + 1, s["id"], "ALLOCATION", "Outstation student accommodation request", st, HOST if st != "PENDING" else None, "No beds available" if st == "REJECTED" else None))

    # 9. M4 Finance: Fee Structures, Components, Student Fees, Payments, Allocations, Receipts
    fstruct_rows, fcomp_rows, struct_map = [], [], {}
    fcomp_id_seq = 0
    for t in TERMS:
        ayi = (t[0] - 1) // 2
        due = t[4] + dt.timedelta(days=41)
        for di, d in enumerate(DEPTS):
            fs_id = len(fstruct_rows) + 1
            fstruct_rows.append((fs_id, di + 1, t[0], f"Fee Structure {d[0]} {t[1]}"))
            for comp, amt in (("TUITION", round(d[4] * (1.04 ** ayi) / 500) * 500),
                              ("EXAM", 3500 + 250 * ayi),
                              ("DEVELOPMENT", 6000 + 500 * ayi),
                              ("HOSTEL", 45000 + 2000 * ayi)):
                fcomp_id_seq += 1
                fcomp_rows.append((fcomp_id_seq, fs_id, comp, float(amt), due))
                struct_map[(di, t[0], comp)] = dict(comp_id=fcomp_id_seq, amount=float(amt), due=due)

    fees, pays = [], []
    def do_payment(dues, applied_amt, when, student, status="SUCCESS"):
        rem = applied_amt
        allocs = []
        if status == "SUCCESS":
            for d in dues:
                owed = d["amt"] - d["paid"]
                if owed <= 0 or rem <= 0:
                    continue
                x = min(owed, rem)
                d["paid"] += x
                rem -= x
                allocs.append((d["id"], x))
        mode = pick_w([("ONLINE", 62), ("CASH", 22), ("DD", 16)])
        # CampusOS payment reference regex: ^PAY-[A-Z0-9]{12}$
        raw_token = uuid.uuid4().hex[:12].upper()
        ref_no = f"PAY-{raw_token}"
        pays.append(dict(
            student_id=student["id"],
            when=when,
            applied=applied_amt if status == "SUCCESS" else 0.0,
            attempt=float(applied_amt),
            mode=mode,
            status=status,
            ref_no=ref_no,
            allocs=allocs
        ))

    for s in students:
        fr = res_range.get(s["id"])
        for t in TERMS:
            if t[0] < s["start"]:
                continue
            comps = ["TUITION", "EXAM", "DEVELOPMENT"] + (["HOSTEL"] if fr and fr[0] <= t[0] <= fr[1] else [])
            dues = []
            for c in comps:
                st = struct_map[(s["prog_id"] - 1, t[0], c)]
                dues.append(dict(id=len(fees) + 1, student_id=s["id"], comp_id=st["comp_id"], amt=st["amount"], paid=0.0, due=st["due"]))
                fees.append(dues[-1])
            tot = sum(d["amt"] for d in dues)
            due_d = dues[0]["due"]
            r = rnd.random()
            if t[0] < CUR:
                sc = "ontime" if r < 0.93 else ("late" if r < 0.975 else "partial")
            else:
                sc = "unpaid" if s["status"] == "DROPPED" else ("ontime" if r < 0.60 else "late" if r < 0.72 else "partial" if r < 0.82 else "unpaid")

            def early_dt():
                return rtime(min(due_d - dt.timedelta(days=rnd.randint(0, 30)), TODAY))

            if sc == "ontime":
                if rnd.random() < 0.10:
                    first = round(tot * 0.60 / 100) * 100
                    do_payment(dues, first, max(early_dt(), rtime(t[4])), s)
                    do_payment(dues, tot - first, rtime(min(due_d + dt.timedelta(days=rnd.randint(5, 40)), TODAY)), s)
                else:
                    do_payment(dues, tot, max(early_dt(), rtime(t[4])), s)
            elif sc == "late":
                do_payment(dues, tot, rtime(min(due_d + dt.timedelta(days=rnd.randint(8, 55)), TODAY)), s)
            elif sc == "partial":
                do_payment(dues, round(tot * rnd.uniform(0.3, 0.7) / 100) * 100, max(early_dt(), rtime(t[4])), s)

            if sc in ("unpaid", "ontime", "late") and rnd.random() < (0.20 if sc == "unpaid" else 0.03):
                do_payment(dues, tot, rtime(min(due_d - dt.timedelta(days=rnd.randint(1, 5)), TODAY)), s, "FAILED")

            for d in dues:
                d["status"] = "PAID" if d["paid"] >= d["amt"] else ("PARTIAL" if d["paid"] > 0 else "PENDING")

    pays.sort(key=lambda p: p["when"])
    pay_rows, alloc_rows, rcpt_rows = [], [], []
    rcpt_counter = 0

    for p in pays:
        pid = len(pay_rows) + 1
        amt = round(p["applied"], 2) if p["status"] == "SUCCESS" else round(p["attempt"], 2)
        pay_rows.append((pid, p["student_id"], amt, p["mode"], p["ref_no"], p["when"], p["status"]))
        for fid, x in p["allocs"]:
            alloc_rows.append((len(alloc_rows) + 1, pid, fid, float(x), 0.0))
        if p["status"] == "SUCCESS":
            rcpt_counter += 1
            # CampusOS receipt format: ^RCP-[0-9]{8}-[0-9]{5}$
            r_no = f"RCP-{p['when'].strftime('%Y%m%d')}-{rcpt_counter:05d}"
            rcpt_rows.append((rcpt_counter, r_no, pid, p["when"]))

    student_fee_rows = [(d["id"], d["student_id"], d["comp_id"], d["amt"], float(d["paid"]), d["status"]) for d in fees]

    # Fee Audit Log
    fee_audit_rows = []
    for fc in rnd.sample(fcomp_rows, min(50, len(fcomp_rows))):
        ts = rtime(D(2026, rnd.randint(1, 9), rnd.randint(1, 28)))
        old_val = round(fc[3] * 0.95, 2)
        fee_audit_rows.append((len(fee_audit_rows) + 1, "fee_component", fc[0], f'{{"amount": {old_val}}}', f'{{"amount": {fc[3]}}}', "finance.admin", ts))

    # 10. M5 HR, Leaves, Payroll
    # Leave Entitlements: already in 01_reference_data.sql
    leaves, used = [], {}
    reasons = {
        1: ["Family function", "Personal work", "Festival travel"],
        2: ["Medical consultation", "Recovery from fever"],
        3: ["Vacation", "Annual home visit"],
        4: ["Personal commitments", "Extended leave"]
    }
    for e in employees:
        cur_dt = max(D(2025, 1, 10), e["join_date"]) + dt.timedelta(days=rnd.randint(0, 120))
        while True:
            lt = pick_w([(1, 45), (2, 25), (3, 20), (4, 10)])
            days = {1: rnd.randint(1, 3), 2: rnd.randint(2, 6), 3: rnd.randint(3, 8), 4: rnd.randint(1, 5)}[lt]
            fr = cur_dt
            to = fr + dt.timedelta(days=days - 1)
            if fr > D(2026, 12, 15):
                break
            if fr >= D(2026, 10, 10):
                st = pick_w([("PENDING", 7), ("APPROVED", 3)])
            else:
                st = pick_w([("APPROVED", 85), ("REJECTED", 15)])
            remark = None
            if st == "APPROVED":
                quota = 12 if lt == 1 else (10 if lt == 2 else 30)
                k = (e["id"], lt, fr.year)
                if used.get(k, 0) + days > quota:
                    st, remark = "REJECTED", "Insufficient quota"
                else:
                    used[k] = used.get(k, 0) + days
            dec_by = HR if st != "PENDING" else None
            dec_dt = rtime(fr - dt.timedelta(days=rnd.randint(1, 5))) if dec_by else None
            leaves.append((len(leaves) + 1, e["id"], lt, fr, to, float(days), rnd.choice(reasons[lt]), st, dec_by, dec_dt))
            cur_dt = to + dt.timedelta(days=rnd.randint(60, 200))

    # Payroll Runs & Payslips
    # CampusOS payroll month format: ^[0-9]{4}-(0[1-9]|1[0-2])$
    runs, slips, slip_lines = [], [], []
    for m in range(1, 10):
        rid = m
        month_str = f"2026-{m:02d}"
        run_dt = rtime(D(2026, m, 25))
        runs.append((rid, month_str, run_dt, "FINALIZED", HR))
        for e in employees:
            if e["join_date"].year > 2026 or (e["join_date"].year == 2026 and e["join_date"].month > m):
                continue
            basic = float(SALARY[e["desig_id"]])
            allow = round(basic * 0.35, 2)
            gross = round(basic + allow, 2)
            pf = round(basic * 0.12, 2)
            pt = 200.00
            tot_ded = round(pf + pt, 2)
            net = round(gross - tot_ded, 2)
            slip_id = len(slips) + 1
            slips.append((slip_id, rid, e["id"], gross, tot_ded, net, 0.0))
            slip_lines.append((len(slip_lines) + 1, slip_id, "EARNING", "Basic Pay", basic))
            slip_lines.append((len(slip_lines) + 1, slip_id, "EARNING", "Allowances", allow))
            slip_lines.append((len(slip_lines) + 1, slip_id, "DEDUCTION", "Provident Fund", pf))
            slip_lines.append((len(slip_lines) + 1, slip_id, "DEDUCTION", "Professional Tax", pt))

    # 11. General Audit Log
    general_audit = []
    for tid in range(1, LAST_PUBLISHED + 1):
        general_audit.append((len(general_audit) + 1, EXAM, "PUBLISH_RESULTS", "academic_term", str(tid), None, '{"status": "PUBLISHED"}', pub_time[tid]))
    for r in runs:
        general_audit.append((len(general_audit) + 1, HR, "FINALIZE_PAYROLL", "payroll_run", str(r[0]), '{"status": "DRAFT"}', '{"status": "FINALIZED"}', r[2]))
    for s in students:
        if s["status"] == "DROPPED":
            general_audit.append((len(general_audit) + 1, SUPER, "STUDENT_DROPPED", "student", str(s["id"]), '{"status": "ACTIVE"}', '{"status": "DROPPED"}', rtime(D(2026, 8, rnd.randint(5, 25)))))

    # ================================================================= WRITE SQL
    with open(a.out, "w", encoding="utf-8") as f:
        f.write("-- CampusOS 1,000-Student Realistic Demo Seed\n"
                f"-- Generated by seed_erp_campusos.py (seed={a.seed}, students={total}, 'today'={TODAY})\n"
                "SET NAMES utf8mb4;\n"
                "SET FOREIGN_KEY_CHECKS=0;\n"
                "START TRANSACTION;\n\n")

        w = W(f)

        f.write("-- 1. Departments & Programs\n")
        w.emit("department", ["id", "code", "name", "head_employee_id"], dept_rows)
        w.emit("program", ["id", "code", "name", "department_id", "duration_years", "credits_required"], prog_rows)
        w.emit("academic_term", ["id", "term_identifier", "term_year", "term_label", "start_date", "end_date", "is_current"], term_rows)

        f.write("\n-- 2. Designations & Salary Structures\n")
        w.emit("designation", ["id", "title", "job_level"], DESIG, ignore=True)
        extra_salaries = [
            (7, 60000.00, 20000.00, 8000.00),  # Lecturer
            (8, 40000.00, 15000.00, 5000.00),  # Hostel Warden
            (9, 70000.00, 25000.00, 10000.00)  # Administrative Officer
        ]
        w.emit("salary_structure", ["designation_id", "basic_pay", "allowances", "standard_deductions"], extra_salaries, ignore=True)

        f.write("\n-- 3. Employees\n")
        w.emit("employee", ["id", "employee_id", "first_name", "last_name", "department_id", "designation_id", "joining_date", "emp_type", "status"],
               [(e["id"], e["eid_str"], e["fname"], e["lname"], e["dept_id"], e["desig_id"], e["join_date"], e["emp_type"], e["status"]) for e in employees])

        f.write("\n-- 4. Students\n")
        w.emit("student", ["id", "global_student_id", "first_name", "last_name", "email", "phone", "program_id", "batch_year", "status"],
               [(s["id"], s["global_id"], s["fname"], s["lname"], s["email"], s["phone"], s["prog_id"], s["batch_year"], s["status"]) for s in students])

        f.write("\n-- 5. User Accounts & RBAC\n")
        w.emit("user_account", ["id", "username", "password_hash", "status", "last_login", "student_id", "employee_id"], users)
        w.emit("role_assignment", ["user_id", "role_id"], role_assignments)
        w.emit("admin_permission_set_assignment", ["user_id", "permission_set_id"], admin_perm_assignments)

        f.write("\n-- 6. Courses, Curriculum & Offerings\n")
        w.emit("course", ["id", "code", "title", "credits", "department_id", "status"], courses)
        w.emit("curriculum_mapping", ["id", "program_id", "semester", "course_id", "type"], curriculum)
        w.emit("course_offering", ["id", "course_id", "term_id", "faculty_id", "section", "capacity"],
               [(o["id"], o["course_id"], o["term_id"], o["faculty_id"], o["section"], o["capacity"]) for o in offerings])

        f.write("\n-- 7. Enrollments\n")
        w.emit("enrollment", ["id", "student_id", "offering_id", "status", "enrolled_date"],
               [(e["id"], e["student"]["id"], e["offering"]["id"], e["status"], e["enrolled_date"]) for e in enrollments])

        f.write("\n-- 8. Bulk Enrollment Batches & Logs\n")
        w.emit("bulk_enrollment_batch", ["id", "batch_id", "run_by", "run_date", "total_processed", "total_success", "total_failed"], bulk_batches)
        w.emit("bulk_enrollment_batch_log", ["id", "batch_id", "student_id", "offering_id", "status", "message"], bulk_logs)

        f.write("\n-- 9. Attendance Sessions & Records\n")
        w.emit("attendance_session", ["id", "offering_id", "session_date", "slot", "marked_by", "marked_at"], sessions)
        w.emit("attendance_record", ["session_id", "enrollment_id", "status"], att_rows, batch=1000)

        f.write("\n-- 10. Exams & Exam Registrations\n")
        w.emit("exam", ["id", "offering_id", "exam_type", "exam_date", "max_marks", "reg_start_date", "reg_end_date"], exams)
        w.emit("exam_registration", ["id", "exam_id", "student_id", "status", "registered_at"], regs)
        w.emit("exam_marks_result", ["registration_id", "marks", "grade", "grade_points", "is_published"], marks)
        w.emit("semester_result", ["id", "student_id", "term_id", "total_credits", "sgpa", "cgpa", "computed_at"], sem_results)

        f.write("\n-- 11. Hostels, Rooms, Allocations, Requests\n")
        w.emit("hostel", ["id", "name", "gender_block", "total_capacity"], hostel_rows)
        w.emit("room", ["id", "hostel_id", "room_number", "bed_capacity", "available_beds"], room_rows)
        w.emit("hostel_allocation", ["id", "student_id", "room_id", "from_date", "to_date", "status"], alloc)
        w.emit("hostel_request", ["id", "student_id", "request_type", "details", "status", "decision_by", "remark"], hreq)

        f.write("\n-- 12. Finance: Fees, Payments, Allocations, Receipts\n")
        w.emit("fee_structure", ["id", "program_id", "term_id", "structure_name"], fstruct_rows)
        w.emit("fee_component", ["id", "structure_id", "component_name", "amount", "due_date"], fcomp_rows)
        w.emit("student_fee", ["id", "student_id", "component_id", "amount_due", "amount_paid", "status"], student_fee_rows)
        w.emit("payment", ["id", "student_id", "amount", "payment_mode", "reference_no", "payment_date", "status"], pay_rows)
        w.emit("payment_allocation", ["id", "payment_id", "student_fee_id", "allocated_principal", "allocated_late_fee"], alloc_rows)
        w.emit("receipt", ["id", "receipt_number", "payment_id", "generated_at"], rcpt_rows)
        w.emit("fee_audit_log", ["id", "entity_name", "entity_id", "old_value", "new_value", "changed_by", "changed_at"], fee_audit_rows)

        f.write("\n-- 13. HR: Leaves & Payroll\n")
        w.emit("leave_application", ["id", "employee_id", "leave_type_id", "start_date", "end_date", "days", "reason", "status", "decision_by", "decision_date"], leaves)
        w.emit("payroll_run", ["id", "payroll_month", "run_date", "status", "run_by"], runs)
        w.emit("payslip", ["id", "run_id", "employee_id", "gross_pay", "total_deductions", "net_pay", "leave_days_deducted"], slips)
        w.emit("payslip_line", ["id", "payslip_id", "component_type", "description", "amount"], slip_lines)

        f.write("\n-- 14. General Audit Log\n")
        w.emit("general_audit_log", ["id", "actor_user_id", "action", "entity_name", "entity_id", "before_state", "after_state", "timestamp"], general_audit)

        f.write("\n-- 15. Update Department Heads\n")
        for i, hid in enumerate(heads, start=1):
            f.write(f"UPDATE department SET head_employee_id={hid} WHERE id={i};\n")

        f.write("\nCOMMIT;\nSET FOREIGN_KEY_CHECKS=1;\n")

    print(f"[OK] Successfully wrote {a.out}")
    print("Table Row Counts:")
    for t, c in w.counts.items():
        print(f"  {t:32s}: {c:>8,}")

if __name__ == "__main__":
    main()
