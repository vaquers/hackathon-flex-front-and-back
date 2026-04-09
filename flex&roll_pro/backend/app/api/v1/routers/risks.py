from fastapi import APIRouter, Query
from app.schemas.common import ApiResponse
from app.repositories import mock_repository as repo
from app.schemas.dashboard import PriorityDeal

router = APIRouter(prefix="/risks", tags=["Risks"])

# Re-use PriorityDeal as base; in a real implementation, RiskItem would be a separate schema
@router.get("", response_model=ApiResponse[list[dict]])
async def get_risks(
    category: str | None = Query(None),
    manager_id: str | None = Query(None, alias="managerId"),
    is_vip: bool | None = Query(None, alias="isVip"),
    risk_level: str | None = Query(None, alias="riskLevel"),
):
    # TODO: Replace with real risk scoring engine + CRM data
    from app.schemas.dashboard import RiskLevel
    mock_risks = [
        {
            "id": "r-001",
            "client_id": "c-004",
            "client_name": "ООО «ЭкоПак Решения»",
            "manager_id": "m-003",
            "manager_name": "Павел Волков",
            "deal_stage": "stalled",
            "deal_stage_label": "Заморожена",
            "days_since_activity": 21,
            "risk_reason": "Расчёт завис на 21 день. Клиент перестал отвечать.",
            "risk_score": 88,
            "risk_level": "critical",
            "sentiment": "negative",
            "ai_next_action": "Позвонить и выяснить причину блокировки.",
            "is_vip": False,
            "status": "active",
            "amount": 650000,
            "currency": "RUB",
            "risk_category": "stalled",
        },
        {
            "id": "r-002",
            "client_id": "c-001",
            "client_name": "ООО «ТехноПак Групп»",
            "manager_id": "m-001",
            "manager_name": "Дмитрий Соколов",
            "deal_stage": "negotiation",
            "deal_stage_label": "Переговоры",
            "days_since_activity": 14,
            "risk_reason": "14 дней без ответа на КП.",
            "risk_score": 72,
            "risk_level": "high",
            "sentiment": "negative",
            "ai_next_action": "Личный звонок + скидка 5%",
            "is_vip": True,
            "status": "active",
            "amount": 4800000,
            "currency": "RUB",
            "risk_category": "post_proposal_silence",
        },
        {
            "id": "r-006",
            "client_id": "c-002",
            "client_name": "АО «Продторг»",
            "manager_id": "m-002",
            "manager_name": "Екатерина Новикова",
            "deal_stage": "proposal",
            "deal_stage_label": "КП отправлено",
            "days_since_activity": 7,
            "risk_reason": "Конкурент предложил цену ниже на 8%.",
            "risk_score": 45,
            "risk_level": "medium",
            "sentiment": "mixed",
            "ai_next_action": "Отправить кейсы клиентов + предложить пилотный тираж",
            "is_vip": False,
            "status": "active",
            "amount": 1200000,
            "currency": "RUB",
            "risk_category": "post_proposal_silence",
        },
    ]

    items = mock_risks
    if category:
        items = [r for r in items if r["risk_category"] == category]
    if manager_id:
        items = [r for r in items if r["manager_id"] == manager_id]
    if is_vip is not None:
        items = [r for r in items if r["is_vip"] == is_vip]
    if risk_level:
        items = [r for r in items if r["risk_level"] == risk_level]

    return ApiResponse(data=sorted(items, key=lambda r: r["risk_score"], reverse=True))
