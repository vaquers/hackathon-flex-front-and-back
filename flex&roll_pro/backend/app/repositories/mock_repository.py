"""
Mock Repository — in-memory data store.
Replace this module with real DB / CRM / AI adapters when ready.

Extension points are marked with TODO comments.
"""

from app.schemas.dashboard import (
    DashboardSummary, PriorityDeal, IncomingRequest, VipAlert, SentimentItem,
)
from app.schemas.clients import (
    Client, AiClientSummary, CommunicationEvent, CallSummary, CallQualityReview,
    AiNextAction, RelatedDocument,
)
from app.schemas.analytics import (
    AnalyticsOverview, EmployeeKpi, DynamicsDataPoint, CommunicationQuality,
    LostDealReason, LostDealsByStage,
)
from app.schemas.search import SearchResult, SearchResponse, PopularDoc
from app.schemas.leads import Lead


# ─── Dashboard ───────────────────────────────────────────────────────────────

def get_dashboard_summary() -> DashboardSummary:
    # TODO: Replace with Bitrix24 API + real metrics aggregation
    return DashboardSummary(
        deals_at_risk=7,
        stalled_deals=4,
        pending_incoming=3,
        vip_clients=5,
        today_follow_ups=9,
        avg_response_time="2ч 14м",
        weekly_conversion_rate=18.4,
    )


def get_priority_deals() -> list[PriorityDeal]:
    # TODO: Replace with Bitrix24 CRM deals query + AI risk scoring
    return [
        PriorityDeal(
            id="d-001",
            client_name="ООО «ТехноПак Групп»",
            client_id="c-001",
            stage="negotiation",
            stage_label="Переговоры",
            risk_score=72,
            risk_level="high",
            risk_reason="14 дней без ответа на КП. Конкурент активен.",
            ai_next_action="Позвонить лично, предложить скидку 5% до 15 апреля",
            last_contact_at="2026-03-25T10:30:00",
            manager_id="m-001",
            manager_name="Д. Соколов",
            amount=4800000,
            currency="RUB",
            is_vip=True,
            sentiment="negative",
            days_since_contact=14,
        ),
        PriorityDeal(
            id="d-004",
            client_name="ООО «ЭкоПак Решения»",
            client_id="c-004",
            stage="stalled",
            stage_label="Заморожена",
            risk_score=88,
            risk_level="critical",
            risk_reason="21 день без движения. Расчёт завис.",
            ai_next_action="Срочно связаться, выяснить причину блокировки",
            last_contact_at="2026-03-18T16:00:00",
            manager_id="m-003",
            manager_name="П. Волков",
            amount=650000,
            currency="RUB",
            is_vip=False,
            sentiment="negative",
            days_since_contact=21,
        ),
    ]


def get_incoming_requests() -> list[IncomingRequest]:
    # TODO: Replace with Bitrix24 open lines / email integration + AI routing
    return [
        IncomingRequest(
            id="ir-001",
            client_name="ООО «СтройМатериалы Юг»",
            client_id=None,
            topic="Запрос расчёта упаковки для строительной смеси",
            summary="Новый клиент из Ростова. Запрашивает расчёт мешков 25 кг для цемента. Объём 30 000 шт./мес.",
            urgency="high",
            client_type="Производитель стройматериалов",
            complexity="medium",
            recommended_assignee="Дмитрий Соколов",
            recommended_assignee_id="m-001",
            recommendation_reason="Специализируется на промышленной упаковке, 3 аналогичных закрытых сделки",
            received_at="2026-04-08T07:45:00",
            channel="web",
            is_new=True,
        ),
        IncomingRequest(
            id="ir-003",
            client_name="ОАО «Молокозавод Кубань»",
            client_id="c-010",
            topic="Срочный дозаказ — изменились характеристики продукта",
            summary="Существующий клиент. Плановый объём вырос. Нужен срочный ответ.",
            urgency="critical",
            client_type="Производитель продуктов питания (действующий клиент)",
            complexity="complex",
            recommended_assignee="Игорь Лебедев",
            recommended_assignee_id="m-004",
            recommendation_reason="Ведёт этого клиента, знает специфику заказа",
            received_at="2026-04-08T09:01:00",
            channel="phone",
            is_new=True,
        ),
    ]


