import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "CampusOS API"
    API_V1_STR: str = "/api/v1"
    
    # DB Connection (Read from .env)
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "university_erp"
    MYSQL_APP_USER: str = "app"
    MYSQL_APP_PASSWORD: str = "apppassword"
    
    # Security / JWT
    SECRET_KEY: str = "SUPER_SECRET_KEY_REPLACE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Auth Lockout
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_WINDOW_MINUTES: int = 15
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "*" # Comma-separated list for origins

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_APP_USER}:{self.MYSQL_APP_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        # Search for .env in parent directory as well
        env_file_encoding = "utf-8"
        extra = "ignore"

# We load settings directly, but specify env_file path explicitly to find it in project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
env_path = os.path.join(project_root, '.env')

settings = Settings(_env_file=env_path, _env_file_encoding="utf-8") if os.path.exists(env_path) else Settings()
