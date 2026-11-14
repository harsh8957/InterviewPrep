# Phased Implementation Plan

**Audit Date:** 2026-11-12  
**Note:** Audit & documentation deliverable only — zero implementation code has been written. Execute phases strictly in order after owner approval.

---

## Recommended Implementation Sequence Overview

1. **Phase 1 — Critical Bugs & Security Stabilization** *(Blocker for everything else)*
2. **Phase 2 — UI/UX Redesign & Workspace Navigation Shell** *(Creates home for all modules)*
3. **Phase 3 — DSA Roadmap, Problem Bank & Coding Practice Workspace** *(Core SWE prep spine)*
4. **Phase 4 — Online Coding Judge & Timed Coding Assessments** *(Interactive execution & OAs)*
5. **Phase 5 — Core CS (OS, DBMS, CN, OOP) & System Design Modules** *(Full SWE breadth)*
6. **Phase 6 — Code-Aware & Resume-Based AI Mock Interviews** *(Integrates Judge/Resume into AI)*
7. **Phase 7 — Company-Specific Prep Tracks & Interview Experiences** *(Company-targeted layer)*
8. **Phase 8 — Learning Progress Analytics, Bookmarks & Profiles (+ Optional Contests)** *(Retention & metrics)*
9. **Phase 9 — Security Hardening, Performance Optimization & Deployment** *(Production readiness)*

---

## Detailed Phase Breakdown

### Phase 1: Critical Bugs, Security Fixes & Existing Functionality

- **User Problem:** Self-signup grants `admin` privileges; room endpoints expose PII unauthenticated; live AI interviews fail with HTTP `500` (`gemini-2.5-flash` 404); `ResultDetailPage` hides candidate answers; broken links lead to 404s.
- **Proposed Solution:** Lock down RBAC/JWT/AI endpoints, migrate `evaluator_service` and `aiService.ts` to active Gemini SDK/model with structured JSON output, align env config (`EVALUATOR_SERVICE_URL` port `8001` & `GEMINI_API_KEY`), fix broken UI mappings/routes, remove fake fallback scores.
- **Frontend Changes:** Fix `ResultDetailPage.tsx` (`answerText`), `ResultsPage.tsx` dashboard links, `InterviewContext.tsx` (`await` result save + remove random `50–70` fake score fallback), `InterviewPage.tsx` (`material-icons` -> `lucide-react`), `InterviewRoomPage.tsx` `useEffect` deps, and `LoginPage.tsx` `/forgot-password`.
- **Backend Changes:** Restrict `POST /api/auth/signup` to `'candidate'|'hr'`; enforce mandatory `process.env.JWT_SECRET` at boot; add `authenticateToken` + participant authorization on `GET/PUT /api/interviews/room/:roomId`, `auto-complete`, and `/api/interviews/gemini/*`; add shared internal service header between Express & FastAPI; unify Express/FastAPI Gemini usage cleanly with Zod validation.
- **Database Changes:** Add compound indexes on `InterviewRoom` and `InterviewResult`.
- **APIs Modified:** `POST /api/auth/signup`, `GET/PUT /api/interviews/room/:roomId`, `POST /api/interviews/gemini/*`, FastAPI `/fetch-questions`, `/evaluate-answer`, `/evaluate-and-next`.
- **Dependencies:** `zod` (backend validation), `google-genai` (Python), updated `@google/generative-ai` / active Gemini model ID (`gemini-2.5-flash` replacement verified via Google AI docs).
- **Testing & Acceptance Criteria:** Attempting `role: "admin"` signup returns `400/403`; unauthenticated `GET /room/:roomId` returns `401`; `fetch_questions` returns contiguous IDs `1..N`; Candidate sees exact submitted `answerText` on `/results/:id`; `npm run lint` works cleanly after fixing ESLint dependencies.
- **Estimated Complexity:** **Medium** (3–5 days).

---

### Phase 2: UI/UX Redesign & Responsive Workspace Shell

