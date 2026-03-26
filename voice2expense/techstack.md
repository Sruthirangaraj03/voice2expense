# Tech Stack
**Product:** Voice Expense Logger + AI Assistant

---

## Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS + ShadCN |
| Backend | NestJS (Node.js) |
| Database | Supabase (PostgreSQL) |
| Cache & Queue | Redis + BullMQ |
| AI — LLM | OpenAI (GPT) |
| AI — STT | OpenAI Whisper |
| Auth | JWT + NextAuth |
| Deployment | Vercel + Railway + Supabase |

---

## Frontend

### Next.js + TypeScript
- **Why:** Server-side rendering (SSR) and static generation out of the box, excellent performance, file-based routing, and full TypeScript support. Ideal for a dashboard-heavy, real-time SaaS product.
- **Key usage:** App router, API routes, server components for dashboard data fetching.

### Tailwind CSS
- **Why:** Utility-first CSS for rapid UI development with consistent spacing, typography, and responsive design. Zero runtime overhead.
- **Key usage:** All layout, spacing, responsive breakpoints, and dark mode theming.

### ShadCN UI
- **Why:** Unstyled, accessible, copy-paste components built on Radix UI primitives. Full control over design without fighting a component library.
- **Key usage:** Modals, dropdowns, form inputs, toasts, charts wrapper components.

---

## Backend

### NestJS (Node.js)
- **Why:** Opinionated, enterprise-grade Node.js framework with built-in dependency injection, decorators, modular architecture, and strong TypeScript support. Scales cleanly as the codebase grows.
- **Key usage:** REST API endpoints, service layer (Auth, Expense, Budget, AI, Analytics), guards and interceptors.

**Core Modules:**
```
src/
├── auth/         # JWT strategy, guards
├── expense/      # CRUD + AI parse trigger
├── budget/       # Limit tracking, alert triggers
├── ai/           # LLM + STT integration
├── analytics/    # Dashboard data aggregation
└── prediction/   # Forecast engine
```

---

## Database

### Supabase (PostgreSQL)
- **Why:** Managed PostgreSQL with real-time subscriptions, built-in auth, Row Level Security (RLS), and an auto-generated REST + GraphQL API. Removes database ops overhead.
- **Key usage:** All persistent data — users, expenses, budgets, predictions. Real-time dashboard updates via Supabase subscriptions.

**Schema:**
```sql
users        (id, name, email, created_at)
expenses     (id, user_id, amount, category, type, date, description)
budgets      (id, user_id, category, limit, used)
predictions  (id, user_id, forecast_date, predicted_amount, risk_flag)
```

---

## Cache & Queue

### Redis
- **Why:** In-memory data store for ultra-fast caching. Reduces repeated AI API calls and DB queries for frequently accessed dashboard data.
- **Key usage:** Cache AI query responses, dashboard aggregates, user session data.

### BullMQ
- **Why:** Robust job queue built on Redis. Handles async workloads reliably with retries, priorities, and concurrency controls.
- **Key usage:** Background jobs for prediction generation, budget alert notifications, and batch analytics processing.

---

## AI Layer

### OpenAI — LLM (GPT-4o / GPT-4-turbo)
- **Why:** Best-in-class language understanding for parsing free-form expense descriptions, answering natural language queries, and generating spending insights.
- **Key usage:**
  - Parse STT text → structured JSON `{ amount, category, type, date, description }`
  - Answer natural language queries ("How much did I spend on food this week?")
  - Generate predictive insights with confidence scores

### OpenAI — Whisper (STT)
- **Why:** State-of-the-art open-source speech-to-text model. Highly accurate across accents and noisy environments, with multilingual support.
- **Key usage:** Convert recorded voice audio (WebM/MP4) to text before passing to GPT for parsing.

**AI Flow:**
```
Voice Input (WebM)
      ↓
Whisper STT → Raw Text
      ↓
GPT-4o NLP Parse → { amount, category, type, date, description }
      ↓
Backend API → Supabase
```

---

## Authentication

### JWT (JSON Web Tokens)
- **Why:** Stateless, scalable token-based auth. Works seamlessly across frontend and backend services.
- **Key usage:** Access tokens for API authorization, refresh token rotation.

### NextAuth.js
- **Why:** Full-featured auth library for Next.js with built-in providers, session management, and easy JWT integration.
- **Key usage:** OAuth providers (Google, GitHub), credential login, session context on the frontend.

---

## Deployment

### Vercel
- **What:** Frontend hosting
- **Why:** Native Next.js deployment with zero-config CI/CD, edge network, automatic preview deployments per PR.

### Railway
- **What:** Backend hosting (NestJS + Redis + BullMQ)
- **Why:** Simple container-based deployment for Node.js services, built-in Redis add-on, environment variable management, and auto-scaling.

### Supabase
- **What:** Database + Auth + Realtime hosting
- **Why:** Fully managed PostgreSQL — handles backups, connection pooling, RLS, and real-time out of the box.

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│        Client (Next.js / Mobile)    │
│   TypeScript + Tailwind + ShadCN    │
└────────────────┬────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────┐
│         API Gateway (NestJS)        │
│  Auth │ Expense │ AI │ Budget │ Analytics │
└────┬──────────────────────┬─────────┘
     │                      │
┌────▼──────┐        ┌──────▼──────────┐
│ Supabase  │        │  Redis + BullMQ │
│ PostgreSQL│        │  Cache + Queue  │
└───────────┘        └─────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │    OpenAI APIs              │
              │  Whisper (STT) + GPT (LLM)  │
              └─────────────────────────────┘
```

---

## Development Environment

```bash
# Frontend
Node.js >= 18
next dev

# Backend
NestJS CLI
nest start --watch

# Database
Supabase CLI for local dev
supabase start

# Queue
Redis via Docker
docker run -d -p 6379:6379 redis
```

---

## Environment Variables

```env
# Frontend (.env.local)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
REDIS_URL=
JWT_SECRET=
```