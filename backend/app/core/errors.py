from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    msg: str

class ErrorResponse(BaseModel):
    code: str
    message: str
    field_errors: Optional[List[ErrorDetail]] = None
    request_id: Optional[str] = None

DB_ERROR_CODE_MAP = {
    # M1
    51001: ("TERM_NOT_OPEN", status.HTTP_400_BAD_REQUEST),
    # M2
    52001: ("ENROLLMENT_CAPACITY_FULL", status.HTTP_409_CONFLICT),
    52002: ("DUPLICATE_ENROLLMENT", status.HTTP_409_CONFLICT),
    52003: ("STUDENT_NOT_IN_CURRICULUM", status.HTTP_400_BAD_REQUEST),
    # M3
    53001: ("ATTENDANCE_BELOW_THRESHOLD", status.HTTP_403_FORBIDDEN),
    53002: ("EXAM_REGISTRATION_CLOSED", status.HTTP_400_BAD_REQUEST),
    53003: ("MARKS_OUT_OF_BOUNDS", status.HTTP_400_BAD_REQUEST),
    53004: ("RESULT_ALREADY_PUBLISHED", status.HTTP_409_CONFLICT),
    53005: ("EXAM_STUDENT_NOT_ENROLLED", status.HTTP_400_BAD_REQUEST),
    53006: ("EXAM_DUPLICATE_REGISTRATION", status.HTTP_409_CONFLICT),
    # M4
    54001: ("PAYMENT_EXCEEDS_BALANCE", status.HTTP_400_BAD_REQUEST),
    54002: ("DUE_ALREADY_SETTLED", status.HTTP_400_BAD_REQUEST),
    # M5
    55001: ("LEAVE_EXCEEDS_BALANCE", status.HTTP_400_BAD_REQUEST),
    -10535: ("LEAVE_EXCEEDS_BALANCE", status.HTTP_400_BAD_REQUEST),
    55002: ("OVERLAPPING_LEAVE", status.HTTP_409_CONFLICT),
    -10534: ("OVERLAPPING_LEAVE", status.HTTP_409_CONFLICT),
    55003: ("PAYROLL_ALREADY_FINALIZED", status.HTTP_409_CONFLICT),
    -10533: ("PAYROLL_ALREADY_FINALIZED", status.HTTP_409_CONFLICT),
    # M6
    56001: ("NO_BEDS_AVAILABLE", status.HTTP_409_CONFLICT),
    56002: ("ACTIVE_ALLOCATION_EXISTS", status.HTTP_409_CONFLICT),
}

class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, field_errors: Optional[List[ErrorDetail]] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.field_errors = field_errors

def create_error_response(code: str, message: str, status_code: int, field_errors: Optional[List[ErrorDetail]] = None, req_id: Optional[str] = None) -> JSONResponse:
    content = ErrorResponse(code=code, message=message, field_errors=field_errors, request_id=req_id).model_dump(exclude_none=True)
    return JSONResponse(status_code=status_code, content=content)
