import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-load cached leads
    from app.services.lead_generator import get_lead_service
    get_lead_service()
    logging.getLogger("startup").info("Lead generator service initialized")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Flex&Roll AI Backend — AI-powered CRM overlay for Bitrix24",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# In production, CORS_ORIGINS should include the Vercel frontend URL and
# the Bitrix24 portal domain (*.bitrix24.ru).
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
    from app.services.lead_generator import get_lead_service
    svc = get_lead_service()
    status = svc.get_status()
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "mock" if settings.USE_MOCK else "production",
        "pipeline_status": status["pipeline_status"],
        "leads_cached": status["leads_count"],
    }


@app.get("/", include_in_schema=False)
async def root():
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}", "docs": "/api/docs"}
