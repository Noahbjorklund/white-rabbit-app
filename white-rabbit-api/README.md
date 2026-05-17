# White Rabbit OS™ — Backend API

Operational Intelligence Platform for Nordic SMBs.

## Stack

- **Python 3.12** + **FastAPI**
- **PostgreSQL** via SQLAlchemy (async)
- **Claude API** (Anthropic) for prospect analysis and meeting summaries
- **Alembic** for database migrations
- Deploy on **Railway** or **Render**

---

## Project structure

```
white-rabbit-api/
├── app/
│   ├── main.py              # FastAPI app + middleware
│   ├── config.py            # Settings from .env
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py       # Pydantic request/response schemas
│   ├── services/
│   │   ├── ai_service.py    # Claude analysis + meeting summaries
│   │   ├── scoring.py       # Prospect scoring engine
│   │   └── crm_service.py   # HubSpot + Pipedrive push
│   ├── routers/
│   │   ├── prospects.py     # /prospects CRUD
│   │   ├── ai.py            # /ai/analyze, /ai/summarize, /ai/crm/push
│   │   └── activities.py    # /activities + /tasks
│   └── db/
│       └── database.py      # Async DB session
├── alembic/
│   └── env.py
├── alembic.ini
├── requirements.txt
├── .env.example
├── docker-compose.yml       # Local dev with Postgres
├── Dockerfile
├── railway.toml             # Railway deploy config
└── render.yaml              # Render deploy config
```

---

## Local setup

```bash
# 1. Clone and install
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and ANTHROPIC_API_KEY

# 3. Start database (Docker)
docker-compose up db -d

# 4. Run migrations
alembic upgrade head

# 5. Start API
uvicorn app.main:app --reload
```

Or run everything with Docker:

```bash
docker-compose up
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## API endpoints

### Prospects
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/prospects/` | List all prospects (filterable by industry, min_score) |
| POST   | `/prospects/` | Create prospect (auto-scores on creation) |
| GET    | `/prospects/{id}` | Get single prospect |
| PATCH  | `/prospects/{id}` | Update prospect (re-scores automatically) |
| DELETE | `/prospects/{id}` | Delete prospect |
| GET    | `/prospects/{id}/contacts` | List contacts |
| POST   | `/prospects/{id}/contacts` | Add contact |
| GET    | `/prospects/{id}/deals` | List deals |
| POST   | `/prospects/{id}/deals` | Create deal |
| PATCH  | `/prospects/{id}/deals/{deal_id}` | Update deal stage |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/ai/analyze` | Run Claude prospect analysis |
| POST   | `/ai/summarize` | Summarize meeting transcript |
| POST   | `/ai/score` | Score a prospect without saving |
| POST   | `/ai/crm/push` | Push prospect to HubSpot or Pipedrive |

### Activities & Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/activities/` | List activities (filter by company) |
| POST   | `/activities/` | Log activity |
| GET    | `/tasks/` | List tasks (filter by company, completed) |
| POST   | `/tasks/` | Create task |
| PATCH  | `/tasks/{id}/complete` | Mark task complete |

---

## Example requests

### Analyze a prospect
```bash
curl -X POST http://localhost:8000/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Bright Commerce Group",
    "industry": "ecommerce",
    "revenue_msek": 95,
    "growth_pct": 41,
    "employees": 52,
    "tech_stack": ["Shopify", "Fortnox", "HubSpot"],
    "hiring_signals": "Hiring operations coordinator",
    "save_to_company": 1
  }'
```

### Score a prospect
```bash
curl -X POST http://localhost:8000/ai/score \
  -H "Content-Type: application/json" \
  -d '{
    "revenue_msek": 95,
    "growth_pct": 41,
    "employees": 52,
    "industry": "ecommerce",
    "tech_stack": ["Shopify", "Fortnox"],
    "has_internal_dev": false
  }'
```

### Summarize a meeting
```bash
curl -X POST http://localhost:8000/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "We spoke with the COO about their current operations...",
    "company_id": 1
  }'
```

### Push to CRM
```bash
curl -X POST http://localhost:8000/ai/crm/push \
  -H "Content-Type: application/json" \
  -d '{"company_id": 1, "crm": "hubspot"}'
```

---

## Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set DATABASE_URL=...
```

## Deploy to Render

Push to GitHub, then connect your repo in Render dashboard.
The `render.yaml` file handles service + database setup automatically.

---

## Database migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```
