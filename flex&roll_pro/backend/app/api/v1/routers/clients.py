from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.common import ApiResponse
from app.schemas.clients import (
    Client, AiClientSummary, CommunicationEvent, CallSummary,
    CallQualityReview, AiNextAction, RelatedDocument,
)
from app.repositories import mock_repository as repo
from app.services.bitrix_bridge import (
    BitrixBridgeError,
    bridge_request,
    list_bridge_team,
    list_bridge_contacts,
    match_bridge_contact,
    resolve_bridge_contact,
)

router = APIRouter(prefix="/clients", tags=["Clients"])


class TempManagerAssignRequest(BaseModel):
    original_manager_bitrix_id: int
    temp_manager_bitrix_id: int


async def _client_with_bridge(client: Client) -> Client:
    try:
        bridge_contact = await resolve_bridge_contact(
            client_name=client.name,
            company_name=client.company,
            email=client.email,
        )
    except BitrixBridgeError:
        return client

    if not bridge_contact:
        return client

    return client.model_copy(update={
        "bridge_contact_id": bridge_contact.get("id"),
        "bridge_chat_id": bridge_contact.get("bitrix_chat_id"),
        "bridge_connected": True,
    })


async def _get_client_or_404(client_id: str) -> Client:
    client = repo.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return await _client_with_bridge(client)


async def _resolve_bridge_contact_or_404(client: Client) -> dict[str, Any]:
    try:
        bridge_contact = await resolve_bridge_contact(
            client_name=client.name,
            company_name=client.company,
            email=client.email,
        )
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not bridge_contact or not bridge_contact.get("id"):
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

    clients = []
    for client in repo.list_clients():
        bridge_contact = match_bridge_contact(
            bridge_contacts,
            client_name=client.name,
            company_name=client.company,
            email=client.email,
        )
        if bridge_contact:
            clients.append(client.model_copy(update={
                "bridge_contact_id": bridge_contact.get("id"),
                "bridge_chat_id": bridge_contact.get("bitrix_chat_id"),
                "bridge_connected": True,
            }))
        else:
            clients.append(client)
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
    try:
        data = await bridge_request("POST", f"/contacts/{bridge_contact['id']}/summary")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.post("/{client_id}/bitrix/brief")
async def get_bitrix_brief(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    try:
        data = await bridge_request("POST", f"/contacts/{bridge_contact['id']}/brief")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/{client_id}/bitrix/calls")
async def get_bitrix_calls(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    try:
        data = await bridge_request("GET", f"/calls/contact/{bridge_contact['id']}")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.get("/{client_id}/bitrix/last-call")
async def get_bitrix_last_call(client_id: str):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    try:
        payload = await bridge_request("GET", f"/calls/contact/{bridge_contact['id']}")
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
    try:
        data = await bridge_request("GET", f"/contacts/{bridge_contact['id']}/temp-managers")
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.post("/{client_id}/bitrix/temp-manager")
async def assign_bitrix_temp_manager(client_id: str, body: TempManagerAssignRequest):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    try:
        data = await bridge_request(
            "POST",
            f"/contacts/{bridge_contact['id']}/temp-manager",
            json=body.model_dump(),
        )
    except BitrixBridgeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ApiResponse(data=data)


@router.delete("/{client_id}/bitrix/temp-manager/{assignment_id}")
async def remove_bitrix_temp_manager(client_id: str, assignment_id: int):
    client = await _get_client_or_404(client_id)
    bridge_contact = await _resolve_bridge_contact_or_404(client)
    try:
        data = await bridge_request(
            "DELETE",
            f"/contacts/{bridge_contact['id']}/temp-manager/{assignment_id}",
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
