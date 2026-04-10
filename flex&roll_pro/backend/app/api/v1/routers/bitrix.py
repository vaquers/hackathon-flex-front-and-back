"""
Bitrix24 integration endpoints.

- /install — handles app installation callback from Bitrix24
- /app — entry point URL for the Bitrix24 iframe (redirects to frontend)
"""

import json
import logging
from urllib.parse import parse_qs

from fastapi import APIRouter, Request
from fastapi import HTTPException
from fastapi.responses import HTMLResponse

from app.config import settings
from app.bitrix.auth import exchange_code, get_tokens
from app.schemas.common import ApiResponse
from app.services.bitrix_bridge import (
    BitrixBridgeError,
    bridge_request,
    bridge_value,
    list_bridge_cards,
    list_bridge_contacts,
    list_bridge_team,
)

logger = logging.getLogger("bitrix_router")

router = APIRouter(prefix="/bitrix", tags=["Bitrix24"])


def _coerce_int(value: object, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_team_member(item: dict[str, object]) -> dict[str, object]:
    bitrix_user_id = _coerce_int(
        bridge_value(item, "bitrix_user_id", "user_id", "employee_id", "id"),
    )
    return {
        "id": _coerce_int(bridge_value(item, "id", "employee_id", "user_id"), bitrix_user_id),
        "bitrix_user_id": bitrix_user_id,
        "name": str(bridge_value(item, "name", "full_name", "employee_name", "user_name") or "Сотрудник"),
        "role": str(bridge_value(item, "role", "position", "title") or "Менеджер"),
        "experience_text": str(bridge_value(item, "experience_text", "experience", "description") or ""),
        "rating": _coerce_int(bridge_value(item, "rating", "score"), 0),
    }


async def _collect_bitrix_params(request: Request) -> dict[str, str]:
    """Merge Bitrix params from query string and POST body into one dict."""
    params: dict[str, str] = {}

    for key, value in request.query_params.multi_items():
        if value is not None:
            params[key] = value

    content_type = request.headers.get("content-type", "")
    if request.method == "POST":
        body = await request.body()
        if body:
            parsed_body: dict[str, str] = {}
            raw_text = body.decode("utf-8", errors="ignore")

            if "application/json" in content_type:
                try:
                    json_body = json.loads(raw_text)
                except json.JSONDecodeError:
                    json_body = {}
                if isinstance(json_body, dict):
                    parsed_body = {
                        str(key): str(value)
                        for key, value in json_body.items()
                        if value is not None
                    }
            else:
                parsed_qs = parse_qs(raw_text, keep_blank_values=True)
                parsed_body = {
                    key: values[-1]
                    for key, values in parsed_qs.items()
                    if values
                }

            for key, value in parsed_body.items():
                params[key] = value

    return params


@router.api_route("/install", methods=["GET", "POST"])
async def install(request: Request):
    """
    Bitrix24 app installation handler.
    Called when a portal admin installs the app.
    Exchanges the auth code for access/refresh tokens.
    """
    params = await _collect_bitrix_params(request)
    code = params.get("code") or params.get("AUTH_ID")
    domain = params.get("domain") or params.get("DOMAIN")
    member_id = params.get("member_id") or params.get("MEMBER_ID")
    server_endpoint = params.get("server_endpoint") or params.get("SERVER_ENDPOINT")

    if not code or not domain:
        return HTMLResponse(
            "<h3>Flex&Roll AI</h3><p>Ошибка установки: отсутствует code или domain.</p>",
            status_code=400,
        )

    try:
        await exchange_code(code, domain, server_endpoint)
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


@router.api_route("/app", methods=["GET", "POST"])
async def app_entry(request: Request):
    """
    App entry point — Bitrix24 loads this URL in iframe.
    Serves a small bootstrap page that loads frontend, avoiding redirect issues.
    """
    params = await _collect_bitrix_params(request)
    portal_domain = params.get("domain") or params.get("DOMAIN")
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
async def check_install(domain: str | None = None):
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


@router.post("/deals/sync", response_model=ApiResponse)
async def sync_deals():
    """Proxy deal synchronization to Anton's Bitrix bridge backend."""
    try:
        data = await bridge_request("POST", "/deals/sync")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/team", response_model=ApiResponse)
async def get_team():
    """Expose Anton bridge sales team in a frontend-friendly place."""
    try:
        data = [_normalize_team_member(item) for item in await list_bridge_team()]
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/bridge-health", response_model=ApiResponse)
async def bridge_health():
    """Quick diagnostics for Anton bridge availability and payload parsing."""
    try:
        cards = await list_bridge_cards()
        contacts = await list_bridge_contacts()
        team = await list_bridge_team()
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return ApiResponse(data={
        "status": "ok",
        "bridge_url": settings.BITRIX_BRIDGE_URL,
        "cards_count": len(cards),
        "contacts_count": len(contacts),
        "team_count": len(team),
        "sample_card_keys": sorted(list(cards[0].keys())) if cards else [],
        "sample_contact_keys": sorted(list(contacts[0].keys())) if contacts else [],
        "sample_team_keys": sorted(list(team[0].keys())) if team else [],
    })
