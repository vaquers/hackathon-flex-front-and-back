from typing import Any
from datetime import datetime, timezone
import json
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.schemas.common import ApiResponse
from app.schemas.clients import (
    Client, AiClientSummary, CommunicationEvent, CallSummary,
    CallQualityReview, AiNextAction, RelatedDocument,
)
from app.repositories import mock_repository as repo
from app.services.bitrix_bridge import (
    BitrixBridgeError,
    bridge_value,
    bridge_request,
    find_bridge_contact_by_id,
    list_bridge_cards,
    list_bridge_team,
    list_bridge_contacts,
    match_bridge_contact,
)

router = APIRouter(prefix="/clients", tags=["Clients"])
BRIDGE_CLIENT_PREFIX = "bridge-contact-"


class TempManagerAssignRequest(BaseModel):
    original_manager_bitrix_id: int
    temp_manager_bitrix_id: int


def _bridge_client_id(contact_id: int | str) -> str:
    return f"{BRIDGE_CLIENT_PREFIX}{contact_id}"


def _bridge_contact_key(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_text(value: Any, default: str) -> str:
    if value in (None, ""):
        return default
    return str(value)


def _normalize_stage(value: Any) -> tuple[str, str]:
    raw = _safe_text(value, "new").strip().casefold()
    mapping = {
        "new": ("new", "Новая"),
        "qualification": ("qualification", "Квалификация"),
        "proposal": ("proposal", "КП отправлено"),
        "negotiation": ("negotiation", "Переговоры"),
        "won": ("won", "Успешно"),
        "lost": ("lost", "Проиграно"),
        "stalled": ("stalled", "Без движения"),
    }
    return mapping.get(raw, ("qualification", _safe_text(value, "Bitrix bridge")))


def _normalize_sentiment(value: Any) -> str:
    sentiment = _safe_text(value, "neutral").casefold()
    if sentiment in {"positive", "neutral", "negative", "mixed"}:
        return sentiment
    return "neutral"


def _risk_level(score: int) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def _days_since(value: str) -> int:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - parsed.astimezone(timezone.utc)
        return max(int(delta.total_seconds() // 86400), 0)
    except ValueError:
        return 0


def _bridge_contact_to_client(contact: dict[str, Any]) -> Client | None:
    contact_id = bridge_value(contact, "id", "contact_id")
    if contact_id in (None, ""):
        return None

    name = _safe_text(
        bridge_value(contact, "name", "full_name", "contact_name"),
        f"Контакт #{contact_id}",
    )
    company = _safe_text(
        bridge_value(contact, "company", "company_name", "organization", "title"),
        name,
    )
    manager_name = _safe_text(
        bridge_value(contact, "manager_name", "responsible_name", "assigned_to_name", "manager"),
        "Backend Антона",
    )
    stage, stage_label = _normalize_stage(
        bridge_value(contact, "deal_stage", "stage", "deal_stage_label", "stage_label"),
    )
    last_contact_at = _safe_text(
        bridge_value(contact, "last_contact_at", "updated_at", "created_at"),
        datetime.now(timezone.utc).isoformat(),
    )
    risk_score = _coerce_int(bridge_value(contact, "risk_score"), 0)

    return Client(
        id=_bridge_client_id(contact_id),
        name=name,
        company=company,
        segment="mid",
        segment_label="Bitrix bridge",
        is_vip=bool(bridge_value(contact, "is_vip", "vip")),
        manager_id=_safe_text(bridge_value(contact, "manager_id", "responsible_id"), "bridge"),
        manager_name=manager_name,
        phone=_safe_text(bridge_value(contact, "phone", "phone_number", "mobile"), "") or None,
        email=_safe_text(bridge_value(contact, "email", "email_address", "mail"), "") or None,
        deal_id=_safe_text(bridge_value(contact, "deal_id", "primary_deal_id"), _bridge_client_id(contact_id)),
        deal_amount=_coerce_float(bridge_value(contact, "deal_amount", "amount", "opportunity"), 0.0),
        deal_currency=_safe_text(bridge_value(contact, "deal_currency", "currency"), "RUB"),
        deal_stage=stage,
        deal_stage_label=stage_label,
        risk_score=risk_score,
        risk_level=_risk_level(risk_score),
        risk_reason=_safe_text(
            bridge_value(contact, "risk_reason", "summary"),
            "Клиент подключён через backend Антона",
        ),
        sentiment=_normalize_sentiment(bridge_value(contact, "sentiment")),
        last_contact_at=last_contact_at,
        days_since_contact=_days_since(last_contact_at),
        product=_safe_text(bridge_value(contact, "product", "product_name"), "—"),
        expected_volume=_safe_text(bridge_value(contact, "expected_volume", "volume"), "—"),
        city=_safe_text(bridge_value(contact, "city", "location"), "—"),
        inn=_safe_text(bridge_value(contact, "inn", "unp"), "") or None,
        bridge_contact_id=_coerce_int(contact_id),
        bridge_chat_id=_safe_text(bridge_value(contact, "bitrix_chat_id", "chat_id"), "") or None,
        bridge_connected=True,
    )


def _priority_risk_score(priority: Any) -> int:
    normalized = _safe_text(priority, "").strip().casefold()
    mapping = {
        "vip": 92,
        "высокий": 78,
        "high": 78,
        "средний": 56,
        "medium": 56,
        "низкий": 24,
        "low": 24,
    }
    return mapping.get(normalized, 35)


def _parse_assigned_employee_ids(value: Any) -> list[int]:
    if value in (None, ""):
        return []

    if isinstance(value, list):
        result = []
        for item in value:
            parsed = _coerce_int(item, 0)
            if parsed:
                result.append(parsed)
        return result

    text = str(value).strip()
    if not text:
        return []

    try:
        decoded = json.loads(text)
    except json.JSONDecodeError:
        decoded = [segment for segment in re.findall(r"\d+", text)]

    if not isinstance(decoded, list):
        decoded = [decoded]

    result = []
    for item in decoded:
        parsed = _coerce_int(item, 0)
        if parsed:
            result.append(parsed)
    return result


def _resolve_bridge_manager(
    assigned_employee_ids: list[int],
    team: list[dict[str, Any]],
) -> tuple[str, str]:
    team_lookup = {
        _coerce_int(bridge_value(member, "bitrix_user_id", "user_id", "employee_id", "id"), 0): member
        for member in team
    }

    for bitrix_user_id in assigned_employee_ids:
        member = team_lookup.get(bitrix_user_id)
        if member:
            return (
                _safe_text(
                    bridge_value(member, "name", "full_name", "employee_name", "user_name"),
                    "Backend Антона",
                ),
                str(bitrix_user_id),
            )

    return ("Backend Антона", "bridge")


def _bridge_card_to_client(
    card: dict[str, Any],
    *,
    contacts: list[dict[str, Any]],
    team: list[dict[str, Any]],
) -> Client | None:
    contact_id = bridge_value(card, "contact_id", "id")
    if contact_id in (None, ""):
        return None

    contact = find_bridge_contact_by_id(contacts, contact_id)
    if not contact:
        # Client cards can outlive the contact in Anton bridge. Such cards
        # should not keep deleted clients alive in the current clients list.
        return None

    assigned_ids = _parse_assigned_employee_ids(bridge_value(card, "assigned_employees"))
    manager_name, manager_id = _resolve_bridge_manager(assigned_ids, team)

    name = _safe_text(
        bridge_value(contact, "name", "full_name", "contact_name"),
        f"Контакт #{contact_id}",
    )
    company = _safe_text(
        bridge_value(card, "company", "company_name"),
        _safe_text(
            bridge_value(contact, "company", "company_name", "organization"),
            name,
        ),
    )
    segment = _safe_text(bridge_value(card, "segment"), "")
    product = _safe_text(
        bridge_value(card, "product_type", "product"),
        _safe_text(bridge_value(contact, "product", "product_name"), "—"),
    )
    last_contact_at = _safe_text(
        bridge_value(card, "created_at"),
        _safe_text(
            bridge_value(contact, "updated_at", "created_at"),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    priority = _safe_text(bridge_value(card, "priority"), "Средний")
    risk_score = _priority_risk_score(priority)

    return Client(
        id=_bridge_client_id(contact_id),
        name=name,
        company=company,
        segment="mid",
        segment_label=segment or "Bitrix bridge",
        is_vip=priority.strip().casefold() == "vip",
        manager_id=manager_id,
        manager_name=manager_name,
        phone=_safe_text(bridge_value(contact, "phone", "phone_number", "mobile"), "") or None,
        email=_safe_text(bridge_value(contact, "email", "email_address", "mail"), "") or None,
        deal_id=_safe_text(bridge_value(card, "id"), _bridge_client_id(contact_id)),
        deal_amount=0.0,
        deal_currency="RUB",
        deal_stage="qualification",
        deal_stage_label="Bitrix bridge",
        risk_score=risk_score,
        risk_level=_risk_level(risk_score),
        risk_reason=_safe_text(
            bridge_value(card, "notes", "summary"),
            "Карточка клиента из backend Антона",
        ),
        sentiment="neutral",
        last_contact_at=last_contact_at,
        days_since_contact=_days_since(last_contact_at),
        product=product,
        expected_volume=_safe_text(bridge_value(card, "volume", "expected_volume"), "—"),
        city=_safe_text(bridge_value(contact, "city", "location"), "—"),
        inn=_safe_text(bridge_value(contact, "inn", "unp"), "") or None,
        bridge_contact_id=_coerce_int(contact_id),
        bridge_chat_id=_safe_text(bridge_value(contact, "bitrix_chat_id", "chat_id"), "") or None,
        bridge_connected=True,
    )


def _bridge_contact_id_value(contact: dict[str, Any]) -> str | None:
    value = bridge_value(contact, "id", "contact_id")
    if value in (None, ""):
        return None
    return str(value)


async def _client_with_bridge(client: Client) -> Client:
    try:
        bridge_contacts = await list_bridge_contacts()
    except BitrixBridgeError:
        return client

    bridge_contact = None
    if client.bridge_contact_id:
        bridge_contact = find_bridge_contact_by_id(bridge_contacts, client.bridge_contact_id)
    if not bridge_contact:
        bridge_contact = match_bridge_contact(
            bridge_contacts,
            client_name=client.name,
            company_name=client.company,
            email=client.email,
        )

    if not bridge_contact:
        return client

    return client.model_copy(update={
        "bridge_contact_id": _coerce_int(bridge_value(bridge_contact, "id", "contact_id")),
        "bridge_chat_id": _safe_text(bridge_value(bridge_contact, "bitrix_chat_id", "chat_id"), "") or None,
        "bridge_connected": True,
    })


async def _get_client_or_404(client_id: str) -> Client:
    client = repo.get_client(client_id)
    if client:
        return await _client_with_bridge(client)

    try:
        bridge_contacts = await list_bridge_contacts()
        bridge_cards = await list_bridge_cards()
        bridge_team = await list_bridge_team()
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    for card in bridge_cards:
        contact_key = bridge_value(card, "contact_id", "id")
        if contact_key not in (None, "") and client_id == _bridge_client_id(contact_key):
            bridge_client = _bridge_card_to_client(
                card,
                contacts=bridge_contacts,
                team=bridge_team,
            )
            if bridge_client:
                return bridge_client

    for contact in bridge_contacts:
        contact_key = bridge_value(contact, "id", "contact_id")
        if contact_key not in (None, "") and client_id == _bridge_client_id(contact_key):
            bridge_client = _bridge_contact_to_client(contact)
            if bridge_client:
                return bridge_client

    raise HTTPException(status_code=404, detail="Клиент не найден")


async def _resolve_bridge_contact_or_404(client: Client) -> dict[str, Any]:
    try:
        bridge_contacts = await list_bridge_contacts()
        bridge_contact = None
        if client.bridge_contact_id:
            bridge_contact = find_bridge_contact_by_id(bridge_contacts, client.bridge_contact_id)
        if not bridge_contact:
            bridge_contact = match_bridge_contact(
                bridge_contacts,
                client_name=client.name,
                company_name=client.company,
                email=client.email,
            )
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    bridge_contact_id = _bridge_contact_id_value(bridge_contact) if bridge_contact else None
    if not bridge_contact or not bridge_contact_id:
        raise HTTPException(
            status_code=404,
            detail="Клиент ещё не связан с Bitrix bridge backend. Нужен контакт в backend Антона.",
        )
    return bridge_contact


def _call_sort_key(call: dict[str, Any]) -> str:
    return str(call.get("started_at") or call.get("created_at") or "")


@router.get("", response_model=ApiResponse[list[Client]])
async def get_clients():
    try:
        bridge_contacts = await list_bridge_contacts()
    except BitrixBridgeError:
        bridge_contacts = []
    try:
        bridge_cards = await list_bridge_cards()
    except BitrixBridgeError:
        bridge_cards = []
    try:
        bridge_team = await list_bridge_team()
    except BitrixBridgeError:
        bridge_team = []

    if not bridge_contacts:
        clients = repo.list_clients() if settings.USE_MOCK else []
        clients.sort(key=lambda client: client.company.casefold())
        return ApiResponse(data=clients)

    bridge_cards_by_contact: dict[str, dict[str, Any]] = {}
    for card in bridge_cards:
        contact_key = _bridge_contact_key(bridge_value(card, "contact_id", "id"))
        if not contact_key or contact_key in bridge_cards_by_contact:
            continue
        if not find_bridge_contact_by_id(bridge_contacts, contact_key):
            continue
        bridge_cards_by_contact[contact_key] = card

    clients: list[Client] = []
    for contact in bridge_contacts:
        contact_key = _bridge_contact_key(bridge_value(contact, "id", "contact_id"))
        if not contact_key:
            continue

        bridge_client = None
        bridge_card = bridge_cards_by_contact.get(contact_key)
        if bridge_card:
            bridge_client = _bridge_card_to_client(
                bridge_card,
                contacts=bridge_contacts,
                team=bridge_team,
            )

        if not bridge_client:
            bridge_client = _bridge_contact_to_client(contact)

        if bridge_client:
            clients.append(bridge_client)

    clients.sort(key=lambda client: client.company.casefold())
    return ApiResponse(data=clients)


@router.get("/{client_id}", response_model=ApiResponse[Client])
async def get_client(client_id: str):
    client = await _get_client_or_404(client_id)
    return ApiResponse(data=client)


@router.get("/{client_id}/ai-summary", response_model=ApiResponse[AiClientSummary])
async def get_ai_summary(client_id: str):
    # TODO: Generate on-demand via LLM with real CRM context
    summary = repo.get_ai_summary(client_id)
    if not summary:
        raise HTTPException(status_code=404, detail="AI Summary не найден")
    return ApiResponse(data=summary)


@router.get("/{client_id}/communications", response_model=ApiResponse[list[CommunicationEvent]])
async def get_communications(client_id: str):
    # TODO: Fetch from Bitrix24 activity feed + email/call integrations
    return ApiResponse(data=repo.get_communications(client_id))


@router.get("/{client_id}/next-action", response_model=ApiResponse[AiNextAction])
async def get_next_action(client_id: str):
    # TODO: Generate via LLM with deal context, history, and risk signals
    action = repo.get_next_action(client_id)
    if not action:
        raise HTTPException(status_code=404, detail="AI Next Action не найден")
    return ApiResponse(data=action)


@router.get("/{client_id}/documents", response_model=ApiResponse[list[RelatedDocument]])
async def get_related_documents(client_id: str):
    # TODO: Use RAG vector search over document base (Qdrant)
    return ApiResponse(data=repo.get_related_documents(client_id))


@router.post("/{client_id}/bitrix/conversation-summary")
async def get_bitrix_conversation_summary(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request("POST", f"/contacts/{bridge_contact_id}/summary")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.post("/{client_id}/bitrix/brief")
async def get_bitrix_brief(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request("POST", f"/contacts/{bridge_contact_id}/brief")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/{client_id}/bitrix/calls")
async def get_bitrix_calls(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request("GET", f"/calls/contact/{bridge_contact_id}")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/{client_id}/bitrix/last-call")
async def get_bitrix_last_call(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        payload = await bridge_request("GET", f"/calls/contact/{bridge_contact_id}")
        calls = payload.get("calls", []) if isinstance(payload, dict) else []
        if not calls:
            raise HTTPException(status_code=404, detail="Для клиента ещё нет звонков в Bitrix bridge")
        last_call = sorted(calls, key=_call_sort_key, reverse=True)[0]
        call_id = last_call.get("call_id") or last_call.get("id")
        if not call_id:
            raise HTTPException(status_code=404, detail="Последний звонок найден, но не содержит call_id")
        data = await bridge_request("GET", f"/calls/{call_id}")
    except HTTPException:
        raise
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/{client_id}/bitrix/temp-managers")
async def get_bitrix_temp_managers(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request("GET", f"/contacts/{bridge_contact_id}/temp-managers")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.post("/{client_id}/bitrix/temp-manager")
async def assign_bitrix_temp_manager(client_id: str, body: TempManagerAssignRequest):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request(
            "POST",
            f"/contacts/{bridge_contact_id}/temp-manager",
            json=body.model_dump(),
        )
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.delete("/{client_id}/bitrix/temp-manager/{assignment_id}")
async def remove_bitrix_temp_manager(client_id: str, assignment_id: int):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    bridge_contact_id = _bridge_contact_id_value(bridge_contact)
    try:
        data = await bridge_request(
            "DELETE",
            f"/contacts/{bridge_contact_id}/temp-manager/{assignment_id}",
        )
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


# ─── Call endpoints (nested under /calls for clarity) ────────────────────────

calls_router = APIRouter(prefix="/calls", tags=["Calls"])


@calls_router.get("/{event_id}/quality", response_model=ApiResponse[CallQualityReview])
async def get_call_quality(event_id: str):
    # TODO: Fetch from AI call analysis pipeline (speech-to-text + LLM)
    quality = repo.get_call_quality(event_id)
    if not quality:
        raise HTTPException(status_code=404, detail="Оценка звонка не найдена")
    return ApiResponse(data=quality)


@calls_router.get("/bitrix/team")
async def get_bitrix_team():
    try:
        data = await list_bridge_team()
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return ApiResponse(data=data)