def get_vip_alerts() -> list[VipAlert]:
    # TODO: Replace with AI-powered monitoring of VIP client activity
    return [
        VipAlert(
            id="va-001",
            client_id="c-001",
            client_name="ООО «ТехноПак Групп»",
            alert_type="no_contact",
            alert_message="VIP-клиент без ответа 14 дней. Риск потери контракта на 4,8 млн руб./мес.",
            severity="high",
            detected_at="2026-04-08T08:00:00",
            manager_name="Дмитрий Соколов",
        ),
    ]


def get_sentiment_feed() -> list[SentimentItem]:
    # TODO: Replace with AI sentiment analysis of calls/emails
    return [
        SentimentItem(
            client_id="c-001",
            client_name="ООО «ТехноПак Групп»",
            previous_sentiment="neutral",
            current_sentiment="negative",
            change="worsened",
            reason="Не отвечает 14 дней, упомянул конкурента",
            detected_at="2026-04-06T12:00:00",
            is_vip=True,
        ),
        SentimentItem(
            client_id="c-003",
            client_name="ГК «АгроСнаб»",
            previous_sentiment="neutral",
            current_sentiment="positive",
            change="improved",
            reason="Активно отвечает, расширяет объём",
            detected_at="2026-04-07T10:00:00",
            is_vip=True,
        ),
    ]


# ─── Clients ─────────────────────────────────────────────────────────────────

CLIENTS_DB: dict[str, Client] = {
    "c-001": Client(
        id="c-001",
        name="Алексей Петров",
        company="ООО «ТехноПак Групп»",
        segment="enterprise",
        segment_label="Крупный бизнес",
        is_vip=True,
        manager_id="m-001",
        manager_name="Дмитрий Соколов",
        phone="+7 495 123-45-67",
        email="a.petrov@technopak.ru",
        deal_id="d-001",
        deal_amount=4800000,
        deal_currency="RUB",
        deal_stage="negotiation",
        deal_stage_label="Переговоры",
        risk_score=72,
        risk_level="high",
        risk_reason="14 дней без ответа после отправки КП",
        sentiment="negative",
        last_contact_at="2026-03-25T10:30:00",
        days_since_contact=14,
        product="Гофрокартонная упаковка, ящики B2",
        expected_volume="50 000 шт./мес.",
        city="Москва",
        inn="7701234567",
    ),
    "c-002": Client(
        id="c-002",
        name="Марина Власова",
        company="АО «Продторг»",
        segment="mid",
        segment_label="Средний бизнес",
        is_vip=False,
        manager_id="m-002",
        manager_name="Екатерина Новикова",
        phone="+7 812 987-65-43",
        email="m.vlasova@prodtorg.ru",
        deal_id="d-002",
        deal_amount=1200000,
        deal_currency="RUB",
        deal_stage="proposal",
        deal_stage_label="КП отправлено",
        risk_score=45,
        risk_level="medium",
        risk_reason="7 дней без ответа, конкурент предложил меньшую цену",
        sentiment="mixed",
        last_contact_at="2026-04-01T14:20:00",
        days_since_contact=7,
        product="Флексографическая печать, пакеты с ручкой",
        expected_volume="20 000 шт./мес.",
        city="Санкт-Петербург",
    ),
}


def get_client(client_id: str) -> Client | None:
    # TODO: Replace with Bitrix24 CRM client lookup / DB query
    return CLIENTS_DB.get(client_id)


def get_ai_summary(client_id: str) -> AiClientSummary | None:
    # TODO: Replace with AI-generated summary from LLM (GPT-4 / Claude)
    summaries = {
        "c-001": AiClientSummary(
            client_id="c-001",
            company="ООО «ТехноПак Групп»",
            segment="Крупный производитель бытовой техники",
            product="Гофрокартонная упаковка формата B2",
            expected_volume="50 000 штук в месяц",
            recent_actions=[
                "Отправлено КП на 4,8 млн руб.",
                "Проведена встреча 25 марта",
                "Согласованы технические характеристики",
            ],
            deal_stage="Переговоры — ждём решения по КП",
            risk_score=72,
            risk_reason="14 дней без ответа. Конкурент активен.",
            priority="high",
            priority_label="Высокий приоритет",
            recommended_next_step="Позвонить лично, предложить скидку 5% при подписании до 15 апреля.",
            generated_at="2026-04-08T08:00:00",
        ),
    }
    return summaries.get(client_id)


