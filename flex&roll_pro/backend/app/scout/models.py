"""
Unified Lead model for AI-Scout.
Every lead, regardless of source, is represented as a Lead object.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class ScoringFactor:
    """A single factor in the scoring breakdown."""
    score: float       # 0-100
    weight: float      # contribution weight, all weights sum to 1.0
    explanation: str   # why this factor got this score

    @property
    def weighted_score(self) -> float:
        return self.score * self.weight


@dataclass
class ScoringBreakdown:
    """
    Explainable scoring breakdown.
    Each factor is rated 0-100 and weighted to produce final_score.

    Weights:
      product_packaging_fit  0.30  — Is this a physical product business?
      labeling_need          0.25  — Do they obviously need labels?
      newness_signal         0.20  — Is this new / just launched?
      urgency_signal         0.15  — Is there urgency to act right now?
      data_quality           0.05  — How reliable is our data?
      sales_readiness        0.05  — Can a salesperson call today?
    """
    product_packaging_fit: ScoringFactor
    labeling_need: ScoringFactor
    newness_signal: ScoringFactor
    urgency_signal: ScoringFactor
    data_quality: ScoringFactor
    sales_readiness: ScoringFactor

    @property
    def final_score(self) -> float:
        total = (
            self.product_packaging_fit.weighted_score
            + self.labeling_need.weighted_score
            + self.newness_signal.weighted_score
            + self.urgency_signal.weighted_score
            + self.data_quality.weighted_score
            + self.sales_readiness.weighted_score
        )
        return round(min(100.0, max(0.0, total)), 1)

    @property
    def priority_tier(self) -> str:
        score = self.final_score
        if score >= 70:
            return "hot"
        if score >= 45:
            return "warm"
        return "cold"

    def to_dict(self) -> dict:
        factors = {
            "product_packaging_fit": self.product_packaging_fit,
            "labeling_need": self.labeling_need,
            "newness_signal": self.newness_signal,
            "urgency_signal": self.urgency_signal,
            "data_quality": self.data_quality,
            "sales_readiness": self.sales_readiness,
        }
        result = {}
        for key, factor in factors.items():
            result[key] = {
                "score": round(factor.score, 1),
                "weight": factor.weight,
                "weighted_contribution": round(factor.weighted_score, 1),
                "explanation": factor.explanation,
            }
        result["final_score"] = self.final_score
        result["priority_tier"] = self.priority_tier
        return result


@dataclass
class Evidence:
    """A single piece of evidence found about a company."""
    url: str
    title: str
    snippet: str
    source_type: str   # "registry", "official_site", "marketplace", "news", "catalog", "social"
    quality: float     # 0.0–1.0, higher = more reliable


@dataclass
class Lead:
    """
    Unified lead object. Every candidate from any source becomes a Lead.
    Starts minimal, gets enriched through the pipeline.
    """
    # ── Identity ──────────────────────────────────────────────────────────
    id: str
    company_name: str
    normalized_name: str

    # ── Source ────────────────────────────────────────────────────────────
    source_name: str       # "egr", "news_search", etc.
    source_type: str       # "registry", "news", "marketplace", "manual"
    source_url: str
    source_quality: float  # 0.0–1.0

    # ── Signal ────────────────────────────────────────────────────────────
    detected_signal: str       # "new_registration", "new_brand", "new_product", …
    signal_description: str    # human-readable trigger

    # ── Geography ─────────────────────────────────────────────────────────
    region: str = ""
    country: str = "BY"

    # ── Business info ─────────────────────────────────────────────────────
    legal_form: str = ""
    website: str = ""
    description: str = ""
    business_category: str = ""
    product_category: str = ""

    # ── Raw source data ───────────────────────────────────────────────────
    raw_data: dict = field(default_factory=dict)

    # ── Enrichment ────────────────────────────────────────────────────────
    evidence: list[Evidence] = field(default_factory=list)

    # ── LLM Analysis ──────────────────────────────────────────────────────
    company_summary: str = ""
    business_model_guess: str = ""
    why_labels: str = ""
    why_now: str = ""
    sales_brief: str = ""
    outreach_angle: str = ""
    suggested_pitch: str = ""
    evidence_quality_notes: str = ""
    assumptions: list[str] = field(default_factory=list)

    # ── Scoring ───────────────────────────────────────────────────────────
    scoring_breakdown: Optional[ScoringBreakdown] = None
    confidence_score: float = 0.0

    # ── Metadata ──────────────────────────────────────────────────────────
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    analysis_status: str = "pending"   # "pending" | "ok" | "partial" | "failed"
    analysis_model: str = ""

    # ── Computed properties ───────────────────────────────────────────────
    @property
    def final_score(self) -> float:
        if self.scoring_breakdown:
            return self.scoring_breakdown.final_score
        return 0.0

    @property
    def priority_tier(self) -> str:
        if self.scoring_breakdown:
            return self.scoring_breakdown.priority_tier
        return "cold"

    # ── Serialization ─────────────────────────────────────────────────────
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_name": self.company_name,
            "normalized_name": self.normalized_name,
            "source_name": self.source_name,
            "source_type": self.source_type,
            "source_url": self.source_url,
            "source_quality": self.source_quality,
            "detected_signal": self.detected_signal,
            "signal_description": self.signal_description,
            "region": self.region,
            "country": self.country,
            "legal_form": self.legal_form,
            "website": self.website,
            "description": self.description,
            "business_category": self.business_category,
            "product_category": self.product_category,
            "evidence": [
                {
                    "url": e.url,
                    "title": e.title,
                    "snippet": e.snippet,
                    "source_type": e.source_type,
                    "quality": e.quality,
                }
                for e in self.evidence
            ],
            "company_summary": self.company_summary,
            "business_model_guess": self.business_model_guess,
            "why_labels": self.why_labels,
            "why_now": self.why_now,
            "sales_brief": self.sales_brief,
            "outreach_angle": self.outreach_angle,
            "suggested_pitch": self.suggested_pitch,
            "evidence_quality_notes": self.evidence_quality_notes,
            "assumptions": self.assumptions,
            "scoring_breakdown": (
                self.scoring_breakdown.to_dict() if self.scoring_breakdown else None
            ),
            "final_score": self.final_score,
            "priority_tier": self.priority_tier,
            "confidence_score": self.confidence_score,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "analysis_status": self.analysis_status,
            "analysis_model": self.analysis_model,
        }

    def to_csv_row(self) -> dict:
        """Flat dict suitable for CSV output."""
        top_urls = " | ".join(e.url for e in self.evidence[:3])
        sb = self.scoring_breakdown
        return {
            "company_name": self.company_name,
            "normalized_name": self.normalized_name,
            "source_name": self.source_name,
            "detected_signal": self.detected_signal,
            "signal_description": self.signal_description,
            "business_category": self.business_category,
            "product_category": self.product_category,
            "region": self.region,
            "website": self.website,
            "company_summary": self.company_summary,
            "why_now": self.why_now,
            "why_labels": self.why_labels,
            "outreach_angle": self.outreach_angle,
            "suggested_pitch": self.suggested_pitch,
            "sales_brief": self.sales_brief,
            "final_score": self.final_score,
            "priority_tier": self.priority_tier,
            "confidence_score": self.confidence_score,
            "ppf_score": sb.product_packaging_fit.score if sb else "",
            "newness_score": sb.newness_signal.score if sb else "",
            "labeling_score": sb.labeling_need.score if sb else "",
            "urgency_score": sb.urgency_signal.score if sb else "",
            "data_quality_score": sb.data_quality.score if sb else "",
            "sales_readiness_score": sb.sales_readiness.score if sb else "",
            "top_evidence_urls": top_urls,
            "evidence_quality_notes": self.evidence_quality_notes,
            "assumptions": "; ".join(self.assumptions),
            "analysis_status": self.analysis_status,
            "created_at": self.created_at,
            "source_url": self.source_url,
        }


def make_lead_id(source_name: str, identifier: str) -> str:
    """Stable 16-char ID derived from source + identifier."""
    raw = f"{source_name}:{identifier}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]
