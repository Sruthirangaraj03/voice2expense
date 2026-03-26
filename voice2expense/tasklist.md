# Voice2Expense — Task List

---

## Phase 1: Project Setup & Infrastructure

- [x] Initialize Next.js frontend with TypeScript + Tailwind CSS + ShadCN
- [x] Initialize NestJS backend with TypeScript
- [x] Set up Supabase project and configure connection
- [ ] Set up Redis on Railway (or local Docker for dev)
- [x] Configure environment variables (frontend + backend)
- [x] Set up monorepo or polyrepo folder structure
- [x] Configure ESLint + Prettier for both projects
- [x] Set up Git branching strategy and .gitignore

---

## Phase 2: Database Schema & Migrations

- [x] Create `users` table with RLS policy
- [x] Create `expenses` table with indexes and RLS policy
- [x] Create `budgets` table with unique constraint and RLS policy
- [x] Create `predictions` table with indexes and RLS policy
- [x] Create `ai_conversations` table with RLS policy
- [x] Create `budget_status` computed view
- [x] Add CHECK constraints (categories, types, amounts, confidence)
- [x] Add NOT NULL constraints on timestamp columns
- [x] Add unique constraint for prediction upserts
- [x] Secure budget_status view with security_invoker

---

## Phase 3: Authentication

- [ ] Set up NextAuth.js with Google OAuth provider
- [ ] Set up NextAuth.js with GitHub OAuth provider
- [ ] Set up NextAuth.js with credentials provider (email/password)
- [x] Build login page UI
- [x] Build registration page UI
- [x] Implement JWT strategy in NestJS (Passport)
- [x] Create `JwtAuthGuard` for protected routes
- [x] Implement `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/me` endpoints
- [x] Set up refresh token rotation (httpOnly cookie)
- [x] Differentiate access/refresh tokens with type claims
- [x] Add automatic token refresh on 401 (frontend)

---

## Phase 4: Expense Module (Backend)

- [x] Create `ExpenseModule` with controller, service, DTOs
- [x] Implement `POST /expenses` — create expense
- [x] Implement `GET /expenses` — list with pagination, filters, sorting
- [x] Implement `PUT /expenses/:id` — update expense
- [x] Implement `DELETE /expenses/:id` — delete expense
- [x] Add input validation with `class-validator`
- [x] Add ownership check (user can only access own expenses)
- [x] Fix silent delete returning success for non-existent records

---

## Phase 5: AI Module (Backend)

- [x] Create `AIModule` with controller, service
- [x] Implement `SttService` — OpenAI Whisper integration
- [x] Implement `LlmService` — OpenAI GPT-4o integration
- [x] Create expense parsing system prompt
- [x] Create query assistant system prompt
- [x] Implement `POST /ai/transcribe` — audio -> text
- [x] Implement `POST /ai/parse` — text -> structured JSON
- [x] Implement `POST /ai/voice-log` — combined: audio -> parse -> save
- [x] Implement `POST /ai/query` — natural language query -> AI response
- [x] Add confidence score to parsing responses
- [x] Add file upload size limit (10MB)
- [x] Add null check for file uploads
- [x] Handle empty transcription gracefully
- [x] Add try/catch for JSON.parse on LLM responses
- [x] Validate parsed voice data before saving
- [x] Add DTO validation for query/parse endpoints

---

## Phase 6: Budget Module (Backend)

- [x] Create `BudgetModule` with controller, service, DTOs
- [x] Implement `POST /budgets` — create/update budget limit
- [x] Implement `GET /budgets` — list budgets for current month
- [x] Implement `DELETE /budgets/:id` — remove budget
- [x] Implement `GET /budgets/status` — budget vs actual (uses view)
- [x] Add budget threshold alert logic (80% warning, 100% exceeded)
- [x] Fix silent delete returning success for non-existent records

---

## Phase 7: Analytics Module (Backend)

- [x] Create `AnalyticsModule` with controller, service
- [x] Implement `GET /analytics/summary` — totals, count, avg by period
- [x] Implement `GET /analytics/breakdown` — spending by category
- [x] Implement `GET /analytics/trends` — daily/weekly spending over time
- [ ] Add Redis caching for analytics queries
- [ ] Implement cache invalidation on expense CRUD

---

## Phase 8: Prediction Module (Backend)

- [x] Create `PredictionModule` with controller, service, processor
- [x] Implement `GET /predictions` — fetch forecasts
- [x] Implement `POST /predictions/generate` — trigger prediction job
- [x] Set up BullMQ queue and processor for prediction jobs
- [x] Implement GPT-based forecasting with confidence scores
- [x] Add risk flag logic for overspending predictions
- [x] Add try/catch for JSON.parse on prediction responses

---

## Phase 9: Frontend — Layout & Navigation