- **User Problem:** App looks like a generic marketing template, lacks developer workspace navigation, routes `admin` to 404 `/admin/dashboard`, and hides resources in the footer.
- **Proposed Solution:** Build a responsive Workspace Layout (`AppShell` sidebar on desktop + drawer on mobile) separated from lightweight marketing/auth landing pages; remove fabricated `HomePage`/`LoginPage` stats (`10K+`, `95%`); build initial Admin Dashboard stub route (`/admin/dashboard`).
- **Frontend Changes:** Refactor `Layout.tsx`, `Navbar.tsx`, `Footer.tsx`, `HomePage.tsx`; create `/admin/dashboard` shell; adopt route-level `React.lazy` code splitting; verify contrast/overflow across light/dark and mobile viewports via Playwright/Browser Automation.
- **Backend Changes:** Minimal (ensure `/api/auth/me` returns role cleanly).
- **Database Changes:** None.
- **APIs Required:** Existing `/api/auth/me`, `/api/admin/stats`.
- **Dependencies:** Existing Tailwind CSS + `lucide-react`.
- **Testing & Acceptance Criteria:** Zero 404 internal links; `admin`, `hr`, and `candidate` roles each route to valid dashboards; zero horizontal overflow at `375px` width; light & dark themes pass WCAG AA contrast check.
- **Estimated Complexity:** **Medium** (4–6 days).

---

### Phase 3: DSA Learning Roadmap & Coding Practice Workspace

- **User Problem:** Platform offers zero DSA curriculum, topic-wise problems, or code editor despite targeting SWE interview prep.
- **Proposed Solution:** Create structured DSA Roadmap tracks (Arrays, Strings, Sliding Window, Trees, Graphs, DP, etc.), curated Problem Catalog with search/difficulty/topic filters, and a split-pane Coding Practice Workspace.
- **Frontend Changes:** Add `/roadmap`, `/problems`, and `/problems/:slug` pages featuring Markdown statement viewer, hints accordion, starter-code selector (Python, JavaScript/TS, C++, Java), and Monaco Editor (`@monaco-editor/react`).
- **Backend Changes:** Add `roadmap` and `problem` controllers with pagination, filtering, and admin authoring endpoints (never returning hidden test cases).
- **Database Changes:** Add `RoadmapNode` and `Problem` collections (plus `TestCase` collection referenced by `problemId`).
- **APIs Required:** `GET /api/roadmaps`, `GET /api/problems`, `GET /api/problems/:slug`, `POST/PUT /api/admin/problems`.
- **Dependencies:** `@monaco-editor/react` (or CodeMirror 6), `react-markdown` + `rehype-sanitize` (safe Markdown rendering).
- **Testing & Acceptance Criteria:** Candidates browse roadmap topics, filter problems by topic/difficulty, view problem statements safely (XSS-sanitized), and persist local draft code per language.
- **Estimated Complexity:** **High** (1–2 weeks).

---

### Phase 4: Online Coding Judge, Test Cases & Timed Assessments

- **User Problem:** Candidates cannot compile/execute solutions against test cases or practice timed Online Assessments (OAs).
- **Proposed Solution:** Integrate an isolated code-execution sandbox (self-hosted Judge0 CE container or isolated Docker/nsjail runner queue) supporting sample runs and full hidden-case grading, plus timed multi-problem `Assessment` sessions.
- **Frontend Changes:** Wire "Run Sample Tests" and "Submit" buttons, verdict/runtime/memory badge display (`AC`, `WA`, `TLE`, `MLE`, `RE`, `CE`), submission history tab, and `/assessments` + `/assessments/:id` countdown workspace.
- **Backend Changes:** Implement `submissions` & `assessments` routes, async execution queue (BullMQ/Redis or worker queue), rate limiting, and server-side timer validation (`expiresAt`).
- **Database Changes:** Add `TestCase`, `Submission`, `Assessment`, `AssessmentAttempt`.
- **APIs Required:** `POST /api/submissions/run`, `POST /api/submissions`, `GET /api/submissions/:id`, `GET /api/assessments`, `POST /api/assessments/:id/start`, `POST /api/assessments/attempts/:attemptId/finish`.
- **Dependencies:** Docker/Judge0 CE (or Piston/isolated worker) + Redis/BullMQ for asynchronous job execution.
- **Testing & Acceptance Criteria:** Infinite loops trigger `TLE`, syntax errors return `CE` without leaking host paths, hidden test cases never leave server, and expired timed assessments reject late submissions (`403`).
- **Estimated Complexity:** **Very High** (2–3 weeks).

