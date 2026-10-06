from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.errors import APIError

class AnalyticsRepository:
    def _paginate_query(self, db: Session, base_query: str, count_query: str, params: Dict[str, Any], page: int, size: int) -> Tuple[List[Dict[str, Any]], int]:
        total = db.execute(text(count_query), params).scalar() or 0
        
        paginated_query = f"{base_query} LIMIT :limit OFFSET :offset"
        params["limit"] = size
        params["offset"] = (page - 1) * size
        
        result = db.execute(text(paginated_query), params).mappings().all()
        return [dict(r) for r in result], total
        
    def _execute_view_query(self, db: Session, view_name: str, filters: Dict[str, Any], page: int, size: int, export: bool = False) -> Tuple[List[Dict[str, Any]], int]:
        where_clauses = []
        params = {}
        
        for k, v in filters.items():
            if v is not None:
                where_clauses.append(f"{k} = :{k}")
                params[k] = v
                
        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)
            
        base_query = f"SELECT * FROM {view_name} {where_sql}"
        
        if export:
            # For export, fetch everything matching the filter
            result = db.execute(text(base_query), params).mappings().all()
            return [dict(r) for r in result], len(result)
            
        count_query = f"SELECT COUNT(*) FROM {view_name} {where_sql}"
        return self._paginate_query(db, base_query, count_query, params, page, size)

    def get_report(self, db: Session, report_key: str, filters: Dict[str, Any], page: int, size: int, export: bool = False) -> Tuple[List[Dict[str, Any]], int]:
        # Mapping report keys to views/procedures
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
        
        if report_key == "RP-4":
            threshold = filters.get("defaulter_threshold", 0.0)
            result = db.execute(
                text("CALL sp_fee_collection_summary(:threshold)"),
                {"threshold": threshold}
            ).mappings().all()
            data = [dict(r) for r in result]
            if export:
                return data, len(data)
            # Simulate pagination for procedure result
            start = (page - 1) * size
            end = start + size
            return data[start:end], len(data)
            
        if report_key not in view_mapping:
            raise APIError(code="VALIDATION_ERROR", message=f"Invalid report key: {report_key}", status_code=400)
            
        view_name = view_mapping[report_key]
        return self._execute_view_query(db, view_name, filters, page, size, export)

    def get_audit_logs(self, db: Session, filters: Dict[str, Any], page: int, size: int) -> Tuple[List[Dict[str, Any]], int]:
        return self._execute_view_query(db, "vw_audit_log_unified", filters, page, size)

    def run_integrity_checks(self, db: Session) -> List[Dict[str, Any]]:
        # Procedure returns a result set
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
