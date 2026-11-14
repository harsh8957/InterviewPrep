# Database & API Design

**Audit Date:** 2026-11-12  
**Scope:** Verified existing MongoDB/Mongoose schemas & Express/FastAPI endpoints vs. proposed additive schema and API architecture for the full SWE InterviewPrep platform.

---

## 1. Verified Existing Database Schemas (`backend/src/lib/models/`)

11 model files currently define 15 Mongoose models:

| Model File | Models Defined | Key Fields & Relationships | Verified Gaps |
| :--- | :--- | :--- | :--- |
| `User.ts` | `User` | `email` (unique), `password` (bcrypt 10), `role` (`candidate\|hr\|admin`), `firstName`, `lastName`, `company?`, `position?` | `IUser` TS interface omits `'admin'` while schema allows `'admin'`; no profile fields (targetRole, skills, streak, solvedStats). |
| `InterviewRoom.ts` | `InterviewRoom` | `title`, `hr` (-> `User`), `candidate` (-> `User`), `scheduledFor`, `duration`, `jobRole` (5 enums), `experienceLevel` (4 enums), `roomLink` (UUID), `status`, `notes?` | Missing compound indexes (`{ hr: 1, scheduledFor: -1 }`, `{ candidate: 1, status: 1 }`, unique index on `roomLink`). |
| `InterviewResult.ts` | `InterviewResult` | `candidateId` (-> `User`), `interviewId?` (-> `InterviewRoom`), `jobRole`, `experienceLevel`, `totalScore`, `feedback`, `strengths[]`, `improvements[]`, `answers[{ questionId, questionText, answerText, score, feedback, strengths[], weaknesses[] }]` | Frontend `ResultDetailPage.tsx` reads `answer.text` instead of `answerText`; lacks `interviewType` (`ai-practice\|hr-room\|coding`), `codeSubmissions[]`, `metadata`. |
| `Job.ts` | `Job`, `JobApplication` | `Job`: `title`, `department`, `location`, `type`, `description`, `isActive`; `JobApplication`: `job` (-> `Job`), `user` (-> `User`), `resumeText`, `matchScore?`, `status` | Represents internal company careers rather than candidate prep tracks. |
| `Blog.ts` | `BlogCategory`, `BlogPost` | `BlogPost`: `slug` (unique), `category` (-> `BlogCategory`), `author` (-> `User`), `status`, `comments[{ user, text, createdAt }]` | Unbounded embedded `comments` array; no moderation state. |
| `FAQ.ts` | `FAQCategory`, `FAQ` | `category` (-> `FAQCategory`), `question`, `answer`, `order` | Works for basic FAQ reads. |
| `InterviewTip.ts` | `InterviewTip` | `slug` (unique), `category` (`behavioral\|technical\|general\|role-specific`), `role?`, `difficulty?` | Static article format only; no interactive drills. |
| `ResumeGuide.ts` | `ResumeGuide` | `slug` (unique), `category` (`formatting\|content\|ats\|examples`), `content` | Static content only; analyzed resumes are never persisted (`ResumeAnalysis` collection missing). |
| `CompanyInfo.ts` | `CompanyInfo`, `TeamMember` | Marketing mission/vision/stats + team directory | Marketing-site artifact. |
| `ContactMessage.ts` | `ContactMessage` | `name`, `email`, `subject`, `message`, `intentTag`, `status` | Lacks spam/rate-limit protection on `POST /api/contact`. |
| `PolicyDocument.ts` | `PolicyDocument` | `type` (`privacy\|terms`), `content`, `version`, `isActive` | Functional as-is. |

---

## 2. Verified Existing API Surface (Tested vs. Observed Status)

### 2.1 Express Backend (`backend/src/server/routes/`, Port `5000`)

