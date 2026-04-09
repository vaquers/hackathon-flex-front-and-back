from fastapi import APIRouter, HTTPException
from app.schemas.common import ApiResponse
from app.schemas.clients import (
    Client, AiClientSummary, CommunicationEvent, CallSummary,
    CallQualityReview, AiNextAction, RelatedDocument,
)
from app.repositories import mock_repository as repo

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/{client_id}", response_model=ApiResponse[Client])
async def get_client(client_id: str):
    client = repo.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
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


# ─── Call endpoints (nested under /calls for clarity) ────────────────────────

calls_router = APIRouter(prefix="/calls", tags=["Calls"])


@calls_router.get("/{event_id}/quality", response_model=ApiResponse[CallQualityReview])
async def get_call_quality(event_id: str):
    # TODO: Fetch from AI call analysis pipeline (speech-to-text + LLM)
    quality = repo.get_call_quality(event_id)
    if not quality:
        raise HTTPException(status_code=404, detail="Оценка звонка не найдена")
    return ApiResponse(data=quality)
