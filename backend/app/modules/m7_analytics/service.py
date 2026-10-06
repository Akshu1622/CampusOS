import csv
from io import StringIO
from typing import List, Dict, Any, Tuple
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.modules.m7_analytics.repository import AnalyticsRepository
from app.core.errors import APIError

class AnalyticsService:
    def __init__(self):
        self.repository = AnalyticsRepository()
        
    def _generate_csv(self, data: List[Dict[str, Any]], filename: str) -> StreamingResponse:
        if not data:
            return StreamingResponse(iter([]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}.csv"})
            
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )

    def get_report(self, db: Session, report_key: str, filters: Dict[str, Any], page: int, size: int, export_csv: bool = False):
        data, total = self.repository.get_report(db, report_key, filters, page, size, export=export_csv)
        if export_csv:
            return self._generate_csv(data, report_key)
            
        return {
            "data": data,
            "total": total,
            "page": page,
            "size": size
        }

    def get_audit_logs(self, db: Session, filters: Dict[str, Any], page: int, size: int):
        data, total = self.repository.get_audit_logs(db, filters, page, size)
        return {
            "data": data,
            "total": total,
            "page": page,
            "size": size
        }

    def run_integrity_checks(self, db: Session):
        return self.repository.run_integrity_checks(db)

    def get_admin_dashboard(self, db: Session):
        return self.repository.get_admin_dashboard(db)

    def get_faculty_dashboard(self, db: Session, faculty_id: int):
        return self.repository.get_faculty_dashboard(db, faculty_id)

    def get_student_dashboard(self, db: Session, student_id: int):
        return self.repository.get_student_dashboard(db, student_id)
