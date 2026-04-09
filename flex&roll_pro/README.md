# Flex&Roll AI Workspace

AI-надстройка над Bitrix24 для менеджеров и руководителей отдела продаж.
Включает **Lead Generator** — AI-скоринг новых компаний из EGR.gov.by для холодного контакта.

## Архитектура

```
flex&roll_pro/
├── frontend/              # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/Leads/   # Lead Generator UI (real data)
│       ├── services/      # leadsService → real API
│       ├── api/           # axios client
│       ├── mocks/         # Mock data for non-lead pages
│       └── components/    # Reusable UI
├── backend/               # FastAPI + Python
│   └── app/
│       ├── api/v1/routers/
│       │   ├── leads.py   # GET /leads/top, POST /leads/refresh
│       │   └── bitrix.py  # Bitrix24 install/app handlers
│       ├── services/
│       │   └── lead_generator.py  # Pipeline orchestrator
│       ├── scout/         # EGR parser + LLM scoring engine
│       ├── bitrix/        # OAuth2 + REST API client
│       ├── schemas/       # Pydantic models
│       └── config.py      # Settings
```

## Lead Generator Pipeline

```
EGR.gov.by API → [новые компании за N дней]
    → Heuristic pre-filter (keyword matching) → top 100
    → LLM enrichment + scoring (top 15) → ranked results
    → top 5 → cached → API → frontend
```

- **Источник**: egr.gov.by API (недавно зарегистрированные компании)
- **Pre-filter**: keyword-based heuristic (пищевая, косметика, фарма, FMCG...)
- **Scoring**: 6 факторов (product_packaging_fit, labeling_need, newness, urgency, data_quality, sales_readiness)
- **LLM**: OpenRouter (Gemini 2.0 Flash) для анализа и скоринга
- **Кэш**: результат хранится в JSON, обновляется по запросу или TTL

## Быстрый старт

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Скопировать и заполнить .env
cp .env.example .env
# Обязательно: OPENROUTER_API_KEY=sk-or-v1-...

uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend
npm install

# Для работы с реальным backend:
echo "VITE_USE_MOCK=false" > .env
echo "VITE_API_URL=http://localhost:8000/api/v1" >> .env

npm run dev
```

http://localhost:5173 → страница `/leads`

### Запуск генерации лидов

```bash
# Через API:
curl -X POST http://localhost:8000/api/v1/leads/refresh

# Проверить статус:
curl http://localhost:8000/api/v1/leads/status

# Получить результат:
curl http://localhost:8000/api/v1/leads/top
```

Или нажмите кнопку **Обновить** на странице Lead Generator в UI.

## API Endpoints (Lead Generator)

| Method | URL | Описание |
|--------|-----|----------|
| `GET` | `/api/v1/leads/top` | Кэшированные top-5 лидов |
| `POST` | `/api/v1/leads/refresh` | Запуск пайплайна в фоне |
| `GET` | `/api/v1/leads/status` | Статус пайплайна |
| `GET` | `/health` | Healthcheck + pipeline status |

### Формат ответа `/api/v1/leads/top`

```json
{
  "data": {
    "leads": [
      {
        "id": "abc123",
        "company_name": "ООО «ВитаФуд»",
        "normalized_name": "ВитаФуд",
        "registration_date": "2026-04-01",
        "industry": "food",
        "product_category": "продукты питания",
        "why_recommended": "Производитель продуктов питания — нужны этикетки | Новая регистрация",
        "score": 82.5,
        "confidence_score": 75,
        "priority_tier": "hot",
        "source_url": "https://egr.gov.by/...",
        "source_name": "egr",
        "company_summary": "...",
        "outreach_angle": "...",
        "suggested_pitch": "...",
        "sales_brief": "...",
        "scoring_breakdown": {
          "product_packaging_fit": { "score": 90, "weight": 0.30, "explanation": "..." },
          "labeling_need": { "score": 85, "weight": 0.25, "explanation": "..." }
        },
        "created_at": "2026-04-09T10:00:00Z"
      }
    ],
    "generated_at": "2026-04-09T10:00:00Z",
    "pipeline_status": "done",
    "total_candidates": 156,
    "total_scored": 15,
    "cache_stale": false
  }
}
```

## Деплой

### Frontend → Vercel

1. Подключите репо к Vercel
2. Root directory: `flex&roll_pro/frontend`
3. Framework: Vite
4. Environment variables:
   ```
   VITE_USE_MOCK=false
   VITE_API_URL=https://your-backend.up.railway.app/api/v1
   ```

### Backend → Railway

1. Подключите репо к Railway
2. Root directory: `flex&roll_pro/backend`
3. Start command определён в `Procfile` / `railway.json`
4. Environment variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   CORS_ORIGINS=["https://your-frontend.vercel.app"]
   FRONTEND_PUBLIC_URL=https://your-frontend.vercel.app
   BACKEND_PUBLIC_URL=https://your-backend.up.railway.app
   DEBUG=false
   USE_MOCK=false
   ```

