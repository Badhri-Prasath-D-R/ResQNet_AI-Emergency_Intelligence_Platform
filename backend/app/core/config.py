import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Load the .env file located in the backend directory (two levels up from this file)
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings(BaseSettings):
    MONGO_URI: str = Field(default_factory=lambda: os.environ.get("MONGO_URI", "mongodb://localhost:27017/resqnet"))
    JWT_SECRET: str = Field(default_factory=lambda: os.environ.get("JWT_SECRET", "supersecretjwtkeychangeinproduction12345!"))
    JWT_EXPIRE: int = Field(default_factory=lambda: int(os.environ.get("JWT_EXPIRE", "1440")))
    USE_CLOUD_AI: bool = Field(default_factory=lambda: os.environ.get("USE_CLOUD_AI", "false").lower() == "true")
    LM_STUDIO_BASE_URL: str = Field(default_factory=lambda: os.environ.get("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1"))
    AI_MODEL_NAME: str = Field(default_factory=lambda: os.environ.get("AI_MODEL_NAME", "google/gemma-4-e4b"))
    CLOUD_AI_BASE_URL: str = Field(default_factory=lambda: os.environ.get("CLOUD_AI_BASE_URL", "https://openrouter.ai/api/v1"))
    CLOUD_AI_API_KEY: str = Field(default_factory=lambda: os.environ.get("CLOUD_AI_API_KEY", ""))
    CLOUD_AI_MODEL_NAME: str = Field(default_factory=lambda: os.environ.get("CLOUD_AI_MODEL_NAME", "google/gemini-2.5-flash"))
    FRONTEND_URL: str = Field(default_factory=lambda: os.environ.get("FRONTEND_URL", "http://localhost:5173"))
    BACKEND_URL: str = Field(default_factory=lambda: os.environ.get("BACKEND_URL", "http://localhost:8000"))
    PORT: int = Field(default_factory=lambda: int(os.environ.get("PORT", "8000")))
    HOST: str = Field(default_factory=lambda: os.environ.get("HOST", "0.0.0.0"))

    model_config = SettingsConfigDict(
        extra="ignore"
    )

settings = Settings()
