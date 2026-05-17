from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/whiterabbit"

    # Anthropic
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"
    claude_max_tokens: int = 1000

    # CRM
    hubspot_api_key: str = ""
    pipedrive_api_token: str = ""
    pipedrive_domain: str = ""

    # Contact enrichment
    apollo_api_key: str = ""
    kaspr_api_key: str = ""

    # App
    app_env: str = "development"
    app_secret_key: str = "change-this-in-production"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
