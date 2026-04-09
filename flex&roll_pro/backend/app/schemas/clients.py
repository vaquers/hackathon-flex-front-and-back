from pydantic import BaseModel
from typing import Literal

RiskLevel = Literal["low", "medium", "high", "critical"]
SentimentLevel = Literal["positive", "neutral", "negative", "mixed"]
UrgencyLevel = Literal["low", "medium", "high", "critical"]


class Client(BaseModel):
    id: str
    name: str
    company: str
    segment: str
    segment_label: str
    is_vip: bool
    manager_id: str
    manager_name: str
    phone: str | None = None
    email: str | None = None
    deal_id: str
    deal_amount: float
    deal_currency: str
    deal_stage: str
    deal_stage_label: str
    risk_score: int
    risk_level: RiskLevel
    risk_reason: str
    sentiment: SentimentLevel
    last_contact_at: str
    days_since_contact: int
    product: str
    expected_volume: str
    city: str
    inn: str | None = None


class AiClientSummary(BaseModel):
    client_id: str
    company: str
    segment: str
    product: str
    expected_volume: str
    recent_actions: list[str]
    deal_stage: str
    risk_score: int
    risk_reason: str
    priority: Literal["low", "medium", "high", "critical"]
    priority_label: str
    recommended_next_step: str
    generated_at: str


class CommunicationEvent(BaseModel):
    id: str
    client_id: str
    type: Literal["call", "email", "messenger", "note", "status_change"]
    type_label: str
    title: str
    summary: str | None = None
    body: str | None = None
    author: str
    author_id: str
    happened_at: str
    duration_seconds: int | None = None
    sentiment: SentimentLevel | None = None
    is_important: bool = False
    attachments: list[dict] = []


class CallSummary(BaseModel):
    id: str
    client_id: str
    happened_at: str
    duration_seconds: int
    summary: str
    agreements: list[str]
    next_step: str
    responsible: str
    sentiment: SentimentLevel
    quality_score: int


class CallQualityReview(BaseModel):
    call_id: str
    done_well: list[str]
    missed: list[str]
    need_identification_score: int
    objection_handling_score: int
    next_step_fixed_score: int
    overall_score: int
    recommendations: list[str]


class AiNextAction(BaseModel):
    client_id: str
    action: str
    reason: str
    urgency: UrgencyLevel
    deadline: str | None = None
    type: Literal["call", "email", "meeting", "proposal", "internal"]


class RelatedDocument(BaseModel):
    id: str
    type: Literal["calculation", "tech_doc", "past_order", "template", "proposal"]
    type_label: str
    name: str
    relevance: int
    date: str
    client_name: str | None = None
    url: str | None = None
