"""
RiskTerrain Configuration — Fix #17 #44 #97 #98
"""

from pydantic_settings import BaseSettings, SettingsConfigDict  # Fix #98
from pydantic import Field, field_validator

__version__ = "2.0.0"  # Fix #97: single source of truth


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")  # Fix #98

    SURREAL_URL: str = Field(default="ws://localhost:8000/rpc")
    SURREAL_NAMESPACE: str = Field(default="riskterrain")
    SURREAL_DATABASE: str = Field(default="main")
    SURREAL_USER: str = Field(default="root")
    SURREAL_PASS: str = Field(default="root")

    ANTHROPIC_API_KEY: str = Field(default="")  # Validated below
    NEWSAPI_KEY: str = Field(default="")
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    CLAUDE_MODEL: str = Field(default="claude-sonnet-4-20250514")  # Fix #44

    # Fix #17: warn if key is empty but don't crash (allows health check to work)
    @field_validator("ANTHROPIC_API_KEY")
    @classmethod
    def warn_empty_key(cls, v: str) -> str:
        if not v or v == "sk-ant-...":
            import logging
            logging.getLogger("riskterrain.config").warning(
                "ANTHROPIC_API_KEY is empty — Claude calls will fail. Set it in .env"
            )
        return v


settings = Settings()
