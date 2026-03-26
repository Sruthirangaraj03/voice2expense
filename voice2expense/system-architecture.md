# System Architecture Document
**Product:** Voice Expense Logger + AI Assistant
**Version:** 1.0
**Last Updated:** 2026-03-26

---

## 1. Architecture Overview

Voice2Expense follows a **three-tier architecture** with a clear separation between the client layer, API layer, and data/service layer. The system is designed for low-latency voice-driven expense logging (< 2s end-to-end) with AI-powered categorization and predictive analytics.

```
+=====================================================================+
|                        CLIENT TIER (Vercel)                         |
|  +---------------------------------------------------------------+  |
|  |               Next.js App (TypeScript)                        |  |
|  |  +-------------+  +--------------+  +---------------------+  |  |
|  |  | Voice Input  |  | Dashboard    |  | AI Chat Assistant   |  |  |
|  |  | (Web Audio)  |  | (Charts/KPI) |  | (NL Queries)        |  |  |
|  |  +-------------+  +--------------+  +---------------------+  |  |
|  |  +-------------+  +--------------+  +---------------------+  |  |
|  |  | Expense Form |  | Budget Mgmt  |  | Auth (NextAuth.js)  |  |  |
|  |  | (Manual Edit)|  | (Limits/Alerts)|  | (Google/GitHub/Cred)|  |  |
|  |  +-------------+  +--------------+  +---------------------+  |  |
|  +---------------------------------------------------------------+  |
+============================|========================================+
                             | HTTPS (REST + WebSocket)
+============================|========================================+
|                        API TIER (Railway)                           |
|  +---------------------------------------------------------------+  |
|  |                    NestJS Application                         |  |
|  |                                                               |  |
|  |  +-----------+  +------------+  +----------+  +-----------+  |  |
|  |  | AuthModule|  |ExpenseModule| | AIModule  |  |BudgetModule| |  |
|  |  | - Guards  |  | - CRUD     |  | - STT    |  | - Limits  |  |  |
|  |  | - JWT     |  | - Validate |  | - Parse  |  | - Alerts  |  |  |
|  |  | - Refresh |  | - History  |  | - Query  |  | - Track   |  |  |
|  |  +-----------+  +------------+  +----------+  +-----------+  |  |
|  |  +---------------+  +----------------+                        |  |
|  |  |AnalyticsModule |  |PredictionModule|                        |  |
|  |  | - Aggregation  |  | - Forecast     |                        |  |
|  |  | - Trends       |  | - Risk Flags   |                        |  |
|  |  | - Reports      |  | - Confidence   |                        |  |
|  |  +---------------+  +----------------+                        |  |
|  +---------------------------------------------------------------+  |
+============================|========================================+
                             |
        +--------------------+---------------------+
        |                    |                      |
+-------v--------+  +-------v--------+  +----------v-----------+
|   DATA TIER    |  |  CACHE/QUEUE   |  |    EXTERNAL APIS     |
|                |  |                |  |                      |
| Supabase       |  | Redis          |  | OpenAI Whisper (STT) |
| (PostgreSQL)   |  | - Query Cache  |  | OpenAI GPT-4o (LLM)  |
| - Users        |  | - Session      |  |                      |
| - Expenses     |  | BullMQ         |  |                      |
| - Budgets      |  | - Predictions  |  |                      |
| - Predictions  |  | - Alerts       |  |                      |
| - RLS Enabled  |  | - Batch Jobs   |  |                      |
+----------------+  +----------------+  +----------------------+
```

---

## 2. Component Architecture

