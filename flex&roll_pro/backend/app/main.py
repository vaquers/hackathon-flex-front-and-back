from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    **Flex&Roll AI Backend** — API для AI-надстройки над Bitrix24.

    В текущей версии используются mock-провайдеры данных.
    Замените `app/repositories/mock_repository.py` на реальные интеграции:
    - Bitrix24 REST API (CRM данные)
    - AI сервисы (LLM для summary, next actions)
    - Speech/call analysis (транскрипция + оценка)
    - RAG / Qdrant (поиск по документам)
    """,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "mock" if settings.USE_MOCK else "production",
    }


@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}", "docs": "/api/docs"}
