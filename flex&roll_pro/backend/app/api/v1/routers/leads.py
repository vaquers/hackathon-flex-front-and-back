import logging
from threading import Thread

from fastapi import APIRouter, Query, HTTPException
from app.schemas.common import ApiResponse
from app.schemas.leads import (
    Lead, GeneratedLead, TopLeadsResponse, PipelineStatus,
)
from app.repositories import mock_repository as repo
from app.services.lead_generator import get_lead_service

logger = logging.getLogger("leads_router")

router = APIRouter(prefix="/leads", tags=["Leads"])


# ── Real lead generator endpoints ────────────────────────────────────────────

@router.get("/top", response_model=ApiResponse[TopLeadsResponse])
async def get_top_leads():
    """Return cached top-5 AI-generated leads for cold outreach."""
    svc = get_lead_service()
    data = svc.get_top_leads()

    leads = []
    for ld in data["leads"]:
        breakdown = ld.get("scoring_breakdown")
        leads.append(GeneratedLead(
            id=ld["id"],
            company_name=ld["company_name"],
            normalized_name=ld["normalized_name"],
            registration_date=ld.get("registration_date"),
            industry=ld.get("industry", "unknown"),
            product_category=ld.get("product_category", ""),
            why_recommended=ld.get("why_recommended", ""),
            score=ld.get("score", 0),
            confidence_score=ld.get("confidence_score", 0),
            priority_tier=ld.get("priority_tier", "cold"),
            source_url=ld.get("source_url", ""),
            source_name=ld.get("source_name", ""),
            company_summary=ld.get("company_summary", ""),
            outreach_angle=ld.get("outreach_angle", ""),
            suggested_pitch=ld.get("suggested_pitch", ""),
            sales_brief=ld.get("sales_brief", ""),
            scoring_breakdown=breakdown,
            created_at=ld.get("created_at", ""),
        ))

    return ApiResponse(data=TopLeadsResponse(
        leads=leads,
        generated_at=data.get("generated_at", ""),
        pipeline_status=data.get("pipeline_status", "idle"),
        error_message=data.get("error_message", ""),
        total_candidates=data.get("total_candidates", 0),
        total_scored=data.get("total_scored", 0),
        cache_stale=data.get("cache_stale", True),
    ))


@router.post("/refresh", response_model=ApiResponse[PipelineStatus])
async def refresh_leads():
    """Trigger lead generation pipeline in background."""
    svc = get_lead_service()

    if svc.is_running():
        status = svc.get_status()
        return ApiResponse(data=PipelineStatus(**status))

    thread = Thread(target=svc.run_pipeline_sync, daemon=True)
    thread.start()
    logger.info("Pipeline refresh triggered")

    status = svc.get_status()
    return ApiResponse(data=PipelineStatus(**status))


@router.get("/status", response_model=ApiResponse[PipelineStatus])
async def get_pipeline_status():
    """Check the pipeline execution status."""
    svc = get_lead_service()
    status = svc.get_status()
    return ApiResponse(data=PipelineStatus(**status))


# ── Legacy CRM-style lead endpoints (mock) ──────────────────────────────────

@router.get("", response_model=ApiResponse[list[Lead]])
async def get_leads(
    segment: str | None = Query(None),
    trigger_type: str | None = Query(None, alias="triggerType"),
    show_saved: bool | None = Query(None, alias="showSaved"),
):
    return ApiResponse(data=repo.get_leads(segment, trigger_type, show_saved))


@router.post("/{lead_id}/save")
async def save_lead(lead_id: str):
    success = repo.save_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Лид не найден")
    return ApiResponse(data={"status": "saved", "lead_id": lead_id})


@router.post("/{lead_id}/hide")
async def hide_lead(lead_id: str):
    success = repo.hide_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Лид не найден")
    return ApiResponse(data={"status": "hidden", "lead_id": lead_id})


@router.post("/{lead_id}/add-to-crm")
async def add_to_crm(lead_id: str):
    return ApiResponse(data={"status": "added_to_crm", "lead_id": lead_id, "bitrix_deal_id": None})
