#!/usr/bin/env python3
"""
seed_erp.py - deterministic seed-data generator for the University Higher Education ERP
(React + FastAPI + MySQL, DBMS PBL).

    pip install bcrypt
    python seed_erp.py --students 1000 --seed 2026 --out seed_data.sql

Generates ~1,000 students across 6 B.Tech programs, 4 batches and 7 academic terms and
populates all 7 modules so every page, trigger, procedure, UDF and report (RP-1..RP-10)
has realistic data.  "Today" is fixed to 2026-10-26 so the data is reproducible.

Table / column names follow schema_assumed.sql.  If your DDL differs, edit the column
lists passed to W.emit(...) near the bottom of each module section.
"""
import argparse, datetime as dt, math, random, sys

D = dt.date
TODAY = D(2026, 10, 26)
CUR = 7                                   # current term id
rnd = random.Random()

# ----------------------------------------------------------------- helpers
def clip(x, lo, hi): return max(lo, min(hi, x))

def pick_w(items):
    tot = sum(w for _, w in items); r = rnd.random() * tot; acc = 0
    for v, w in items:
        acc += w
        if r <= acc: return v
    return items[-1][0]

def rtime(d, lo=9, hi=17):
    return dt.datetime(d.year, d.month, d.day, rnd.randint(lo, hi), rnd.randint(0, 59), rnd.randint(0, 59))