### 2.1 Frontend (Next.js — Vercel)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login page (NextAuth)
│   │   └── register/page.tsx         # Registration page
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Authenticated layout shell
│   │   ├── page.tsx                  # Dashboard home (KPIs + charts)
│   │   ├── expenses/page.tsx         # Expense list + filters
│   │   ├── budget/page.tsx           # Budget management
│   │   ├── insights/page.tsx         # AI insights + predictions
│   │   └── settings/page.tsx         # User preferences
│   ├── api/
│   │   └── auth/[...nextauth]/       # NextAuth API route
│   └── layout.tsx                    # Root layout
├── components/
│   ├── voice/
│   │   ├── VoiceRecorder.tsx         # Mic button + Web Audio API
│   │   └── VoicePreview.tsx          # Transcription preview + edit
│   ├── expense/
│   │   ├── ExpenseForm.tsx           # Manual / AI-filled form
│   │   ├── ExpenseList.tsx           # Sortable, filterable list
│   │   └── ExpenseCard.tsx           # Single expense display
│   ├── dashboard/
│   │   ├── SpendingPieChart.tsx      # Category breakdown
│   │   ├── TrendLineChart.tsx        # Spending over time
│   │   ├── BudgetProgressBar.tsx     # Per-category budget usage
│   │   └── KPICards.tsx              # Summary metrics
│   ├── ai/
│   │   ├── ChatAssistant.tsx         # NL query interface
│   │   └── PredictionCard.tsx        # Forecast display
│   └── ui/                           # ShadCN components
├── lib/
│   ├── api.ts                        # API client (fetch wrapper)
│   ├── supabase.ts                   # Supabase client init
│   └── auth.ts                       # NextAuth config
├── hooks/
│   ├── useVoiceRecorder.ts           # Audio recording hook
│   ├── useExpenses.ts                # Expense data fetching
│   └── useBudget.ts                  # Budget data fetching
└── types/
    └── index.ts                      # Shared TypeScript interfaces
```

**Key Design Decisions:**
- **App Router** with server components for dashboard data fetching (reduced client JS)
- **Web Audio API** for voice capture — outputs WebM/OGG blob sent to backend
- **Supabase Realtime** subscriptions for live dashboard updates after expense creation
- **ShadCN + Tailwind** for consistent, accessible UI with dark mode support

### 2.2 Backend (NestJS — Railway)

```
backend/
├── src/
│   ├── main.ts                       # Bootstrap + global pipes/filters
│   ├── app.module.ts                 # Root module
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts        # POST /auth/login, /auth/refresh
│   │   ├── auth.service.ts           # JWT sign/verify, user validation
│   │   ├── jwt.strategy.ts           # Passport JWT strategy
│   │   └── guards/
│   │       └── jwt-auth.guard.ts     # Route protection
│   ├── expense/
│   │   ├── expense.module.ts
│   │   ├── expense.controller.ts     # CRUD: GET/POST/PUT/DELETE /expenses
│   │   ├── expense.service.ts        # Business logic + Supabase queries
│   │   └── dto/
│   │       ├── create-expense.dto.ts
│   │       └── update-expense.dto.ts
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.controller.ts          # POST /ai/transcribe, /ai/parse, /ai/query
│   │   ├── ai.service.ts             # Orchestrates STT + LLM calls
│   │   ├── stt.service.ts            # Whisper API integration
│   │   ├── llm.service.ts            # GPT-4o integration
│   │   └── prompts/
│   │       ├── parse-expense.txt     # System prompt for expense parsing
│   │       └── query-assistant.txt   # System prompt for NL queries
│   ├── budget/
│   │   ├── budget.module.ts
│   │   ├── budget.controller.ts      # CRUD: /budgets + GET /budgets/status
│   │   ├── budget.service.ts         # Limit tracking + alert logic
│   │   └── dto/
│   │       └── create-budget.dto.ts
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts   # GET /analytics/summary, /trends, /breakdown
│   │   └── analytics.service.ts      # Aggregation queries + caching
│   ├── prediction/
│   │   ├── prediction.module.ts
│   │   ├── prediction.controller.ts  # GET /predictions
│   │   ├── prediction.service.ts     # Forecast logic using GPT
│   │   └── prediction.processor.ts   # BullMQ job processor
│   └── common/
│       ├── filters/                  # Global exception filters
│       ├── interceptors/             # Logging, transform interceptors
│       └── decorators/               # Custom decorators (e.g., @CurrentUser)
```

**Key Design Decisions:**
- **Modular architecture** — each domain is a self-contained NestJS module
- **DTOs with class-validator** for request validation at the API boundary
- **Guards + interceptors** for cross-cutting concerns (auth, logging, error handling)
- **Prompt files** stored as text files for easy iteration on AI behavior

---

## 3. Database Schema (Supabase PostgreSQL)

```sql
-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    avatar_url      TEXT,
    provider        TEXT DEFAULT 'credentials',   -- google, github, credentials
    password_hash   TEXT,                          -- null for OAuth users
    currency        TEXT DEFAULT 'INR',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    category        TEXT NOT NULL,                 -- food, transport, entertainment, etc.
    type            TEXT NOT NULL DEFAULT 'expense', -- expense | income
    description     TEXT,
    source          TEXT DEFAULT 'manual',         -- manual | voice
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);

