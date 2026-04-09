from pydantic import BaseModel
from typing import Literal


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
