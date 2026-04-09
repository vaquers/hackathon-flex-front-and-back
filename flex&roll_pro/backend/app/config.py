from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Flex&Roll AI Backend"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = True

    # CORS — populated from env; includes Bitrix24 iframe origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.bitrix24.ru",
        "https://*.bitrix24.com",
    ]

    # Mock mode — use in-memory fake data providers for non-lead endpoints
    USE_MOCK: bool = True

    # ── Lead generation ──────────────────────────────────────────────────────
    OPENROUTER_API_KEY: str = ""
    LLM_MODEL: str = "google/gemini-2.0-flash-001"

    # ── Bitrix24 local app ───────────────────────────────────────────────────
    BITRIX_CLIENT_ID: str = ""
    BITRIX_CLIENT_SECRET: str = ""
    BITRIX_SCOPE: str = "crm,user"

    # Public URLs for deployment
    FRONTEND_PUBLIC_URL: str = "http://localhost:5173"
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