-- ============================================
-- BUDGETS
-- ============================================
CREATE TABLE budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category        TEXT NOT NULL,
    month           DATE NOT NULL,                 -- first day of the month
    limit_amount    NUMERIC(12,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category, month)
);

-- ============================================
-- PREDICTIONS
-- ============================================
CREATE TABLE predictions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    forecast_month    DATE NOT NULL,
    category          TEXT NOT NULL,
    predicted_amount  NUMERIC(12,2) NOT NULL,
    confidence_score  NUMERIC(3,2) NOT NULL,       -- 0.00 to 1.00
    risk_flag         BOOLEAN DEFAULT false,
    generated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_predictions_user ON predictions(user_id, forecast_month);

-- ============================================
-- AI CHAT HISTORY (for context-aware queries)
-- ============================================
CREATE TABLE ai_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role            TEXT NOT NULL,                  -- user | assistant
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_self ON users FOR ALL USING (id = auth.uid());
CREATE POLICY expenses_owner ON expenses FOR ALL USING (user_id = auth.uid());
CREATE POLICY budgets_owner ON budgets FOR ALL USING (user_id = auth.uid());
CREATE POLICY predictions_owner ON predictions FOR ALL USING (user_id = auth.uid());
CREATE POLICY ai_conversations_owner ON ai_conversations FOR ALL USING (user_id = auth.uid());
```

**Computed View — Budget Status:**
```sql
CREATE VIEW budget_status AS
SELECT
    b.id,
    b.user_id,
    b.category,
    b.month,
    b.limit_amount,
    COALESCE(SUM(e.amount), 0) AS used_amount,
    b.limit_amount - COALESCE(SUM(e.amount), 0) AS remaining,
    CASE
        WHEN COALESCE(SUM(e.amount), 0) >= b.limit_amount THEN 'exceeded'
        WHEN COALESCE(SUM(e.amount), 0) >= b.limit_amount * 0.8 THEN 'warning'
        ELSE 'on_track'
    END AS status
FROM budgets b
LEFT JOIN expenses e
    ON e.user_id = b.user_id
    AND e.category = b.category
    AND e.type = 'expense'
    AND e.date >= b.month
    AND e.date < b.month + INTERVAL '1 month'
GROUP BY b.id, b.user_id, b.category, b.month, b.limit_amount;
```

---

## 4. API Design

### 4.1 REST Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Auth** | | | |
| POST | `/auth/register` | Register with email/password | No |
| POST | `/auth/login` | Login, returns JWT | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| **Expenses** | | | |
| GET | `/expenses` | List expenses (paginated, filterable) | Yes |
| POST | `/expenses` | Create expense | Yes |
| PUT | `/expenses/:id` | Update expense | Yes |
| DELETE | `/expenses/:id` | Delete expense | Yes |
| **AI** | | | |
| POST | `/ai/transcribe` | Upload audio -> text (Whisper) | Yes |
| POST | `/ai/parse` | Text -> structured expense JSON (GPT) | Yes |
| POST | `/ai/voice-log` | Audio -> transcribe + parse + save (combined) | Yes |
| POST | `/ai/query` | Natural language query -> AI response | Yes |
| **Budget** | | | |
| GET | `/budgets` | List budgets for current month | Yes |
| POST | `/budgets` | Create/update budget limit | Yes |
| DELETE | `/budgets/:id` | Remove budget | Yes |
| GET | `/budgets/status` | Budget vs actual for all categories | Yes |
| **Analytics** | | | |
| GET | `/analytics/summary` | Total spent, count, avg (day/week/month) | Yes |
| GET | `/analytics/breakdown` | Spending by category | Yes |
| GET | `/analytics/trends` | Daily/weekly spending over time | Yes |
| **Predictions** | | | |
| GET | `/predictions` | Get forecasts for next month | Yes |
| POST | `/predictions/generate` | Trigger prediction job | Yes |

### 4.2 Query Parameters (Expenses)

```
GET /expenses?category=food&type=expense&from=2026-03-01&to=2026-03-31&page=1&limit=20&sort=date:desc
```

### 4.3 Key Request/Response Formats

**Voice Log (Combined Endpoint):**
```
POST /ai/voice-log
Content-Type: multipart/form-data

