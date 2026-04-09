from fastapi import APIRouter, Query, HTTPException
from app.schemas.common import ApiResponse
from app.schemas.leads import Lead
from app.repositories import mock_repository as repo

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("", response_model=ApiResponse[list[Lead]])
async def get_leads(
    segment: str | None = Query(None),
    trigger_type: str | None = Query(None, alias="triggerType"),
    show_saved: bool | None = Query(None, alias="showSaved"),
):
    # TODO: Replace with AI lead scoring pipeline (company signals, purchase likelihood)
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
    # TODO: Create deal/contact in Bitrix24 via REST API
    return ApiResponse(data={"status": "added_to_crm", "lead_id": lead_id, "bitrix_deal_id": None})
