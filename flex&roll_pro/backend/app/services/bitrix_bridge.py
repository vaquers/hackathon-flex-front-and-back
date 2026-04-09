import logging
import re
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger("bitrix_bridge")


class BitrixBridgeError(RuntimeError):
    """Raised when the external Bitrix bridge cannot fulfill a request."""


def _base_url() -> str:
    if not settings.BITRIX_BRIDGE_URL:
        raise BitrixBridgeError("BITRIX_BRIDGE_URL is not configured")
    return settings.BITRIX_BRIDGE_URL.rstrip("/")


async def bridge_request(
    method: str,
    path: str,
    *,
    json: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
) -> Any:
    url = f"{_base_url()}{path}"
    timeout = settings.BITRIX_BRIDGE_TIMEOUT_SEC

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.request(method, url, json=json, params=params)
        except httpx.HTTPError as exc:
            logger.error("Bitrix bridge request failed: %s %s -> %s", method, url, exc)
            raise BitrixBridgeError(f"Bitrix bridge unavailable: {exc}") from exc

    try:
        payload = response.json()
    except ValueError:
        payload = {"error": response.text}

    if not response.is_success:
        detail = payload.get("error") if isinstance(payload, dict) else response.text
        raise BitrixBridgeError(
            str(detail or f"Bridge returned {response.status_code}")
            if response.status_code == 200
            else f"Bridge returned {response.status_code}: {detail or response.text}"
        )

    return payload


def normalize_match_key(value: str | None) -> str:
    if not value:
        return ""
    normalized = re.sub(r"\s+", " ", value).strip().casefold()
    return normalized.replace("ё", "е")


async def list_bridge_contacts() -> list[dict[str, Any]]:
    payload = await bridge_request("GET", "/contacts")
    return payload if isinstance(payload, list) else []


async def list_bridge_team() -> list[dict[str, Any]]:
    payload = await bridge_request("GET", "/employees/team")
    return payload if isinstance(payload, list) else []


def match_bridge_contact(
    contacts: list[dict[str, Any]],
    *,
    client_name: str,
    company_name: str | None = None,
    email: str | None = None,
) -> dict[str, Any] | None:
    if not contacts:
        return None

    email_key = normalize_match_key(email)
    if email_key:
        for contact in contacts:
            if normalize_match_key(contact.get("email")) == email_key:
                return contact

    candidate_keys = [
        normalize_match_key(client_name),
        normalize_match_key(company_name),
    ]
    candidate_keys = [key for key in candidate_keys if key]

    for key in candidate_keys:
        for contact in contacts:
            if normalize_match_key(contact.get("name")) == key:
                return contact

    for key in candidate_keys:
        key_tokens = set(key.split())
        if not key_tokens:
            continue
        for contact in contacts:
            contact_tokens = set(normalize_match_key(contact.get("name")).split())
            if key_tokens and contact_tokens and key_tokens & contact_tokens == key_tokens:
                return contact

    return None


async def resolve_bridge_contact(
    *,
    client_name: str,
    company_name: str | None = None,
    email: str | None = None,
) -> dict[str, Any] | None:
    contacts = await list_bridge_contacts()
    return match_bridge_contact(
        contacts,
        client_name=client_name,
        company_name=company_name,
        email=email,
    )