def q(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "1" if v else "0"
    if isinstance(v, int): return str(v)
    if isinstance(v, float): return f"{v:.2f}"
    if isinstance(v, dt.datetime): return "'" + v.strftime("%Y-%m-%d %H:%M:%S") + "'"
    if isinstance(v, dt.date): return "'" + v.isoformat() + "'"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"

class W:
    def __init__(self, f): self.f, self.counts = f, {}
    def emit(self, table, cols, rows, batch=400):
        rows = list(rows)
        for i in range(0, len(rows), batch):
            chunk = rows[i:i + batch]
            self.f.write(f"INSERT INTO `{table}` (`" + "`,`".join(cols) + "`) VALUES\n")
            self.f.write(",\n".join("(" + ",".join(q(v) for v in r) + ")" for r in chunk) + ";\n")
        self.counts[table] = len(rows)

# ----------------------------------------------------------------- name banks
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
def person(gender):
    first = rnd.choice(MALE if gender == "M" else FEMALE)
    return f"{first} {rnd.choice(SURN)}"
def phone(): return f"{rnd.choice('6789')}{rnd.randint(0, 999999999):09d}"

# ----------------------------------------------------------------- reference data
#            code    name                                       weight faculty tuition_base male_prob
DEPTS = [("CSE", "Computer Engineering", .26, 14, 98000, .55), ("IT", "Information Technology", .16, 9, 95000, .50),
         ("ENTC", "Electronics & Telecommunication Engineering", .22, 13, 92000, .62),
         ("MECH", "Mechanical Engineering", .14, 9, 88000, .85), ("CIVIL", "Civil Engineering", .10, 7, 85000, .78),
         ("EE", "Electrical Engineering", .12, 8, 90000, .75)]
ND = len(DEPTS)
BATCH_START = {2023: 1, 2024: 3, 2025: 5, 2026: 7}          # batch -> first term id
BATCH_SHARE = {2023: .25, 2024: .26, 2025: .25, 2026: .24}
TERMS = [(1, "2023-24-ODD", "2023-24", "ODD", D(2023, 7, 17), D(2023, 12, 15)),
         (2, "2023-24-EVEN", "2023-24", "EVEN", D(2024, 1, 8), D(2024, 5, 31)),
         (3, "2024-25-ODD", "2024-25", "ODD", D(2024, 7, 15), D(2024, 12, 14)),
         (4, "2024-25-EVEN", "2024-25", "EVEN", D(2025, 1, 6), D(2025, 5, 30)),
         (5, "2025-26-ODD", "2025-26", "ODD", D(2025, 7, 14), D(2025, 12, 13)),
         (6, "2025-26-EVEN", "2025-26", "EVEN", D(2026, 1, 5), D(2026, 5, 29)),
         (7, "2026-27-ODD", "2026-27", "ODD", D(2026, 7, 20), D(2026, 12, 18))]
TERM = {t[0]: t for t in TERMS}
LAST_PUBLISHED = 5                                        # term 6 marks entered but NOT published (E-09 demo)

SEM12 = {1: ["Engineering Mathematics I", "Engineering Physics", "Basic Electrical & Electronics", "Physics Laboratory", "Communication Skills"],
         2: ["Engineering Mathematics II", "Engineering Chemistry", "Programming for Problem Solving", "Programming Laboratory", "Engineering Graphics"]}
T = {  # dept -> semester -> 5 titles (4th is lab; 5th is elective from sem 5)
 "CSE": {3: "Discrete Mathematics;Data Structures;Computer Organization;Data Structures Lab;Object Oriented Programming",
         4: "Design & Analysis of Algorithms;Database Management Systems;Operating Systems;DBMS Lab;Probability & Statistics",
         5: "Computer Networks;Theory of Computation;Software Engineering;Networks Lab;Elective I: Machine Learning",
         6: "Compiler Design;Web Technologies;Information Security;Web Technologies Lab;Elective II: Cloud Computing",
         7: "Distributed Systems;Artificial Intelligence;Big Data Analytics;AI Lab;Elective III: Blockchain Technology",
         8: "Deep Learning;Human Computer Interaction;Project Management;Project Lab;Elective IV: Quantum Computing Basics"},
 "IT": {3: "Discrete Structures;Data Structures & Algorithms;Digital Logic;DSA Lab;Python Programming",
        4: "Database Systems;Operating Systems;Computer Networks;Database Lab;Statistics for IT",
        5: "Software Engineering;Web Development;Information Systems;Web Lab;Elective I: Data Mining",
        6: "Cyber Security;Mobile Application Development;Cloud Infrastructure;Mobile App Lab;Elective II: DevOps",
        7: "Machine Learning;Internet of Things;Business Intelligence;ML Lab;Elective III: Natural Language Processing",
        8: "Enterprise Architecture;Software Testing;IT Project Management;Capstone Lab;Elective IV: AR/VR Systems"},
 "ENTC": {3: "Signals & Systems;Analog Circuits;Digital Electronics;Analog Circuits Lab;Electronic Measurements",
          4: "Network Theory;Electromagnetic Fields;Microcontrollers;Microcontrollers Lab;Control Systems",
          5: "Digital Signal Processing;Analog Communication;Antennas & Wave Propagation;Communication Lab;Elective I: Embedded Systems",
          6: "Digital Communication;VLSI Design;Microwave Engineering;VLSI Lab;Elective II: Image Processing",
          7: "Mobile Communication;Optical Fibre Communication;Information Theory & Coding;Wireless Lab;Elective III: IoT Systems",
          8: "Satellite Communication;Radar Engineering;Telecom Networks;Project Lab;Elective IV: 5G Technologies"},
 "MECH": {3: "Thermodynamics;Strength of Materials;Fluid Mechanics;Materials Testing Lab;Manufacturing Processes",
          4: "Kinematics of Machinery;Heat Transfer;Machine Drawing;CAD Lab;Metrology",
          5: "Dynamics of Machinery;Design of Machine Elements;IC Engines;Thermal Lab;Elective I: Mechatronics",
          6: "Refrigeration & Air Conditioning;CAD/CAM;Industrial Engineering;CAM Lab;Elective II: Robotics",
          7: "Finite Element Analysis;Power Plant Engineering;Operations Research;FEA Lab;Elective III: Additive Manufacturing",
          8: "Automobile Engineering;Production Management;Renewable Energy Systems;Project Lab;Elective IV: Industry 4.0"},
 "CIVIL": {3: "Surveying;Building Materials;Structural Analysis I;Surveying Lab;Fluid Mechanics",
           4: "Structural Analysis II;Geotechnical Engineering;Concrete Technology;Concrete Lab;Hydrology",
           5: "Design of RC Structures;Transportation Engineering;Environmental Engineering;Geotech Lab;Elective I: Remote Sensing & GIS",
           6: "Design of Steel Structures;Water Resources Engineering;Foundation Engineering;Structural Design Lab;Elective II: Construction Management",
           7: "Advanced Structural Design;Estimating & Costing;Highway Engineering;Transportation Lab;Elective III: Earthquake Engineering",
           8: "Bridge Engineering;Quantity Surveying;Environmental Impact Assessment;Project Lab;Elective IV: Smart Cities"},
 "EE": {3: "Network Analysis;Electrical Machines I;Electromagnetic Theory;Machines Lab I;Analog Electronics",
        4: "Electrical Machines II;Power Systems I;Control Systems;Machines Lab II;Measurements & Instrumentation",
        5: "Power Electronics;Power Systems II;Microprocessors;Power Electronics Lab;Elective I: Renewable Energy",
        6: "Electric Drives;Switchgear & Protection;Digital Signal Processing;Drives Lab;Elective II: Smart Grids",
        7: "HVDC & FACTS;Power System Operation;Industrial Automation;Automation Lab;Elective III: Electric Vehicles",
        8: "Energy Management;Power Quality;Utilization of Electrical Energy;Project Lab;Elective IV: Energy Storage"}}
CREDITS = {1: 4, 2: 4, 3: 3, 4: 2, 5: 3}                   # = 16 credits / semester
GRADES = [("O", 90, 100, 10), ("A+", 80, 89.99, 9), ("A", 70, 79.99, 8), ("B+", 60, 69.99, 7),
          ("B", 55, 59.99, 6), ("C", 50, 54.99, 5), ("P", 40, 49.99, 4), ("F", 0, 39.99, 0)]
def grade_of(m):
    for g, lo, hi, gp in GRADES:
        if m >= lo: return g, gp
    return "F", 0

DESIG = [(1, "Professor", 5), (2, "Associate Professor", 4), (3, "Assistant Professor", 3), (4, "Lecturer", 2),
         (5, "Lab Assistant", 1), (6, "Clerk", 1), (7, "Accountant", 2), (8, "Hostel Warden", 2), (9, "Administrative Officer", 3)]
SALARY = {1: 150000, 2: 120000, 3: 85000, 4: 60000, 5: 32000, 6: 28000, 7: 45000, 8: 40000, 9: 70000}
LEAVE_TYPES = [(1, "CL", "Casual Leave", 12, 0, True), (2, "EL", "Earned Leave", 15, 30, True), (3, "ML", "Medical Leave", 10, 0, True),
               (4, "CO", "Compensatory Off", 5, 0, True), (5, "LWP", "Leave Without Pay", 30, 0, False)]
PERMS = ["Super Admin", "Academic Admin", "Exam Admin", "Finance Admin", "HR Admin", "Hostel Admin"]

# ===================================================================== main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--students", type=int, default=1000)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--out", default="seed_data.sql")
    ap.add_argument("--password", default="Password@123", help="plain password given to every seeded user")
    ap.add_argument("--password-hash", default=None, help="use this pre-computed hash instead of bcrypt")
    ap.add_argument("--sessions", type=int, default=13, help="attendance sessions per current-term offering")
    a = ap.parse_args()
    rnd.seed(a.seed)
    NS = a.sessions

    if a.password_hash: PW = a.password_hash
    else:
        try:
            import bcrypt
            PW = bcrypt.hashpw(a.password.encode(), bcrypt.gensalt(rounds=10)).decode()
        except ImportError:
            sys.exit("pip install bcrypt   (or pass --password-hash '<your hash>')")

    # ------------------------------------------------------------- M1 reference
    roles = [(1, "ADMIN"), (2, "FACULTY"), (3, "STUDENT")]
    perm_rows = [(i + 1, n) for i, n in enumerate(PERMS)]
    dept_rows = [(i + 1, d[0], d[1], None) for i, d in enumerate(DEPTS)]
    prog_rows = [(i + 1, i + 1, f"BTECH-{d[0]}", f"B.Tech {d[1]}", "UG", 4, 128) for i, d in enumerate(DEPTS)]
    term_rows = [(t[0], t[1], t[2], t[3], t[4], t[5], t[0] == CUR) for t in TERMS]

    # ------------------------------------------------------------- employees (60 faculty + 20 staff)
    employees, fac_by_dept, emp_seq = [], {i: [] for i in range(ND)}, 0
    def new_emp(dept_i, desig, etype, join, gender=None):
        nonlocal emp_seq
        emp_seq += 1; g = gender or ("M" if rnd.random() < .6 else "F"); eid = f"EMP{emp_seq:04d}"
        e = dict(id=eid, name=("Dr. " if desig <= 2 and etype == "FACULTY" else "") + person(g), gender=g,
                 dept=dept_i, desig=desig, type=etype, join=join, status="ACTIVE")
        employees.append(e); return e
    for i, d in enumerate(DEPTS):
        for k in range(d[3]):
            desig = 1 if k == 0 else pick_w([(1, 12), (2, 28), (3, 45), (4, 15)])
            fac_by_dept[i].append(new_emp(i, desig, "FACULTY", D(rnd.randint(2005, 2023), rnd.randint(1, 12), rnd.randint(1, 28))))
    staff_plan = [6, 6, 6, 6, 6, 6, 7, 7, 7, 5, 5, 5, 5, 8, 8, 8, 8, 9, 9, 9]
    for k, desig in enumerate(staff_plan):
        join = D(2026, rnd.randint(3, 6), rnd.randint(1, 28)) if k in (2, 11, 17) else D(rnd.randint(2008, 2024), rnd.randint(1, 12), rnd.randint(1, 28))
        new_emp(rnd.randrange(ND), desig, "STAFF", join)
    for e in rnd.sample([x for x in employees if x["type"] == "FACULTY" and x["desig"] != 1], 2): e["status"] = "ON_LEAVE"
    for e in employees:
        e["email"] = f"{e['id'].lower()}@erp.example.edu"; e["phone"] = phone()
    emp_by_id = {e["id"]: e for e in employees}
    heads = [fac_by_dept[i][0]["id"] for i in range(ND)]       # first faculty of each dept is a Professor = HOD
    wardens = [e for e in employees if e["desig"] == 8]

    # ------------------------------------------------------------- students
    total = a.students
    bsize = {b: int(round(total * s)) for b, s in BATCH_SHARE.items()}
    bsize[2026] += total - sum(bsize.values())
    students, cohorts, seqs = [], {}, {}
    for batch in sorted(bsize):
        counts = [int(round(bsize[batch] * d[2])) for d in DEPTS]
        counts[0] += bsize[batch] - sum(counts)
        for di, c in enumerate(counts):
            cohorts[(di, batch)] = []
            for _ in range(c):
                seqs[(di, batch)] = seqs.get((di, batch), 0) + 1
                g = "M" if rnd.random() < DEPTS[di][5] else "F"
                city, state, _w = pick_w([((c_, s_, w_), w_) for c_, s_, w_ in CITIES])
                st0 = TERM[BATCH_START[batch]][4]
                s = dict(id=f"S{batch % 100:02d}{DEPTS[di][0]}{seqs[(di, batch)]:04d}", name=person(g), gender=g,
                         dob=D(batch - rnd.randint(18, 20), rnd.randint(1, 12), rnd.randint(1, 28)), city=city, state=state,
                         prog=di, batch=batch, start=BATCH_START[batch], sem=CUR - BATCH_START[batch] + 1, status="ACTIVE",
                         adm=st0 - dt.timedelta(days=rnd.randint(10, 40)), phone=phone(),
                         att=(clip(rnd.gauss(.915, .04), .75, .99) if (r := rnd.random()) < .84 else
                              clip(rnd.gauss(.74, .04), .6, .85) if r < .95 else clip(rnd.gauss(.62, .05), .5, .72)),
                         ab=clip(rnd.gauss(.66, .12), .35, .90))
                s["email"] = f"{s['id'].lower()}@students.erp.example.edu"
                students.append(s); cohorts[(di, batch)].append(s)
    S = {s["id"]: s for s in students}
    for s in rnd.sample([x for x in students if x["batch"] == 2023], min(6, total // 150)): s["status"] = "DETAINED"
    for s in rnd.sample([x for x in students if x["status"] == "ACTIVE" and x["batch"] != 2026], min(8, total // 100)): s["status"] = "DROPPED"

    # ------------------------------------------------------------- users
    users, uid = [], 0
    def new_user(username, email, role, sid=None, eid=None, status="ACTIVE"):
        nonlocal uid
        uid += 1
        fa = 5 if status == "LOCKED" else (rnd.choice([0, 0, 0, 1, 2]) if status == "ACTIVE" else 0)
        ll = rtime(TODAY - dt.timedelta(days=rnd.randint(0, 30))) if status == "ACTIVE" and rnd.random() < .85 else None
        users.append((uid, username, email, PW, role, sid, eid, status, fa, ll, rtime(D(2023, 7, 1))))
        return uid
    admin_uid = {}
    for i, p in enumerate(PERMS):
        admin_uid[p] = new_user(p.lower().replace(" ", "."), f"{p.lower().replace(' ', '.')}@erp.example.edu", 1)
    SUPER, ACAD, EXAM, FIN, HR, HOST = (admin_uid[p] for p in PERMS)
    perm_links = [(SUPER, i + 1) for i in range(len(PERMS))] + [(admin_uid[p], i + 1) for i, p in enumerate(PERMS) if i > 0]
    emp_uid, stu_uid = {}, {}
    for e in employees:
        if e["type"] == "FACULTY": emp_uid[e["id"]] = new_user(e["id"].lower(), e["email"], 2, eid=e["id"])
    locked = set(rnd.sample([s["id"] for s in students if s["status"] == "ACTIVE"], 4))
    for s in students:
        st = "INACTIVE" if s["status"] == "DROPPED" else ("LOCKED" if s["id"] in locked else "ACTIVE")
        stu_uid[s["id"]] = new_user(s["id"].lower(), s["email"], 3, sid=s["id"], status=st)

    # ------------------------------------------------------------- M2 courses / curriculum / offerings / enrollments
    courses, curriculum, course_id = [], [], {}
    for di, d in enumerate(DEPTS):
        for sem in range(1, 9):
            titles = SEM12[sem] if sem <= 2 else T[d[0]][sem].split(";")
            for n in range(1, 6):
                cid = len(courses) + 1; course_id[(di, sem, n)] = cid
                ctype = "LAB" if n == 4 else ("ELECTIVE" if (n == 5 and sem >= 5) else "THEORY")
                courses.append((cid, f"{d[0]}{sem}{n:02d}", titles[n - 1], CREDITS[n], di + 1, ctype, True))
                curriculum.append((cid, di + 1, sem, cid, "ELECTIVE" if ctype == "ELECTIVE" else "CORE"))
    course_credit = {c[0]: c[3] for c in courses}

    offerings, off_map = [], {}
    for t in TERMS:
        for di in range(ND):
            for batch, start in BATCH_START.items():
                if start > t[0] or not cohorts[(di, batch)]: continue
                sem = t[0] - start + 1; nsec = max(1, math.ceil(len(cohorts[(di, batch)]) / 60))
                fac = fac_by_dept[di]
                for n in range(1, 6):
                    for sec in range(nsec):
                        o = dict(id=len(offerings) + 1, term=t[0], course=course_id[(di, sem, n)], di=di, sem=sem, n=n,
                                 fac=fac[(sem * 7 + n * 3 + sec + t[0]) % len(fac)]["id"], sec=chr(65 + sec))
                        offerings.append(o); off_map[(t[0], di, sem, n, sec)] = o
    O = {o["id"]: o for o in offerings}

    withdraw_one = {s["id"]: rnd.randint(1, 5) for s in rnd.sample([x for x in students if x["status"] == "ACTIVE" and x["start"] < CUR + 1], min(12, total // 80))}
    enrollments, enr_by_off = [], {}
    for t in TERMS:
        for batch, start in BATCH_START.items():
            if start > t[0]: continue
            sem = t[0] - start + 1
            for di in range(ND):
                coh = cohorts[(di, batch)]
                nsec = max(1, math.ceil(len(coh) / 60))
                for j, s in enumerate(coh):
                    for n in range(1, 6):
                        o = off_map[(t[0], di, sem, n, j % nsec)]
                        e = dict(id=len(enrollments) + 1, s=s, o=o, term=t[0], status="COMPLETED", on=t[4] + dt.timedelta(days=rnd.randint(0, 7)),
                                 wd=None, why=None)
                        if t[0] == CUR:
                            if s["status"] == "DROPPED":
                                e.update(status="WITHDRAWN", wd=D(2026, 8, rnd.randint(5, 30)), why="Dropped out of programme")
                            elif withdraw_one.get(s["id"]) == n:
                                e.update(status="WITHDRAWN", wd=D(2026, 8, rnd.randint(1, 28)), why=rnd.choice(["Timetable clash", "Elective changed", "Medical reasons"]))
                            else: e["status"] = "ENROLLED"
                        enrollments.append(e); enr_by_off.setdefault(o["id"], []).append(e)

    # bulk-enrollment batch history (first-semester cohorts of terms 5 and 7)
    bulk, rejects, rj = [], [], 0
    for tid, batch in ((5, 2025), (7, 2026)):
        for di in range(ND):
            n_ok = len(cohorts[(di, batch)]) * 5
            if not n_ok: continue
            skip, fail = rnd.randint(0, 4), rnd.randint(0, 3)
            bid = len(bulk) + 1
            bulk.append((bid, ACAD, di + 1, tid, 1, pick_w([("UI", 5), ("CSV", 3), ("JSON", 1), ("XML", 1)]), n_ok + skip + fail, n_ok, skip, fail,
                         rtime(TERM[tid][4] + dt.timedelta(days=rnd.randint(0, 4)))))
            for k in range(skip + fail):
                rj += 1; dup = k < skip
                sid = rnd.choice(cohorts[(di, batch)])["id"] if dup else f"S{batch % 100:02d}XXX{rnd.randint(1, 9999):04d}"
                rejects.append((rj, bid, n_ok + k + 1, sid, None,
                                "Duplicate enrollment for this offering" if dup else rnd.choice(["Student not found", "Program mapping invalid for course"])))

    # ------------------------------------------------------------- M3 attendance (current term only)
    sessions, att_rows = [], []
    for o in [x for x in offerings if x["term"] == CUR]:
        om = rnd.gauss(0, .02) - (.08 if rnd.random() < .06 else 0)       # a few low-attendance courses (RP-3)
        dow, slot = rnd.randint(0, 4), f"S{rnd.randint(1, 4)}"
        sids = []
        for i in range(NS):
            sid = len(sessions) + 1; sids.append(sid)
            sessions.append((sid, o["id"], D(2026, 7, 27) + dt.timedelta(days=7 * i + dow), slot, o["fac"]))
        for e in enr_by_off[o["id"]]:
            if e["status"] != "ENROLLED": continue
            p = clip(e["s"]["att"] + rnd.gauss(0, .025) + om, .4, .99)
            pres = [rnd.random() < p for _ in range(NS)]
            att_rows += [(sid, e["id"], "P" if pr else "A") for sid, pr in zip(sids, pres)]
            e["att_pct"] = round(100 * sum(pres) / NS, 2)

    # exams, registrations, attempts, marks
    exams, regs, attempts, marks = [], [], [], []
    exam_of = {}
    for o in offerings:
        t = TERM[o["term"]]; xid = len(exams) + 1; exam_of[o["id"]] = xid
        if o["term"] == CUR:
            ed, ro, rc = D(2026, 12, rnd.randint(1, 12)), D(2026, 10, 15), D(2026, 11, 15)
        else:
            ed = t[5] - dt.timedelta(days=rnd.randint(5, 12)); ro, rc = ed - dt.timedelta(days=40), ed - dt.timedelta(days=15)
        exams.append((xid, o["id"], "END_SEM", ed, 100, ro, rc))
    EX = {x[0]: x for x in exams}
    pub_time = {tid: rtime(TERM[tid][5] + dt.timedelta(days=20)) for tid in range(1, LAST_PUBLISHED + 1)}
    for e in enrollments:
        xid = exam_of[e["o"]["id"]]; x = EX[xid]
        if e["term"] < CUR:
            rid = len(regs) + 1
            regs.append((rid, xid, e["id"], "REGISTERED", rtime(x[5] + dt.timedelta(days=rnd.randint(0, 20)))))
            m = round(2 * clip(100 * (e["s"]["ab"] + rnd.gauss(0, .08)), 12, 99.5)) / 2
            entered = rtime(x[3] + dt.timedelta(days=rnd.randint(3, 10)))
            if e["term"] <= LAST_PUBLISHED:
                g, gp = grade_of(m); marks.append((rid, float(m), g, gp, True, e["o"]["fac"], entered, pub_time[e["term"]]))
            else:
                marks.append((rid, float(m), None, None, False, e["o"]["fac"], entered, None))
            e["m"], e["rid"] = m, rid
        elif e["status"] == "ENROLLED":
            pct = e["att_pct"]; when = rtime(D(2026, 10, rnd.randint(15, 25)))
            if pct >= 75:
                if rnd.random() < .82:
                    rid = len(regs) + 1; regs.append((rid, xid, e["id"], "REGISTERED", when))
                    attempts.append((len(attempts) + 1, xid, e["id"], "REGISTERED", pct, None, when))
            elif rnd.random() < .65:
                attempts.append((len(attempts) + 1, xid, e["id"], "BLOCKED", pct, f"Attendance {pct:.2f}% is below the required 75%", when))

    # semester results + running CGPA (published terms only)
    sem_results, per_st = [], {}
    for e in enrollments:
        if e["term"] <= LAST_PUBLISHED:
            gp = grade_of(e["m"])[1]; cr = course_credit[e["o"]["course"]]
            per_st.setdefault(e["s"]["id"], {}).setdefault(e["term"], []).append((cr, gp))
    for sid, by_t in per_st.items():
        tc = tp = 0
        for tid in sorted(by_t):
            cr = sum(c for c, _ in by_t[tid]); pts = sum(c * g for c, g in by_t[tid]); earn = sum(c for c, g in by_t[tid] if g > 0)
            tc += cr; tp += pts
            sem_results.append((len(sem_results) + 1, sid, tid, cr, earn, round(pts / cr, 2), round(tp / tc, 2), pub_time[tid]))

    # ------------------------------------------------------------- M6 hostel (built before fees: hostel fee depends on it)
    hostel_defs = [("Aryabhatta Hostel", "BOYS", "A"), ("Bhaskara Hostel", "BOYS", "B"), ("Gargi Hostel", "GIRLS", "G"), ("Maitreyi Hostel", "GIRLS", "M")]
    rooms, room_by_type = [], {"BOYS": [], "GIRLS": []}
    for hi, (hn, ht, code) in enumerate(hostel_defs):
        k = 0
        for fl, cnt in enumerate([9, 9, 9, 8], start=1):
            for r in range(1, cnt + 1):
                k += 1; cap = [2, 3, 3, 4][k % 4]
                rm = dict(id=len(rooms) + 1, h=hi + 1, no=f"{code}-{fl}{r:02d}", fl=fl, cap=cap, used=0)
                rooms.append(rm); room_by_type[ht].append(rm)
    alloc, res_range = [], {}                                        # res_range: sid -> (first_term, last_term)
    for gender, htype in (("M", "BOYS"), ("F", "GIRLS")):
        beds = sum(r["cap"] for r in room_by_type[htype])
        cands = sorted([s for s in students if s["gender"] == gender and s["status"] == "ACTIVE"], key=lambda s: (s["city"] == "Pune", rnd.random()))
        queue = cands[:int(.72 * beds)]
        for rm in room_by_type[htype]:
            if not queue: break
            if rnd.random() < .12: continue
            take = rm["cap"] if rnd.random() < .7 else max(1, rm["cap"] - 1)
            for _ in range(take):
                if not queue: break
                s = queue.pop(0); rm["used"] += 1
                ft = s["start"] if rnd.random() < .8 or s["start"] + 2 > CUR else s["start"] + 2
                res_range[s["id"]] = (ft, CUR)
                alloc.append((len(alloc) + 1, s["id"], rm["id"], TERM[ft][4] + dt.timedelta(days=rnd.randint(0, 10)), None, "ACTIVE"))
    vac_pool = [s for s in students if s["id"] not in res_range and s["start"] <= 5 and s["status"] == "ACTIVE"]
    vacated = rnd.sample(vac_pool, min(40, len(vac_pool)))
    for s in vacated:
        last = rnd.randint(s["start"], min(6, s["start"] + 3))
        res_range[s["id"]] = (s["start"], last)
        rm = rnd.choice(room_by_type["BOYS" if s["gender"] == "M" else "GIRLS"])
        alloc.append((len(alloc) + 1, s["id"], rm["id"], TERM[s["start"]][4] + dt.timedelta(days=rnd.randint(0, 10)), TERM[last][5], "VACATED"))
    hostel_rows = [(i + 1, hn, ht, sum(r["cap"] for r in rooms if r["h"] == i + 1), wardens[i % len(wardens)]["id"]) for i, (hn, ht, _) in enumerate(hostel_defs)]
    room_rows = [(r["id"], r["h"], r["no"], r["fl"], r["cap"], r["cap"] - r["used"]) for r in rooms]
    active_res = [x for x in alloc if x[5] == "ACTIVE"]
    resident_ids = {x[1] for x in active_res}
    hreq = []
    def add_req(sid, typ, det, status, when, remark=None):
        dec_by = HOST if status != "PENDING" else None
        dec_at = rtime((when + dt.timedelta(days=rnd.randint(1, 5))).date()) if status != "PENDING" else None
        hreq.append((len(hreq) + 1, sid, typ, det, status, when, dec_by, dec_at, remark))
    for x in rnd.sample(active_res, min(60, len(active_res))):
        add_req(x[1], "ALLOCATION", "Request for hostel accommodation", "APPROVED", rtime(x[3] - dt.timedelta(days=rnd.randint(10, 25))), "Bed allotted")
    for x in rnd.sample(active_res, min(30, len(active_res))):
        add_req(x[1], "ROOM_CHANGE", rnd.choice(["Wants a quieter room", "Roommate conflict", "Wants a room closer to the mess"]),
                pick_w([("PENDING", 2), ("APPROVED", 1), ("REJECTED", 1)]), rtime(D(2026, 10, rnd.randint(1, 24))), None)
    for s in vacated:
        add_req(s["id"], "VACATE", "Moving out of hostel", "APPROVED", rtime(alloc[[a_[1] for a_ in alloc].index(s["id"])][4] - dt.timedelta(days=rnd.randint(7, 20))), "Vacated after clearance")
    nonres = [s for s in students if s["id"] not in res_range and s["status"] == "ACTIVE"]
    for s in rnd.sample(nonres, min(80, len(nonres))):
        st = pick_w([("PENDING", 6), ("REJECTED", 4)])
        add_req(s["id"], "ALLOCATION", rnd.choice(["Outstation student", "Long daily commute", "Needs quiet study environment"]), st,
                rtime(D(2026, 10, rnd.randint(1, 24))), "No beds available in preferred block" if st == "REJECTED" else None)

    # ------------------------------------------------------------- M4 finance
    structs, fs_rows = {}, []
    for t in TERMS:
        ayi = (t[0] - 1) // 2; due = t[4] + dt.timedelta(days=41)
        for di, d in enumerate(DEPTS):
            for comp, amt in (("TUITION", round(d[4] * (1.04 ** ayi) / 500) * 500), ("EXAM", 3500 + 250 * ayi),
                              ("DEVELOPMENT", 6000 + 500 * ayi), ("HOSTEL", 45000 + 2000 * ayi)):
                sid_ = len(fs_rows) + 1; structs[(di, t[0], comp)] = dict(id=sid_, amount=float(amt), due=due)
                fs_rows.append((sid_, di + 1, t[0], comp, float(amt), due))
    late_rules = [(1, "Standard per-day penalty", "PER_DAY", 50.0, 7, 5000.0, D(2023, 7, 1), True),
                  (2, "Legacy flat penalty", "FLAT", 500.0, 0, 500.0, D(2023, 1, 1), False)]
    LATE_RATE, GRACE, MAXP = 50.0, 7, 5000.0
    def late_fee(due, paid):
        days = (paid - due).days
        return min(MAXP, LATE_RATE * (days - GRACE)) if days > GRACE else 0.0

    fees, pays = [], []
    def do_pay(dues, applied, when, student, status="SUCCESS"):
        rem, allocs = applied, []
        if status == "SUCCESS":
            for d in dues:
                owed = d["amt"] - d["paid"]
                if owed <= 0 or rem <= 0: continue
                x = min(owed, rem); d["paid"] += x; rem -= x; allocs.append((d["id"], x))
        lf = late_fee(dues[0]["due"], when.date()) if status == "SUCCESS" else 0.0
        mode = pick_w([("ONLINE", 62), ("CASH", 22), ("DD", 16)])
        ref = {"ONLINE": f"TXN{rnd.randint(10**15, 10**16 - 1)}", "CASH": f"CSH{rnd.randint(10**5, 10**6 - 1)}", "DD": f"DD{rnd.randint(10**5, 10**6 - 1)}"}[mode]
        pays.append(dict(s=student, when=when, applied=applied if status == "SUCCESS" else 0.0, attempt=float(applied), late=lf, mode=mode,
                         status=status, ref=ref, allocs=allocs, by=FIN if mode != "ONLINE" else stu_uid[student["id"]]))
    for s in students:
        fr = res_range.get(s["id"])
        for t in TERMS:
            if t[0] < s["start"]: continue
            comps = ["TUITION", "EXAM", "DEVELOPMENT"] + (["HOSTEL"] if fr and fr[0] <= t[0] <= fr[1] else [])
            dues = []
            for c in comps:
                st = structs[(s["prog"], t[0], c)]
                dues.append(dict(id=len(fees) + 1, s=s["id"], sid=st["id"], amt=st["amount"], paid=0.0, due=st["due"]))
                fees.append(dues[-1])
            total_amt = sum(d["amt"] for d in dues); due = dues[0]["due"]; r = rnd.random()
            if t[0] < CUR:
                sc = "ontime" if r < .93 else ("late" if r < .975 else "partial")
            else:
                sc = "unpaid" if s["status"] == "DROPPED" else ("ontime" if r < .60 else "late" if r < .72 else "partial" if r < .82 else "unpaid")
            def early(): return rtime(min(due - dt.timedelta(days=rnd.randint(0, 30)), TODAY))
            if sc == "ontime":
                if rnd.random() < .10:      # two instalments
                    first = round(total_amt * .6 / 100) * 100
                    do_pay(dues, first, max(early(), rtime(t[4])), s)
                    do_pay(dues, total_amt - first, rtime(min(due + dt.timedelta(days=rnd.randint(5, 40)), TODAY)), s)
                else: do_pay(dues, total_amt, max(early(), rtime(t[4])), s)
            elif sc == "late":
                do_pay(dues, total_amt, rtime(min(due + dt.timedelta(days=rnd.randint(8, 55)), TODAY)), s)
            elif sc == "partial":
                do_pay(dues, round(total_amt * rnd.uniform(.3, .7) / 100) * 100, max(early(), rtime(t[4])), s)
            if sc in ("unpaid", "ontime", "late") and rnd.random() < (.2 if sc == "unpaid" else .03):
                do_pay(dues, total_amt, rtime(min(due - dt.timedelta(days=rnd.randint(1, 5)), TODAY)), s, "FAILED")
            for d in dues: d["status"] = "PAID" if d["paid"] >= d["amt"] else ("PARTIAL" if d["paid"] > 0 else "UNPAID")
    pays.sort(key=lambda p: p["when"])
    pay_rows, alloc_rows, rcpt_rows, yr_seq = [], [], [], {}
    for p in pays:
        pid = len(pay_rows) + 1; amt = round(p["applied"] + p["late"], 2) if p["status"] == "SUCCESS" else round(p["attempt"], 2)
        pay_rows.append([pid, p["s"]["id"], amt, p["late"], p["mode"], p["status"], p["when"], p["ref"], p["by"]])
        for fid, x in p["allocs"]: alloc_rows.append((len(alloc_rows) + 1, pid, fid, float(x)))
        if p["status"] == "SUCCESS":
            y = p["when"].year; yr_seq[y] = yr_seq.get(y, 0) + 1
            rcpt_rows.append((len(rcpt_rows) + 1, f"RCP-{y}-{yr_seq[y]:06d}", pid, p["when"], amt))
    fee_rows = [(d["id"], d["s"], d["sid"], d["amt"], float(d["paid"]), d["status"], d["due"]) for d in fees]
    # fee audit log (what the trigger would have captured)
    faudit = []
    for st in rnd.sample(fs_rows, min(70, len(fs_rows))):
        t0 = TERM[st[2]][4]; ts = rtime(t0 - dt.timedelta(days=rnd.randint(20, 90)))
        if rnd.random() < .75:
            old = round(st[4] * rnd.choice([.92, .95, .97]) / 100) * 100
            faudit.append((len(faudit) + 1, st[0], "amount", f"{old:.2f}", f"{st[4]:.2f}", "UPDATE", FIN, ts))
        else:
            faudit.append((len(faudit) + 1, st[0], "due_date", (st[5] - dt.timedelta(days=7)).isoformat(), st[5].isoformat(), "UPDATE", FIN, ts))
    faudit.sort(key=lambda r: r[7]); faudit = [(i + 1,) + r[1:] for i, r in enumerate(faudit)]

    # ------------------------------------------------------------- M5 leave & payroll
    lt_rows = [(i, c, n, float(q_), float(cf), p) for i, c, n, q_, cf, p in LEAVE_TYPES]
    ent_rows = [(e["id"], lt[0], y, float(lt[3])) for e in employees for lt in LEAVE_TYPES for y in (2025, 2026)]
    leaves, used, lwp_apps = [], {}, []
    reasons = {1: ["Family function", "Personal work", "Festival travel"], 2: ["Vacation", "Home visit"], 3: ["Medical consultation", "Recovery"],
               4: ["Compensatory for weekend duty"], 5: ["Personal commitments", "Extended travel"]}
    for e in employees:
        cur = max(D(2025, 1, 10), e["join"]) + dt.timedelta(days=rnd.randint(0, 120))
        while True:
            lt = pick_w([(1, 42), (2, 20), (3, 16), (4, 8), (5, 14)])
            days = {1: rnd.randint(1, 3), 2: rnd.randint(3, 8), 3: rnd.randint(2, 6), 4: 1, 5: rnd.randint(1, 6)}[lt]
            fr = cur; to = fr + dt.timedelta(days=days - 1)
            if fr > D(2026, 12, 15): break
            if fr >= D(2026, 10, 10): st = pick_w([("PENDING", 7), ("APPROVED", 3)])
            else: st = pick_w([("APPROVED", 82), ("REJECTED", 10), ("CANCELLED", 8)])
            remark = None
            if st == "APPROVED":
                k = (e["id"], lt, fr.year)
                if used.get(k, 0) + days > LEAVE_TYPES[lt - 1][3]: st, remark = "REJECTED", "Insufficient leave balance"
                else: used[k] = used.get(k, 0) + days
            applied = min(rtime(fr - dt.timedelta(days=rnd.randint(2, 20))), rtime(TODAY - dt.timedelta(days=rnd.randint(0, 8))))
            dec_by = HR if st in ("APPROVED", "REJECTED") else None
            dec_at = applied + dt.timedelta(days=rnd.randint(1, 3), hours=1) if dec_by else None
            if st == "REJECTED" and not remark: remark = "Staff shortage during period"
            leaves.append((len(leaves) + 1, e["id"], lt, fr, to, float(days), rnd.choice(reasons[lt]), st, applied, dec_by, dec_at, remark))
            if lt == 5 and st == "APPROVED": lwp_apps.append((e["id"], fr, to))
            cur = to + dt.timedelta(days=rnd.randint(60, 200))
    sal_rows = [(d[0], d[0], float(SALARY[d[0]]), 20.0, 15.0, 12.0, 200.0) for d in DESIG]
    runs, slips = [], []
    for m in range(1, 10):
        rid = m; ms = D(2026, m, 1); me = (D(2026, m + 1, 1) if m < 12 else D(2027, 1, 1)) - dt.timedelta(days=1)
        runs.append((rid, 2026, m, "FINALIZED", rtime(D(2026, m, 25)), rtime(D(2026, m, 27)), HR))
        for e in employees:
            if e["join"] > me: continue
            lwp = sum(max(0, (min(b, me) - max(a_, ms)).days + 1) for eid, a_, b in lwp_apps if eid == e["id"])
            basic = float(SALARY[e["desig"]]); hra = basic * .20; da = basic * .15; gross = basic + hra + da
            pf = round(basic * .12, 2); pt = 200.0; ld = round(basic / 30 * lwp, 2); td = round(pf + pt + ld, 2)
            slips.append((len(slips) + 1, rid, e["id"], basic, hra, da, gross, pf, pt, float(lwp), ld, td, round(gross - td, 2)))

    # ------------------------------------------------------------- audit log (general)
    audit, kinds = [], []
    for tid in range(1, LAST_PUBLISHED + 1): kinds.append((EXAM, "RESULT_PUBLISH", "TERM", str(tid), None, '{"published": true}', pub_time[tid]))
    for r in runs: kinds.append((HR, "PAYROLL_FINALIZE", "PAYROLL_RUN", str(r[0]), '{"status": "DRAFT"}', '{"status": "FINALIZED"}', r[5]))
    for b in bulk: kinds.append((ACAD, "BULK_ENROLLMENT", "BATCH", str(b[0]), None, f'{{"enrolled": {b[7]}}}', b[10]))
    for s in students:
        if s["status"] == "DROPPED": kinds.append((SUPER, "USER_DEACTIVATE", "USER", s["id"], '{"status": "ACTIVE"}', '{"status": "INACTIVE"}', rtime(D(2026, 8, rnd.randint(5, 30)))))
    for _ in range(60):
        s = rnd.choice(students); kinds.append((None, "LOGIN_FAILED", "USER", s["id"], None, None, rtime(TODAY - dt.timedelta(days=rnd.randint(0, 60)))))
    for _ in range(10):
        e = rnd.choice(employees); kinds.append((SUPER, "ROLE_CHANGE", "USER", e["id"], '{"role": "FACULTY"}', '{"role": "FACULTY", "dept_head": true}', rtime(TODAY - dt.timedelta(days=rnd.randint(5, 300)))))
    for f_ in faudit[:25]: kinds.append((FIN, "FEE_STRUCTURE_UPDATE", "FEE_STRUCTURE", str(f_[1]), f_[3], f_[4], f_[7]))
    kinds.sort(key=lambda k: k[6])
    audit = [(i + 1, k[0], k[1], k[2], k[3], k[4], k[5], k[6]) for i, k in enumerate(kinds)]

    # ================================================================= WRITE FILE
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(f"-- Generated by seed_erp.py  (seed={a.seed}, students={total}, 'today'={TODAY})\n"
                f"-- Default password for every seeded user: {a.password if not a.password_hash else '(custom hash)'}\n"
                "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=1;\nSTART TRANSACTION;\n")
        w = W(f)
        w.emit("roles", ["role_id", "role_name"], roles)
        w.emit("permission_sets", ["permission_set_id", "name"], perm_rows)
        w.emit("departments", ["department_id", "dept_code", "name", "head_employee_id"], dept_rows)
        w.emit("programs", ["program_id", "department_id", "program_code", "name", "degree_level", "duration_years", "total_credits"], prog_rows)
        w.emit("academic_terms", ["term_id", "term_code", "academic_year", "term_label", "start_date", "end_date", "is_current"], term_rows)
        w.emit("designations", ["designation_id", "title", "level_no"], DESIG)
        w.emit("employees", ["employee_id", "full_name", "gender", "email", "phone", "department_id", "designation_id", "emp_type", "joining_date", "status"],
               [(e["id"], e["name"], e["gender"], e["email"], e["phone"], e["dept"] + 1, e["desig"], e["type"], e["join"], e["status"]) for e in employees])
        w.emit("students", ["student_id", "full_name", "gender", "dob", "email", "phone", "city", "state", "program_id", "batch_year", "current_semester", "status", "admission_date"],
               [(s["id"], s["name"], s["gender"], s["dob"], s["email"], s["phone"], s["city"], s["state"], s["prog"] + 1, s["batch"], s["sem"], s["status"], s["adm"]) for s in students])
        w.emit("users", ["user_id", "username", "email", "password_hash", "role_id", "student_id", "employee_id", "status", "failed_attempts", "last_login", "created_at"], users)
        w.emit("user_permission_sets", ["user_id", "permission_set_id"], perm_links)
        w.emit("courses", ["course_id", "course_code", "title", "credits", "department_id", "course_type", "is_active"], courses)
        w.emit("curriculum_mapping", ["curriculum_id", "program_id", "semester", "course_id", "category"], curriculum)
        w.emit("course_offerings", ["offering_id", "term_id", "course_id", "faculty_id", "section", "capacity"],
               [(o["id"], o["term"], o["course"], o["fac"], o["sec"], 70) for o in offerings])
        w.emit("enrollments", ["enrollment_id", "student_id", "offering_id", "status", "enrolled_on", "withdrawn_on", "withdrawal_reason"],
               [(e["id"], e["s"]["id"], e["o"]["id"], e["status"], e["on"], e["wd"], e["why"]) for e in enrollments])
        w.emit("bulk_enrollment_batches", ["batch_id", "run_by_user_id", "program_id", "term_id", "semester", "source_format", "total_rows", "enrolled_count", "skipped_count", "failed_count", "run_at"], bulk)
        w.emit("bulk_enrollment_rejects", ["reject_id", "batch_id", "row_no", "student_id", "offering_id", "reason"], rejects)
        w.emit("grade_scale", ["grade", "min_marks", "max_marks", "grade_points"], [(g, float(lo), float(hi), gp) for g, lo, hi, gp in GRADES])
        w.emit("attendance_sessions", ["session_id", "offering_id", "session_date", "slot", "marked_by"], sessions)
        w.emit("attendance_records", ["session_id", "enrollment_id", "status"], att_rows, batch=1000)
        w.emit("exams", ["exam_id", "offering_id", "exam_type", "exam_date", "max_marks", "reg_open", "reg_close"], exams)
        w.emit("exam_registrations", ["registration_id", "exam_id", "enrollment_id", "status", "registered_at"], regs)
        w.emit("exam_registration_attempts", ["attempt_id", "exam_id", "enrollment_id", "outcome", "attendance_pct", "reason", "attempted_at"], attempts)
        w.emit("exam_marks", ["registration_id", "marks_obtained", "grade", "grade_points", "is_published", "entered_by", "entered_at", "published_at"], marks)
        w.emit("semester_results", ["result_id", "student_id", "term_id", "credits_registered", "credits_earned", "sgpa", "cgpa", "published_at"], sem_results)
        w.emit("fee_structures", ["structure_id", "program_id", "term_id", "component", "amount", "due_date"], fs_rows)
        w.emit("late_fee_rules", ["rule_id", "rule_name", "penalty_type", "rate", "grace_days", "max_penalty", "effective_from", "is_active"], late_rules)
        w.emit("student_fees", ["fee_id", "student_id", "structure_id", "amount_due", "amount_paid", "status", "due_date"], fee_rows)
        w.emit("payments", ["payment_id", "student_id", "amount", "late_fee", "mode", "status", "paid_at", "reference_no", "recorded_by_user_id"], pay_rows)
        w.emit("payment_allocations", ["allocation_id", "payment_id", "fee_id", "amount_applied"], alloc_rows)
        w.emit("receipts", ["receipt_id", "receipt_no", "payment_id", "issued_at", "total_amount"], rcpt_rows)
        w.emit("fee_audit_log", ["audit_id", "structure_id", "field_name", "old_value", "new_value", "action", "changed_by_user_id", "changed_at"], faudit)
        w.emit("leave_types", ["leave_type_id", "code", "name", "annual_quota", "carry_forward_max", "is_paid"], lt_rows)
        w.emit("leave_entitlements", ["employee_id", "leave_type_id", "leave_year", "quota"], ent_rows)
        w.emit("leave_applications", ["leave_id", "employee_id", "leave_type_id", "from_date", "to_date", "days", "reason", "status", "applied_at", "decided_by_user_id", "decided_at", "remark"], leaves)
        w.emit("salary_structures", ["structure_id", "designation_id", "basic", "hra_pct", "da_pct", "pf_pct", "professional_tax"], sal_rows)
        w.emit("payroll_runs", ["run_id", "pay_year", "pay_month", "status", "run_at", "finalized_at", "run_by_user_id"], runs)
        w.emit("payslips", ["payslip_id", "run_id", "employee_id", "basic", "hra", "da", "gross", "pf", "professional_tax", "unpaid_leave_days", "leave_deduction", "total_deductions", "net_pay"], slips)
        w.emit("hostels", ["hostel_id", "name", "hostel_type", "total_capacity", "warden_employee_id"], hostel_rows)
        w.emit("rooms", ["room_id", "hostel_id", "room_no", "floor_no", "bed_capacity", "available_beds"], room_rows)
        w.emit("hostel_allocations", ["allocation_id", "student_id", "room_id", "from_date", "to_date", "status"], alloc)
        w.emit("hostel_requests", ["request_id", "student_id", "request_type", "details", "status", "requested_at", "decided_by_user_id", "decided_at", "remark"], hreq)
        w.emit("audit_log", ["audit_id", "actor_user_id", "action", "entity", "entity_id", "old_value", "new_value", "created_at"], audit)
        for i, hid in enumerate(heads, start=1):
            f.write(f"UPDATE departments SET head_employee_id='{hid}' WHERE department_id={i};\n")
        f.write("COMMIT;\n")
    print(f"Wrote {a.out}")
    for t, c in w.counts.items(): print(f"  {t:30s}{c:>9,}")

if __name__ == "__main__":
    main()
