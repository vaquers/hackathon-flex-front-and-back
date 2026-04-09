from pydantic import BaseModel
from typing import Literal


# ── Legacy CRM-style lead (kept for backward compatibility) ──────────────────

class Lead(BaseModel):
    id: str
    company_name: str
    inn: str | None = None
    city: str
    segment: str
    segment_label: str
    trigger_reason: str
    trigger_type: Literal["new_company", "competitor_loss", "seasonal", "activity_signal", "referral"]
    order_probability: int
    expected_product: str
    expected_volume: str
    contact_person: str | None = None
    contact_phone: str | None = None
    is_saved: bool
    is_hidden: bool
    generated_at: str
    ai_insight: str


# ── Generated lead from AI pipeline ─────────────────────────────────────────

class ScoringFactor(BaseModel):
    score: float
    weight: float
    explanation: str


class ScoringBreakdown(BaseModel):
    product_packaging_fit: ScoringFactor | None = None
    labeling_need: ScoringFactor | None = None
    newness_signal: ScoringFactor | None = None
    urgency_signal: ScoringFactor | None = None
    data_quality: ScoringFactor | None = None
    sales_readiness: ScoringFactor | None = None


class GeneratedLead(BaseModel):
    id: str
    company_name: str
    normalized_name: str
    registration_date: str | None = None
    industry: str
    product_category: str
    why_recommended: str
    score: float
    confidence_score: float
    priority_tier: Literal["hot", "warm", "cold"]
    source_url: str
    source_name: str
    company_summary: str
    outreach_angle: str
    suggested_pitch: str
    sales_brief: str
    scoring_breakdown: ScoringBreakdown | None = None
    created_at: str


class TopLeadsResponse(BaseModel):
    leads: list[GeneratedLead]
    generated_at: str
    pipeline_status: str
    error_message: str = ""
    total_candidates: int = 0
    total_scored: int = 0
    cache_stale: bool = False


class PipelineStatus(BaseModel):
    pipeline_status: str
    generated_at: str
    leads_count: int
    is_running: bool
    cache_stale: bool
