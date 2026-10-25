import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_full_report(output_filename="CampusOS_DBMS_Mini_Project_Report_Module3.docx"):
    doc = docx.Document()

    # Define color palette
    COLOR_PRIMARY = RGBColor(15, 23, 42)       # Slate 900
    COLOR_TEXT = RGBColor(30, 41, 59)          # Slate 800
    COLOR_MUTED = RGBColor(100, 116, 139)      # Slate 500
    COLOR_ACCENT = RGBColor(37, 99, 235)       # Blue 600

    # -------------------------------------------------------------
    # Helper Functions for Page Setup & Typography
    # -------------------------------------------------------------
    def configure_section(sec, top=1.0, bottom=1.0, left=1.0, right=0.75):
        sec.page_width = Inches(8.27)   # A4 width
        sec.page_height = Inches(11.69) # A4 height
        sec.top_margin = Inches(top)
        sec.bottom_margin = Inches(bottom)
        sec.left_margin = Inches(left)
        sec.right_margin = Inches(right)

    def set_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=COLOR_TEXT):
        run.font.name = name
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, line_spacing=1.5, bold=False, italic=False, size=12):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            set_font(r, size=size, bold=bold, italic=italic)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        set_font(r, size=14, bold=True, color=COLOR_PRIMARY)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        set_font(r, size=13, bold=True, color=COLOR_PRIMARY)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        set_font(r, size=12, bold=True, color=COLOR_PRIMARY)
        return p

    def add_table_caption(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        set_font(r, size=10, bold=False, italic=True)
        return p

    def add_figure_caption(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(text)
        set_font(r, size=10, bold=False, italic=True)
        return p

    def format_table(table, col_widths, headers, data, align_cols=None):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Borders XML
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(
            r'<w:tblBorders %s>'
            r'  <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            r'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
            r'  <w:left w:val="none"/>'
            r'  <w:right w:val="none"/>'
            r'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            r'  <w:insideV w:val="none"/>'
            r'</w:tblBorders>' % nsdecls('w')
        )
        tblPr.append(tblBorders)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            hdr_cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            hdr_cells[i].paragraphs[0].paragraph_format.space_before = Pt(3)
            hdr_cells[i].paragraphs[0].paragraph_format.space_after = Pt(3)
            hdr_cells[i].paragraphs[0].paragraph_format.line_spacing = 1.0
            r = hdr_cells[i].paragraphs[0].runs[0]
            set_font(r, size=10, bold=True, color=COLOR_PRIMARY)
            
            # Header cell background
            shading = parse_xml(r'<w:shd %s w:fill="F1F5F9"/>' % nsdecls('w'))
            hdr_cells[i]._tc.get_or_add_tcPr().append(shading)

        # Data Rows
        for row_idx, row_data in enumerate(data):
            row_cells = table.add_row().cells
            for col_idx, val in enumerate(row_data):
                row_cells[col_idx].text = str(val)
                p = row_cells[col_idx].paragraphs[0]
                align = WD_ALIGN_PARAGRAPH.LEFT
                if align_cols and col_idx < len(align_cols):
                    align = align_cols[col_idx]
                p.alignment = align
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.05
                r = p.runs[0]
                set_font(r, size=9.5)
                
                # Alternate row shading
                if row_idx % 2 == 1:
                    shading = parse_xml(r'<w:shd %s w:fill="F8FAFC"/>' % nsdecls('w'))
                    row_cells[col_idx]._tc.get_or_add_tcPr().append(shading)

        # Apply Column Widths
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.52)
        shading = parse_xml(r'<w:shd %s w:fill="F8FAFC"/>' % nsdecls('w'))
        borders = parse_xml(
            r'<w:tcBorders %s>'
            r'  <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            r'  <w:left w:val="single" w:sz="18" w:space="0" w:color="3B82F6"/>'
            r'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            r'  <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            r'</w:tcBorders>' % nsdecls('w')
        )
        cell._tc.get_or_add_tcPr().append(shading)
        cell._tc.get_or_add_tcPr().append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(code_text.strip())
        set_font(r, name="Consolas", size=8.5, color=RGBColor(30, 41, 59))
        p2 = doc.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(4)

    def add_page_number_to_run(run):
        fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        run._r.append(fldChar1)
        run._r.append(instrText)
        run._r.append(fldChar2)
        run._r.append(fldChar3)

    # -------------------------------------------------------------
    # SECTION 1: FRONT MATTER (No Page Numbers: Cover, Cert, Ack)
    # -------------------------------------------------------------
    sec1 = doc.sections[0]
    configure_section(sec1)
    sec1.different_first_page_header_footer = False
    sec1.header.is_linked_to_previous = False
    sec1.footer.is_linked_to_previous = False

    # COVER PAGE
    add_p("PUNE INSTITUTE OF COMPUTER TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4, bold=True, size=15)
    add_p("DEPARTMENT OF ELECTRONICS AND TELECOMMUNICATION ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18, bold=True, size=13)
    add_p("PUNE – 411043", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=28, bold=True, size=12)

    add_p("ACADEMIC YEAR: 2026 – 2027", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, bold=True, size=12)

    add_p("A MINI PROJECT REPORT ON", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=8, italic=True, size=12)
    add_p("“CampusOS: University Higher Education ERP System”", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=6, bold=True, size=16)
    add_p("Subsystem: Module 03 – Examinations and Results Management", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=28, bold=True, size=13)

    add_p("SUBMITTED BY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=8, italic=True, size=11)
    
    # Students Table
    st_table = doc.add_table(rows=1, cols=3)
    format_table(st_table, [2.5, 2.0, 2.0], ["Name of Student", "Exam Seat No.", "Roll No."], [
        ["Student 1", "T190058501", "31101"],
        ["Student 2", "T190058502", "31102"],
        ["Student 3", "T190058503", "31103"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    add_p("", space_before=16, space_after=0)
    add_p("UNDER THE GUIDANCE OF", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, italic=True, size=11)
    add_p("Dr. S. V. Gaikwad", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, bold=True, size=13)
    add_p("Project Guide & Head of Department", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, italic=True, size=11)

    add_p("IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE COURSE OF", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, size=10)
    add_p("DATABASE MANAGEMENT SYSTEMS (DBMS)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, bold=True, size=12)
    add_p("THIRD YEAR BACHELOR OF TECHNOLOGY (TY B.TECH)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0, bold=True, size=11)

    # PAGE BREAK TO CERTIFICATE
    doc.add_page_break()

    # CERTIFICATE
    add_p("DEPARTMENT OF ELECTRONICS AND TELECOMMUNICATION ENGINEERING", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, bold=True, size=13)
    add_p("PUNE INSTITUTE OF COMPUTER TECHNOLOGY, PUNE – 411043", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18, bold=True, size=12)
    add_p("CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=20, bold=True, size=16)

    cert_text = (
        "This is to certify that the Mini Project Report entitled “CampusOS: University Higher Education ERP "
        "System – Examinations & Results Subsystem” has been successfully completed and submitted by "
        "Student 1 (Exam No. T190058501), Student 2 (Exam No. T190058502), and Student 3 (Exam No. T190058503) "
        "as a bona fide work carried out by them under the supervision of Dr. S. V. Gaikwad. It is approved for "
        "the partial fulfillment of the requirements for the Database Management Systems Course of TY B.Tech "
        "in Electronics & Telecommunication Engineering, Pune Institute of Computer Technology, Pune, affiliated "
        "to Savitribai Phule Pune University during the Academic Year 2026–2027."
    )
    add_p(cert_text, space_before=0, space_after=32)

    cert_tbl = doc.add_table(rows=1, cols=2)
    cert_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_cells = cert_tbl.rows[0].cells
    c_cells[0].width = Inches(3.26)
    c_cells[1].width = Inches(3.26)
    c_cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
    c_cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    r1 = c_cells[0].paragraphs[0].add_run("Dr. S. V. Gaikwad\nProject Guide\nDept. of E&TC, PICT")
    set_font(r1, size=11, bold=True)
    r2 = c_cells[1].paragraphs[0].add_run("Dr. S. V. Gaikwad\nHead of Department (HOD)\nDept. of E&TC, PICT")
    set_font(r2, size=11, bold=True)

    add_p("", space_before=24, space_after=0)
    add_p("Place: Pune\nDate: 26th October 2026", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=0, bold=True, size=11)

    # PAGE BREAK TO ACKNOWLEDGEMENT
    doc.add_page_break()

    # ACKNOWLEDGEMENT
    add_p("ACKNOWLEDGEMENT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=20, bold=True, size=15)
    ack_text1 = (
        "We express our deepest gratitude to our project guide and Head of Department, Dr. S. V. Gaikwad, "
        "Department of Electronics and Telecommunication Engineering, Pune Institute of Computer Technology, "
        "for his invaluable guidance, technical insights, and continuous encouragement throughout the conception, "
        "architectural design, and implementation of this Database Management Systems Mini-Project."
    )
    ack_text2 = (
        "We extend our sincere thanks to our course coordinator Mr. L. P. Patil and the faculty members of "
        "the DBMS laboratory for providing the foundational understanding of advanced relational database design, "
        "transaction management, stored programmability, and query optimization principles. Their rigorous academic "
        "benchmarks helped us build an enterprise-grade ERP subsystem complying with Third Normal Form (3NF) relational "
        "discipline and strict ACID guarantees."
    )
    ack_text3 = (
        "We also appreciate our peer sub-groups across the CampusOS engineering team for their seamless collaboration "
        "in establishing robust foreign key contracts, cross-module synchronization protocols, and integration stubs. "
        "Finally, we thank our parents and colleagues who extended their constant support throughout this project."
    )
    add_p(ack_text1, space_before=0, space_after=10)
    add_p(ack_text2, space_before=0, space_after=10)
    add_p(ack_text3, space_before=0, space_after=24)

    add_p("Student 1 (Exam No. T190058501)\nStudent 2 (Exam No. T190058502)\nStudent 3 (Exam No. T190058503)", align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=0, space_after=0, bold=True, size=11)

    # -------------------------------------------------------------
    # SECTION 2: PRELIMINARY PAGES (Roman numerals: i, ii, iii, iv, v)
    # -------------------------------------------------------------
    sec2 = doc.add_section()
    configure_section(sec2)
    sec2.header.is_linked_to_previous = False
    sec2.footer.is_linked_to_previous = False

    # Set roman page number formatting
    pgNumType = parse_xml(r'<w:pgNumType %s w:fmt="lowerRoman" w:start="1"/>' % nsdecls('w'))
    sec2._sectPr.append(pgNumType)

    # Add Roman page number to footer
    footer2 = sec2.footer.paragraphs[0]
    footer2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rf2 = footer2.add_run()
    set_font(rf2, size=10)
    add_page_number_to_run(rf2)

    # ABSTRACT
    add_p("ABSTRACT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=16, bold=True, size=15)
    abstract_text = (
        "CampusOS is an enterprise-grade, web-based University Higher Education Enterprise Resource Planning (ERP) "
        "platform developed to unify disparate academic and administrative workflows across higher education institutions "
        "into a robust, polyglot relational-document architecture. This report documents the architectural design, formal "
        "normalization, stored programmability, and system integration of Module 03: Examinations and Results Management Subsystem.\n\n"
        "The subsystem governs the complete lifecycle of university examinations, encompassing examination scheduling, "
        "automated hall-ticket generation, dynamic eligibility gating, marks capture, UGC-compliant grading, and semester "
        "GPA (SGPA) and cumulative GPA (CGPA) compilation. A pivotal business integrity constraint is enforced at the database "
        "kernel level: student exam registration is strictly barred if course attendance falls below the mandatory 75% threshold, "
        "implemented via an authoritative BEFORE INSERT trigger. Advanced MySQL programmability—including deterministic "
        "User-Defined Functions (UDFs) for credit-weighted GPA calculation, stored procedures managing transactional bulk "
        "registrations with custom exception handlers, and audit triggers tracking historical grade revisions—guarantees "
        "strict data integrity independently of external application logic. A secondary MongoDB document store manages "
        "semi-structured revaluation workflows and broadcast notifications. Extensive negative boundary testing, concurrency "
        "validation, and cross-module foreign key alignment prove that the subsystem meets enterprise performance and compliance standards."
    )
    add_p(abstract_text, space_before=0, space_after=18)
    add_p("Keywords: Database Management Systems (DBMS), Enterprise Resource Planning (ERP), Relational Integrity, Third Normal Form (3NF), Attendance Gating, Stored Procedures, Database Triggers, User-Defined Functions, Polyglot Persistence, UGC Grade Scale.", space_before=0, space_after=16, bold=True, size=10)

    add_p("Student 1          |          Student 2          |          Student 3", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0, bold=True, size=11)

    # PAGE BREAK TO LIST OF FIGURES
    doc.add_page_break()

    # LIST OF FIGURES
    add_p("LIST OF FIGURES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=16, bold=True, size=15)
    fig_table = doc.add_table(rows=1, cols=3)
    format_table(fig_table, [1.2, 4.3, 1.0], ["Figure No.", "Figure Caption", "Page No."], [
        ["Figure 1.1", "Enterprise System Architecture of CampusOS ERP Platform", "2"],
        ["Figure 1.2", "Master Enterprise Entity-Relationship (E-R) Diagram", "4"],
        ["Figure 1.3", "Master System Context Diagram (Level 0 DFD)", "6"],
        ["Figure 2.1", "Module 03 Data Flow Diagram (Level 1 DFD) – Examination Lifecycle", "12"],
        ["Figure 2.2", "Module 03 Data Flow Diagram (Level 2 DFD) – Results Processing Engine", "14"],
        ["Figure 2.3", "Module 03 Sub-Schema Relational Structural Diagram", "18"],
        ["Figure 2.4", "Execution Proof: Trigger exm_trg_registration_bi_attendance Block Event", "26"],
        ["Figure 2.5", "Execution Proof: Stored Procedure exm_sp_bulk_register Transaction Log", "28"],
        ["Figure 2.6", "Execution Proof: Stored Procedure exm_sp_generate_results Result Compilation", "30"],
        ["Figure 2.7", "Execution Proof: Function exm_fn_calculate_cgpa Output Validation", "32"],
        ["Figure 2.8", "Analytical View Output: Departmental Merit Ranking (exm_vw_topper_list)", "35"],
        ["Figure 3.1", "Cross-Module Stub Integration Architecture and Synchronization Pipeline", "38"],
        ["Figure 3.2", "Complete Test Suite Execution Trace Across Constraints T1–T14", "43"]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    # PAGE BREAK TO LIST OF TABLES
    doc.add_page_break()

    # LIST OF TABLES
    add_p("LIST OF TABLES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=16, bold=True, size=15)
    tbl_table = doc.add_table(rows=1, cols=3)
    format_table(tbl_table, [1.2, 4.3, 1.0], ["Table No.", "Table Caption", "Page No."], [
        ["Table 1.1", "CampusOS Core Modules and Primary Functional Boundaries", "3"],
        ["Table 1.2", "Enterprise Role-Based Access Control (RBAC) Entitlements Matrix", "5"],
        ["Table 1.3", "Functional Dependencies and 3NF Normalization Decomposition", "8"],
        ["Table 1.4", "System Hardware and Software Specifications", "9"],
        ["Table 1.5", "Global Data Dictionary and Cross-Module Key Conventions", "10"],
        ["Table 2.1", "Examination Subsystem Role Privileges Specification", "11"],
        ["Table 2.2", "UGC-Compliant Standard 10-Point Absolute Grade Scale Configuration", "16"],
        ["Table 2.3", "Data Dictionary: exm_grade_scale", "19"],
        ["Table 2.4", "Data Dictionary: exm_exam", "19"],
        ["Table 2.5", "Data Dictionary: exm_schedule", "20"],
        ["Table 2.6", "Data Dictionary: exm_registration", "20"],
        ["Table 2.7", "Data Dictionary: exm_marks", "21"],
        ["Table 2.8", "Data Dictionary: exm_result", "21"],
        ["Table 2.9", "Data Dictionary: exm_semester_result", "22"],
        ["Table 2.10", "Data Dictionary: exm_marks_audit", "22"],
        ["Table 2.11", "Data Dictionary: exm_registration_block_log", "23"],
        ["Table 2.12", "MongoDB Collections Schema Definition", "23"],
        ["Table 3.1", "Cross-Module Synchronization API Contract", "39"],
        ["Table 3.2", "Master Integration Verification Test Results (T1 to T14)", "42"]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    # PAGE BREAK TO ABBREVIATIONS
    doc.add_page_break()

    # ABBREVIATIONS
    add_p("ABBREVIATIONS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=16, bold=True, size=15)
    abb_table = doc.add_table(rows=1, cols=3)
    format_table(abb_table, [1.3, 3.7, 1.5], ["Symbol / Acronym", "Meaning", "Remark"], [
        ["DBMS", "Database Management System", "Core academic course"],
        ["RDBMS", "Relational Database Management System", "MySQL 8.4 LTS InnoDB"],
        ["3NF", "Third Normal Form", "E.F. Codd Relational Model"],
        ["BCNF", "Boyce-Codd Normal Form", "Advanced Normal Form"],
        ["FD", "Functional Dependency", "Integrity constraint (X -> Y)"],
        ["ERD", "Entity-Relationship Diagram", "Crow's foot semantic notation"],
        ["DFD", "Data Flow Diagram", "Gane-Sarson / Yourdon notation"],
        ["UDF", "User-Defined Function", "Deterministic SQL function"],
        ["SP", "Stored Procedure", "Procedural database routine"],
        ["ACID", "Atomicity, Consistency, Isolation, Durability", "Transaction integrity model"],
        ["SGPA", "Semester Grade Point Average", "Term performance index"],
        ["CGPA", "Cumulative Grade Point Average", "Career performance index"],
        ["RBAC", "Role-Based Access Control", "Authorization security model"],
        ["UGC", "University Grants Commission", "Statutory academic authority"],
        ["AICTE", "All India Council for Technical Education", "Regulatory technical authority"],
        ["REST", "Representational State Transfer", "Stateless HTTP API"],
        ["JWT", "JSON Web Token", "Session credential format"],
        ["DDL", "Data Definition Language", "CREATE, ALTER, DROP"],
        ["DML", "Data Manipulation Language", "SELECT, INSERT, UPDATE"],
        ["COE", "Controller of Examinations", "Administrative role"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    # PAGE BREAK TO TABLE OF CONTENTS
    doc.add_page_break()

    # TABLE OF CONTENTS / INDEX
    add_p("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=16, bold=True, size=15)
    toc_table = doc.add_table(rows=1, cols=3)
    format_table(toc_table, [1.0, 4.5, 1.0], ["Chapter", "Section Title", "Page No."], [
        ["", "Abstract", "i"],
        ["", "List of Figures", "ii"],
        ["", "List of Tables", "iii"],
        ["", "Abbreviations", "iv"],
        ["", "Table of Contents", "v"],
        ["1", "SYSTEM OVERVIEW & COMMON ARCHITECTURE", "1"],
        ["", "1.1 Introduction & Overall Project Scope", "1"],
        ["", "1.2 Overall Enterprise ER Diagram", "3"],
        ["", "1.3 Master System Context Diagram (Level 0 DFD)", "5"],
        ["", "1.3.1 Enterprise System Boundary, External Actors & Top-Level Data Flows", "6"],
        ["", "1.4 Master Database Relational Schema & Normalization (3NF)", "7"],
        ["", "1.5 Hardware & Software Requirements Specification", "9"],
        ["", "1.6 Global Data Dictionary & Cross-Module Key Standards", "10"],
        ["2", "MODULE IMPLEMENTATION & PROGRAMMABILITY", "11"],
        ["", "2.1 Module Scope & Business Rules", "11"],
        ["", "2.2 Module Data Flow Diagram (Level 1 / Level 2 DFD)", "13"],
        ["", "2.2.1 Sub-System Processes, Data Stores, and External Movement", "14"],
        ["", "2.3 Sub-Schema & Relational Data Dictionary", "17"],
        ["", "2.4 Advanced SQL Implementation", "23"],
        ["", "2.4.1 Stored Procedures (SQL Code & Execution Proofs)", "24"],
        ["", "2.4.2 Database Triggers (SQL Code & Execution Proofs)", "29"],
        ["", "2.4.3 User-Defined Functions (UDFs) (SQL Code & Execution Proofs)", "32"],
        ["", "2.5 Complex Analytical Queries & Views", "34"],
        ["3", "SYSTEM INTEGRATION, TESTING & CONCLUSION", "37"],
        ["", "3.1 Cross-Module Foreign Key Alignment & Master Script Execution", "37"],
        ["", "3.2 Constraint, Edge-Case & Transaction Validation Testing", "40"],
        ["", "3.3 Conclusion & Future Enhancements", "44"],
        ["", "3.4 References", "45"]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    # -------------------------------------------------------------
    # SECTION 3: CHAPTERS (Arabic numerals: 1, 2, 3...)
    # -------------------------------------------------------------
    sec3 = doc.add_section()
    configure_section(sec3)
    sec3.header.is_linked_to_previous = False
    sec3.footer.is_linked_to_previous = False

    # Set arabic page number formatting starting at 1
    pgNumType3 = parse_xml(r'<w:pgNumType %s w:fmt="decimal" w:start="1"/>' % nsdecls('w'))
    sec3._sectPr.append(pgNumType3)

    # Header with title
    hdr3 = sec3.header.paragraphs[0]
    hdr3.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rh3 = hdr3.add_run("CampusOS: DBMS Mini-Project Report | Module 03: Examinations & Results")
    set_font(rh3, size=8.5, color=COLOR_MUTED, italic=True)

    # Footer with Arabic page number
    footer3 = sec3.footer.paragraphs[0]
    footer3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rf3 = footer3.add_run()
    set_font(rf3, size=10)
    add_page_number_to_run(rf3)

    # =============================================================
    # CHAPTER 1
    # =============================================================
    add_h1("CHAPTER 1: SYSTEM OVERVIEW & COMMON ARCHITECTURE")
    
    add_h2("1.1 Introduction & Overall Project Scope")
    intro_p1 = (
        "Modern higher education institutes operate complex ecosystems comprising academic programs, course catalogs, "
        "session attendance monitoring, continuous evaluation, semester end-examinations, revenue collection, staff payroll, "
        "and campus facilities. Traditional universities frequently suffer from fragmented departmental software silos, resulting "
        "in data inconsistency, conflicting student records, vulnerability to grade tampering, and asynchronous fee/attendance gating."
    )
    intro_p2 = (
        "CampusOS is an integrated, full-stack Higher Education Enterprise Resource Planning (ERP) platform developed for technical "
        "institutes. The architectural objective is to establish the relational database management system as the single source of truth "
        "for operational and financial integrity. Rather than relying on external web server application logic to enforce critical institutional "
        "policies, CampusOS encapsulates business integrity rules—such as student attendance thresholds for exam eligibility, idempotent fee "
        "generation, transactional room allotment, and credit-weighted SGPA/CGPA evaluation—directly inside the MySQL database engine via "
        "declarative constraints, database triggers, user-defined functions, and ACID-compliant stored procedures."
    )
    add_p(intro_p1)
    add_p(intro_p2)

    add_table_caption("Table 1.1: CampusOS Core Modules and Primary Functional Boundaries")
    t1_tbl = doc.add_table(rows=1, cols=3)
    format_table(t1_tbl, [1.2, 1.8, 3.5], ["Module Code", "Module Designation", "Functional Domain & Architectural Boundaries"], [
        ["M1", "Core Platform", "Identity management, RBAC, departments, degree programs, academic terms, and centralized student/staff master directories."],
        ["M2", "Academics & Enrollment", "Course catalogs, curriculum matrices, term offerings, sections, and automated cohort-level bulk student course enrollments."],
        ["M3", "Examinations & Results", "Exam session scheduling, attendance eligibility gating (>= 75%), hall ticket allocation, marks processing, and SGPA/CGPA compilation."],
        ["M4", "Finance & Fees", "Dynamic term fee structures, automated fee assignment, payment processing, late-fee penalty calculation, and immutable fee auditing."],
        ["M5", "HR, Leave & Payroll", "Employee directories, designation hierarchies, faculty leave balance tracking, and monthly salary disbursement with net deductions."],
        ["M6", "Hostel Management", "Hostel blocks, room inventories, bed capacity management, student allocation workflows, and room change requests."],
        ["M7", "Analytics & Audit", "Cross-module materialized reporting, window-partitioned merit rankings, attendance shortage logs, and centralized audit trails."]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    add_p("", space_before=6, space_after=0)
    add_code_block(
        "+-------------------------------------------------------------------------+\n"
        "|                        M1: CORE PLATFORM                                |\n"
        "|           (Master Data, User Accounts, Term Lifecycles, RBAC)           |\n"
        "+-----------------------------------+-------------------------------------+\n"
        "                                    |\n"
        "         +--------------------------+--------------------------+\n"
        "         |                                                     |\n"
        "         v                                                     v\n"
        "+------------------------------+             +------------------------------+\n"
        "|        M2: ACADEMICS         |             |   M5: HR, LEAVE & PAYROLL    |\n"
        "| (Courses, Offerings, Enrol)  |             | (Employees, Leave, Salaries) |\n"
        "+--------------+---------------+             +------------------------------+\n"
        "               |\n"
        "      +--------+--------+\n"
        "      |                 |\n"
        "      v                 v\n"
        "+---------------+ +---------------+ +---------------+ +---------------------+\n"
        "|   M3: EXAMS   | |  M4: FINANCE  | |  M6: HOSTEL   | |    M7: ANALYTICS    |\n"
        "|  (Attendance  | | (Structures,  | | (Rooms, Beds, | | (Rankings, Shortage |\n"
        "|  Block, CGPA) | |  Invoices)    | |  Allocations) | |  Materialized Views)|\n"
        "+---------------+ +---------------+ +---------------+ +---------------------+"
    )
    add_figure_caption("Figure 1.1: Enterprise System Architecture of CampusOS ERP Platform")

    add_h2("1.2 Overall Enterprise ER Diagram")
    add_p(
        "The CampusOS relational schema is modeled to eliminate data redundancy, prevent modification anomalies, and enforce "
        "referential integrity via declarative foreign key relationships. The complete enterprise schema incorporates over 25 core "
        "entities spanning academic, administrative, and logistical domains."
    )
    add_p(
        "Key relationships include:\n"
        "1. Department to Program & Employee: 1-to-many relationship establishing departmental academic and organizational hierarchy.\n"
        "2. Student to Enrollment: 1-to-many relationship connecting student admissions to term-specific course offerings.\n"
        "3. Course Offering to Attendance & Exam: Academic sessions generate attendance records; course offerings spawn scheduled examinations.\n"
        "4. Exam Registration to Marks & Results: Registrations link students to verified marks, which compute compiled term results.\n"
        "5. Fee Structures to Student Fees & Receipts: Fee invoices connect to payment receipts generating financial audit trails.\n"
        "6. Hostel Blocks to Rooms & Allocations: Tracks room inventory and active bed occupancy."
    )

    add_table_caption("Table 1.2: Enterprise Role-Based Access Control (RBAC) Entitlements Matrix")
    t2_tbl = doc.add_table(rows=1, cols=4)
    format_table(t2_tbl, [2.5, 1.3, 1.3, 1.4], ["System Feature / Operation", "Admin (COE)", "Faculty", "Student"], [
        ["Manage Master Entities (Dept, Term, Program)", "Full Read/Write", "Read-Only", "Read-Only"],
        ["Define Course Catalog & Term Offerings", "Full Read/Write", "Read-Only", "Read-Only"],
        ["Mark Course Session Attendance", "Override / Write", "Write (Assigned)", "Forbidden"],
        ["View Course Attendance Records", "Global Read", "Read (Assigned)", "Read (Self Only)"],
        ["Schedule Examinations & Registration Windows", "Full Read/Write", "Read-Only", "Read-Only"],
        ["Register for Course Examination", "Bulk Execution", "Forbidden", "Write (Self Only)"],
        ["Enter & Revise Student Examination Marks", "Full Override", "Write (Dept)", "Forbidden"],
        ["Generate & Publish Semester Grade Cards", "Full Read/Write", "Read-Only", "Read-Only"],
        ["View Transcript & Semester Result", "Global Read", "Read (Dept)", "Read (Self Only)"],
        ["Submit Revaluation Application", "Review / Decide", "Read-Only", "Write (Self Only)"],
        ["Run Institutional Analytic Merit Reports", "Full Access", "Limited (Courses)", "Forbidden"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    add_h2("1.3 Master System Context Diagram (Level 0 DFD)")
    add_p(
        "The Level 0 Data Flow Diagram defines the enterprise boundary of CampusOS, identifying all external entities interacting "
        "with the centralized system and the primary informational inputs and outputs flowing across system boundaries."
    )

    add_h3("1.3.1 Enterprise System Boundary, External Actors & Top-Level Data Flows")
    add_p(
        "External actors include:\n"
        "• University Administrator / Controller of Examinations (COE): Injects institutional curriculum, defines academic terms, "
        "configures examination schedules, oversees result generation, and inspects analytical audits.\n"
        "• Faculty / Instructor: Submits course attendance records, enters internal and term examination marks, and accesses class rosters.\n"
        "• Candidate / Student: Submits course exam registrations, tracks ongoing attendance percentages, downloads verified hall tickets, "
        "views published grade cards, and raises revaluation requests."
    )

    add_code_block(
        "       [ UNIVERSITY ADMINISTRATOR / COE ]\n"
        "          |                     ^\n"
        "          | (Master Config,     | (Institutional Reports,\n"
        "          |  Exam Schedules,    |  Defaulter Lists,\n"
        "          |  Grade Approval)    |  Audit Trails)\n"
        "          v                     |\n"
        "    +-------------------------------------------------------+\n"
        "    |                                                       |\n"
        "    |                       CampusOS                        |\n"
        "    |          HIGHER EDUCATION ERP SYSTEM DATABASE         |\n"
        "    |                     (Level 0 DFD)                     |\n"
        "    |                                                       |\n"
        "    +-------------------------------------------------------+\n"
        "          |         ^                     ^           |\n"
        "          |         | (Course Rosters,    | (Grades,  | (Hall Tickets,\n"
        "          | (Marks  |  Session Logs,      |  Exam     |  Transcripts,\n"
        "          |  Logs,  |  Leave Apps)        |  Reqs,    |  Fee Invoices,\n"
        "          |  Attend)|                     |  Payments)|  Receipts)\n"
        "          v         |                     |           v\n"
        "        [ FACULTY / INSTRUCTOR ]       [ REGISTERED STUDENT ]"
    )
    add_figure_caption("Figure 1.3: Master System Context Diagram (Level 0 DFD)")

    add_h2("1.4 Master Database Relational Schema & Normalization (3NF)")
    add_p(
        "Relational normalization is critical in enterprise ERP databases to prevent insertion, deletion, and modification anomalies. "
        "Every table in CampusOS has been systematically designed to satisfy Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF)."
    )
    add_p(
        "Formal Normalization Process:\n"
        "1. First Normal Form (1NF): Achieved by ensuring that all column attributes contain atomic, indivisible values with no "
        "repeating groups. Arrays of marks or multiple session logs are extracted into dedicated child relations.\n"
        "2. Second Normal Form (2NF): Achieved by verifying that every non-prime attribute is fully functionally dependent on the primary "
        "key, eliminating partial dependencies. In composite entities like exm_registration(schedule_id, student_id), attributes belonging "
        "exclusively to the schedule (e.g. course_id, exam_date) are segregated into exm_schedule.\n"
        "3. Third Normal Form (3NF): Achieved by eliminating transitive functional dependencies (X -> Y -> Z). For instance, in "
        "evaluating student grades, storing letter grade, grade points, and percentage in exm_result creates a transitive dependency "
        "(result_id -> percentage -> grade -> grade_points). To resolve this, exm_grade_scale was decomposed into a distinct relation, "
        "with exm_result maintaining a clean foreign key to the grade scale."
    )

    add_table_caption("Table 1.3: Functional Dependencies and 3NF Normalization Decomposition")
    t3_tbl = doc.add_table(rows=1, cols=4)
    format_table(t3_tbl, [1.5, 2.3, 1.0, 1.7], ["Relation Name", "Functional Dependencies (FDs)", "Normal Form", "Decomposition Rationale"], [
        ["exm_grade_scale", "grade -> min_pct, max_pct, grade_points", "BCNF", "Determinant is the primary superkey."],
        ["exm_exam", "exam_id -> exam_name, academic_year, semester, dates", "BCNF", "All determinants are candidate superkeys."],
        ["exm_schedule", "schedule_id -> exam_id, course_id, max_marks, passing_marks", "BCNF", "Course & exam details isolated."],
        ["exm_registration", "registration_id -> schedule_id, student_id, hall_ticket_no", "BCNF", "Candidate keys are superkeys."],
        ["exm_marks", "marks_id -> registration_id, marks_obtained, is_absent", "BCNF", "Single-attribute PK; 1-to-1 with reg."],
        ["exm_result", "result_id -> student_id, course_id, marks, grade, status", "3NF", "Grade scale decomposed to avoid transitive FD."],
        ["exm_semester_result", "(student_id, year, sem) -> total_credits, sgpa, cgpa", "BCNF", "Composite primary key determinant."]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    add_h2("1.5 Hardware & Software Requirements Specification")
    add_p(
        "The hardware and software specifications for development, testing, and production deployment are summarized in Table 1.4."
    )

    add_table_caption("Table 1.4: System Hardware and Software Specifications")
    t4_tbl = doc.add_table(rows=1, cols=3)
    format_table(t4_tbl, [1.5, 2.5, 2.5], ["Specification Layer", "Development / Testing Setup", "Production Recommendation"], [
        ["Processor (CPU)", "Intel Core i5 / AMD Ryzen 5 (4 Cores, 2.5 GHz)", "Intel Xeon / AMD EPYC (8 Cores, 3.2 GHz+)"],
        ["RAM", "8 GB DDR4", "32 GB DDR4/DDR5 ECC RAM"],
        ["Storage", "256 GB NVMe SSD", "1 TB NVMe SSD (RAID-10)"],
        ["Operating System", "Microsoft Windows 11 / Ubuntu 22.04 LTS", "Red Hat Enterprise Linux 9 / Ubuntu 24.04 LTS"],
        ["Database Engines", "MySQL Community Server 8.4 LTS, MongoDB 7.0", "MySQL Enterprise Server 8.4 LTS, MongoDB Enterprise"],
        ["Backend Runtime", "Python 3.12 (FastAPI, SQLAlchemy, PyMySQL)", "Python 3.12 (Gunicorn / Uvicorn ASGI Cluster)"],
        ["Frontend Stack", "Node.js 20 LTS, React 18, TypeScript, Vite", "Nginx Reverse Proxy, Cloudflare Edge CDN"],
        ["Testing & Tooling", "VS Code, Postman, Pytest, Playwright, Git", "Docker Engine, GitHub Actions CI/CD"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    add_h2("1.6 Global Data Dictionary & Cross-Module Key Standards")
    add_p(
        "To ensure integration across modular sub-teams, uniform data standards and key naming conventions were enforced:\n"
        "1. Table and Object Prefixes: All database entities for Module 03 carry the exm_ prefix (e.g., exm_exam, exm_schedule).\n"
        "2. Cross-Module Stubs: Consumed foreign entities use the exm_ref_ prefix (exm_ref_student, exm_ref_course, exm_ref_attendance, exm_ref_employee).\n"
        "3. Primary & Foreign Key Types: Auto-incrementing INT or BIGINT keys are used for internal surrogate joins; natural candidate keys (e.g. student_id, academic_year) are indexed with UNIQUE constraints.\n"
        "4. Referential Integrity Actions: All foreign key relationships explicitly define ON UPDATE CASCADE and ON DELETE RESTRICT to preserve historical academic auditability."
    )

    add_table_caption("Table 1.5: Global Data Dictionary and Cross-Module Key Conventions")
    t5_tbl = doc.add_table(rows=1, cols=4)
    format_table(t5_tbl, [1.4, 1.8, 1.6, 1.7], ["Identifier Key", "Format / Pattern", "Source Entity", "Validation Regex / Rule"], [
        ["student_id", "S<YYYY>-<DEPT>-<SEQ>", "exm_ref_student (M1)", "^S[0-9]{4}-[A-Z]{2,4}-[0-9]{4}$"],
        ["course_id", "<DEPT><SEM><SEQ>", "exm_ref_course (M2)", "^[A-Z]{2,4}[0-9]{3}$"],
        ["academic_year", "YYYY-YY", "academic_term (M1)", "^[0-9]{4}-[0-9]{2}$"],
        ["hall_ticket_no", "HT-<EXAM>-<SCHED>-<STUDENT>", "exm_registration (M3)", "Deterministically generated by SP"],
        ["grade", "Letter (O, A+, A, B+, B, C, P, F)", "exm_grade_scale (M3)", "UGC 10-Point Absolute Grading"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    # =============================================================
    # CHAPTER 2
    # =============================================================
    doc.add_page_break()
    add_h1("CHAPTER 2: MODULE IMPLEMENTATION & PROGRAMMABILITY")
    add_p("(Module 03: Examinations and Results Management)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13)

    add_h2("2.1 Module Scope & Business Rules")
    add_p(
        "Module 03 coordinates all administrative, evaluation, and publishing tasks associated with university evaluations. The functional scope encompasses:\n"
        "1. Setting up comprehensive examination sessions (Mid-Semester, End-Semester, Practical).\n"
        "2. Generating course-wise schedules and venue capacities.\n"
        "3. Managing student exam registrations while enforcing attendance constraints.\n"
        "4. Regulating marks capture, ensuring bounds enforcement, and tracking audits.\n"
        "5. Computing credit-weighted SGPA and CGPA according to statutory guidelines.\n"
        "6. Processing post-publication revaluation workflows via MongoDB."
    )

    add_table_caption("Table 2.1: Examination Subsystem Role Privileges Specification")
    t21_tbl = doc.add_table(rows=1, cols=4)
    format_table(t21_tbl, [2.5, 1.3, 1.3, 1.4], ["Operational Capability", "Admin (COE)", "Faculty", "Student"], [
        ["Create Exam Events & Course Schedules", "Allowed", "Forbidden", "Forbidden"],
        ["Open Registration & Execute Bulk Registration", "Allowed", "Forbidden", "Forbidden"],
        ["Register Self for an Available Examination", "Forbidden", "Forbidden", "Allowed (Self)"],
        ["Enter / Revise Student Marks", "Allowed (All)", "Allowed (Dept)", "Forbidden"],
        ["Execute Result Processing & Publishing", "Allowed", "Forbidden", "Forbidden"],
        ["Inspect Own Hall Tickets & Grade Transcripts", "Forbidden", "Forbidden", "Allowed (Self)"],
        ["View Merit Lists & Subject Pass Statistics", "Allowed", "Allowed (Read)", "Forbidden"],
        ["Raise Revaluation Request (MongoDB)", "Forbidden", "Forbidden", "Allowed (Self)"],
        ["Adjudicate Revaluation Request", "Allowed", "Forbidden", "Forbidden"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    add_p(
        "Explicit Business Integrity Rules Enforced:\n"
        "• BR-EXM-01: Attendance Eligibility Threshold: No student is permitted to register for an examination if their course attendance "
        "percentage in exm_ref_attendance is strictly below 75.00%. This rule is enforced at the database level by the exm_trg_registration_bi_attendance "
        "trigger on exm_registration.\n"
        "• BR-EXM-02: Registration Window Adherence: Registrations are accepted only when the corresponding exam event holds the status "
        "REG_OPEN and the transaction timestamp is on or before registration_deadline.\n"
        "• BR-EXM-03: Hall Ticket Number Uniqueness: Every valid registration receives a deterministic, unique hall ticket identifier formatted as "
        "HT-<exam_id>-<schedule_id>-<student_id>.\n"
        "• BR-EXM-04: Marks Range and Absence Consistency: Marks entered must satisfy 0 <= marks_obtained <= max_marks. If a student is flagged "
        "as absent (is_absent = 1), marks_obtained is forced to NULL.\n"
        "• BR-EXM-05: Non-Destructive Audit Logging: Any update to previously entered marks generates an immutable audit record in exm_marks_audit "
        "containing old score, new score, modifying employee ID, and change timestamp.\n"
        "• BR-EXM-06: Absolute Grading and GPA Weighting: Grades are determined strictly via exm_grade_scale. SGPA and CGPA are computed using "
        "credit-weighted formulas: SGPA = Sum(Grade_Points * Credits) / Sum(Credits). A score below passing marks receives grade 'F' with 0 points."
    )

    add_table_caption("Table 2.2: UGC-Compliant Standard 10-Point Absolute Grade Scale Configuration")
    t22_tbl = doc.add_table(rows=1, cols=5)
    format_table(t22_tbl, [1.0, 1.6, 1.1, 1.5, 1.3], ["Letter Grade", "Percentage Range", "Grade Points", "Performance Descriptor", "Result Status"], [
        ["O", "90.00% – 100.00%", "10", "Outstanding", "PASS"],
        ["A+", "80.00% – 89.99%", "9", "Excellent", "PASS"],
        ["A", "70.00% – 79.99%", "8", "Very Good", "PASS"],
        ["B+", "60.00% – 69.99%", "7", "Good", "PASS"],
        ["B", "55.00% – 59.99%", "6", "Above Average", "PASS"],
        ["C", "50.00% – 54.99%", "5", "Average", "PASS"],
        ["P", "40.00% – 49.99%", "4", "Pass", "PASS"],
        ["F", "0.00% – 39.99%", "0", "Fail", "FAIL"]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    add_h2("2.2 Module Data Flow Diagram (Level 1 / Level 2 DFD)")
    add_h3("2.2.1 Sub-System Processes, Data Stores, and External Movement")
    add_p(
        "Figure 2.1 documents the Level 1 DFD, detailing the progression of an exam from initial setup through student registration and exception logging. "
        "When an administrator schedules an exam via Process 3.1, entries are committed to exm_exam and exm_schedule. In Process 3.2, registrations are "
        "validated against exm_ref_attendance. Students meeting the 75% threshold are entered into exm_registration, while ineligible candidates are "
        "logged to exm_registration_block_log."
    )

    add_code_block(
        "                                  [ CONTROLLER OF EXAMINATIONS (ADMIN) ]\n"
        "                                      |                       |\n"
        "                     (Exam Details)   |                       | (Trigger Bulk Run)\n"
        "                                      v                       v\n"
        "                             +-----------------+     +-----------------+\n"
        "                             |   Process 3.1   |     |   Process 3.2   |\n"
        "                             |  Schedule Exam  |     | Bulk Exam Reg.  |\n"
        "                             |    & Courses    |     |  & Attendance   |\n"
        "                             +--------+--------+     |   Validation    |\n"
        "                                      |              +----+-------+----+\n"
        "                                      v                   |       |\n"
        "                              [(D3.1) exm_exam]           |       | (Blocked Rows)\n"
        "                              [(D3.2) exm_schedule]       |       v\n"
        "                                      |                   |   [(D3.8) exm_block_log]\n"
        "                                      |                   |\n"
        "                                      +--------+----------+\n"
        "                                               |\n"
        "                                               v\n"
        "    [ CANDIDATE / STUDENT ] <---------- [(D3.3) exm_registration]\n"
        "           |      (Hall Ticket)                ^\n"
        "           |                                   | (Self-Registration)\n"
        "           +-----------------------------------+\n"
        "           |\n"
        "           | (Submit Revaluation)\n"
        "           v\n"
        "     +-----------------+\n"
        "     |   Process 3.5   |\n"
        "     | Mongo Grievance | ----------> [(D3.9) Mongo: revaluation_requests]\n"
        "     +-----------------+"
    )
    add_figure_caption("Figure 2.1: Module 03 Data Flow Diagram (Level 1 DFD) – Examination Lifecycle")

    add_p(
        "Figure 2.2 details the marks entry and results processing engine (Level 2 DFD). Departmental examiners enter raw scores into "
        "Process 3.3, which verifies that marks_obtained <= max_marks. Any changes to previously entered marks are routed to the audit log exm_marks_audit.\n\n"
        "Once all marks are verified, the administrator executes Process 3.4 (exm_sp_generate_results). This process calculates percentages, "
        "queries exm_grade_scale via User-Defined Functions, weighs earned grade points against course credits, and updates exm_result and "
        "exm_semester_result before setting the exam status to RESULTS_PUBLISHED."
    )

    add_code_block(
        "                    [ FACULTY / EXAMINER ]\n"
        "                              |\n"
        "               (Marks Entry)  v\n"
        "                      +-----------------+\n"
        "                      |   Process 3.3   | <------- [(D3.3) exm_registration]\n"
        "                      | Marks Capture   |\n"
        "                      |  & Validation   | -------> [(D3.7) exm_marks_audit]\n"
        "                      +--------+--------+          (Trigger on UPDATE)\n"
        "                               |\n"
        "                               v\n"
        "                       [(D3.4) exm_marks]\n"
        "                               |\n"
        "                               v\n"
        "                      +-----------------+\n"
        "                      |   Process 3.4   | <------- [(D3.0) exm_grade_scale]\n"
        "                      | Result Engine   | <------- [exm_ref_course (Credits)]\n"
        "                      | & SGPA/CGPA Calc|\n"
        "                      +--------+--------+\n"
        "                               |\n"
        "              +----------------+----------------+\n"
        "              |                                 |\n"
        "              v                                 v\n"
        "     [(D3.5) exm_result]             [(D3.6) exm_semester_result]\n"
        "              |                                 |\n"
        "              +----------------+----------------+\n"
        "                               |\n"
        "                               v\n"
        "                     (Published Transcripts)\n"
        "                               |\n"
        "                               v\n"
        "                     [ REGISTERED STUDENT ]"
    )
    add_figure_caption("Figure 2.2: Module 03 Data Flow Diagram (Level 2 DFD) – Results Processing Engine")

    add_h2("2.3 Sub-Schema & Relational Data Dictionary")
    add_p(
        "The relational sub-schema of Module 03 consists of 9 core tables in MySQL erp_examinations along with 2 document collections "
        "in MongoDB erp_examinations_mongo. The full data dictionary is detailed below."
    )

    add_table_caption("Table 2.3: Data Dictionary: exm_grade_scale")
    t23_tbl = doc.add_table(rows=1, cols=5)
    format_table(t23_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["grade", "VARCHAR(2)", "NO", "PRIMARY KEY", "UGC letter grade identifier (O, A+, A, B+, B, C, P, F)."],
        ["min_percentage", "DECIMAL(5,2)", "NO", "CHECK >= 0", "Lower percentage threshold (inclusive)."],
        ["max_percentage", "DECIMAL(5,2)", "NO", "CHECK <= 100", "Upper percentage threshold (inclusive)."],
        ["grade_points", "TINYINT", "NO", "CHECK 0 - 10", "Numeric grade points mapped to grade."]
    ])

    add_table_caption("Table 2.4: Data Dictionary: exm_exam")
    t24_tbl = doc.add_table(rows=1, cols=5)
    format_table(t24_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["exam_id", "INT", "NO", "PK, AUTO_INC", "Surrogate unique identifier for exam event."],
        ["exam_name", "VARCHAR(100)", "NO", "Candidate Key", "Official title of the examination."],
        ["exam_type", "ENUM(...)", "NO", "Check Values", "MID_SEM, END_SEM, or PRACTICAL."],
        ["academic_year", "VARCHAR(7)", "NO", "Candidate Key", "Academic term session string (e.g. 2026-27)."],
        ["semester", "TINYINT", "NO", "CHECK 1 - 8", "Applicable curricular semester number."],
        ["start_date", "DATE", "NO", "Logical Date", "Commencement date of the exam series."],
        ["end_date", "DATE", "NO", "CHECK >= Start", "Conclusion date of the exam series."],
        ["registration_deadline", "DATE", "NO", "CHECK <= Start", "Cut-off date for accepting registrations."],
        ["status", "ENUM(...)", "NO", "Default 'SCHEDULED'", "SCHEDULED, REG_OPEN, ONGOING, COMPLETED, RESULTS_PUBLISHED."]
    ])

    add_table_caption("Table 2.5: Data Dictionary: exm_schedule")
    t25_tbl = doc.add_table(rows=1, cols=5)
    format_table(t25_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["schedule_id", "INT", "NO", "PK, AUTO_INC", "Surrogate unique schedule identifier."],
        ["exam_id", "INT", "NO", "FK (Cascade Del)", "Parent examination reference."],
        ["course_id", "VARCHAR(10)", "NO", "FK (Restrict)", "Evaluated course code from exm_ref_course."],
        ["exam_date", "DATE", "NO", "Logical Date", "Date scheduled for this specific subject."],
        ["start_time", "TIME", "NO", "Logical Time", "Examination start time."],
        ["end_time", "TIME", "NO", "CHECK > Start", "Examination conclusion time."],
        ["venue", "VARCHAR(50)", "NO", "Text Label", "Designated exam hall or laboratory."],
        ["max_marks", "INT", "NO", "CHECK > 0", "Maximum attainable marks."],
        ["passing_marks", "INT", "NO", "CHECK <= Max", "Minimum marks required to pass."]
    ])

    add_table_caption("Table 2.6: Data Dictionary: exm_registration")
    t26_tbl = doc.add_table(rows=1, cols=5)
    format_table(t26_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["registration_id", "INT", "NO", "PK, AUTO_INC", "Surrogate unique registration identifier."],
        ["schedule_id", "INT", "NO", "FK (Restrict)", "Target examination schedule reference."],
        ["student_id", "VARCHAR(20)", "NO", "FK (Restrict)", "Candidate student reference from exm_ref_student."],
        ["hall_ticket_no", "VARCHAR(25)", "NO", "UNIQUE", "Generated hall ticket identifier."],
        ["registered_on", "DATETIME", "NO", "DEFAULT Current", "Timestamp of successful registration."],
        ["status", "ENUM(...)", "NO", "Default 'REGISTERED'", "REGISTERED or CANCELLED."]
    ])

    add_table_caption("Table 2.7: Data Dictionary: exm_marks")
    t27_tbl = doc.add_table(rows=1, cols=5)
    format_table(t27_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["marks_id", "INT", "NO", "PK, AUTO_INC", "Surrogate marks record identifier."],
        ["registration_id", "INT", "NO", "FK (Cascade), UNIQUE", "Direct link to candidate registration."],
        ["marks_obtained", "DECIMAL(5,2)", "YES", "CHECK >= 0", "Score awarded (NULL if student is absent)."],
        ["is_absent", "TINYINT(1)", "NO", "DEFAULT 0", "1 if student was absent, else 0."],
        ["entered_by", "VARCHAR(10)", "NO", "Logical Key", "Employee ID of evaluating examiner."],
        ["entered_on", "DATETIME", "NO", "DEFAULT Current", "Submission timestamp of marks."]
    ])

    add_table_caption("Table 2.8: Data Dictionary: exm_result")
    t28_tbl = doc.add_table(rows=1, cols=5)
    format_table(t28_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["result_id", "INT", "NO", "PK, AUTO_INC", "Surrogate compiled course result identifier."],
        ["student_id", "VARCHAR(20)", "NO", "FK (Restrict)", "Candidate reference."],
        ["course_id", "VARCHAR(10)", "NO", "FK (Restrict)", "Evaluated course code."],
        ["academic_year", "VARCHAR(7)", "NO", "Grouping Key", "Academic term string."],
        ["semester", "TINYINT", "NO", "CHECK 1 - 8", "Semester number."],
        ["marks_obtained", "DECIMAL(5,2)", "NO", "DEFAULT 0.00", "Final marks awarded."],
        ["max_marks", "INT", "NO", "Standard Scale", "Maximum possible marks."],
        ["percentage", "DECIMAL(5,2)", "NO", "CHECK 0 - 100", "Calculated percentage."],
        ["grade", "VARCHAR(2)", "NO", "FK Grade Scale", "Allocated UGC letter grade."],
        ["grade_points", "TINYINT", "NO", "Integer 0 - 10", "Grade points earned."],
        ["credits", "TINYINT", "NO", "Credit Weight", "Course credit value from catalog."],
        ["result_status", "ENUM(...)", "NO", "Check Values", "PASS, FAIL, or ABSENT."]
    ])

    add_table_caption("Table 2.9: Data Dictionary: exm_semester_result")
    t29_tbl = doc.add_table(rows=1, cols=5)
    format_table(t29_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["student_id", "VARCHAR(20)", "NO", "Composite PK, FK", "Candidate student reference."],
        ["academic_year", "VARCHAR(7)", "NO", "Composite PK", "Academic term descriptor."],
        ["semester", "TINYINT", "NO", "Composite PK", "Evaluated semester number."],
        ["total_credits", "INT", "NO", "Summed Credits", "Total course credits evaluated in term."],
        ["sgpa", "DECIMAL(4,2)", "NO", "CHECK 0 - 10", "Credit-weighted term grade average."],
        ["cgpa", "DECIMAL(4,2)", "NO", "CHECK 0 - 10", "Cumulative career grade average."],
        ["published_on", "DATETIME", "NO", "DEFAULT Current", "Timestamp of result publication."]
    ])

    add_table_caption("Table 2.10: Data Dictionary: exm_marks_audit")
    t210_tbl = doc.add_table(rows=1, cols=5)
    format_table(t210_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["audit_id", "INT", "NO", "PK, AUTO_INC", "Surrogate audit log sequence key."],
        ["marks_id", "INT", "NO", "Historical Link", "Reference to modified marks record."],
        ["old_marks", "DECIMAL(5,2)", "YES", "State Storage", "Score prior to modification."],
        ["new_marks", "DECIMAL(5,2)", "YES", "State Storage", "New updated score applied."],
        ["changed_by", "VARCHAR(10)", "NO", "Identity Track", "Employee ID executing change."],
        ["changed_on", "DATETIME", "NO", "DEFAULT Current", "Timestamp of audit modification."]
    ])

    add_table_caption("Table 2.11: Data Dictionary: exm_registration_block_log")
    t211_tbl = doc.add_table(rows=1, cols=5)
    format_table(t211_tbl, [1.3, 1.3, 0.9, 1.4, 1.6], ["Column Name", "Data Type", "Nullable", "Constraint", "Description"], [
        ["log_id", "INT", "NO", "PK, AUTO_INC", "Surrogate block event sequence key."],
        ["schedule_id", "INT", "NO", "Schedule Link", "Target examination schedule identifier."],
        ["student_id", "VARCHAR(20)", "NO", "Candidate Link", "Candidate student identifier."],
        ["reason", "VARCHAR(150)", "NO", "Error Text", "Detailed message explaining block."],
        ["logged_on", "DATETIME", "NO", "DEFAULT Current", "Timestamp of blocked attempt."]
    ])

    add_table_caption("Table 2.12: MongoDB Collections Schema Definition (erp_examinations_mongo)")
    t212_tbl = doc.add_table(rows=1, cols=3)
    format_table(t212_tbl, [1.5, 3.2, 1.8], ["Collection Name", "Document Schema (JSON / BSON)", "Purpose & Operational Domain"], [
        ["revaluation_requests", "{\n  _id: ObjectId,\n  student_id: String,\n  course_id: String,\n  exam_id: Number,\n  reason: String,\n  status: 'OPEN'|'RESOLVED',\n  history: [{ status: String, on: ISODate, by: String }]\n}", "Captures unstructured revaluation grievances, historical reviews, and status changes."],
        ["exam_notifications", "{\n  _id: ObjectId,\n  exam_id: Number,\n  audience: 'ALL'|'FACULTY'|'STUDENT',\n  title: String,\n  message: String,\n  posted_on: ISODate\n}", "Broadcast alerts for timetable updates, registration windows, and result publications."]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    add_h2("2.4 Advanced SQL Implementation")
    add_h3("2.4.1 Stored Procedures (SQL Code & Execution Proofs)")
    
    add_p("1. Individual Registration Stored Procedure (exm_sp_register_student):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE PROCEDURE exm_sp_register_student(\n"
        "    IN p_schedule_id INT,\n"
        "    IN p_student_id  VARCHAR(20)\n"
        ")\n"
        "BEGIN\n"
        "    DECLARE v_exam_id INT;\n"
        "    DECLARE v_exam_status VARCHAR(20);\n"
        "    DECLARE v_reg_deadline DATE;\n"
        "    DECLARE v_student_status VARCHAR(20);\n"
        "    DECLARE v_hall_ticket VARCHAR(25);\n\n"
        "    -- 1. Validate exam status and registration deadline\n"
        "    SELECT e.exam_id, e.status, e.registration_deadline\n"
        "      INTO v_exam_id, v_exam_status, v_reg_deadline\n"
        "      FROM exm_schedule s\n"
        "      JOIN exm_exam e ON s.exam_id = e.exam_id\n"
        "     WHERE s.schedule_id = p_schedule_id;\n\n"
        "    IF v_exam_id IS NULL THEN\n"
        "        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Schedule does not exist';\n"
        "    END IF;\n\n"
        "    IF v_exam_status <> 'REG_OPEN' OR CURDATE() > v_reg_deadline THEN\n"
        "        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration closed for this examination';\n"
        "    END IF;\n\n"
        "    -- 2. Validate student enrollment status\n"
        "    SELECT status INTO v_student_status\n"
        "      FROM exm_ref_student\n"
        "     WHERE student_id = p_student_id;\n\n"
        "    IF v_student_status IS NULL OR v_student_status <> 'ACTIVE' THEN\n"
        "        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not active or enrolled in the university';\n"
        "    END IF;\n\n"
        "    -- 3. Insert registration (triggers attendance validation)\n"
        "    SET v_hall_ticket = CONCAT('HT-', v_exam_id, '-', p_schedule_id, '-', p_student_id);\n"
        "    INSERT INTO exm_registration (schedule_id, student_id, hall_ticket_no, registered_on, status)\n"
        "    VALUES (p_schedule_id, p_student_id, v_hall_ticket, NOW(), 'REGISTERED');\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("2. Bulk Registration Stored Procedure (exm_sp_bulk_register):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE PROCEDURE exm_sp_bulk_register(\n"
        "    IN  p_exam_id    INT,\n"
        "    OUT p_registered INT,\n"
        "    OUT p_blocked    INT\n"
        ")\n"
        "BEGIN\n"
        "    DECLARE v_done INT DEFAULT 0;\n"
        "    DECLARE v_sched_id INT;\n"
        "    DECLARE v_stud_id VARCHAR(20);\n"
        "    DECLARE v_err_msg VARCHAR(150);\n\n"
        "    DECLARE cur_candidates CURSOR FOR\n"
        "        SELECT s.schedule_id, st.student_id\n"
        "          FROM exm_schedule s\n"
        "          JOIN exm_exam e ON s.exam_id = e.exam_id\n"
        "          JOIN exm_ref_course c ON s.course_id = c.course_id\n"
        "          JOIN exm_ref_student st ON st.program_id = c.program_id\n"
        "         WHERE s.exam_id = p_exam_id\n"
        "           AND st.status = 'ACTIVE'\n"
        "           AND c.semester = e.semester;\n\n"
        "    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;\n\n"
        "    -- Catch trigger exceptions and log blocked students\n"
        "    DECLARE CONTINUE HANDLER FOR SQLSTATE '45000'\n"
        "    BEGIN\n"
        "        GET DIAGNOSTICS CONDITION 1 v_err_msg = MESSAGE_TEXT;\n"
        "        SET p_blocked = p_blocked + 1;\n"
        "        INSERT INTO exm_registration_block_log (schedule_id, student_id, reason, logged_on)\n"
        "        VALUES (v_sched_id, v_stud_id, v_err_msg, NOW());\n"
        "    END;\n\n"
        "    SET p_registered = 0;\n"
        "    SET p_blocked = 0;\n"
        "    OPEN cur_candidates;\n\n"
        "    read_loop: LOOP\n"
        "        FETCH cur_candidates INTO v_sched_id, v_stud_id;\n"
        "        IF v_done = 1 THEN LEAVE read_loop; END IF;\n\n"
        "        CALL exm_sp_register_student(v_sched_id, v_stud_id);\n"
        "        IF NOT EXISTS (\n"
        "            SELECT 1 FROM exm_registration_block_log\n"
        "             WHERE schedule_id = v_sched_id AND student_id = v_stud_id\n"
        "               AND logged_on >= NOW() - INTERVAL 2 SECOND\n"
        "        ) THEN\n"
        "            SET p_registered = p_registered + 1;\n"
        "        END IF;\n"
        "    END LOOP;\n"
        "    CLOSE cur_candidates;\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("3. Result Processing and Publication Procedure (exm_sp_generate_results):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE PROCEDURE exm_sp_generate_results(IN p_exam_id INT)\n"
        "BEGIN\n"
        "    DECLARE v_rollback BOOL DEFAULT FALSE;\n"
        "    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_rollback = TRUE;\n\n"
        "    START TRANSACTION;\n\n"
        "    -- 1. Compute percentages, grades, and status into exm_result\n"
        "    INSERT INTO exm_result (\n"
        "        student_id, course_id, academic_year, semester,\n"
        "        marks_obtained, max_marks, percentage,\n"
        "        grade, grade_points, credits, result_status\n"
        "    )\n"
        "    SELECT \n"
        "        r.student_id, s.course_id, e.academic_year, e.semester,\n"
        "        IFNULL(m.marks_obtained, 0.00), s.max_marks,\n"
        "        CASE \n"
        "            WHEN m.is_absent = 1 OR m.marks_obtained IS NULL THEN 0.00\n"
        "            ELSE ROUND((m.marks_obtained * 100.0) / s.max_marks, 2)\n"
        "        END AS pct,\n"
        "        CASE \n"
        "            WHEN m.is_absent = 1 THEN 'F'\n"
        "            WHEN m.marks_obtained < s.passing_marks THEN 'F'\n"
        "            ELSE exm_fn_get_grade(ROUND((m.marks_obtained * 100.0) / s.max_marks, 2))\n"
        "        END AS gr,\n"
        "        CASE \n"
        "            WHEN m.is_absent = 1 OR m.marks_obtained < s.passing_marks THEN 0\n"
        "            ELSE (SELECT gs.grade_points FROM exm_grade_scale gs \n"
        "                   WHERE gs.grade = exm_fn_get_grade(ROUND((m.marks_obtained * 100.0) / s.max_marks, 2)))\n"
        "        END AS gp,\n"
        "        c.credits,\n"
        "        CASE \n"
        "            WHEN m.is_absent = 1 THEN 'ABSENT'\n"
        "            WHEN m.marks_obtained >= s.passing_marks THEN 'PASS'\n"
        "            ELSE 'FAIL'\n"
        "        END AS res_status\n"
        "    FROM exm_schedule s\n"
        "    JOIN exm_exam e ON s.exam_id = e.exam_id\n"
        "    JOIN exm_ref_course c ON s.course_id = c.course_id\n"
        "    JOIN exm_registration r ON s.schedule_id = r.schedule_id\n"
        "    JOIN exm_marks m ON r.registration_id = m.registration_id\n"
        "    WHERE s.exam_id = p_exam_id\n"
        "    ON DUPLICATE KEY UPDATE\n"
        "        marks_obtained = VALUES(marks_obtained),\n"
        "        percentage     = VALUES(percentage),\n"
        "        grade          = VALUES(grade),\n"
        "        grade_points   = VALUES(grade_points),\n"
        "        result_status  = VALUES(result_status);\n\n"
        "    -- 2. Compile semester GPA and CGPA\n"
        "    INSERT INTO exm_semester_result (\n"
        "        student_id, academic_year, semester, total_credits, sgpa, cgpa, published_on\n"
        "    )\n"
        "    SELECT \n"
        "        res.student_id, res.academic_year, res.semester, SUM(res.credits),\n"
        "        exm_fn_calculate_sgpa(res.student_id, res.academic_year, res.semester),\n"
        "        exm_fn_calculate_cgpa(res.student_id), NOW()\n"
        "    FROM exm_result res\n"
        "    JOIN exm_schedule s ON res.course_id = s.course_id \n"
        "     AND res.academic_year = (SELECT academic_year FROM exm_exam WHERE exam_id = p_exam_id)\n"
        "    WHERE s.exam_id = p_exam_id\n"
        "    GROUP BY res.student_id, res.academic_year, res.semester\n"
        "    ON DUPLICATE KEY UPDATE\n"
        "        total_credits = VALUES(total_credits),\n"
        "        sgpa          = VALUES(sgpa),\n"
        "        cgpa          = VALUES(cgpa),\n"
        "        published_on  = VALUES(published_on);\n\n"
        "    -- 3. Publish results\n"
        "    UPDATE exm_exam SET status = 'RESULTS_PUBLISHED' WHERE exam_id = p_exam_id;\n\n"
        "    IF v_rollback THEN\n"
        "        ROLLBACK;\n"
        "        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction failed and rolled back';\n"
        "    ELSE\n"
        "        COMMIT;\n"
        "    END IF;\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_h3("2.4.2 Database Triggers (SQL Code & Execution Proofs)")
    add_p("1. Attendance Eligibility Trigger (exm_trg_registration_bi_attendance):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE TRIGGER exm_trg_registration_bi_attendance\n"
        "BEFORE INSERT ON exm_registration\n"
        "FOR EACH ROW\n"
        "BEGIN\n"
        "    DECLARE v_course_id VARCHAR(10);\n"
        "    DECLARE v_year VARCHAR(7);\n"
        "    DECLARE v_attendance DECIMAL(5,2);\n\n"
        "    SELECT s.course_id, e.academic_year\n"
        "      INTO v_course_id, v_year\n"
        "      FROM exm_schedule s\n"
        "      JOIN exm_exam e ON s.exam_id = e.exam_id\n"
        "     WHERE s.schedule_id = NEW.schedule_id;\n\n"
        "    SELECT attendance_pct INTO v_attendance\n"
        "      FROM exm_ref_attendance\n"
        "     WHERE student_id = NEW.student_id\n"
        "       AND course_id = v_course_id\n"
        "       AND academic_year = v_year;\n\n"
        "    IF v_attendance IS NULL OR v_attendance < 75.00 THEN\n"
        "        SIGNAL SQLSTATE '45000'\n"
        "            SET MESSAGE_TEXT = 'Attendance below 75%: registration not allowed';\n"
        "    END IF;\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("2. Marks Validation Trigger (exm_trg_marks_bi_validate):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE TRIGGER exm_trg_marks_bi_validate\n"
        "BEFORE INSERT ON exm_marks\n"
        "FOR EACH ROW\n"
        "BEGIN\n"
        "    DECLARE v_max_marks INT;\n\n"
        "    SELECT s.max_marks INTO v_max_marks\n"
        "      FROM exm_registration r\n"
        "      JOIN exm_schedule s ON r.schedule_id = s.schedule_id\n"
        "     WHERE r.registration_id = NEW.registration_id;\n\n"
        "    IF NEW.marks_obtained > v_max_marks THEN\n"
        "        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Marks exceed maximum';\n"
        "    END IF;\n\n"
        "    IF NEW.is_absent = 1 THEN\n"
        "        SET NEW.marks_obtained = NULL;\n"
        "    END IF;\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("3. Marks Modification Audit Trigger (exm_trg_marks_au_audit):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE TRIGGER exm_trg_marks_au_audit\n"
        "AFTER UPDATE ON exm_marks\n"
        "FOR EACH ROW\n"
        "BEGIN\n"
        "    IF (OLD.marks_obtained IS NULL AND NEW.marks_obtained IS NOT NULL) OR\n"
        "       (OLD.marks_obtained IS NOT NULL AND NEW.marks_obtained IS NULL) OR\n"
        "       (OLD.marks_obtained <> NEW.marks_obtained) THEN\n"
        "        \n"
        "        INSERT INTO exm_marks_audit (marks_id, old_marks, new_marks, changed_by, changed_on)\n"
        "        VALUES (OLD.marks_id, OLD.marks_obtained, NEW.marks_obtained, NEW.entered_by, NOW());\n"
        "    END IF;\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_h3("2.4.3 User-Defined Functions (UDFs) (SQL Code & Execution Proofs)")
    add_p("1. Letter Grade Conversion Function (exm_fn_get_grade):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE FUNCTION exm_fn_get_grade(p_percentage DECIMAL(5,2))\n"
        "RETURNS VARCHAR(2)\n"
        "DETERMINISTIC READS SQL DATA\n"
        "BEGIN\n"
        "    DECLARE v_grade VARCHAR(2) DEFAULT 'F';\n"
        "    SELECT grade INTO v_grade FROM exm_grade_scale\n"
        "     WHERE p_percentage >= min_percentage AND p_percentage <= max_percentage\n"
        "     LIMIT 1;\n"
        "    RETURN IFNULL(v_grade, 'F');\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("2. Semester GPA Calculation Function (exm_fn_calculate_sgpa):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE FUNCTION exm_fn_calculate_sgpa(p_student_id VARCHAR(20), p_year VARCHAR(7), p_sem TINYINT)\n"
        "RETURNS DECIMAL(4,2)\n"
        "DETERMINISTIC READS SQL DATA\n"
        "BEGIN\n"
        "    DECLARE v_sgpa DECIMAL(4,2) DEFAULT 0.00;\n"
        "    SELECT ROUND(SUM(grade_points * credits) / NULLIF(SUM(credits), 0), 2)\n"
        "      INTO v_sgpa FROM exm_result\n"
        "     WHERE student_id = p_student_id AND academic_year = p_year AND semester = p_sem;\n"
        "    RETURN IFNULL(v_sgpa, 0.00);\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_p("3. Cumulative GPA Calculation Function (exm_fn_calculate_cgpa):", bold=True)
    add_code_block(
        "DELIMITER //\n"
        "CREATE FUNCTION exm_fn_calculate_cgpa(p_student_id VARCHAR(20))\n"
        "RETURNS DECIMAL(4,2)\n"
        "DETERMINISTIC READS SQL DATA\n"
        "BEGIN\n"
        "    DECLARE v_cgpa DECIMAL(4,2) DEFAULT 0.00;\n"
        "    SELECT ROUND(SUM(grade_points * credits) / NULLIF(SUM(credits), 0), 2)\n"
        "      INTO v_cgpa FROM exm_result\n"
        "     WHERE student_id = p_student_id;\n"
        "    RETURN IFNULL(v_cgpa, 0.00);\n"
        "END //\n"
        "DELIMITER ;"
    )

    add_h2("2.5 Complex Analytical Queries & Views")
    add_p("1. Departmental Merit Ranking (exm_vw_topper_list):", bold=True)
    add_code_block(
        "CREATE OR REPLACE VIEW exm_vw_topper_list AS\n"
        "SELECT \n"
        "    st.dept_id,\n"
        "    sr.semester,\n"
        "    sr.student_id,\n"
        "    st.first_name,\n"
        "    st.last_name,\n"
        "    sr.sgpa,\n"
        "    DENSE_RANK() OVER (\n"
        "        PARTITION BY st.dept_id, sr.semester \n"
        "        ORDER BY sr.sgpa DESC\n"
        "    ) AS merit_rank\n"
        "FROM exm_semester_result sr\n"
        "JOIN exm_ref_student st ON sr.student_id = st.student_id;"
    )

    add_p("2. Subject Pass Rate Analysis (exm_vw_subject_pass_rate):", bold=True)
    add_code_block(
        "CREATE OR REPLACE VIEW exm_vw_subject_pass_rate AS\n"
        "SELECT \n"
        "    r.course_id,\n"
        "    c.title AS course_title,\n"
        "    r.academic_year,\n"
        "    COUNT(r.result_id) AS total_appeared,\n"
        "    SUM(CASE WHEN r.result_status = 'PASS' THEN 1 ELSE 0 END) AS total_passed,\n"
        "    ROUND((SUM(CASE WHEN r.result_status = 'PASS' THEN 1 ELSE 0 END) * 100.0) / COUNT(r.result_id), 2) AS pass_percentage\n"
        "FROM exm_result r\n"
        "JOIN exm_ref_course c ON r.course_id = c.course_id\n"
        "GROUP BY r.course_id, c.title, r.academic_year\n"
        "HAVING COUNT(r.result_id) > 0;"
    )

    add_p("3. Academic Transcript Generator (exm_vw_student_transcript):", bold=True)
    add_code_block(
        "CREATE OR REPLACE VIEW exm_vw_student_transcript AS\n"
        "SELECT \n"
        "    r.student_id,\n"
        "    st.first_name,\n"
        "    st.last_name,\n"
        "    r.academic_year,\n"
        "    r.semester,\n"
        "    r.course_id,\n"
        "    c.title AS course_title,\n"
        "    r.credits,\n"
        "    r.marks_obtained,\n"
        "    r.max_marks,\n"
        "    r.grade,\n"
        "    r.grade_points,\n"
        "    r.result_status\n"
        "FROM exm_result r\n"
        "JOIN exm_ref_student st ON r.student_id = st.student_id\n"
        "JOIN exm_ref_course c ON r.course_id = c.course_id\n"
        "ORDER BY r.student_id, r.semester, r.course_id;"
    )

    add_p("4. Backlog Tracking View (exm_vw_backlog_students):", bold=True)
    add_code_block(
        "CREATE OR REPLACE VIEW exm_vw_backlog_students AS\n"
        "SELECT \n"
        "    st.student_id,\n"
        "    st.first_name,\n"
        "    st.last_name,\n"
        "    st.dept_id,\n"
        "    st.program_id,\n"
        "    (SELECT COUNT(*) \n"
        "       FROM exm_result r2 \n"
        "      WHERE r2.student_id = st.student_id \n"
        "        AND r2.result_status IN ('FAIL', 'ABSENT')) AS backlog_count\n"
        "FROM exm_ref_student st\n"
        "WHERE EXISTS (\n"
        "    SELECT 1 \n"
        "      FROM exm_result r \n"
        "     WHERE r.student_id = st.student_id \n"
        "       AND r.result_status IN ('FAIL', 'ABSENT')\n"
        ");"
    )

    # =============================================================
    # CHAPTER 3
    # =============================================================
    doc.add_page_break()
    add_h1("CHAPTER 3: SYSTEM INTEGRATION, TESTING & CONCLUSION")

    add_h2("3.1 Cross-Module Foreign Key Alignment & Master Script Execution")
    add_p(
        "Cross-module foreign key dependencies are maintained using local stub replicas populated through internal synchronization "
        "APIs. This architecture eliminates distributed foreign key locks while preserving relational integrity within the module boundary."
    )

    add_table_caption("Table 3.1: Cross-Module Synchronization API Contract")
    t31_tbl = doc.add_table(rows=1, cols=4)
    format_table(t31_tbl, [1.7, 1.4, 1.6, 1.8], ["Sync Endpoint", "Source Module", "Target Stub Table", "Primary Synchronized Attributes"], [
        ["POST /internal/sync/student", "M1 (Core)", "exm_ref_student", "student_id, program_id, status"],
        ["POST /internal/sync/course", "M2 (Academics)", "exm_ref_course", "course_id, program_id, semester, credits"],
        ["POST /internal/sync/attendance", "M2 (Attendance)", "exm_ref_attendance", "student_id, course_id, academic_year, attendance_pct"],
        ["POST /internal/sync/employee", "M5 (HR)", "exm_ref_employee", "employee_id, dept_id, status"],
        ["GET /export/result_summary", "M3 (Exams)", "Consumed by M4/M7", "student_id, academic_year, semester, sgpa, cgpa"]
    ], [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    add_p(
        "Master Build Execution Order:\n"
        "1. 01_stubs_and_seeds.sql: Provisions stubs and seeds (15 students, 9 courses, 8 employees, 24 attendance records).\n"
        "2. 02_schema_tables.sql: Creates 9 core tables.\n"
        "3. 03_functions.sql: Defines UDFs for grade and GPA calculations.\n"
        "4. 04_triggers.sql: Activates attendance and marks validation triggers.\n"
        "5. 05_procedures.sql: Compiles registration and result generation procedures.\n"
        "6. 06_views.sql: Creates analytical views for toppers, pass rates, transcripts, and backlogs.\n"
        "7. 07_verify_and_test.sql: Executes the automated verification suite across test cases T1 to T14."
    )

    add_h2("3.2 Constraint, Edge-Case & Transaction Validation Testing")
    add_p(
        "The subsystem underwent automated verification across all 14 mandatory test cases. Table 3.2 details the test suite results."
    )

    add_table_caption("Table 3.2: Master Integration Verification Test Results (T1 to T14)")
    t32_tbl = doc.add_table(rows=1, cols=5)
    format_table(t32_tbl, [0.6, 2.2, 1.8, 1.2, 0.7], ["ID", "Executed Action / SQL Test", "Expected Outcome", "Observed Result", "Status"], [
        ["T1", "Register student S2026-CS-0003 (attendance 72.50%)", "Error: 'Attendance below 75%'", "Trigger raised 45000; blocked", "PASS"],
        ["T2", "Register student S2026-CS-0001 (attendance 92.50%)", "Success; hall ticket created", "HT-1-1-S2026-CS-0001 generated", "PASS"],
        ["T3", "CALL exm_sp_bulk_register(1, @r, @b)", "@r = 12, @b = 12, log = 12 rows", "@r=12, @b=12, 12 rows logged", "PASS"],
        ["T4", "Register on exam with status 'SCHEDULED'", "Error: 'Registration closed'", "Procedure blocked with 45000", "PASS"],
        ["T5", "Insert marks = 35 where max = 30", "Error: 'Marks exceed maximum'", "Trigger raised 45000; rejected", "PASS"],
        ["T6", "Update marks from 20.00 to 22.00", "Row logged in exm_marks_audit", "Audit row created (old 20, new 22)", "PASS"],
        ["T7", "SELECT exm_fn_get_grade(84.5), (39.99), (90)", "Output: 'A+', 'F', 'O'", "Output: A+, F, O", "PASS"],
        ["T8", "CALL exm_sp_generate_results(1)", "Results computed, exam published", "Result rows upserted; published", "PASS"],
        ["T9", "Marks < passing marks but overall % high", "Grade 'F', 0 points, status 'FAIL'", "Grade 'F', 0 points, status 'FAIL'", "PASS"],
        ["T10", "SELECT exm_fn_calculate_cgpa('S2025-CS-0001')", "Matches manual calc (9.00)", "Output matches expected 9.00", "PASS"],
        ["T11", "Query exm_vw_topper_list", "Ranks reset per dept and semester", "DENSE_RANK resets per partition", "PASS"],
        ["T12", "Student calls POST /schedules/:id/register", "Identity pulled from JWT token", "Self-registration enforced", "PASS"],
        ["T13", "Student requests peer's transcript via API", "HTTP 403 Forbidden", "Access denied with 403", "PASS"],
        ["T14", "GET /summary endpoint", "Returns 4 operational KPI metrics", "JSON returns all 4 metric keys", "PASS"]
    ], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    add_p(
        "Mathematical Verification of Test Case T10 (CGPA Manual Proof):\n"
        "For candidate S2025-CS-0001 over two semesters:\n"
        "• Semester 1: CS101 (4 credits, 88.00% -> Grade A+, 9 pts -> 36 credit-points) and CS102 (4 credits, 76.00% -> Grade A, 8 pts -> 32 credit-points). Term 1 SGPA = (36 + 32) / 8 = 8.50.\n"
        "• Semester 2: CS201 (4 credits, 92.00% -> Grade O, 10 pts -> 40 credit-points). Term 2 SGPA = 40 / 4 = 10.00.\n"
        "• Career CGPA = (36 + 32 + 40) / (4 + 4 + 4) = 108 / 12 = 9.00.\n"
        "Executing SELECT exm_fn_calculate_cgpa('S2025-CS-0001') returns 9.00, verifying the function against manual calculation."
    )

    add_h2("3.3 Conclusion & Future Enhancements")
    add_p(
        "The design and implementation of Module 03: Examinations and Results Management fulfills all functional and integrity "
        "requirements established by the syllabus and PRD. By embedding core rules—such as attendance threshold validation, marks audit "
        "logging, and credit-weighted GPA compilation—directly into MySQL triggers, stored procedures, and functions, the platform ensures "
        "data integrity regardless of external client access.\n\n"
        "Future Enhancements include:\n"
        "1. Automated Timetable Generation: Applying constraint satisfaction algorithms to schedule examinations and venues without conflicts.\n"
        "2. Cryptographic Transcript Verification: Embedding SHA-256 hashes into published grade records for tamper-evident digital verification.\n"
        "3. Predictive Attendance Alerts: Integrating trend analysis to notify students before attendance drops below the 75% threshold."
    )

    add_h2("3.4 References")
    add_p(
        "1. Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020). Database System Concepts (7th ed.). McGraw-Hill Education.\n"
        "2. Elmasri, R., & Navathe, S. B. (2016). Fundamentals of Database Systems (7th ed.). Pearson.\n"
        "3. Date, C. J. (2003). An Introduction to Database Systems (8th ed.). Addison-Wesley.\n"
        "4. MySQL AB / Oracle Corporation. (2024). MySQL 8.4 Reference Manual: Stored Programs, Triggers, Views, and Optimization.\n"
        "5. MongoDB, Inc. (2024). MongoDB Manual: Flexible Document Modeling and Aggregation Pipeline Framework.\n"
        "6. University Grants Commission (UGC), New Delhi. (2015). Guidelines on Adoption of Choice Based Credit System (CBCS) and 10-Point Absolute Grading Scale.\n"
        "7. Dept. of Electronics and Telecommunication Engineering, PICT Pune. (2026). Project Based Learning (PBL) Activity Guidelines for DBMS."
    )

    # Save document
    doc.save(output_filename)
    print(f"Successfully generated report at: {output_filename}")

if __name__ == "__main__":
    create_full_report()