Body: { audio: <WebM file> }

Response 200:
{
  "transcription": "Spent 250 rupees on lunch today",
  "parsed": {
    "amount": 250,
    "category": "food",
    "type": "expense",
    "date": "2026-03-26",
    "description": "lunch"
  },
  "expense_id": "uuid",
  "confidence": 0.95
}
```

**AI Query:**
```
POST /ai/query
Body: { "question": "How much did I spend on food this week?" }

Response 200:
{
  "answer": "You spent Rs. 1,450 on food this week across 6 transactions. This is 15% higher than last week.",
  "data": {
    "total": 1450,
    "count": 6,
    "change_percent": 15
  }
}
```

---

## 5. Data Flow Diagrams

### 5.1 Voice Expense Logging Flow

```
 User                Frontend              Backend (NestJS)         OpenAI           Supabase
  |                    |                        |                     |                 |
  |  Tap Mic           |                        |                     |                 |
  |--+                 |                        |                     |                 |
  |  | Record Audio    |                        |                     |                 |
  |<-+                 |                        |                     |                 |
  |                    |                        |                     |                 |
  |  Stop Recording    |                        |                     |                 |
  |------------------->|                        |                     |                 |
  |                    |  POST /ai/voice-log    |                     |                 |
  |                    |  (audio blob)          |                     |                 |
  |                    |----------------------->|                     |                 |
  |                    |                        |  Whisper STT        |                 |
  |                    |                        |-------------------->|                 |
  |                    |                        |  "250 on lunch"     |                 |
  |                    |                        |<--------------------|                 |
  |                    |                        |                     |                 |
  |                    |                        |  GPT-4o Parse       |                 |
  |                    |                        |-------------------->|                 |
  |                    |                        |  {amount,category}  |                 |
  |                    |                        |<--------------------|                 |
  |                    |                        |                     |                 |
  |                    |                        |  INSERT expense     |                 |
  |                    |                        |-------------------------------------------->|
  |                    |                        |  expense_id         |                 |
  |                    |                        |<--------------------------------------------|
  |                    |                        |                     |                 |
  |                    |  { parsed, id, conf }  |                     |                 |
  |                    |<-----------------------|                     |                 |
  |                    |                        |                     |                 |
  |  Show editable form|                        |                     |                 |
  |<-------------------|                        |                     |                 |
  |                    |                        |                     |                 |
  |  [Edit & Confirm]  |                        |                     |                 |
  |------------------->|  PUT /expenses/:id     |                     |                 |
  |                    |----------------------->|  UPDATE expense     |                 |
  |                    |                        |-------------------------------------------->|
  |                    |                        |                                        |
```

### 5.2 AI Query Flow

```
 User                Frontend              Backend (NestJS)      Redis        OpenAI        Supabase
  |                    |                        |                  |             |              |
  |  "How much on      |                        |                  |             |              |
  |   food this week?" |                        |                  |             |              |
  |------------------->|                        |                  |             |              |
  |                    |  POST /ai/query        |                  |             |              |
  |                    |----------------------->|                  |             |              |
  |                    |                        |  Check cache     |             |              |
  |                    |                        |----------------->|             |              |
  |                    |                        |  MISS            |             |              |
  |                    |                        |<-----------------|             |              |
  |                    |                        |                  |             |              |
  |                    |                        |  Fetch user expenses           |              |
  |                    |                        |--------------------------------------------->|
  |                    |                        |  expense data    |             |              |
  |                    |                        |<---------------------------------------------|
  |                    |                        |                  |             |              |
  |                    |                        |  GPT-4o (context + data)       |              |
  |                    |                        |-------------------------------->|              |
  |                    |                        |  NL answer       |             |              |
  |                    |                        |<--------------------------------|              |
  |                    |                        |                  |             |              |
  |                    |                        |  Cache result    |             |              |
  |                    |                        |----------------->|             |              |
  |                    |                        |                  |             |              |
  |                    |  { answer, data }      |                  |             |              |
  |                    |<-----------------------|                  |             |              |
  |  Display answer    |                        |                  |             |              |
  |<-------------------|                        |                  |             |              |