def get_communications(client_id: str) -> list[CommunicationEvent]:
    # TODO: Replace with Bitrix24 activity timeline + email/call integrations
    comms = {
        "c-001": [
            CommunicationEvent(
                id="ev-001",
                client_id="c-001",
                type="call",
                type_label="Звонок",
                title="Звонок: итоги встречи и следующие шаги",
                summary="Обсудили технические требования. Договорились об отправке КП до 24 марта.",
                author="Дмитрий Соколов",
                author_id="m-001",
                happened_at="2026-03-22T14:30:00",
                duration_seconds=1380,
                sentiment="positive",
                is_important=True,
            ),
            CommunicationEvent(
                id="ev-002",
                client_id="c-001",
                type="email",
                type_label="Email",
                title="Коммерческое предложение №КП-2026-087",
                summary="Отправлено КП на поставку гофроящиков B2 в объёме 50 000 шт./мес.",
                author="Дмитрий Соколов",
                author_id="m-001",
                happened_at="2026-03-24T16:00:00",
                attachments=[{"name": "КП-2026-087.pdf", "url": "#"}],
            ),
        ],
    }
    return comms.get(client_id, [])


def get_call_quality(event_id: str) -> CallQualityReview | None:
    # TODO: Replace with AI call quality analysis (speech recognition + LLM)
    reviews = {
        "ev-001": CallQualityReview(
            call_id="ev-001",
            done_well=[
                "Чётко зафиксировал следующий шаг",
                "Уточнил детальные технические требования",
            ],
            missed=[
                "Не спросил о бюджете и сроках принятия решения",
                "Не выяснил ЛПР",
            ],
            need_identification_score=74,
            objection_handling_score=68,
            next_step_fixed_score=95,
            overall_score=82,
            recommendations=[
                "В следующем звонке уточнить дату принятия решения",
                "Предложить экскурсию на производство",
            ],
        ),
    }
    return reviews.get(event_id)


def get_next_action(client_id: str) -> AiNextAction | None:
    # TODO: Replace with AI next-action generation (LLM with CRM context)
    actions = {
        "c-001": AiNextAction(
            client_id="c-001",
            action="Позвонить лично и предложить скидку 5% при подписании до 15 апреля",
            reason="14 дней молчания после КП. Конкурент активен.",
            urgency="critical",
            deadline="2026-04-09",
            type="call",
        ),
    }
    return actions.get(client_id)


def get_related_documents(client_id: str) -> list[RelatedDocument]:
    # TODO: Replace with RAG vector search over document base
    docs = {
        "c-001": [
            RelatedDocument(
                id="doc-001",
                type="calculation",
                type_label="Расчёт",
                name="Расчёт гофроящик B2 / 50k шт.",
                relevance=98,
                date="2026-03-24",
                client_name="ТехноПак Групп",
            ),
            RelatedDocument(
                id="doc-002",
                type="past_order",
                type_label="Прошлый заказ",
                name="Заказ №О-2025-445: ящики B1 / 30k шт.",
                relevance=85,
                date="2025-09-10",
                client_name="ТехноПак Групп",
            ),
        ],
    }
    return docs.get(client_id, [])


# ─── Analytics ───────────────────────────────────────────────────────────────

def get_analytics_overview(period: str) -> AnalyticsOverview:
    # TODO: Replace with real metrics from BI / database aggregations
    return AnalyticsOverview(
        period="Q1 2026",
        total_revenue=47800000,
        total_deals=124,
        won_deals=43,
        lost_deals=28,
        avg_deal_cycle=34,
        avg_response_time=135,
        avg_call_quality=76,
    )