---

### Phase 5: Core CS (OS, DBMS, CN, OOP) & System Design Modules

- **User Problem:** Technical interviews heavily test Core CS concepts and HLD/LLD System Design, which are completely absent (except 1 blog post).
- **Proposed Solution:** Build interactive Core CS study & quiz modules (`OS`, `DBMS`, `CN`, `OOP`) and structured System Design case studies (requirements, capacity math, component trade-offs, Mermaid diagram editor, Backend/Full-Stack architecture scenarios).
- **Frontend Changes:** Add `/core-cs` (topic cards + timed quiz + explanations), `/system-design` & `/system-design/:slug` (structured design canvas + Mermaid preview + AI trade-off critique), and interactive STAR Behavioral builder (`/behavioral`).
- **Backend Changes:** Add `core-cs`, `system-design`, and `behavioral` drill routes + FastAPI evaluation prompt for open-ended architecture/CS explanations.
- **Database Changes:** Add `CoreCSQuizItem`, `SystemDesignProblem`, `ConceptAttempt`.
- **APIs Required:** `GET /api/core-cs/:subject`, `POST /api/core-cs/:subject/attempt`, `GET /api/system-design/:slug`, `POST /api/system-design/:slug/evaluate`.
- **Dependencies:** Existing `lucide-react`; optional `mermaid` renderer for system design diagrams.
- **Testing & Acceptance Criteria:** Quiz grading verifies answers server-side (hashes/answers not sent in `GET` quiz payload); System Design evaluator returns rubric-aligned structured feedback (scalability, data model, bottlenecks).
- **Estimated Complexity:** **High** (1.5–2 weeks).

---

### Phase 6: Code-Aware AI Mock Interviews & Resume-Based Prep

- **User Problem:** Current AI interview (`InterviewPage`) only accepts plain text, lacks real resume parsing (PDF), breaks on short/empty inputs inconsistently, and duplicates unused WebRTC/TTS dependencies.
- **Proposed Solution:** Upgrade `/setup` and `/interview` to support coding + follow-up technical questioning (leveraging Monaco + Judge context), parse uploaded PDF resumes safely into structured `ResumeProfile`, and generate tailored project/stack deep-dive mock interviews.
- **Frontend Changes:** Upgrade `SetupPage` with interview modes (`DSA Coding Round`, `Backend/System Design`, `Resume Deep-Dive`, `Behavioral`), add PDF upload UI, and embed code + text dual response input in `InterviewPage`.
- **Backend Changes:** Wire PDF text extraction (`pdf-parse` with size/MIME guard), persist `ResumeProfile`, pass candidate resume/role/experienceLevel context to FastAPI evaluator. Fix `POST /api/interviews/tts` (implement or remove stub).
- **Database Changes:** Add `ResumeProfile`; extend `InterviewResult` with `mode` and optional `submissionIds[]`.
- **APIs Required:** `POST /api/resume/upload`, `GET /api/resume/profile`, updated `POST /api/interviews/gemini/questions` & `/evaluate-and-next`.
- **Dependencies:** `multer` (already in `backend/package.json`!) + `pdf-parse` + clean FastAPI `google-genai` JSON schemas.
- **Testing & Acceptance Criteria:** PDF > size limit or non-PDF rejected (`400`); resume skills appear in generated interview prompt; AI evaluation returns valid JSON matching `EvaluateAndNextResponse` without `0.5` silent masking.
- **Estimated Complexity:** **High** (1.5–2 weeks).

---

### Phase 7: Company-Specific Preparation & Interview Experiences

