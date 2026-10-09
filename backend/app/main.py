from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.errors import APIError, create_error_response
from app.core.logging import setup_logging
from app.core.limiter import limiter
from app.db.engine import engine
from app.modules.m1_core.routers import router as m1_router
from app.modules.m2_academics.routers import router as m2_router
from app.modules.m3_attendance_exams.routers import m3_router
from app.modules.m4_finance.routers import m4_router
from app.modules.m5_hr.routers import m5_router
from app.modules.m6_hostel.routers import router as m6_router
from app.modules.m7_analytics.routers import router as m7_router

setup_logging()

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Setup
origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

from fastapi.exceptions import RequestValidationError
import uuid

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(map(str, err.get("loc", []))), "msg": err.get("msg", "")} for err in exc.errors()]
    return create_error_response("VALIDATION_ERROR", "Invalid request parameters", 422, field_errors=errors)

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return create_error_response(exc.code, exc.message, exc.status_code, exc.field_errors)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import logging
    req_id = str(uuid.uuid4())
    logging.getLogger(__name__).error(f"Unhandled Exception [{req_id}]: {exc}", exc_info=True)
    return create_error_response("INTERNAL_SERVER_ERROR", "An internal server error occurred", 500, req_id=req_id)

@app.get("/health", tags=["System"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "database": "disconnected"})

# Include Routers
app.include_router(m1_router, prefix=settings.API_V1_STR)
app.include_router(m2_router, prefix=settings.API_V1_STR)
app.include_router(m3_router)
app.include_router(m4_router, prefix=settings.API_V1_STR)
app.include_router(m5_router)
app.include_router(m6_router)
app.include_router(m7_router, prefix=settings.API_V1_STR)