def get_employee_kpi(period: str) -> list[EmployeeKpi]:
    # TODO: Replace with real manager performance data
    return [
        EmployeeKpi(
            manager_id="m-001",
            manager_name="Дмитрий Соколов",
            avg_response_time_minutes=95,
            active_deals=18,
            conversion_rate=24.5,
            workload=82,
            follow_up_discipline=91,
            avg_deal_cycle_days=28,
            total_revenue=18400000,
            lost_deals=5,
            call_quality_score=84,
        ),
        EmployeeKpi(
            manager_id="m-002",
            manager_name="Екатерина Новикова",
            avg_response_time_minutes=140,
            active_deals=14,
            conversion_rate=19.2,
            workload=68,
            follow_up_discipline=78,
            avg_deal_cycle_days=38,
            total_revenue=11200000,
            lost_deals=8,
            call_quality_score=72,
        ),
        EmployeeKpi(
            manager_id="m-004",
            manager_name="Игорь Лебедев",
            avg_response_time_minutes=75,
            active_deals=22,
            conversion_rate=28.1,
            workload=95,
            follow_up_discipline=95,
            avg_deal_cycle_days=25,
            total_revenue=22600000,
            lost_deals=4,
            call_quality_score=88,
        ),
    ]


def get_dynamics(period: str) -> list[DynamicsDataPoint]:
    return [
        DynamicsDataPoint(period="Янв 2026", conversion_rate=16.5, response_time_minutes=168, workload=65, call_quality_score=70, deals_closed=10, deals_lost=11, plan_fact=82),
        DynamicsDataPoint(period="Фев 2026", conversion_rate=20.3, response_time_minutes=148, workload=80, call_quality_score=75, deals_closed=15, deals_lost=8, plan_fact=94),
        DynamicsDataPoint(period="Мар 2026", conversion_rate=22.7, response_time_minutes=132, workload=85, call_quality_score=78, deals_closed=18, deals_lost=6, plan_fact=102),
        DynamicsDataPoint(period="Апр 2026", conversion_rate=21.4, response_time_minutes=128, workload=82, call_quality_score=80, deals_closed=14, deals_lost=7, plan_fact=98),
    ]


def get_communication_quality(period: str) -> list[CommunicationQuality]:
    return [
        CommunicationQuality(manager_id="m-001", manager_name="Дмитрий Соколов", need_identification_score=82, objection_handling_score=78, next_step_fixation_score=94, conversation_retention_score=80, avg_communication_score=84, calls_analyzed=47),
        CommunicationQuality(manager_id="m-004", manager_name="Игорь Лебедев", need_identification_score=91, objection_handling_score=87, next_step_fixation_score=96, conversation_retention_score=88, avg_communication_score=90, calls_analyzed=62),
    ]


def get_lost_deal_reasons(period: str) -> list[LostDealReason]:
    return [
        LostDealReason(reason="Долгий расчёт / потеря скорости", count=9, percentage=32.0, avg_deal_amount=780000, stages=["qualification", "proposal"]),
        LostDealReason(reason="Цена выше конкурента", count=7, percentage=25.0, avg_deal_amount=1100000, stages=["proposal", "negotiation"]),
        LostDealReason(reason="Задержка ответа менеджера", count=5, percentage=18.0, avg_deal_amount=540000, stages=["new", "qualification"]),
    ]


def get_lost_by_stage(period: str) -> list[LostDealsByStage]:
    return [
        LostDealsByStage(stage="new", stage_label="Новая", count=3, total_amount=420000),
        LostDealsByStage(stage="qualification", stage_label="Квалификация", count=5, total_amount=1800000),
        LostDealsByStage(stage="proposal", stage_label="КП отправлено", count=12, total_amount=8400000),
        LostDealsByStage(stage="negotiation", stage_label="Переговоры", count=8, total_amount=14200000),
    ]


# ─── Search ──────────────────────────────────────────────────────────────────

_SEARCH_DOCS = [
    SearchResult(
        id="sr-001",
        type="calculation",
        type_label="Расчёт",
        name="Расчёт стоимости гофроящик B2 / 50 000 шт. — ТехноПак Групп",
        ai_answer="Расчёт для ООО «ТехноПак Групп» на гофроящики B2 в объёме 50 000 шт./мес. Итоговая стоимость: 4 800 000 руб./мес.",
        relevant_fragment="...стоимость единицы — 96 руб., включая логотип 4+0 и влагостойкое покрытие...",
        client_name="ТехноПак Групп",
        date="2026-03-24",
        relevance_score=98,
        tags=["гофро", "B2", "ящики", "москва"],
    ),
    SearchResult(
        id="sr-004",
        type="proposal",
        type_label="КП",
        name="КП-2026-091: Крафт-пакеты с печатью — АО «Продторг»",
        ai_answer="КП для АО «Продторг» на флексографическую печать крафт-пакетов с ручкой. 20 000 шт./мес., стоимость: 1 200 000 руб./мес.",
        relevant_fragment="...пакет крафт 80г/м², ручка витая, офсет 4+0. Срок изготовления — 14 рабочих дней...",
        client_name="Продторг",
        date="2026-04-01",
        relevance_score=91,
        tags=["крафт", "пакеты", "флексо", "печать"],
    ),
]


