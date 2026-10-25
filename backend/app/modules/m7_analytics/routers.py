from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission
from app.modules.m7_analytics.service import AnalyticsService
from app.modules.m7_analytics.schemas import (
    PaginatedResponse,
    IntegrityCheckResponse,
    AdminDashboardResponse,
    FacultyDashboardResponse,
    StudentDashboardResponse
)
from app.core.errors import APIError

router = APIRouter(prefix="/analytics", tags=["Analytics and Audit"])
analytics_service = AnalyticsService()

@router.get("/reports/{report_key}", summary="Get report data", description="Returns data for RP-1 to RP-10. Export to CSV via export_csv=true.")
def get_report(
    report_key: str,
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    export_csv: bool = Query(False),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Admin"]))
) -> Any:
    # Extract filter parameters (everything except standard query params)
    filters = dict(request.query_params)
    filters.pop("page", None)
    filters.pop("size", None)
    filters.pop("export_csv", None)
    
    # Handle specific types if needed, but strings work for most exact matches in mysql
    if "defaulter_threshold" in filters:
        filters["defaulter_threshold"] = float(filters["defaulter_threshold"])
        
    return analytics_service.get_report(db, report_key, filters, page, size, export_csv)

@router.get("/audit-logs", summary="Get unified audit logs", description="Unified audit trail across general and fee ledgers. Export to CSV via export_csv=true.")
def get_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    export_csv: bool = Query(False),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Admin"]))
) -> Any:
    filters = dict(request.query_params)
    filters.pop("page", None)
    filters.pop("size", None)
    filters.pop("export_csv", None)
    
    return analytics_service.get_audit_logs(db, filters, page, size, export_csv=export_csv)

@router.get("/integrity/checks", response_model=List[IntegrityCheckResponse], summary="Run and get integrity checks")
def run_integrity_checks(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Admin"]))
):
    return analytics_service.run_integrity_checks(db)

@router.get("/dashboard/admin", response_model=AdminDashboardResponse, summary="Get Admin dashboard metrics")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Admin"]))
):
    return analytics_service.get_admin_dashboard(db)

@router.get("/dashboard/faculty", response_model=FacultyDashboardResponse, summary="Get Faculty dashboard metrics")
def get_faculty_dashboard(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Faculty"]))
):
    # Get employee_id for the current user
    res = db.execute(text("SELECT employee_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).scalar()
    if not res:
        raise APIError(code="NOT_FOUND", message="No employee record linked to user", status_code=404)
        
    return analytics_service.get_faculty_dashboard(db, res)

@router.get("/dashboard/student", response_model=StudentDashboardResponse, summary="Get Student dashboard metrics")
def get_student_dashboard(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_role(["Student"]))
):
    # Get student_id for the current user
    res = db.execute(text("SELECT student_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).scalar()
    if not res:
        raise APIError(code="NOT_FOUND", message="No student record linked to user", status_code=404)
        
    return analytics_service.get_student_dashboard(db, res)
