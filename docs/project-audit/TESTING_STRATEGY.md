# Testing Strategy

**Audit Date:** 2026-11-12  
**Current Baseline:** **0 existing test files in repository**; ESLint broken (`@eslint/js` missing in root `eslint.config.js`).

---

## 1. Baseline Audit Test Results Executed Against Current Code

All audit tests ran against an isolated MongoDB database (`interviewprep_audit_test`) without modifying source files:

| Suite | Scope | Executed Checks | Passed | Failed / Findings |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend & Backend Builds** | `tsc`, `vite build`, `tsup` | 2 | **2** | Frontend `462.98 KiB` `dist/`, Backend `54.52 KB` `dist/index.js`. |
| **ESLint (`npm run lint`)** | `frontend/` & `backend/` | 2 | **0** | Both fail immediately: `Cannot find package '@eslint/js'`. |
| **Express API & RBAC Suite** | Auth, RBAC, IDOR, Rooms, Results, CMS, AI Proxy | 58 | **50** | **8 failures/defects:** admin self-signup `201`, unauthenticated `GET /room/:roomId` `200`, 3 live Gemini `500` errors (`gemini-2.5-flash` 404), `/api/resume/analyze` `500` (missing backend key), 2 non-existent doc endpoints (`POST /api/jobs`, `POST /api/results/evaluate` -> `404`). |
| **Mocked FastAPI Unit Suite** | `fetch_questions`, `evaluate_answer`, `evaluate_and_next`, `/health`, Pydantic | 15 | **14** | **1 bug caught:** `fetch_questions_valid_trimmed` shifts IDs to `[2, 3, 4]` when `#` header precedes lines. |
| **Live Browser Automation** | `http://localhost:5173` visual/UI/responsive verification | 0 | **0 (PENDING)** | **Blocked:** `ORIGIN_PERMISSION_REQUIRED` timed out twice waiting for interactive `localhost:5173` permission approval. |

---

## 2. Target Testing Pyramid & Tooling

| Layer | Recommended Tooling | Scope & Targets | Mocking / Environment Strategy |
| :--- | :--- | :--- | :--- |
| **Static Analysis** | `eslint` (fixed deps), `tsc --noEmit`, `ruff` / `mypy` (Python) | All `.ts`, `.tsx`, `.py` files | Fix root/workspace ESLint packages first; block PR merges on warnings/errors. |
| **Backend Unit & Integration** | `vitest` + `supertest` + `mongodb-memory-server` | Auth middleware, RBAC (`candidate`/`hr`/`admin`), Zod validators, Mongoose queries, `UserProgress` aggregation, Express routes | In-memory MongoDB per test suite; mock `axios` calls to `evaluator_service` and Gemini client. |
| **Python Evaluator Unit** | `pytest` + `pytest-asyncio` + `httpx` (`ASGITransport`) | Prompt formatting, strict JSON parsing, score/difficulty clamping, empty-answer guards, timeout/429/invalid-key HTTP status mapping | Mock `google-genai` client deterministically (reserve live API calls for manual/nightly gated smoke tests). |
| **Frontend Component & Context** | `vitest` + `@testing-library/react` + `msw` | `AuthContext`, `InterviewContext`, `SetupPage`, `ResultDetailPage` (`answerText` rendering), coding workspace state | Mock `/api/*` via MSW; verify error states render real messages (no fabricated `50–70` scores). |
| **Online Judge Sandbox Tests** | `vitest` + isolated judge worker integration suite | Multi-language execution (`AC`, `WA`, `TLE` infinite loop, `MLE` large allocation, `CE`, `RE`), container network/filesystem isolation | Ephemeral containers; verify untrusted user code cannot read host env vars, `/etc`, or external network. |
| **End-to-End Browser Tests** | Playwright (`chromium`, desktop `1280x800` + mobile `375x812`) | Signup/login flows, role redirects, dark/light themes, DSA coding submit, AI interview error/success flow, HR room scheduling, scorecard display | Isolated test DB seeded before suite; fail CI on uncaught `pageerror`, HTTP `500`, or console errors. |

---

## 3. Priority Security & Regression Test Cases (Must-Have in CI)

1. **Auth & Privilege Boundary Regression:**
   - `POST /api/auth/signup` with `role: "admin"` must return `400` or `403` (never `201`).
   - `POST /api/auth/logout` invalidates active session/refresh token; reusing revoked token returns `401`.
   - Server boot throws immediately if `JWT_SECRET` is unset in non-test environments.
2. **Authorization & PII Isolation:**
   - Unauthenticated `GET /api/interviews/room/:roomId`, `PUT /api/interviews/:id/auto-complete`, and `POST /api/interviews/gemini/*` must return `401`.
   - Candidate B cannot `GET` Candidate A's `InterviewResult`, `Submission`, `BookmarkList`, or `ResumeProfile` (`403`).
   - `GET /api/problems/:slug` and `GET /api/core-cs/:subject` must never leak hidden test-case `expectedStdout` or MCQ answer keys to clients.
3. **Contract & UI Regression:**
   - `POST /api/interview-results` followed by loading `/results/:id` verifies candidate answers (`answerText`) render non-empty in the DOM.
   - All navigation links in `Navbar`, `Footer`, `ResultsPage`, `ResultDetailPage`, and `LoginPage` resolve to non-404 routes.
4. **Online Judge & AI Resilience:**
   - Submission containing `while True: pass` or fork bombs terminates cleanly with `TLE` / resource cap verdict without impacting API availability.
   - Simulated Gemini `429` / timeout / malformed JSON returns structured error states rather than fabricating fake random scores.