def search_documents(query: str, doc_types: list[str] | None = None) -> SearchResponse:
    # TODO: Replace with RAG pipeline (Qdrant vector DB + LLM answer generation)
    q = query.lower()
    results = [
        r for r in _SEARCH_DOCS
        if q in r.name.lower() or any(q in tag for tag in r.tags) or q in r.ai_answer.lower()
    ] if q else _SEARCH_DOCS

    if doc_types:
        results = [r for r in results if r.type in doc_types]

    return SearchResponse(
        query=query,
        results=results,
        total=len(results),
        processing_time=420,
        suggested_filters=["Расчёты", "КП"],
    )


def get_popular_docs() -> list[PopularDoc]:
    return [
        PopularDoc(id="pd-001", name="Прайс-лист 2026 (актуальный)", type="template", date="2026-01-15"),
        PopularDoc(id="pd-002", name="Шаблон КП: Гофроупаковка", type="template", date="2025-11-20"),
        PopularDoc(id="pd-003", name="Технологическая карта флексопечати", type="tech_doc", date="2025-09-05"),
    ]


# ─── Leads ───────────────────────────────────────────────────────────────────

_LEADS_DB: list[Lead] = [
    Lead(
        id="l-001",
        company_name="ООО «ВитаФуд»",
        inn="7712345678",
        city="Москва",
        segment="mid",
        segment_label="Средний бизнес",
        trigger_reason="Компания открыла новое производство замороженных продуктов.",
        trigger_type="activity_signal",
        order_probability=82,
        expected_product="Гофрокартонные ящики для заморозки",
        expected_volume="25 000 шт./мес.",
        contact_person="Антонина Гришина (Директор по закупкам)",
        contact_phone="+7 495 123-99-88",
        is_saved=False,
        is_hidden=False,
        generated_at="2026-04-08T07:00:00",
        ai_insight="Конкурент «ГофроСнаб» потерял этого клиента год назад — хорошая точка входа.",
    ),
    Lead(
        id="l-005",
        company_name="ООО «МедПак»",
        inn="7745678901",
        city="Москва",
        segment="mid",
        segment_label="Средний бизнес",
        trigger_reason="Референс от действующего клиента ООО «ФармаПак».",
        trigger_type="referral",
        order_probability=89,
        expected_product="Стерильная упаковка для медизделий",
        expected_volume="15 000 шт./мес.",
        contact_person="Михаил Сенников",
        contact_phone="+7 495 777-55-44",
        is_saved=True,
        is_hidden=False,
        generated_at="2026-04-08T07:00:00",
        ai_insight="Реферал от VIP-клиента — высокая вероятность. Назначить встречу в течение 24 часов.",
    ),
]


def get_leads(
    segment: str | None = None,
    trigger_type: str | None = None,
    show_saved: bool | None = None,
) -> list[Lead]:
    # TODO: Replace with AI lead scoring pipeline (company data + signals)
    items = [l for l in _LEADS_DB if not l.is_hidden]
    if segment:
        items = [l for l in items if l.segment == segment]
    if trigger_type:
        items = [l for l in items if l.trigger_type == trigger_type]
    if show_saved:
        items = [l for l in items if l.is_saved]
    return sorted(items, key=lambda l: l.order_probability, reverse=True)


def save_lead(lead_id: str) -> bool:
    for lead in _LEADS_DB:
        if lead.id == lead_id:
            # Pydantic v2 — need to update via dict trick or use model_copy
            object.__setattr__(lead, "is_saved", True)
            return True
    return False


def hide_lead(lead_id: str) -> bool:
    for lead in _LEADS_DB:
        if lead.id == lead_id:
            object.__setattr__(lead, "is_hidden", True)
            return True
    return False
