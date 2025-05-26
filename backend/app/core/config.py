"""Configuration management for the application."""
import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    # Project Info
    PROJECT_NAME: str = "Unicorn API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]  # Frontend URL
    
    # API URLs
    GITHUB_GRAPHQL_URL: str = "https://api.github.com/graphql"
    API_BASE_URL: str = "http://localhost:8000"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")  # Default token for backend operations
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 