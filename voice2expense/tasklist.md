# Vocal Ledger Pro — Task List

---

## Phase 1: Project Setup & Infrastructure
- [x] Initialize Next.js frontend with TypeScript + Tailwind CSS + ShadCN
- [x] Initialize NestJS backend with TypeScript
- [x] Set up Supabase project and configure connection
- [x] Configure environment variables (frontend + backend)
- [x] Set up polyrepo folder structure (frontend/ + backend/)
- [x] Configure ESLint + Prettier
- [x] Set up .gitignore

## Phase 2: Database Schema
- [x] Create users, expenses, budgets, predictions, ai_conversations tables
- [x] Add RLS policies on all tables
- [x] Create budget_status computed view (security_invoker)
- [x] Add CHECK constraints (categories, amounts, confidence)
- [x] Add NOT NULL on timestamps, unique constraint for predictions
- [x] Add sub_type column to expenses

## Phase 3: Authentication
- [x] JWT strategy in NestJS (Passport)
- [x] Auth endpoints: login, register, refresh, me
- [x] Token differentiation (access/refresh)
- [ ] Re-enable auth guards on controllers (currently disabled for testing)
- [ ] Google/GitHub OAuth providers

## Phase 4-6: Backend Modules
- [x] Expense CRUD with validation, pagination, filters
- [x] Budget CRUD with status view
- [x] Analytics: summary, breakdown, trends
- [x] Prediction engine with Sarvam AI

## Phase 7: AI Module (Sarvam AI)
- [x] STT via Sarvam saarika:v2.5 (WAV 16kHz)
- [x] LLM via Sarvam sarvam-m for expense parsing
- [x] Smart parsing: bill splitting, sub-types, date detection
- [x] Budget-aware AI assistant ("Logger AI")
- [x] Strip `<think>` tags from model output
- [x] Amount sanitization (strip currency symbols)
- [x] JSON parse with markdown fence fallback

## Phase 8: Frontend — UI (Stitch Design)
- [x] Light theme with orange #E65100 accent
- [x] Responsive: desktop sidebar + mobile bottom nav
- [x] Landing page with "Get Started" CTA
- [x] Dashboard: voice card, AI search, KPI stats, donut chart, recent activity
- [x] Full-screen voice recording overlay with live transcription
- [x] Voice confirmation card (amount, category, date, confidence)
- [x] Expense list with category filters and sub-type display
- [x] Budget goals with progress bars
- [x] AI chat with message bubbles and suggestions
- [x] 404 and error boundary pages
- [x] Toast notifications (sonner)

## Phase 9: Deployment
- [x] Frontend deployed to Vercel
- [x] Backend deployed to Vercel (serverless)
- [x] Next.js rewrites proxy /api/* to backend
- [x] Supabase production database live
- [x] All env vars configured on Vercel
- [x] Health check endpoint verified
- [ ] Custom domain
- [ ] Uptime monitoring

## Phase 10: Security
- [x] Global exception filter (sanitized errors)
- [x] Request logging with correlation IDs
- [x] DTO validation (whitelist + forbidNonWhitelisted)
- [x] DB CHECK constraints
- [x] RLS + security_invoker view
- [x] No secrets in git

## Pending
- [ ] Re-enable authentication (login/register flow)
- [ ] Custom domain setup
- [ ] Unit/integration tests
- [ ] Dark mode toggle
- [ ] PWA manifest for mobile install
- [ ] Swagger/OpenAPI documentation