| Prefix | Verified Endpoints | Auth / Role Enforcement | Audit Status |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `POST /signup`, `POST /login`, `GET /me`, `POST /logout` | `signup`/`login`/`logout` public; `/me` JWT | **CRITICAL:** `POST /signup` accepts `role: "admin"` (`201`). Fallback JWT secret `'your-secret-key'`. `logout` doesn't invalidate JWT. |
| `/api/interviews` | `GET /`, `GET /candidate`, `POST /`, `PUT /:id/cancel`, `GET /:id`, `PUT /:id/complete`, `PUT /:id/auto-complete`, `PUT /auto-complete/:id`, `GET /room/:roomId`, `PUT /room/:roomId/complete`, `POST /gemini/questions`, `POST /gemini/analyze`, `POST /gemini/evaluate-and-next`, `POST /tts` | Only `/`, `/candidate`, `POST /`, `/:id/cancel`, `/:id`, `/:id/complete` use `authenticateToken` | **CRITICAL:** `GET /room/:roomId` leaks PII without auth (`200`). `auto-complete`, `room/:roomId/complete`, `/gemini/*`, `/tts` unauthenticated. `/gemini/*` returns `500` live (`gemini-2.5-flash` 404). |
| `/api/interview-results` | `GET /`, `GET /interview/:interviewId`, `GET /:id`, `POST /` | All require JWT + ownership checks | Ownership isolation passed (`403` cross-candidate/HR). Frontend fails to `await` `POST /` and mismatches `answerText`. |
| `/api/jobs` | `GET /`, `GET /:id`, `POST /:id/apply` | `apply` requires JWT | Works (`apply` falls back to `matchScore: 50` without backend `GEMINI_API_KEY`). Documented `POST /api/jobs` -> `404`. |
| `/api/resume` | `GET /`, `GET /:slug`, `POST /analyze`, `POST /improve-bullet` | All public | Public GET `200`; `POST /analyze` -> `500` without backend `GEMINI_API_KEY` and open to quota abuse. |
| `/api/blog` | `GET /categories`, `GET /`, `GET /:slug`, `POST /:id/summarize`, `POST /:id/comments`, `GET /:id/recommendations` | `comments` requires JWT | Public reads/comments `200`/`201`. `/summarize` uses `aiService.ts`. |
| `/api/faq` | `GET /`, `POST /ask-ai` | All public | `GET` `200`; `POST /ask-ai` returns unavailability string without `GEMINI_API_KEY`. |
| `/api/interview-tips` | `GET /`, `GET /:slug`, `POST /coach/roadmap`, `POST /coach/review` | All public | `GET` `200`; `POST /coach/*` unauthenticated AI proxy. |
| `/api/company`, `/api/policy`, `/api/contact` | `GET /api/company`, `GET /api/policy/privacy`, `GET /api/policy/terms`, `POST /api/contact` | Public | All verified `200`/`201`. |
| `/api/admin` | `GET /stats`, `POST /blogs`, `POST /policies` | `authenticateToken` + `requireAdmin` | Protected (`403` for candidate/hr), but compromised by admin self-signup and unvalidated `...req.body` spread. |
| *(Documented Legacy)* | `POST /api/results/evaluate`, `POST /api/jobs` | — | **404 Not Found** (verified non-existent despite legacy README claims). |

### 2.2 FastAPI Evaluator Service (`evaluator_service/main.py`, Port `8001`)

| Endpoint | Input Schema | Output Schema | Verified Behavior |
| :--- | :--- | :--- | :--- |
| `GET /health` | — | `{ status, gemini_configured }` | `200 OK` (median `3.59 ms`). |
| `POST /fetch-questions` | `QuestionRequest(role, num_questions=5)` | `List[Question(id, text)]` | Unit mock catches `id` off-by-1 bug on `#` headers; live call -> `500` (`gemini-2.5-flash` 404). |
| `POST /evaluate-answer` | `AnswerEvaluationRequest(question, answer, role)` | `EvaluationResult(score, feedback)` | Clamps score `[0,1]`; `<5` char guard returns `0.0`; malformed parse silently returns `0.5`. |
| `POST /evaluate-and-next` | `EvaluateAndNextRequest(current_question, current_answer, role, history, current_difficulty=5)` | `EvaluateAndNextResponse` | Clamps difficulty `[1,10]`; missing empty-answer guard; live call -> `500`. |

---

## 3. Proposed Additive Database Architecture (Target Platform)

To preserve existing data and avoid breaking migrations, add new collections incrementally and evolve existing collections via optional/defaulted fields:

| Collection / Model | Purpose | Key Fields | Essential Indexes |
| :--- | :--- | :--- | :--- |
| **`RoadmapTrack` / `RoadmapNode`** | DSA & Core CS structured curriculum | `slug`, `title`, `category` (`dsa\|core-cs\|system-design`), `order`, `prerequisites[]`, `problemIds[]`, `estimatedHours` | `{ slug: 1 }` (unique), `{ category: 1, order: 1 }` |
| **`Problem`** | Coding / DSA / System Design / Core CS problems | `slug`, `title`, `type` (`dsa\|system-design\|core-cs\|behavioral`), `difficulty` (`easy\|medium\|hard`), `topics[]`, `companies[]`, `statementMd`, `constraints`, `starterCodeMap`, `hints[]`, `editorialMd`, `isPublished` | `{ slug: 1 }` (unique), `{ type: 1, difficulty: 1 }`, `{ topics: 1 }`, `{ companies: 1 }` |
| **`TestCase`** *(Separate collection)* | Public & hidden judge cases (never projected to client!) | `problemId` (-> `Problem`), `stdin`, `expectedStdout`, `isSample` (bool), `weight`, `order` | `{ problemId: 1, isSample: 1, order: 1 }` |
| **`Submission`** | Code execution history & verdicts | `userId`, `problemId`, `assessmentId?`, `language`, `sourceCode`, `verdict` (`PENDING\|AC\|WA\|TLE\|MLE\|RE\|CE`), `passedCount`, `totalCount`, `runtimeMs`, `memoryKb`, `errorOutput`, `createdAt` | `{ userId: 1, problemId: 1, createdAt: -1 }`, `{ userId: 1, verdict: 1 }` |
| **`Assessment` & `AssessmentAttempt`** | Timed OA simulations & proctoring metadata | `Assessment`: `title`, `durationSec`, `problemIds[]`, `difficultyMix`, `companyTag?`; `Attempt`: `userId`, `assessmentId`, `startedAt`, `expiresAt`, `submittedAt`, `submissionIds[]`, `totalScore` | `{ userId: 1, assessmentId: 1, startedAt: -1 }` |
| **`CoreCSQuizItem`** | OS, DBMS, CN, OOP conceptual questions | `subject` (`os\|dbms\|cn\|oop`), `topic`, `format` (`mcq\|short-answer`), `promptMd`, `options[]`, `correctAnswerHash/Index`, `explanationMd` | `{ subject: 1, topic: 1 }` |
| **`CompanyExperience`** | Structured interview loop reports | `companySlug`, `role`, `level`, `outcome`, `rounds[]`, `questionsAsked[]`, `submittedBy`, `moderationStatus` (`pending\|approved\|rejected`) | `{ companySlug: 1, moderationStatus: 1, createdAt: -1 }` |
| **`BookmarkList` & `RevisionItem`** | Custom collections & spaced repetition state | `BookmarkList`: `userId`, `name`, `items[{ itemType, itemId, notes, nextReviewAt, easeFactor }]` | `{ userId: 1 }` |
| **`UserProgress`** | Aggregated analytics & activity heatmap | `userId` (unique), `solvedByDifficulty`, `topicMasteryMap`, `coreCsScores`, `mockAvgScore`, `currentStreak`, `longestStreak`, `dailyActivityMap` | `{ userId: 1 }` (unique) |
| **`ResumeProfile`** | Stored parsed resume context for AI interviews | `userId`, `fileName`, `extractedText`, `parsedSkills[]`, `projects[]`, `targetRole`, `atsAnalysis` | `{ userId: 1, updatedAt: -1 }` |

### Non-Breaking Migration Strategy for Existing Collections
- **`User`:** Add optional `profile` subdocument (`headline`, `targetRole`, `githubUrl`, `skills[]`, `experienceYears`). Keep all existing auth fields intact.
- **`InterviewResult`:** Add optional `mode` (`'text-qa' | 'coding-ai' | 'resume-drill' | 'behavioral'`) defaulting to `'text-qa'` in schema, leaving existing documents valid; retain `answerText` canonically and align frontend DTO.
- **`InterviewRoom`:** Keep existing fields; add unique index on `roomLink` and composite index on `{ hr: 1, scheduledFor: -1 }`, and enforce auth + token/invite validation before returning room data.

---

## 4. Proposed Core API Endpoints (`/api/*`)

| Domain | Endpoints | Auth & Guard |
| :--- | :--- | :--- |
| **Auth & Security** | `POST /api/auth/signup` (strict `'candidate'\|'hr'` allowlist), `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` (token denylist / refresh revocation), `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Public auth + JWT + rate limiting |
| **DSA & Problems** | `GET /api/roadmaps`, `GET /api/problems` (paginated filters: `topic`, `difficulty`, `company`, `status`), `GET /api/problems/:slug` (projects sample test cases only!) | Public catalog or JWT (adds solved status) |
| **Online Judge** | `POST /api/submissions/run` (sample cases, ephemeral), `POST /api/submissions` (enqueues full public+hidden judge run), `GET /api/submissions/:id` (poll/SSE verdict), `GET /api/problems/:id/submissions` | JWT + strict per-user rate limit |
| **Timed Assessments** | `GET /api/assessments`, `POST /api/assessments/:id/start`, `POST /api/assessments/attempts/:attemptId/finish`, `GET /api/assessments/attempts/:attemptId` | JWT + server-enforced `expiresAt` timer |
| **Core CS & System Design** | `GET /api/core-cs/:subject`, `POST /api/core-cs/:subject/attempt`, `GET /api/system-design`, `POST /api/system-design/:slug/evaluate` | JWT for attempts/AI evaluation |
| **AI Service (Internal)** | Secure FastAPI with `X-Internal-Service-Key`; replace deprecated SDK with `google-genai` structured JSON output; add `/evaluate-code` and `/generate-resume-questions` | Express-to-FastAPI internal auth only |
| **Analytics & Bookmarks** | `GET /api/analytics/overview`, `GET /api/analytics/weak-topics`, `GET/POST/DELETE /api/bookmarks`, `GET/PUT /api/profile` | JWT (`req.user.userId` scoped) |
| **Admin CMS** | `POST/PUT/DELETE /api/admin/problems`, `POST /api/admin/problems/:id/testcases`, `POST/PUT /api/admin/experiences/:id/moderate` | `authenticateToken` + `requireAdmin` (server-provisioned admins only) |