```

### 5.3 Prediction Generation Flow (Background Job)

```
 Scheduler/User       BullMQ Queue        Prediction Processor      OpenAI         Supabase
  |                        |                      |                    |               |
  |  Trigger job           |                      |                    |               |
  |----------------------->|                      |                    |               |
  |                        |  Dequeue job         |                    |               |
  |                        |--------------------->|                    |               |
  |                        |                      |                    |               |
  |                        |                      |  Fetch 90-day history             |
  |                        |                      |-------------------------------------->|
  |                        |                      |  expense history   |               |
  |                        |                      |<--------------------------------------|
  |                        |                      |                    |               |
  |                        |                      |  GPT-4o forecast   |               |
  |                        |                      |------------------->|               |
  |                        |                      |  predictions +     |               |
  |                        |                      |  confidence scores |               |
  |                        |                      |<-------------------|               |
  |                        |                      |                    |               |
  |                        |                      |  UPSERT predictions               |
  |                        |                      |-------------------------------------->|
  |                        |                      |                    |               |
  |                        |                      |  Check budgets for risk flags      |
  |                        |                      |-------------------------------------->|
  |                        |                      |  Trigger alerts if exceeded        |
  |                        |                      |-------------------------------------->|
```

---

## 6. Authentication & Security Architecture

```
+------------------+       +-----------------+       +------------------+
|   NextAuth.js    |       |   NestJS Auth   |       |    Supabase      |
|   (Frontend)     |       |   (Backend)     |       |    (Database)    |
|                  |       |                 |       |                  |
|  OAuth Providers |       |  JWT Strategy   |       |  Row Level       |
|  - Google        | JWT   |  - Validate     |  RLS  |  Security (RLS)  |
|  - GitHub        |------>|  - Decode       |------>|  - users_self    |
|  - Credentials   |       |  - Guard routes |       |  - expenses_owner|
|                  |       |                 |       |  - budgets_owner |
+------------------+       +-----------------+       +------------------+
```

**Security Layers:**

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Transport | HTTPS/TLS | Encrypt data in transit |
| Auth | JWT (access + refresh tokens) | Stateless API authentication |
| Authorization | NestJS Guards | Route-level access control |
| Data | Supabase RLS | Row-level data isolation per user |
| Storage | AES-256 (Supabase managed) | Encrypt data at rest |
| API | Rate limiting (NestJS throttler) | Prevent abuse |
| Input | class-validator DTOs | Validate and sanitize all input |
| Secrets | Environment variables (Railway/Vercel) | Secure credential management |

**Token Flow:**
```
1. User logs in via NextAuth (OAuth or credentials)
2. NextAuth issues a session JWT (short-lived, ~15 min)
3. Frontend sends JWT in Authorization header to NestJS
4. NestJS JwtAuthGuard validates token on every request
5. Refresh token (long-lived, ~7 days) stored in httpOnly cookie
6. On expiry, frontend calls /auth/refresh for a new access token
```

---

## 7. Caching Strategy (Redis)

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `analytics:summary:{userId}:{period}` | 5 min | Dashboard summary cards |
| `analytics:breakdown:{userId}:{month}` | 5 min | Category pie chart data |
| `analytics:trends:{userId}:{range}` | 5 min | Trend line chart data |
| `budget:status:{userId}:{month}` | 2 min | Budget progress bars |
| `ai:query:{hash}` | 10 min | Repeated AI query results |

**Cache Invalidation:**
- On expense create/update/delete: invalidate `analytics:*:{userId}:*` and `budget:status:{userId}:*`
- On budget create/update: invalidate `budget:status:{userId}:*`
- TTL-based expiry as fallback

---

## 8. Background Job Architecture (BullMQ)

| Queue | Job | Trigger | Schedule |
|-------|-----|---------|----------|
| `prediction` | Generate monthly forecasts | Manual + Cron | 1st of each month |
| `budget-alert` | Check budget thresholds | After expense creation | Event-driven |
| `analytics-refresh` | Pre-compute dashboard aggregates | After expense CRUD | Event-driven |
| `cleanup` | Purge old AI conversations | Cron | Weekly |

**Job Processing Architecture:**
```
NestJS Service
      |
      | add job
      v
  BullMQ Queue (Redis)
      |
      | process
      v
  Job Processor (NestJS Injectable)
      |
      +---> Supabase (read/write data)
      +---> OpenAI API (for predictions)
      +---> Redis (cache results)
