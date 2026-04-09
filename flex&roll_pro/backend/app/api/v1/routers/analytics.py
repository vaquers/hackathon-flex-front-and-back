from fastapi import APIRouter, Query
from app.schemas.common import ApiResponse
from app.schemas.analytics import (
    AnalyticsOverview, EmployeeKpi, DynamicsDataPoint,
    CommunicationQuality, LostDealReason, LostDealsByStage,
)
from app.repositories import mock_repository as repo

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=ApiResponse[AnalyticsOverview])
async def get_overview(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_analytics_overview(period))


@router.get("/employee-kpi", response_model=ApiResponse[list[EmployeeKpi]])
async def get_employee_kpi(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_employee_kpi(period))


@router.get("/dynamics", response_model=ApiResponse[list[DynamicsDataPoint]])
async def get_dynamics(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_dynamics(period))


@router.get("/communication-quality", response_model=ApiResponse[list[CommunicationQuality]])
async def get_communication_quality(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_communication_quality(period))


@router.get("/lost-reasons", response_model=ApiResponse[list[LostDealReason]])
async def get_lost_reasons(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_lost_deal_reasons(period))


@router.get("/lost-by-stage", response_model=ApiResponse[list[LostDealsByStage]])
async def get_lost_by_stage(period: str = Query("quarter")):
    return ApiResponse(data=repo.get_lost_by_stage(period))
