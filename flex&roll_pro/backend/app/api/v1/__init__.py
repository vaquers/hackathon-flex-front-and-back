from fastapi import APIRouter
from .routers.dashboard import router as dashboard_router
from .routers.clients import router as clients_router, calls_router
from .routers.risks import router as risks_router
from .routers.analytics import router as analytics_router
from .routers.search import router as search_router
from .routers.leads import router as leads_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(dashboard_router)
api_router.include_router(clients_router)
api_router.include_router(calls_router)
api_router.include_router(risks_router)
api_router.include_router(analytics_router)
api_router.include_router(search_router)
api_router.include_router(leads_router)
