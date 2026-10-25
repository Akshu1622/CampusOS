from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.errors import APIError

VIEW_CONFIGS: Dict[str, Dict[str, Any]] = {
    "vw_dept_student_ranking": {
        "columns": {"department_id", "department_name", "program_name", "student_id", "first_name", "last_name", "cgpa", "dept_rank"},
        "default_order": "department_name ASC, dept_rank ASC",
        "search_cols": ["first_name", "last_name", "department_name", "program_name"]
    },
    "vw_program_term_ranking": {
        "columns": {"program_id", "program_name", "term_id", "term_year", "term_label", "student_id", "first_name", "last_name", "cgpa", "prog_term_rank"},
        "default_order": "program_name ASC, term_label ASC, prog_term_rank ASC",
        "search_cols": ["first_name", "last_name", "program_name", "term_label"]
    },
    "vw_course_attendance_summary": {
        "columns": {"offering_id", "course_code", "course_title", "term_label", "faculty_name", "total_enrollments", "total_sessions", "avg_attendance_pct"},
        "default_order": "avg_attendance_pct ASC",
        "search_cols": ["course_code", "course_title", "faculty_name", "term_label"]
    },
    "vw_high_dues_students": {
        "columns": {"student_id", "global_student_id", "first_name", "last_name", "program_name", "total_dues", "average_dues"},
        "default_order": "total_dues DESC",
        "search_cols": ["global_student_id", "first_name", "last_name", "program_name"]
    },
    "vw_hostel_occupancy": {
        "columns": {"hostel_id", "hostel_name", "gender_block", "total_capacity", "occupied_beds", "available_beds", "occupancy_pct"},
        "default_order": "occupancy_pct DESC",
        "search_cols": ["hostel_name", "gender_block"]
    },
    "vw_payroll_summary": {
        "columns": {"payroll_month", "department_id", "department_name", "employee_count", "total_gross_pay", "total_deductions", "total_net_pay"},
        "default_order": "payroll_month DESC, total_gross_pay DESC",
        "search_cols": ["department_name", "payroll_month"]
    },
    "vw_faculty_leave_utilisation": {
        "columns": {"employee_id", "first_name", "last_name", "department_name", "leave_type_name", "annual_quota", "used_leave", "available_balance"},
        "default_order": "department_name ASC, last_name ASC, first_name ASC",
        "search_cols": ["first_name", "last_name", "department_name", "leave_type_name"]
    },
    "vw_course_pass_percentage": {
        "columns": {"offering_id", "term_label", "course_code", "course_title", "faculty_name", "total_results", "passed_count", "failed_count", "pass_pct", "grade_a_count", "grade_b_count", "grade_c_count", "grade_f_count"},
        "default_order": "pass_pct ASC",
        "search_cols": ["course_code", "course_title", "faculty_name", "term_label"]
    },
    "vw_exam_blocked_students": {
        "columns": {"student_id", "global_student_id", "student_name", "term_label", "course_code", "course_title", "attendance_pct"},
        "default_order": "student_name ASC, course_code ASC",
        "search_cols": ["student_name", "global_student_id", "course_code", "course_title"]
    },
    "vw_audit_log_unified": {
        "columns": {"source", "log_id", "entity_name", "entity_id", "action", "before_state", "after_state", "actor", "timestamp"},
        "default_order": "timestamp DESC",
        "search_cols": ["entity_name", "entity_id", "actor", "action", "source"]
    }
}

