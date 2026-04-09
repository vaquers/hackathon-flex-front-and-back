from fastapi import APIRouter, HTTPException
from app.schemas.common import ApiResponse
from app.schemas.dashboard import (
    DashboardSummary, PriorityDeal, IncomingRequest, VipAlert, SentimentItem, ConfirmRoutingRequest,
)
from app.repositories import mock_repository as repo

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=ApiResponse[DashboardSummary])
async def get_summary():
    return ApiResponse(data=repo.get_dashboard_summary())


@router.get("/priority-deals", response_model=ApiResponse[list[PriorityDeal]])
async def get_priority_deals():
    return ApiResponse(data=repo.get_priority_deals())


@router.get("/incoming", response_model=ApiResponse[list[IncomingRequest]])
async def get_incoming_requests():
    return ApiResponse(data=repo.get_incoming_requests())


@router.get("/vip-alerts", response_model=ApiResponse[list[VipAlert]])
async def get_vip_alerts():
    return ApiResponse(data=repo.get_vip_alerts())


@router.get("/sentiment-feed", response_model=ApiResponse[list[SentimentItem]])
async def get_sentiment_feed():
    return ApiResponse(data=repo.get_sentiment_feed())


@router.post("/incoming/{request_id}/confirm")
async def confirm_routing(request_id: str, body: ConfirmRoutingRequest):
    # TODO: Update CRM assignment via Bitrix24 API
    return ApiResponse(data={"status": "confirmed", "request_id": request_id, "assignee_id": body.assignee_id})