- [x] Create root layout with Tailwind + ShadCN theme (light/dark mode)
- [x] Build authenticated layout shell (sidebar + topbar)
- [x] Set up app router with route groups: `(auth)` and `(dashboard)`
- [x] Build responsive sidebar navigation
- [x] Add loading states and skeleton components
- [x] Set up API client (`lib/api.ts`) with JWT interceptor
- [x] Add 404 not-found page
- [x] Add error boundary page

---

## Phase 10: Frontend — Voice Input & Expense Logging

- [x] Build `VoiceRecorder` component (mic button + Web Audio API)
- [x] Implement `useVoiceRecorder` hook (start/stop/blob)
- [x] Build `ExpenseForm` component (manual entry + AI auto-fill)
- [x] Connect voice flow: record -> upload -> display parsed result -> editable form
- [x] Add confirmation and save flow
- [x] Add success/error toast notifications
- [x] Add browser compatibility check for MediaRecorder
- [x] Add microphone permission denied feedback
- [x] Add file size limit check (10MB)

---

## Phase 11: Frontend — Expense Management

- [x] Build `ExpenseList` component (sortable, filterable table)
- [x] Implement expense list page with pagination
- [x] Add filters: category, date range, type (expense/income)
- [x] Add inline edit and delete functionality
- [x] Implement `useExpenses` data fetching hook
- [x] Add delete confirmation dialog
- [x] Add client-side form validation (amount, description length)

---

## Phase 12: Frontend — Dashboard & Charts

- [x] Build dashboard home page layout
- [x] Build `KPICards` component (total spent, count, avg, voice ratio)
- [x] Build `SpendingPieChart` component (category breakdown)
- [x] Build `TrendLineChart` component (spending over time)
- [x] Build `BudgetProgressBar` component (per-category usage)
- [x] Connect charts to analytics API endpoints
- [x] Add error state with retry button
- [x] Use Indian locale (en-IN) for currency formatting

---

## Phase 13: Frontend — Budget Management

- [x] Build budget management page
- [x] Build budget creation/edit form (category + limit)
- [x] Display budget status cards (on track / warning / exceeded)
- [x] Add visual progress bars with color coding
- [x] Implement `useBudget` data fetching hook
- [x] Add delete confirmation dialog
- [x] Add error toast feedback on creation failure

---

## Phase 14: Frontend — AI Chat Assistant

- [x] Build `ChatAssistant` component (message list + input)
- [x] Implement chat UI with user/assistant message bubbles
- [x] Connect to `/ai/query` endpoint
- [x] Build `PredictionCard` component (forecast display)
- [x] Build insights page with predictions and recommendations
- [x] Add error toast feedback on prediction failure

---

## Phase 15: Background Jobs & Alerts

- [x] Set up BullMQ connection in NestJS
- [x] Implement budget alert job (triggered after expense creation)
- [x] Implement analytics refresh job (pre-compute aggregates)
- [x] Implement prediction generation cron job (monthly)
- [x] Implement cleanup job for old AI conversations (weekly)
- [ ] Add job retry and failure handling

---

## Phase 16: Testing

- [ ] Write unit tests for NestJS services (expense, budget, analytics)
- [ ] Write unit tests for AI service (mocked OpenAI responses)
- [ ] Write integration tests for API endpoints
- [ ] Write frontend component tests (React Testing Library)
- [ ] Test voice recording flow across browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design on mobile viewports
- [ ] End-to-end testing of critical flows (login -> voice log -> dashboard)

---

## Phase 17: Security & Hardening

- [x] Implement rate limiting (NestJS throttler — global guard)
- [x] Add CORS configuration (restrict to frontend origin)
- [x] Validate all DTOs with class-validator (whitelist + forbidNonWhitelisted)
- [x] Verify RLS policies block cross-user data access
- [x] Add request logging with correlation IDs
- [x] Add global exception filter with structured error responses
- [x] Audit environment variable handling (no secrets in client bundle)
- [x] Remove hardcoded JWT fallback secret
- [x] Sanitize error messages (no DB schema leaks)
- [x] Add file upload size limits
- [x] Constrain sort/pagination parameters
- [x] Add category enum validation in DTOs and DB

---

## Phase 18: Deployment

- [ ] Deploy frontend to Vercel (connect Git repo)
- [ ] Deploy backend to Railway (NestJS + Redis)
- [ ] Configure Supabase production project
- [ ] Set all environment variables in Vercel and Railway
- [ ] Configure custom domain and DNS
- [x] Set up health check endpoint (`/health`)
- [ ] Verify production end-to-end flow
- [ ] Set up uptime monitoring

---

## Phase 19: Polish & Launch

- [ ] Add dark mode toggle
- [ ] Optimize Lighthouse performance score
- [ ] Add empty states and onboarding hints for new users
- [ ] Add PWA manifest for mobile install
- [ ] Final cross-browser testing
- [ ] Write API documentation (Swagger/OpenAPI via NestJS)
- [ ] Launch v1.0
