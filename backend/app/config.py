"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CampusMart"
    env: str = "development"
    database_url: str = "sqlite:///./campusmart.db"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    frontend_origin: str = "http://localhost:5173"
    allowed_email_domains: str = "ssn.edu.in"
    allow_any_email: bool = False
    auto_verify: bool = True
    cloudinary_url: str = ""
    upload_dir: str = "./uploads"
    max_image_mb: int = 5
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@campusmart.local"
    admin_email: str = "admin@ssn.edu.in"
    admin_password: str = "Admin@12345"
    prohibited_keywords: str = "weapon,gun,knife,alcohol,liquor,drug,vape,cigarette"

    class Config:
        env_file = ".env"


settings = Settings()
