"""
Bitrix24 integration endpoints.

- /install — handles app installation callback from Bitrix24
- /app — entry point URL for the Bitrix24 iframe (redirects to frontend)
"""

import logging
from fastapi import APIRouter, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from app.config import settings
from app.bitrix.auth import exchange_code, get_tokens
from app.schemas.common import ApiResponse

logger = logging.getLogger("bitrix_router")

router = APIRouter(prefix="/bitrix", tags=["Bitrix24"])


@router.get("/install")
async def install(
    code: str = Query(None),
    domain: str = Query(None),
    member_id: str = Query(None),
    scope: str = Query(None),
    server_endpoint: str = Query(None),
):
    """
    Bitrix24 app installation handler.
    Called when a portal admin installs the app.
    Exchanges the auth code for access/refresh tokens.
    """
    if not code or not domain:
        return HTMLResponse(
            "<h3>Flex&Roll AI</h3><p>Ошибка установки: отсутствует code или domain.</p>",
            status_code=400,
        )

    try:
        tokens = await exchange_code(code, domain, server_endpoint)
        logger.info("App installed on portal %s (member_id=%s)", domain, member_id)
        return HTMLResponse(
            "<h3>Flex&Roll AI</h3>"
            "<p>Приложение успешно установлено!</p>"
            "<script>BX24.installFinish();</script>"
        )
    except Exception as e:
        logger.exception("Install failed for %s: %s", domain, e)
        return HTMLResponse(
            f"<h3>Ошибка установки</h3><p>{e}</p>",
            status_code=500,
        )


@router.get("/app")
async def app_entry(
    domain: str = Query(None),
    DOMAIN: str = Query(None),
):
    """
    App entry point — Bitrix24 loads this URL in iframe.
    Redirects to frontend with domain context.
    """
    portal_domain = domain or DOMAIN
    frontend_url = settings.FRONTEND_PUBLIC_URL
    if portal_domain:
        frontend_url += f"?bitrix_domain={portal_domain}"
    return RedirectResponse(url=frontend_url)


@router.get("/install/check", response_model=ApiResponse)
async def check_install(domain: str = Query(None)):
    """Check if a portal has valid tokens."""
    if not domain:
        return ApiResponse(data={"installed": False, "reason": "no domain"})
    tokens = get_tokens(domain)
    if not tokens:
        return ApiResponse(data={"installed": False, "reason": "not installed"})
    return ApiResponse(data={
        "installed": True,
        "domain": domain,
        "member_id": tokens.member_id,
        "token_expired": tokens.is_expired,
    })
