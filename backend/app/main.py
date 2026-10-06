from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.errors import APIError, create_error_response
from app.core.logging import setup_logging
from app.db.engine import engine
from app.modules.m1_core.routers import router as m1_router
from app.modules.m2_academics.routers import router as m2_router

setup_logging()

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

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

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return create_error_response(exc.code, exc.message, exc.status_code, exc.field_errors)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger(__name__).error(f"Unhandled Exception: {exc}", exc_info=True)
    return create_error_response("INTERNAL_SERVER_ERROR", "An internal server error occurred", 500)

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

