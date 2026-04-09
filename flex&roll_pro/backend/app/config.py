from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Flex&Roll AI Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # CORS — add your frontend URL in production
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Mock mode — use in-memory fake data providers
    # Set to False to enable real integrations
    USE_MOCK: bool = True

    # TODO: Add when connecting real services
    # BITRIX24_WEBHOOK_URL: str = ""
    # OPENAI_API_KEY: str = ""
    # ANTHROPIC_API_KEY: str = ""
    # QDRANT_URL: str = "http://localhost:6333"
    # DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/flexroll"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
