# Technical Audit: Code Quality, Security, Performance & Reliability

**Audit Date:** 2026-11-12  
**Verification Basis:** Full static audit + TypeScript/Vite/tsup builds + `58` Express API checks (`50` passed, `8` defects/failures) + `15` mocked FastAPI unit tests (`14` passed, `1` bug) + `3` live Gemini probes + process memory/latency measurements on isolated MongoDB `interviewprep_audit_test`.

---

## 1. Build, Lint & Environment Verification

| Check | Command / Target | Outcome | Finding |
| :--- | :--- | :--- | :--- |
| **Frontend Build** | `cd frontend && npm run build` | **PASS** | `tsc && vite build` produced 3 assets (`462.98 KiB` on disk) cleanly. |
| **Backend Compile & Bundle** | `cd backend && npx tsc --noEmit && npm run build` | **PASS** | Zero TS errors; `tsup` emitted `dist/index.js` (`54.52 KB`). |
| **ESLint (`frontend` & `backend`)** | `npm run lint` | **FAIL** | Root `eslint.config.js` crashes with `ERR_MODULE_NOT_FOUND: Cannot find package '@eslint/js'`. |
| **Automated Test Suite** | Repository-wide search | **MISSING** | Zero unit, integration, or E2E test files exist (`0` tests). |
| **Environment Config Drift** | `backend/.env` vs `evaluator_service/main.py` | **MISCONFIGURED** | `backend/.env` sets `EVALUATOR_SERVICE_URL=http://localhost:8000` (FastAPI runs on `8001`) and omits `GEMINI_API_KEY` needed by `aiService.ts`. |

---

## 2. Critical & High Security Vulnerabilities (Verified)

| Severity | Finding | Exact Location | Runtime Verification Result | Phase 1 Status |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | **Privilege Escalation via Self-Signup (`role: "admin"`)** | `backend/src/server/routes/auth.ts` (`POST /signup`), `User.ts` (`role` enum includes `'admin'`) | **Exploited:** `POST /api/auth/signup` with `{ role: "admin" }` returned **`201 Created`** and issued a valid `admin` JWT that accessed `GET /api/admin/stats` (`200`). | **RESOLVED:** Zod schema restricts signup to `candidate` & `hr` (`400 Bad Request`); safe CLI `createAdmin.ts` implemented. |
| **Critical** | **Unauthenticated Exposure of Interview Room PII** | `backend/src/server/routes/interviews.ts:238` (`GET /room/:roomId`) | **Exploited:** Unauthenticated request returned **`200 OK`** exposing candidate & HR personal details (`email`, names, schedule) for any UUID/roomId. | **RESOLVED:** Enforced `authenticateToken` + participant/owner validation (`401` unauthenticated, `403` unauthorized). |
| **High** | **Unauthenticated Room Completion / State Tampering** | `backend/src/server/routes/interviews.ts:167,198,257` (`PUT /:id/auto-complete`, `PUT /auto-complete/:id`, `PUT /room/:roomId/complete`) | Endpoints lack `authenticateToken` and ownership checks; `/auto-complete/:id` lacks scheduled time validation. | **RESOLVED:** Protected all room completion and auto-completion routes with token and participant ownership validation. |
| **High** | **Unauthenticated Open AI Quota Proxy** | `backend/src/server/routes/interviews.ts:317,360,411,462` (`/gemini/*`, `/tts`), `faq.ts`, `blog.ts`, `interview-tips.ts`, `resume.ts` | Anyone on the internet can exhaust Gemini API quota/billing via unauthenticated POST endpoints. | **RESOLVED:** Added `authenticateToken` to all AI endpoints; secured internal FastAPI communication with `INTERNAL_SERVICE_KEY`. |
| **High** | **Hardcoded Fallback JWT Secret** | `backend/src/server/routes/auth.ts:7`, `backend/src/server/middleware/auth.ts:4` | Both fall back to `'your-secret-key'` if `JWT_SECRET` is unset, allowing forged tokens in misconfigured deployments. | **RESOLVED:** Replaced fallback with centralized `lib/jwt.ts` that aborts startup if `JWT_SECRET` is unset in non-test mode. |
| **High** | **No Input Validation / Mass Assignment** | `backend/src/server/routes/admin.ts:35` (`POST /blogs`), `auth.ts`, `interviews.ts` | Spreads `...req.body` directly into Mongoose constructors; relies on client body fields (`hr` sent by frontend in `HRDashboard.tsx`). | **RESOLVED:** Implemented Zod schema validation (`lib/validation.ts`); explicitly whitelisted blog fields in `admin.ts`. |
| **Medium** | **Stateless Non-Revocable JWT on Logout** | `backend/src/server/routes/auth.ts:122` (`POST /logout`) | Logout returns `200` without blacklisting token; captured JWT returned `200` on `GET /api/auth/me` immediately after logout. | **RESOLVED:** Implemented `RevokedToken` Mongoose model with MongoDB TTL index; revoked tokens return `401`. |
| **Medium** | **Permissive CORS Configuration in FastAPI** | `evaluator_service/main.py:22-28` | Combines `allow_origins=[..., "*"]` with `allow_credentials=True`. | **RESOLVED:** Removed wildcard `*` with credentials; bound to explicit frontend and backend origins from environment. |
| **Low** | **Error Stack Leakage / Missing Rate Limiting & Security Headers** | `backend/src/index.ts` | Missing `helmet`, `express-rate-limit`, and MongoDB query sanitization (`express-mongo-sanitize`). | Scheduled for Phase 9 hardening. |

---

## 3. Verified Code Defects & Logic Bugs

