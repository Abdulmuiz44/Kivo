from pydantic import BaseSettings, Field
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = Field("Kivo", description="Application name")
    DEBUG: bool = Field(False, description="Debug mode")
    DATA_PATH: str = Field("data", description="Local data directory")
    storage_path: str = Field("storage", description="Where to store research outputs")  # 👈 snake_case

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

def get_settings() -> Settings:
    settings = Settings()
    Path(settings.storage_path).mkdir(parents=True, exist_ok=True)  # 👈 matches research_runner
    return settings