```

---

## 9. Deployment Architecture

```
                    +------------------+
                    |   Cloudflare     |
                    |   (DNS + CDN)    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+        +----------v----------+
    |      Vercel       |        |      Railway        |
    |                   |        |                     |
    |  Next.js App      |  API   |  NestJS App         |
    |  - SSR/SSG pages  |------->|  - REST endpoints   |
    |  - Static assets  |        |  - Job processors   |
    |  - Edge functions |        |                     |
    |                   |        |  Redis (add-on)     |
    +---------+---------+        |  - Cache            |
              |                  |  - BullMQ queues    |
              |                  +----------+----------+
              |                             |
              +-------------+---------------+
                            |
                  +---------v---------+
                  |     Supabase      |
                  |                   |
                  |  PostgreSQL DB    |
                  |  - RLS enabled    |
                  |  - Realtime subs  |
                  |  - Auto backups   |
                  |  - Connection pool|
                  +-------------------+
```

**Environment Configuration:**

| Service | Environment Variables |
|---------|----------------------|
| **Vercel** (Frontend) | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| **Railway** (Backend) | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN` |
| **Supabase** (Database) | Managed — no user-side env config needed |

---

## 10. Error Handling & Observability

### Error Handling Strategy
```
Client Error (4xx)                     Server Error (5xx)
├── 400 Bad Request (validation)       ├── 500 Internal Server Error
├── 401 Unauthorized (JWT expired)     ├── 502 Bad Gateway (OpenAI down)
├── 403 Forbidden (RLS violation)      └── 503 Service Unavailable
├── 404 Not Found
└── 429 Too Many Requests

All errors return:
{
  "statusCode": 400,
  "message": "Human-readable error",
  "error": "BadRequestException",
  "timestamp": "2026-03-26T10:00:00Z"
}
```

### Observability Stack
| Concern | Tool | Notes |
|---------|------|-------|
| API Logging | NestJS Logger + Interceptors | Request/response logging with correlation IDs |
| Error Tracking | Vercel/Railway built-in logs | Centralized log aggregation |
| Performance | Vercel Analytics | Frontend Web Vitals |
| Database | Supabase Dashboard | Query performance, connection stats |
| Uptime | External health check (e.g., UptimeRobot) | Monitor `/health` endpoint |

---

## 11. Scalability Considerations

| Component | Current (v1) | Scale Path |
|-----------|-------------|------------|
| Frontend | Vercel (auto-scales at edge) | No changes needed |
| Backend | Single Railway container | Horizontal scaling via Railway replicas |
| Database | Supabase Free/Pro tier | Upgrade tier, read replicas |
| Cache | Single Redis instance | Redis Cluster on Railway |
| AI API | Direct OpenAI calls | Add retry + circuit breaker pattern |
| Queue | BullMQ on single Redis | Separate Redis for queue vs cache |

**Rate Limits to Enforce:**
- Voice transcription: 30 requests/min per user
- AI queries: 20 requests/min per user
- Expense CRUD: 60 requests/min per user
- Auth: 5 login attempts/min per IP

---

## 12. AI Prompt Architecture

### Expense Parsing Prompt
```
System: You are an expense parser. Given a natural language expense description,
extract and return ONLY a JSON object with these fields:
- amount (number)
- category (one of: food, transport, entertainment, shopping, bills, health, education, other)
- type ("expense" or "income")
- date (ISO date string, default today: {{today}})
- description (short summary)

If any field is ambiguous, use your best guess. Always return valid JSON.
```

### Query Assistant Prompt
```
System: You are a financial assistant for a personal expense tracker.
You have access to the user's expense data provided as context.
Answer spending questions concisely with specific numbers.
If you can provide comparisons or trends, do so.
Always mention the time period and currency (INR).
Never fabricate data — only use what is provided.

Context: {{user_expense_data}}
```

---

## 13. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo vs Polyrepo | **Polyrepo** (separate frontend/backend) | Independent deployment cycles, clear ownership |
| REST vs GraphQL | **REST** | Simpler for CRUD-heavy app, easier caching |
| SSR vs CSR | **Hybrid** (SSR for dashboard, CSR for interactive) | SEO not critical, but SSR improves initial load |
| Supabase Auth vs NextAuth | **NextAuth** (frontend) + **JWT** (backend) | More control over token flow, supports custom backend |
| Real-time approach | **Supabase Realtime** subscriptions | Built-in, no extra infrastructure |
| AI provider | **OpenAI** (Whisper + GPT-4o) | Best accuracy for STT + NLP parsing |
