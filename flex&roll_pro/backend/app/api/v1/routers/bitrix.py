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
            '<script src="https://api.bitrix24.com/api/v1/"></script>'
            "<h3>Flex&Roll AI</h3>"
            "<p>Приложение успешно установлено!</p>"
            "<script>BX24.installFinish();</script>",
            headers={"X-Frame-Options": "ALLOWALL", "Content-Security-Policy": "frame-ancestors *;"},
        )
    except Exception as e:
        logger.exception("Install failed for %s: %s", domain, e)
        return HTMLResponse(
            f"<h3>Ошибка установки</h3><p>{e}</p>",
            status_code=500,
        )


@router.get("/app")
async def app_entry(
    request: Request,
    domain: str = Query(None),
    DOMAIN: str = Query(None),
):
    """
    App entry point — Bitrix24 loads this URL in iframe.
    Serves a small bootstrap page that loads frontend, avoiding redirect issues.
    """
    portal_domain = domain or DOMAIN
    frontend_url = settings.FRONTEND_PUBLIC_URL
    if portal_domain:
        frontend_url += f"?bitrix_domain={portal_domain}"

    return HTMLResponse(
        f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flex&Roll AI</title>
    <style>
        html, body {{ margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }}
        iframe {{ border: none; width: 100%; height: 100%; }}
    </style>
</head>
<body>
    <iframe src="{frontend_url}" allow="clipboard-write"></iframe>
    <script src="https://api.bitrix24.com/api/v1/"></script>
    <script>
        try {{ BX24.init(function() {{ BX24.installFinish(); }}); }} catch(e) {{}}
    </script>
</body>
</html>""",
        headers={
            "Content-Security-Policy": "frame-ancestors *;",
            "X-Frame-Options": "ALLOWALL",
        },
    )


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
