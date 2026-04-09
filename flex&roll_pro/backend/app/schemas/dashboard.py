from pydantic import BaseModel
from typing import Literal


RiskLevel = Literal["low", "medium", "high", "critical"]
SentimentLevel = Literal["positive", "neutral", "negative", "mixed"]
UrgencyLevel = Literal["low", "medium", "high", "critical"]
DealStage = Literal["new", "qualification", "proposal", "negotiation", "won", "lost", "stalled"]


class DashboardSummary(BaseModel):
    deals_at_risk: int
    stalled_deals: int
    pending_incoming: int
    vip_clients: int
    today_follow_ups: int
    avg_response_time: str
    weekly_conversion_rate: float


class PriorityDeal(BaseModel):
    id: str
    client_name: str
    client_id: str
    stage: DealStage
    stage_label: str
    risk_score: int
    risk_level: RiskLevel
    risk_reason: str
    ai_next_action: str
    last_contact_at: str
    manager_id: str
    manager_name: str
    amount: float
    currency: str
    is_vip: bool
    sentiment: SentimentLevel
    days_since_contact: int


class IncomingRequest(BaseModel):
    id: str
    client_name: str
    client_id: str | None = None
    topic: str
    summary: str
    urgency: UrgencyLevel
    client_type: str
    complexity: Literal["simple", "medium", "complex"]
    recommended_assignee: str
    recommended_assignee_id: str
    recommendation_reason: str
    received_at: str
    channel: Literal["email", "phone", "web", "messenger"]
    is_new: bool


class VipAlert(BaseModel):
    id: str
    client_id: str
    client_name: str
    alert_type: Literal["no_contact", "sentiment_drop", "stalled", "competitor_mention"]
    alert_message: str
    severity: RiskLevel
    detected_at: str
    manager_name: str


class SentimentItem(BaseModel):
    client_id: str
    client_name: str
    previous_sentiment: SentimentLevel
    current_sentiment: SentimentLevel
    change: Literal["improved", "worsened", "stable"]
    reason: str
    detected_at: str
    is_vip: bool


class ConfirmRoutingRequest(BaseModel):
    assignee_id: str