class AnalyticsRepository:
    def _paginate_query(self, db: Session, base_query: str, count_query: str, params: Dict[str, Any], page: int, size: int) -> Tuple[List[Dict[str, Any]], int]:
        total = db.execute(text(count_query), params).scalar() or 0
        
        paginated_query = f"{base_query} LIMIT :limit OFFSET :offset"
        query_params = dict(params)
        query_params["limit"] = size
        query_params["offset"] = (page - 1) * size
        
        result = db.execute(text(paginated_query), query_params).mappings().all()
        return [dict(r) for r in result], total
        
    def _execute_view_query(self, db: Session, view_name: str, filters: Dict[str, Any], page: int, size: int, export: bool = False, order_by: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
        cfg = VIEW_CONFIGS.get(view_name, {"columns": set(), "default_order": "", "search_cols": []})
        valid_columns = cfg["columns"]
        sort_order = order_by or cfg.get("default_order", "")

        where_clauses = []
        params = {}
        
        # Filter processing
        for k, v in filters.items():
            if v is None or v == "":
                continue
            
            # General search filter across text columns
            if k == "search":
                search_terms = []
                for idx, col in enumerate(cfg.get("search_cols", [])):
                    p_name = f"search_{idx}"
                    search_terms.append(f"{col} LIKE :{p_name}")
                    params[p_name] = f"%{v}%"
                if search_terms:
                    where_clauses.append("(" + " OR ".join(search_terms) + ")")
                continue

            # Special date range filters
            if k in ("date_from", "start_date"):
                date_val = f"{v} 00:00:00" if len(str(v)) == 10 else str(v)
                where_clauses.append("timestamp >= :date_from")
                params["date_from"] = date_val
                continue
            if k in ("date_to", "end_date"):
                date_val = f"{v} 23:59:59" if len(str(v)) == 10 else str(v)
                where_clauses.append("timestamp <= :date_to")
                params["date_to"] = date_val
                continue

            # Map alias keys to standard column names
            col_name = k
            if k in ("module", "source_module"):
                col_name = "source"
            elif k in ("user", "username"):
                col_name = "actor"
            elif k == "entity":
                col_name = "entity_name"

            # Check if valid column
            if col_name in valid_columns:
                # String partial search vs exact match
                if isinstance(v, str) and not v.isdigit():
                    params[col_name] = v
                    where_clauses.append(f"{col_name} = :{col_name}")
                else:
                    params[col_name] = v
                    where_clauses.append(f"{col_name} = :{col_name}")
                
        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)
            
        order_sql = f"ORDER BY {sort_order}" if sort_order else ""
        base_query = f"SELECT * FROM {view_name} {where_sql} {order_sql}".strip()
        
        if export:
            result = db.execute(text(base_query), params).mappings().all()
            return [dict(r) for r in result], len(result)
            
        count_query = f"SELECT COUNT(*) FROM {view_name} {where_sql}".strip()
        return self._paginate_query(db, base_query, count_query, params, page, size)

    def get_report(self, db: Session, report_key: str, filters: Dict[str, Any], page: int, size: int, export: bool = False) -> Tuple[List[Dict[str, Any]], int]:
        view_mapping = {
            "RP-1": "vw_dept_student_ranking",
            "RP-2": "vw_program_term_ranking",
            "RP-3": "vw_course_attendance_summary",
            "RP-5": "vw_high_dues_students",
            "RP-6": "vw_hostel_occupancy",
            "RP-7": "vw_payroll_summary",
            "RP-8": "vw_faculty_leave_utilisation",
            "RP-9": "vw_course_pass_percentage",
            "RP-10": "vw_exam_blocked_students"
        }
        
        # Handle RP-4: Stored procedure sp_fee_collection_summary
        if report_key == "RP-4":
            threshold = float(filters.get("defaulter_threshold", 0.0) or 0.0)
            result = db.execute(
                text("CALL sp_fee_collection_summary(:threshold)"),
                {"threshold": threshold}
            ).mappings().all()
            data = [dict(r) for r in result]
            
            # In-memory filtering if requested
            prog_filter = str(filters.get("program_name", "")).strip().lower()
            term_filter = str(filters.get("term_label", "")).strip().lower()
            search_filter = str(filters.get("search", "")).strip().lower()
            
            if prog_filter:
                data = [r for r in data if prog_filter in str(r.get("program_name", "")).lower()]
            if term_filter:
                data = [r for r in data if term_filter in str(r.get("term_label", "")).lower()]
            if search_filter:
                data = [r for r in data if search_filter in str(r.get("program_name", "")).lower() or search_filter in str(r.get("term_label", "")).lower()]
                
            total = len(data)
            if export:
                return data, total
            start = (page - 1) * size
            end = start + size
            return data[start:end], total
            
        if report_key not in view_mapping:
            raise APIError(code="VALIDATION_ERROR", message=f"Invalid report key: {report_key}", status_code=400)
            
        view_name = view_mapping[report_key]
        clean_filters = dict(filters)

        # RP-2 specific: Top N students (prog_term_rank <= limit)
        if report_key == "RP-2":
            top_n = clean_filters.pop("limit", None) or clean_filters.pop("top_n", None)
            where_extra = []
            params_extra = {}
            if top_n is not None and str(top_n).isdigit():
                where_extra.append("prog_term_rank <= :top_n_val")
                params_extra["top_n_val"] = int(top_n)

            # Build query with extra filter
            cfg = VIEW_CONFIGS[view_name]
            base_where = []
            for k, v in clean_filters.items():
                if v and k in cfg["columns"]:
                    base_where.append(f"{k} = :{k}")
                    params_extra[k] = v
            all_where = where_extra + base_where
            where_sql = ("WHERE " + " AND ".join(all_where)) if all_where else ""
            base_query = f"SELECT * FROM {view_name} {where_sql} ORDER BY {cfg['default_order']}"
            if export:
                res = db.execute(text(base_query), params_extra).mappings().all()
                return [dict(r) for r in res], len(res)
            count_query = f"SELECT COUNT(*) FROM {view_name} {where_sql}"
            return self._paginate_query(db, base_query, count_query, params_extra, page, size)

        # RP-3 specific: Low attendance threshold (avg_attendance_pct <= threshold)
        if report_key == "RP-3":
            threshold_val = clean_filters.pop("threshold", None) or clean_filters.pop("attendance_threshold", None)
            where_extra = []
            params_extra = {}
            if threshold_val is not None:
                try:
                    where_extra.append("avg_attendance_pct <= :thresh_val")
                    params_extra["thresh_val"] = float(threshold_val)
                except (ValueError, TypeError):
                    pass

            cfg = VIEW_CONFIGS[view_name]
            base_where = []
            for k, v in clean_filters.items():
                if v and k in cfg["columns"]:
                    base_where.append(f"{k} = :{k}")
                    params_extra[k] = v
            all_where = where_extra + base_where
            where_sql = ("WHERE " + " AND ".join(all_where)) if all_where else ""
            base_query = f"SELECT * FROM {view_name} {where_sql} ORDER BY {cfg['default_order']}"
            if export:
                res = db.execute(text(base_query), params_extra).mappings().all()
                return [dict(r) for r in res], len(res)
            count_query = f"SELECT COUNT(*) FROM {view_name} {where_sql}"
            return self._paginate_query(db, base_query, count_query, params_extra, page, size)

        return self._execute_view_query(db, view_name, clean_filters, page, size, export)

    def get_audit_logs(self, db: Session, filters: Dict[str, Any], page: int, size: int, export: bool = False) -> Tuple[List[Dict[str, Any]], int]:
        return self._execute_view_query(db, "vw_audit_log_unified", filters, page, size, export=export)

    def run_integrity_checks(self, db: Session) -> List[Dict[str, Any]]:
        result = db.execute(text("CALL sp_run_integrity_checks()")).mappings().all()
        return [dict(r) for r in result]

    def get_admin_dashboard(self, db: Session) -> Dict[str, Any]:
        result = db.execute(text("SELECT * FROM vw_admin_dashboard")).mappings().first()
        base = dict(result) if result else {}
        from app.modules.m7_analytics.dashboard_helpers import enrich_admin_dashboard
        return enrich_admin_dashboard(db, base)

    def get_faculty_dashboard(self, db: Session, faculty_id: int) -> Dict[str, Any]:
        result = db.execute(
            text("CALL sp_faculty_dashboard(:faculty_id)"),
            {"faculty_id": faculty_id}
        ).mappings().first()
        base = dict(result) if result else {}
        from app.modules.m7_analytics.dashboard_helpers import enrich_faculty_dashboard
        return enrich_faculty_dashboard(db, base, faculty_id)

    def get_student_dashboard(self, db: Session, student_id: int) -> Dict[str, Any]:
        result = db.execute(
            text("CALL sp_student_dashboard(:student_id)"),
            {"student_id": student_id}
        ).mappings().first()
        base = dict(result) if result else {}
        from app.modules.m7_analytics.dashboard_helpers import enrich_student_dashboard
        return enrich_student_dashboard(db, base, student_id)