1. **Retired Gemini Model (`HTTP 500` Across All Live AI Flows):**
   - `evaluator_service/main.py` (lines 90, 137, 208) and `backend/src/services/aiService.ts` (lines 14, 32) hardcode `'gemini-2.5-flash'` using deprecated `google-generativeai`.
   - Controlled live test of all 3 endpoints (`/api/interviews/gemini/questions`, `/evaluate-and-next`, `/analyze`) returned **`HTTP 500`** with upstream error: `404 This model models/gemini-2.5-flash is no longer available to new users`.
2. **Question ID Shift Bug in `fetch_questions` (`evaluator_service/main.py:100-104`):**
   - `enumerate(raw_lines)` runs before filtering `#` headers/empty lines, causing a response starting with `# Questions` to return IDs `[2, 3, 4]` instead of `[1, 2, 3]` (failed `fetch_questions_valid_trimmed` in mocked test suite).
3. **Silent Random Score Fabrication (`frontend/src/contexts/InterviewContext.tsx:632`):**
   - On backend/evaluator failure, `analyzeAnswer` silently generates `Math.floor(Math.random() * 21) + 50` (a fake `50–70%` score) and inserts mock questions, misleading candidates.
4. **Prompt/Parser Fragility & Inconsistency (`evaluator_service/main.py`):**
   - Regex text parsing falls back silently to `score = 0.5` on malformed model output (masked failure).
   - `/evaluate-answer` enforces `len(answer.strip()) < 5 -> score=0.0`, while `/evaluate-and-next` lacks that guard and still calls Gemini for whitespace-only input.
   - `/api/interviews/gemini/questions` hardcodes `num_questions: 1` and drops `experienceLevel` entirely.
5. **Candidate Answer Text Hidden in UI (`ResultDetailPage.tsx:354,370` vs `InterviewResult.ts:63`):**
   - Backend saves `answerText`; frontend reads `answer.text` (`undefined`), hiding candidate answers.
6. **Non-Awaited Persistence & Broken Loop (`InterviewContext.tsx:394`, `InterviewRoomPage.tsx:167`):**
   - `finishInterview` triggers `POST /api/interview-results` without `await`, creating a race condition on navigation; `InterviewRoomPage` `useEffect` includes `[interview, stream]` in dependencies, causing re-fetch loops.
7. **Broken Frontend Routes & Mismatched Docs:**
   - `ResultsPage.tsx` uses `/hr-dashboard` & `/candidate-dashboard` (404); `LoginPage.tsx` uses `/forgot-password` (404); `README.md` documents non-existent `POST /api/jobs` and `POST /api/results/evaluate` (both verified `404`).

---

## 4. Performance, Scalability & Resource Benchmarks (Measured)

### 4.1 API & Latency Benchmarks (Isolated Local MongoDB `interviewprep_audit_test`)
- `FastAPI GET /health` (10 runs): min `2.39 ms`, median **`3.59 ms`**, max `9.18 ms`, avg `4.20 ms`
- `Express GET /api/jobs` (10 runs): min `4.91 ms`, median **`6.66 ms`**, max `8.39 ms`, avg `6.49 ms`
- `Express GET /api/auth/me` (10 runs): min `5.88 ms`, median **`7.81 ms`**, max `9.09 ms`, avg `7.59 ms`
- `Express GET /api/faq` (10 runs): min `8.18 ms`, median **`9.76 ms`**, max `13.17 ms`, avg `10.10 ms`
- `Express GET /api/interview-results` (10 runs): min `8.10 ms`, median **`9.95 ms`**, max `12.62 ms`, avg `10.01 ms`
- `Express POST /api/auth/login` (5 runs, bcrypt 10 rounds): min `99.94 ms`, median **`115.24 ms`**, max `139.66 ms`, avg `120.89 ms`
- `Live Upstream Gemini Roundtrip via Express -> FastAPI -> Google API` (failed 404 upstream): `/questions` `1323.4 ms`, `/evaluate-and-next` `601.5 ms`, `/analyze` `500.8 ms`.

### 4.2 Process Memory & Build Footprint
- **Frontend Production Bundle (`frontend/dist/`):** `3` files, `462.98 KiB` total (`index-BVa_NFeV.js` `403.03 kB` / `110.64 kB` gzip; CSS `69.47 kB` / `11.31 kB` gzip; HTML `1.51 kB` / `0.73 kB` gzip).
- **Idle Service Memory (Working Set):** Isolated `mongod.exe` `251.17 MB`, Vite dev worker `118.09 MB` (`174.85 MB` tree), Express `tsx` worker `93.71 MB` (`207.20 MB` tree), FastAPI Python worker `87.07 MB` (`91.24 MB` tree).

### 4.3 Scalability Bottlenecks for Target Platform
- **Sync Event-Loop Blocking in FastAPI:** `async def fetch_questions` / `evaluate_answer` / `evaluate_and_next` invoke synchronous `model.generate_content()` inside `async def` routes, blocking the single FastAPI event loop thread under concurrent load.
- **No Database Indexes Beyond Default `_id` & `unique` Fields:** Missing compound indexes on `{ candidateId: 1, date: -1 }`, `{ hr: 1, scheduledFor: -1 }`, and `{ candidate: 1, status: 1 }`.
- **Single-Bundle Vite Output:** No route-level `React.lazy` code splitting (`403 kB` monolithic JS bundle today; will bloat rapidly once Monaco Editor & charts are added).
- **Zero Caching / Queueing:** Every repeated AI or CMS query hits MongoDB or Gemini directly with no Redis/in-memory cache or async submission queue for code execution.
