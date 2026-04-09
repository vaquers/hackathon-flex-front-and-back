import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# ─── Iframe / X-Frame-Options ────────────────────────────────────────────────
@app.middleware("http")
async def add_iframe_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "ALLOWALL"
    response.headers["Content-Security-Policy"] = "frame-ancestors *;"
    return response

# ─── CORS ─────────────────────────────────────────────────────────────────────
# In production, CORS_ORIGINS should include the Vercel frontend URL and
# the Bitrix24 portal domain (*.bitrix24.ru).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://localhost:\d+|https://.*\.vercel\.app|https://.*\.bitrix24\.(ru|com)",
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


# ─── Serve Frontend SPA ──────────────────────────────────────────────────────
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

if STATIC_DIR.is_dir():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        """Serve frontend SPA — return index.html for all non-API routes."""
        # Try to serve the exact file first
        file_path = STATIC_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise return index.html for client-side routing
        return FileResponse(str(STATIC_DIR / "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}", "docs": "/api/docs"}
