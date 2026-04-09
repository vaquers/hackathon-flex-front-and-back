from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    period: str
    total_revenue: float
    total_deals: int
    won_deals: int
    lost_deals: int
    avg_deal_cycle: int
    avg_response_time: int
    avg_call_quality: int


class EmployeeKpi(BaseModel):
    manager_id: str
    manager_name: str
    avg_response_time_minutes: int
    active_deals: int
    conversion_rate: float
    workload: int
    follow_up_discipline: int
    avg_deal_cycle_days: int
    total_revenue: float
    lost_deals: int
    call_quality_score: int


class DynamicsDataPoint(BaseModel):
    period: str
    conversion_rate: float
    response_time_minutes: int
    workload: int
    call_quality_score: int
    deals_closed: int
    deals_lost: int
    plan_fact: int


class CommunicationQuality(BaseModel):
    manager_id: str
    manager_name: str
    need_identification_score: int
    objection_handling_score: int
    next_step_fixation_score: int
    conversation_retention_score: int
    avg_communication_score: int
    calls_analyzed: int


class LostDealReason(BaseModel):
    reason: str
    count: int
    percentage: float
    avg_deal_amount: float
    stages: list[str]


class LostDealsByStage(BaseModel):
    stage: str
    stage_label: str
    count: int
    total_amount: float