## Bitrix24 Integration Readiness

Проект подготовлен для подключения как **локальное серверное приложение с интерфейсом**.

### Настройка в Bitrix24

1. Откройте Bitrix24 → Разработчикам → Добавить приложение → Серверное приложение
2. Заполните:
   - **URL приложения** (handler URL): `https://your-backend.up.railway.app/api/v1/bitrix/app`
   - **URL установки**: `https://your-backend.up.railway.app/api/v1/bitrix/install`
   - **Права**: `crm` (CRM), `user` (Пользователи)
3. Сохраните — получите `client_id` и `client_secret`
4. Добавьте в env backend:
   ```
   BITRIX_CLIENT_ID=local.xxx
   BITRIX_CLIENT_SECRET=xxx
   ```

### Реализованные модули

| Модуль | Файл | Статус |
|--------|------|--------|
| OAuth2 install flow | `backend/app/bitrix/auth.py` | Готов |
| Token management | `backend/app/bitrix/auth.py` | Готов (in-memory) |
| REST API client | `backend/app/bitrix/client.py` | Готов (rate-limited) |
| Install endpoint | `backend/app/api/v1/routers/bitrix.py` | Готов |
| App iframe entry | `backend/app/api/v1/routers/bitrix.py` | Готов |
| Frontend iframe mode | `frontend/vercel.json` (X-Frame-Options) | Готов |

### Bitrix24 env-переменные

```
BITRIX_CLIENT_ID=        # Из настроек приложения
BITRIX_CLIENT_SECRET=    # Из настроек приложения
BITRIX_SCOPE=crm,user    # Требуемые права
FRONTEND_PUBLIC_URL=     # URL фронтенда (для redirect из iframe)
BACKEND_PUBLIC_URL=      # URL бэкенда (для handler/install URL)
```

## Environment Variables

### Backend

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `OPENROUTER_API_KEY` | Да (для lead gen) | API ключ OpenRouter |
| `LLM_MODEL` | Нет | Модель LLM (default: gemini-2.0-flash-001) |
| `CORS_ORIGINS` | Да (prod) | JSON-массив допустимых origin |
| `LEAD_CANDIDATE_LIMIT` | Нет | Макс. кандидатов для pre-filter (100) |
| `LEAD_PRE_SCORE_TOP_N` | Нет | Сколько отправить в LLM (15) |
| `LEAD_TOP_K` | Нет | Сколько вернуть (5) |
| `LEAD_DAYS_BACK` | Нет | За сколько дней искать (3) |
| `LEAD_CACHE_TTL` | Нет | TTL кэша в секундах (3600) |
| `BITRIX_CLIENT_ID` | Для Bitrix24 | ID приложения |
| `BITRIX_CLIENT_SECRET` | Для Bitrix24 | Секрет приложения |
| `DEBUG` | Нет | Debug mode (true) |

### Frontend

| Переменная | Описание |
|------------|----------|
| `VITE_USE_MOCK` | `true` — моки, `false` — реальный API |
| `VITE_API_URL` | URL backend API |

## Технологии

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide icons

**Backend:** FastAPI, Pydantic v2, Python 3.11+, Uvicorn

**Lead Generation:** EGR.gov.by API, DuckDuckGo Search, OpenRouter (Gemini 2.0 Flash)

## Что можно улучшить после хакатона

- [ ] Persistent token store для Bitrix24 (DB вместо in-memory)
- [ ] Async pipeline с asyncio вместо threading
- [ ] Cron-based scheduled refresh на Railway
- [ ] Bitrix24 webhook для автоматического создания лидов в CRM
- [ ] Batch LLM scoring для ускорения пайплайна
- [ ] PostgreSQL для хранения истории лидов
- [ ] Деплой worker как отдельный Railway service
- [ ] Rate limit middleware для API
- [ ] Auth middleware (JWT / Bitrix24 token validation)
