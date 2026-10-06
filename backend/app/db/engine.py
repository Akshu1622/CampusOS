from sqlalchemy import create_engine
from app.core.config import settings

# Create engine using settings
# Pool pre-ping ensures connections are alive before using them
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=50
)
