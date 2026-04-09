"""
OpenRouter LLM client for AI-Scout.

Calls the LLM, parses the structured JSON response,
and applies the analysis to a Lead object including
the explainable ScoringBreakdown.
"""
from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import requests

from app.scout.config import (
    DEFAULT_MODEL,
    LLM_TIMEOUT,
    MAX_RETRIES,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    RETRY_DELAY,
)
from app.scout.models import ScoringBreakdown, ScoringFactor
from app.scout.llm.prompts import SYSTEM_PROMPT, build_prompt

if TYPE_CHECKING:
    from app.scout.models import Lead

logger = logging.getLogger(__name__)

# Weights must sum to 1.0
SCORING_WEIGHTS: dict[str, float] = {
    "product_packaging_fit": 0.30,
    "labeling_need": 0.25,
    "newness_signal": 0.20,
    "urgency_signal": 0.15,
    "data_quality": 0.05,
    "sales_readiness": 0.05,
}

_REQUIRED_FIELDS = {
    "company_summary", "business_category", "why_labels", "why_now",
    "sales_brief", "outreach_angle", "scoring_breakdown", "confidence_score",
}


class _RetryableError(Exception):
    pass


def analyze_lead(lead: "Lead", model: str = DEFAULT_MODEL) -> "Lead":
    """
    Analyze a lead using the LLM. Updates and returns the lead in-place.
    Never raises — on failure sets analysis_status to "failed" or "partial".
    """
    prompt = build_prompt(lead)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = _call_llm(prompt, model)
            parsed = _parse_response(raw)
            _apply_analysis(lead, parsed, model)
            lead.analysis_status = "ok"
            logger.info(
                f"[LLM] {lead.company_name!r} → score={lead.final_score} "
                f"[{lead.priority_tier}] confidence={lead.confidence_score}"
            )
            return lead
        except _RetryableError as e:
            wait = RETRY_DELAY * attempt
            logger.warning(f"[LLM] Attempt {attempt}/{MAX_RETRIES}: {e} — retry in {wait}s")
            time.sleep(wait)
        except json.JSONDecodeError as e:
            logger.warning(f"[LLM] JSON parse error (attempt {attempt}): {e}")
            if attempt == MAX_RETRIES:
                lead.analysis_status = "partial"
                return lead
            time.sleep(RETRY_DELAY)
        except Exception as e:
            logger.error(f"[LLM] Error for {lead.company_name!r}: {e}")
            lead.analysis_status = "failed"
            return lead

    lead.analysis_status = "partial"
    return lead


def _call_llm(prompt: str, model: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/ai-scout",
        "X-Title": "AI-Scout Lead Analyzer",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 2500,
    }

    resp = requests.post(
        f"{OPENROUTER_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=LLM_TIMEOUT,
    )

    if resp.status_code == 429:
        raise _RetryableError("Rate limited (429)")
    if resp.status_code >= 500:
        raise _RetryableError(f"Server error ({resp.status_code})")
    if resp.status_code >= 400:
        raise ValueError(f"Client error ({resp.status_code}): {resp.text[:300]}")

    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _parse_response(raw: str) -> dict:
    """Strip markdown fences and parse JSON from LLM response."""
    text = raw.strip()

    # Remove markdown code fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Find outermost JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise json.JSONDecodeError("No JSON object found", text, 0)

    return json.loads(text[start : end + 1])


def _apply_analysis(lead: "Lead", data: dict, model: str) -> None:
    """Apply parsed LLM output to the lead object."""
    # Update names if LLM found better ones
    if data.get("company_name"):
        lead.company_name = data["company_name"]
    if data.get("normalized_name"):
        lead.normalized_name = data["normalized_name"]

    # Business classification
    lead.business_category = data.get("business_category", "")
    lead.product_category = data.get("product_category", "")

    # Refine signal if LLM found a better classification
    if data.get("detected_signal"):
        lead.detected_signal = data["detected_signal"]

    # Sales-oriented analysis fields
    lead.company_summary = data.get("company_summary", "")
    lead.business_model_guess = data.get("business_model_guess", "")
    lead.why_labels = data.get("why_labels", "")
    lead.why_now = data.get("why_now", "")
    lead.sales_brief = data.get("sales_brief", "")
    lead.outreach_angle = data.get("outreach_angle", "")
    lead.suggested_pitch = data.get("suggested_pitch", "")
    lead.evidence_quality_notes = data.get("evidence_quality_notes", "")
    lead.assumptions = list(data.get("assumptions", []))
    lead.confidence_score = _clamp(float(data.get("confidence_score", 30)))

    # Build explainable scoring breakdown
    sb_raw = data.get("scoring_breakdown", {})
    lead.scoring_breakdown = ScoringBreakdown(
        product_packaging_fit=_factor(sb_raw, "product_packaging_fit"),
        labeling_need=_factor(sb_raw, "labeling_need"),
        newness_signal=_factor(sb_raw, "newness_signal"),
        urgency_signal=_factor(sb_raw, "urgency_signal"),
        data_quality=_factor(sb_raw, "data_quality"),
        sales_readiness=_factor(sb_raw, "sales_readiness"),
    )

    lead.analysis_model = model
    lead.updated_at = datetime.now(timezone.utc).isoformat()


def _factor(sb_raw: dict, key: str) -> ScoringFactor:
    fd = sb_raw.get(key, {})
    return ScoringFactor(
        score=_clamp(float(fd.get("score", 25))),
        weight=SCORING_WEIGHTS[key],
        explanation=str(fd.get("explanation", "")),
    )


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))