- **User Problem:** Candidates preparing for specific companies (FAANG, startups, product companies) have no company-tagged problem lists or interview experience repository.
- **Proposed Solution:** Build `/companies` tracks linking existing DSA/System Design/Behavioral items with company tags, plus a moderated `/experiences` round-by-round submission & search hub.
- **Frontend Changes:** Add `/companies`, `/companies/:slug`, `/experiences`, and experience submission drawer with structured round breakdown (`Round Type`, `Difficulty`, `Outcome`, `Questions`).
- **Backend Changes:** Add company aggregation queries, `CompanyExperience` CRUD, and admin moderation endpoints.
- **Database Changes:** Add `CompanyTrack` and `CompanyExperience` collections.
- **APIs Required:** `GET /api/companies`, `GET /api/companies/:slug`, `GET/POST /api/experiences`, `PUT /api/admin/experiences/:id/moderate`.
- **Dependencies:** Existing Problem & Admin infrastructure from Phases 2–3.
- **Testing & Acceptance Criteria:** Submitted experiences start in `pending` moderation state and appear publicly only after admin approval; company track shows user completion %.
- **Estimated Complexity:** **Medium** (1 week).

---

### Phase 8: Learning Progress Analytics, Bookmarks & User Profiles

- **User Problem:** Users have no unified mastery metrics, topic weak-spot insights, bookmarks/revision queues, or developer profile stats.
- **Proposed Solution:** Track progress incrementally on every submission/quiz/mock completion into `UserProgress`, power an Analytics Dashboard (topic mastery, streaks, score trend), and add Bookmark/Revision Lists + optional Contests if Judge capacity permits.
- **Frontend Changes:** Upgrade `CandidateDashboard` with mastery breakdown, weak-topic CTA recommendations, streak calendar, `/bookmarks` revision list manager, and `/profile` settings.
- **Backend Changes:** Event/hook updater for `UserProgress`, analytics aggregation endpoints, bookmark CRUD + spaced repetition review dates.
- **Database Changes:** Add `UserProgress`, `BookmarkList` (and optional `Contest` / `ContestParticipation` if Phase 8+ backlog is pursued).
- **APIs Required:** `GET /api/analytics/overview`, `GET /api/analytics/weak-topics`, `GET/POST/DELETE /api/bookmarks`, `GET/PUT /api/profile`.
- **Dependencies:** Lightweight SVG chart library (e.g., custom SVG / `recharts`) lazy-loaded cleanly.
- **Testing & Acceptance Criteria:** Solving a problem or completing a Core CS quiz atomically increments `UserProgress`; deleting a bookmark preserves underlying problem data; IDOR checks prevent viewing other users' private analytics.
- **Estimated Complexity:** **Medium–High** (1–1.5 weeks).

---

### Phase 9: Security Hardening, Performance & Deployment Readiness

- **User Problem:** Missing rate limiting, security headers, unused dependency bloat, monolithic bundle, broken ESLint, zero automated CI, and synchronous FastAPI blocking risk production outages.
- **Proposed Solution:** Add `helmet`, `express-rate-limit`, `express-mongo-sanitize`, strict CORS origin lists, FastAPI async SDK/threadpool offloading (`asyncio.to_thread` or async client), prune unused packages (`@google-cloud/*`, `spacy`, `formik`, `yup`, unused `socket.io` if WebRTC deferred), add Dockerfiles/Compose + CI workflow.
- **Frontend Changes:** Split vendor/Monaco chunks in `vite.config.ts`, verify gzipped bundle budget, configure Nginx/Vercel environment proxy cleanly.
- **Backend & Evaluator Changes:** Non-blocking FastAPI AI calls, structured request logging (Pino/JSON logs without secrets), graceful shutdown handlers, health checks (`/api/health`, `/health`).
- **Database Changes:** Verify production Atlas/Mongo connection pooling, TTL indexes on revoked tokens/ephemeral runs, automated backup policy.
- **APIs / Infra Required:** `/api/health` readiness endpoint, `docker-compose.yml` (`frontend`, `backend`, `evaluator`, `mongo`, `redis`, `judge`), GitHub Actions CI (`lint`, `typecheck`, `test`, `build`).
- **Testing & Acceptance Criteria:** `eslint .`, `tsc --noEmit`, unit/integration suites, Playwright smoke tests, and Docker Compose startup pass cleanly in CI; load test verifies non-blocking `/health` under concurrent AI calls.
- **Estimated Complexity:** **Medium** (1 week).
