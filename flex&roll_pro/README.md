# Flex&Roll AI Workspace

AI-надстройка над Bitrix24 для менеджеров и руководителей отдела продаж.

## Архитектура

```
flex&roll_pro/
├── frontend/          # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── types/     # Domain entities + API response types
│       ├── api/       # Typed axios client + config
│       ├── services/  # Service layer (abstracts API vs mock)
│       ├── mocks/     # Mock adapter + realistic demo data
│       ├── components/
│       │   ├── ui/    # Reusable: Badge, Card, Button, Tabs, SidePanel...
│       │   └── layout/ # AppLayout, Sidebar
│       ├── pages/
│       │   ├── Today/     # Главная — дашборд менеджера
│       │   ├── Risks/     # Операционный risk tracker
│       │   ├── Search/    # AI document search / RAG
│       │   ├── Leads/     # AI lead generator
│       │   ├── Analytics/ # Executive dashboard (KPI, динамика, качество, потери)
│       │   └── Client/    # Client 360 — карточка клиента
│       └── utils/     # formatRub, formatDate, etc.
└── backend/           # FastAPI + Python
    └── app/
        ├── api/v1/routers/   # dashboard, clients, risks, analytics, search, leads
        ├── schemas/           # Pydantic models
        ├── repositories/      # mock_repository.py → заменить на реальные интеграции
        └── config.py          # Settings (USE_MOCK, CORS, future API keys)
```

## Режим работы

**Mock mode (демо)** — по умолчанию, не требует backend:
```
VITE_USE_MOCK=true
```

**Production mode** — подключает реальный FastAPI backend:
```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000/api/v1
```

## Быстрый старт

### Frontend (Mock mode — для демо)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Откройте http://localhost:5173

### Backend (опционально)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

## Страницы

| URL | Название | Описание |
|-----|----------|----------|
| `/` | Сегодня | Главный дашборд менеджера: риски, маршрутизация, VIP alerts, sentiment |
| `/risks` | Риски | Операционный вид: все рисковые сделки с фильтрами и таблицей |
| `/search` | Поиск | AI-поиск по документам, расчётам, КП, техдокументам |
| `/leads` | Лиды | AI-генератор лидов с инсайтами и триггерами |
| `/analytics` | Аналитика | KPI сотрудников, динамика, качество коммуникаций, причины потерь |
| `/clients/:id` | Карточка клиента | Client 360: AI summary, лента, оценка звонка, документы |

## Как заменить mock на реальный backend

1. Открой `backend/app/repositories/mock_repository.py`
2. Найди функции с комментарием `# TODO:`
3. Замени mock-данные на реальные вызовы (Bitrix24 API, DB, AI сервисы)
4. Поставь `USE_MOCK=False` в `.env`

На фронте:
1. Поставь `VITE_USE_MOCK=false` в `frontend/.env`
2. Убедись что `VITE_API_URL` указывает на backend

Сервисный слой (`frontend/src/services/`) автоматически переключится на реальный API.

## Точки расширения (future integrations)

| Функция | Интеграция |
|---------|------------|
| CRM данные | Bitrix24 REST API |
| AI summary | OpenAI / Anthropic Claude |
| Анализ звонков | Yandex SpeechKit / Whisper + LLM |
| RAG поиск | Qdrant + LangChain |
| Sentiment | Fine-tuned classifier или LLM |
| Авторизация | Bitrix24 OAuth / JWT |
| Уведомления | Bitrix24 push hooks |

## Технологии

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Router v6, Recharts, Lucide icons, Manrope + DM Sans

**Backend:** FastAPI, Pydantic v2, Python 3.11+, Uvicorn
