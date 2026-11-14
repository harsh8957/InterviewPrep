# InterviewPrep — Implementation Progress & Tracking

**Repository:** `D:\InterviewPrep\InterviewPrep`
**Current Phase:** Phase 8 — Analytics, Bookmarks, Revision & Developer Profiles
**Status:** **PHASE 8 FULLY COMPLETED & VERIFIED** (Ready for User Acceptance)
**Last Updated:** 2026-11-14

---

## 1. Phase Execution Status

| Phase | Description | Status | Completed At |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Security, Reliability & Bug Fixes | **COMPLETED** | 2026-11-13 |
| **Phase 2** | UI/UX Redesign & Responsive Workspace Shell | **COMPLETED** | 2026-11-13 |
| **Phase 3** | DSA Roadmap, Problem Bank & Coding Practice Workspace | **COMPLETED** | 2026-11-13 |
| **Phase 4** | Online Coding Judge & Timed Assessments | **COMPLETED** | 2026-11-13 |
| **Phase 5** | Core CS & System Design Modules | **COMPLETED** | 2026-11-14 |
| **Phase 6** | Code-Aware & Resume-Driven AI Mock Interviews | **COMPLETED** | 2026-11-14 |
| **Phase 7** | Company-Specific Prep Tracks & Experiences | **COMPLETED** | 2026-11-14 |
| **Phase 8** | Progress Analytics, Bookmarks & Profiles | **COMPLETED** | 2026-11-14 |
| **Phase 9** | Security Hardening, Performance & Deployment Readiness | PENDING | — |

---

## 2. Phase 1 Implementation Summary & Verified Changes

### 2.1 Authentication & Security Hardening
1. **Blocked Admin Self-Signup:** Enforced strict role allowlisting (`['candidate', 'hr']`) via Zod validation schema in `backend/src/lib/validation.ts` and `backend/src/server/routes/auth.ts`. Any attempt to register with `admin` role returns `HTTP 400 Bad Request`.
2. **Safe Server-Side Admin Provisioning CLI:** Implemented `backend/src/scripts/createAdmin.ts` (`npm run create-admin`) for controlled, server-side admin creation with uniqueness checks, bcrypt password hashing, and role promotion.
3. **Fail-Fast Production & Non-Test JWT_SECRET Enforcement:** Created `backend/src/lib/jwt.ts` and updated middleware to throw fatal exceptions if `JWT_SECRET` is unset or default in non-test environments.
4. **Token Revocation on Logout:** Implemented `backend/src/lib/models/RevokedToken.ts` with MongoDB TTL expiration index (`expiresAt: 1, expireAfterSeconds: 0`). `POST /api/auth/logout` records the token; `authenticateToken` middleware checks `RevokedToken.exists()` and rejects revoked tokens with `HTTP 401 Unauthorized`.
5. **Interview Room & Auto-Complete Authorization:** Enforced `authenticateToken` + participant checks on `GET /room/:roomId`, `PUT /room/:roomId/complete`, `PUT /:id/auto-complete`, and `PUT /auto-complete/:id`. Unauthenticated access returns `401`; non-participants return `403`.
6. **Protected AI Proxy Endpoints:** Added `authenticateToken` to all expensive AI routes: `/gemini/*`, `/tts`, `/faq/ask-ai`, `/interview-tips/coach/*`, `/resume/analyze`, `/resume/improve-bullet`, and `/blog/:id/summarize`.
7. **Fixed Admin Blog Mass Assignment:** Updated `backend/src/server/routes/admin.ts` to strictly whitelist writable fields (`title`, `slug`, `content`, `summary`, `category`, `tags`, `coverImage`, `status`, `publishedAt`), binding `author` to `req.user.userId` and initializing `likes: 0`, `comments: []`.
8. **Schema-Based Request Validation (Zod):** Implemented reusable `validateBody` middleware and Zod schemas in `backend/src/lib/validation.ts` for auth signup, login, interview scheduling, and blog creation.
9. **FastAPI CORS Hardening:** In `evaluator_service/main.py`, removed permissive wildcard `*` with credentials, binding allowed origins to `FRONTEND_URL` and `BACKEND_URL` environment variables.
10. **Consistent Server-Side RBAC:** Enforced backend checks with `authenticateToken`, `requireHR`, and `requireAdmin` middleware.

### 2.2 Restored AI Functionality & Centralized AI Gateway
1. **Centralized AI Gateway in FastAPI:** Positioned `evaluator_service/main.py` as the unified AI microservice exposing `/fetch-questions`, `/evaluate-answer`, `/evaluate-and-next`, `/generate-text`, and `/generate-json`.
2. **Internal Service Secret Authentication:** Secured Express-to-FastAPI communication using `x-internal-service-key` header verified via FastAPI dependency `verify_internal_key`.
3. **Maintained Google Gen AI SDK & Model:** Configured `gemini-3.5-flash` with `transport="rest"` in `evaluator_service/main.py` and fallback in `backend/src/services/aiService.ts`.
4. **Structured Output with Schema Validation:** Pydantic models with markdown code fence stripping and strict validation.
5. **No Silent 0.5 Fallback & Honest Scoring:** Upstream AI failures return `HTTP 502/503` instead of fabricated scores. Empty/short answers (`< 5` chars) return `0.0` with constructive guidance.
6. **Preserved Experience Level & Question Count:** Express passes `experienceLevel` to FastAPI, incorporated directly into the prompt.
7. **Fixed Question ID Indexing:** Contiguous `[1..N]` 1-based indexing after filtering comments/headers.

### 2.3 Frontend Bug Fixes & Contract Alignment
1. **Result Detail Answers Visible:** Updated `ResultDetailPage.tsx` to read `answer.answerText || answer.text`.
2. **Fixed Result Detail Navigation:** Changed back button to role-aware link (`/hr/dashboard` or `/candidate/dashboard`).
3. **Fixed Broken Results Dashboard Links:** Corrected `ResultsPage.tsx` lines 89 and 119 from `/hr-dashboard` and `/candidate-dashboard` to `/hr/dashboard` and `/candidate/dashboard`.
4. **Eliminated Interview Completion Race Condition:** Made `finishInterview` in `InterviewContext.tsx` await `POST /api/interview-results` before navigating.
5. **Removed Fake Random Score Fallback:** Removed `Math.floor(Math.random() * 21) + 50` in `InterviewContext.tsx`.
6. **Replaced Broken Material Icons:** Migrated missing ligature spans in `InterviewPage.tsx` to `lucide-react` icons (`Mic`, `MicOff`, `Volume2`).
7. **Fixed Infinite Re-Fetch Loop:** Removed `interview` and `stream` from `InterviewRoomPage.tsx` `useEffect` dependencies.
8. **Fixed Dead Forgot-Password Link:** Redirected `/forgot-password` in `LoginPage.tsx` to `/contact?subject=Password%20Reset%20Assistance`.

### 2.4 Professional Workspace UI & Role-Based Navigation (Phase 2)
1. **Developer Workspace Shell (`AppShell`):** Created a responsive workspace layout separating public marketing pages from authenticated workflows. Features a collapsible desktop sidebar with persisted state in `localStorage`, Lucide icons, live route highlighting, active badge counters, breadcrumb hierarchy, responsive header with quick search trigger, interactive theme switcher (Light / Dark / System), and a mobile slide-over navigation drawer with backdrop blur.
2. **Strict Role-Based Routing & Workspace Guards:** Replaced fragile client role checks in `App.tsx` with a unified `ProtectedRoute` component. Enforces server-compatible permissions:
   - Candidates visiting HR/Admin routes are automatically redirected to `/candidate/dashboard`.
   - HR recruiters visiting Candidate/Admin routes are redirected to `/hr/dashboard`.
   - Admins access `/admin/dashboard` with content governance, metrics, and security telemetry.
   - Unauthenticated visitors attempting to access workspace routes are redirected to `/login`.
   - Authenticated users visiting `/login` or `/signup` are redirected directly to `/${user.role}/dashboard`.
3. **Route-Level Code Splitting (`React.lazy` + `Suspense`):** Replaced monolithic bundle with lazy-loaded route chunks and an accessible `PageLoadingFallback` skeleton, reducing initial bundle transfer size and improving Core Web Vitals.
4. **Enhanced Recruiter / HR Workspace (`HRDashboard`):** Preserved existing real scheduling API integration while introducing instant status filter tabs (`All`, `Scheduled`, `Completed`, `Cancelled`), live candidate search filter, room link copy tools, and clean container layout within `AppShell`.
5. **Modern Candidate Hub & Practice Tracks:** Upgraded `CandidateDashboard` with a developer practice hub directly linking to:
   - **DSA Roadmap (`/roadmap`):** 8 core algorithmic patterns (Arrays & Hashing, Two Pointers, Sliding Window, Stacks, Binary Search, Linked Lists, Trees, Dynamic Programming) with visual node inspection and complexity targets.
   - **Problem Bank (`/problems`):** LeetCode-style problem bank with search, difficulty filtering (Easy / Medium / Hard), acceptance metrics, and target company tags.
   - **Coding Assessments (`/assessments`):** Timed assessment foundation cards simulating HackerRank and CodeSignal rounds.
   - **Core Computer Science (`/core-cs`):** Curriculum modules for Operating Systems, DBMS, Networks, and OOP.
   - **System Design Lab (`/system-design`):** Architecture case studies (Rate Limiters, TinyURL, Caching, Chat Engine).
   - **Target Company Tracks (`/companies`):** Round breakdowns and preparation guides for FAANG and top tech companies.
6. **Administrator Governance Console (`AdminDashboardPage`):** Implemented protected dashboard backed by `GET /api/admin/stats` displaying real database telemetry, content governance links, and security auditing controls.
7. **Profile & Workspace Preferences (`ProfilePage`):** User identity overview, active role badge, interactive theme selector (Light, Dark, System), and session security controls with instant token revocation.
8. **Removed Fabricated Metrics:** Replaced fake marketing stats (`10K+`, `95%`, `4.9★`) on `HomePage` with verified platform capabilities. Removed dead `href="#"` placeholders in `Footer` and `AppShell`.

### 2.5 DSA Platform, Problem Bank & Monaco Workspace (Phase 3)
1. **Pre-flight & Truthful Copy Alignment:** Inspected and removed all remaining unverified "50+ Roles" marketing text across `HomePage.tsx`, `SignupForm.tsx`, and `LoginPage.tsx`, accurately highlighting the 5 actual supported technical tracks (Web, Mobile, Machine Learning, UI/UX, Data Engineering) and 16 algorithmic patterns.
2. **Database Architecture & Confidentiality:**
   - `RoadmapNode`: Structured curriculum schema with `title`, unique `slug`, `order`, `prerequisites`, `estimatedHours`, and populated `associatedProblemIds`.
   - `Problem`: LeetCode-style problem model with `difficulty`, `topics`, `patterns`, `constraints`, `examples`, multi-language `starterCode` (C++, Java, Python 3, JavaScript, TypeScript), progressive `hints`, `editorial`, `timeComplexity`, `spaceComplexity`, and `companyTags`.
   - `TestCase`: Strict separation between public preview test cases and confidential evaluation test cases (`isHidden: boolean`).
   - **Security Guardrail:** Public endpoints strictly prohibit returning hidden test cases (`isHidden === true`), safeguarding online assessment integrity for Phase 4.
3. **Curated Curriculum Seeding:** Created `backend/src/scripts/seedDSA.ts` (`npm run seed:dsa`), populating all 16 foundational DSA modules (Arrays & Strings through Tries) and 18+ comprehensive coding challenges with full multi-language code templates, test cases, and editorials.
4. **Backend REST APIs & Zod Validation:**
   - `GET /api/roadmaps`: Lists all 16 nodes ordered by curriculum progression with problem counts and metadata.
   - `GET /api/roadmaps/:slug`: Retrieves detailed node information with populated associated published problems.
   - `GET /api/problems`: Paginated catalog supporting query filters (`difficulty`, `topic`, `pattern`, `company`, `search`).
   - `GET /api/problems/:slug`: Retrieves full problem details, progressive hints, editorial, and only public test cases.
   - Admin CRUD: Added `POST /api/admin/problems`, `PUT /api/admin/problems/:id`, `DELETE /api/admin/problems/:id`, `POST /api/admin/roadmaps`, `PUT /api/admin/roadmaps/:id`, `DELETE /api/admin/roadmaps/:id`, protected by `authenticateToken` + `requireAdmin` with strict Zod validation (`createProblemSchema`, `createRoadmapSchema`).
5. **Interactive Monaco Coding Workspace (`ProblemWorkspacePage`):**
   - Split-pane developer workspace at `/problems/:slug` built with `@monaco-editor/react`.
   - Left panel: Tabbed problem specification (Description with formatted examples and constraints, Progressive Hints with one-by-one revelation, Official Editorial with algorithmic analysis, and Public Test Case previews).
   - Right panel: Full-featured Monaco code editor with multi-language selector (Python 3, JavaScript, TypeScript, C++ 20, Java 21), dark/light editor themes (`vs-dark`, `light`), font-size controls, copy to clipboard, and reset template.
   - Local draft persistence: Automatically syncs code edits into browser `localStorage` (`ip-draft-${slug}-${language}`) with autosave status indicators.
   - Phase 4 Execution Boundary: Clear user notices stating that sandboxed code execution, test runners, and judge evaluation arrive in Phase 4.
6. **Dynamic Frontend Catalog Integration:**
   - `RoadmapPage.tsx`: Live-connected to `GET /api/roadmaps`, rendering all 16 topics with prerequisites, hour estimates, and direct "Solve →" problem links to `/problems/:slug`.
   - `ProblemsPage.tsx`: Live-connected to `GET /api/problems`, supporting search, topic selection, difficulty filtering, complexity indicators, company tags, and pagination.
   - `AdminDashboardPage.tsx`: Updated with live problem and roadmap statistics cards, problem bank table, and interactive "Create Problem" modal form.

### 2.6 Secure Online Coding Judge & Timed Assessments (Phase 4)
1. **Infrastructure Design & Documentation:** Documented online judge architecture in `docs/architecture/ONLINE_JUDGE_INFRASTRUCTURE.md`. Enforced strict security controls: zero untrusted code execution in Node/Express or FastAPI; no raw child processes; no Docker socket exposure. Created an extensible `IJudgeProvider` abstraction with production Judge0 CE REST client and deterministic `MockJudgeProvider` for testing all verdicts (`AC`, `WA`, `TLE`, `MLE`, `RE`, `CE`, `INTERNAL_ERROR`).
2. **Master Judge Service & Queue Orchestration:** Implemented `backend/src/services/judge/judgeService.ts` featuring a bounded concurrency queue (max 5 parallel jobs), per-user submission rate limiter (5s rolling window with 429 throttling), test case fetching, execution timeout safeguards, and status normalization.
3. **Confidentiality & Test Case Sanitization:** Guaranteed that hidden test inputs and expected outputs are never returned to clients or browser devtools. Public sample runs only evaluate non-hidden test cases; official submissions evaluate all cases with outputs sanitized.
4. **Timed Assessments Engine:**
   - Schemas: `Assessment` (duration, passing score, problem references) and `AssessmentAttempt` (authoritative server `startedAt`, `expiresAt`, status, tab-switch telemetry, scores).
   - Authoritative Expiration: Backend strictly checks `now <= expiresAt` before accepting problem submissions or finalizing attempts, rejecting late submissions with `HTTP 403 Forbidden`.
   - Proctored Telemetry: Tracks client visibility changes (`visibilitychange`) and records tab switches transparently.
5. **Interactive Frontend Assessment & Submission Workspaces:**
   - `ProblemWorkspacePage.tsx`: Connected live "Run Tests" (sample cases) and "Submit Solution" (all cases), real-time runtime and memory metrics drawer, and "Submissions" history tab.
   - `AssessmentsPage.tsx`: Live-connected assessment catalog displaying challenge cards, duration, difficulty, problem count, and start/resume actions.
   - `AssessmentWorkspacePage.tsx`: Dedicated assessment environment with server-synchronized countdown timer, multi-problem switcher, Monaco IDE with local storage persistence, test runners, and scorecard modal.

### 2.7 Core CS, System Design & Behavioral Preparation (Phase 5)
1. **Core CS Architecture & Question Confidentiality:**
   - Database Models: `CoreCSQuizItem` (subject, topic, slug, title, format, difficulty, conceptExplanation, prompt, options, correctAnswerIndex, explanation, flashcardBack, keyTakeaway, interviewTips) and `ConceptAttempt` (userId, itemId, subject, topic, selectedOption, isCorrect, timeSpentSeconds, attemptCount).
   - Strict Confidentiality: `GET /api/core-cs/:subject/items` strictly projects away `correctAnswerIndex` and `explanation` before candidate attempt submission.
   - Server-Side Grading: `POST /api/core-cs/attempts` grades answers server-side, upserts `ConceptAttempt` with incremented attempt count without inflating solved counts, and returns grading result with official explanation and key takeaway.
   - Mastery Analytics: `GET /api/core-cs/attempts` and `GET /api/core-cs/subjects` aggregate solved counts, attempts, and percentage mastery by subject.
   - Frontend Multi-Mode Console (`CoreCSPage.tsx`): 4 subject cards (OS, DBMS, CN, OOP) supporting Concept Review mode, Interactive Quiz & Scenario drill with instant grading feedback, and 3D Flashcard Deck mode.
2. **Interactive System Design Studio:**
   - Database Models: `SystemDesignCase` (HLD & LLD schemas, capacity estimations, API designs, data models, reference Mermaid topology, tradeoffs, deep-dives, 8-point rubric) and `SystemDesignSubmission` (candidate diagram, notes, rubric self-scores, AI critique).
   - Sanitized Diagram Processing: Input sanitization strips malicious HTML or script injections from Mermaid syntax.
   - High-Level Architecture Workspace (`SystemDesignWorkspacePage.tsx`):
     - Requirements tab (functional/non-functional constraints).
     - Capacity Math sizing calculator (QPS, storage, bandwidth, RAM cache).
     - APIs & Data Models tab (endpoints, payload definitions, database storage selection).
     - Tradeoffs tab (decision matrices, pros/cons, CAP theorem analysis).
     - Interactive Mermaid Studio: Candidate diagram editor, instant syntax validation via `MermaidViewer.tsx`, and comparison toggle against official reference architecture.
     - 8-Point Evaluation Rubric: Requirements, data model, architecture, scalability, availability, reliability, security, and tradeoffs with candidate self-scoring sliders (1-5).
     - Architectural Review: Optional AI critique via centralized gateway with heuristic fallback returning score (0-100), feedback, strengths, and improvements.
3. **Behavioral Preparation & STAR Story Builder:**
   - Database Models: `BehavioralQuestion` (prompt, competency, model STAR example, interview tips) and `StarStory` (userId, title, category, situation, task, action, result, metrics, learnings, companyTags, aiReview).
   - Integrated Strategy Hub (`InterviewTipsPage.tsx`): Unified behavioral preparation with existing Interview Tips and AI Coach without duplication.
   - STAR Story Studio: Situation, Task, Action ("I" vs "We"), Result, Metrics, and Reflection fields with instant persistence.
   - Personal Story Bank: Candidate library supporting review, editing, and deletion with IDOR authorization (`403` for non-owners).
   - Rubric Feedback: `POST /api/behavioral/stories/:id/feedback` evaluating stories against clarity and business impact metrics.
4. **Curriculum Seeding:**
   - Seeded 15 comprehensive Core CS items across Operating Systems, DBMS, Computer Networks, and OOP.
   - Seeded 4 interactive System Design cases: Distributed Rate Limiter (Token Bucket), TinyURL (Snowflake / Base62), Real-Time Chat Engine (WebSockets / Kafka / Cassandra), and E-Commerce Flash Sale (Redis DECR / Saga / Queue).
   - Seeded 4 behavioral competency questions with model STAR answers.

### 2.8 Code-Aware & Resume-Driven AI Mock Interviews (Phase 6)
1. **7 Distinct Interview Tracks & Tailored Parameters:**
   - Supported Modes: DSA Coding Round (`dsa`), Backend Development (`backend`), Full-Stack Engineering (`fullstack`), System Design Architecture (`system-design`), Core Computer Science (`core-cs`), Resume Deep-Dive (`resume-deep-dive`), and Behavioral Round (`behavioral`).
   - Configuration Parameters: Candidate customizable Target Role (Full-Stack, Backend, Frontend, DevOps, ML/AI), Experience Level (`fresher`, `junior`, `mid-level`, `senior`), Difficulty (`easy`, `medium`, `hard`, `adaptive`), and Session Duration (15, 30, 45, 60 minutes).
2. **Secure PDF Resume Upload, Parsing & Prompt Injection Defense:**
   - Database Model: `ResumeProfile` (`userId`, `fileName`, `fileSizeBytes`, `rawTextSummary`, `skills`, `education`, `experience`, `projects`, `technologies`, `achievements`, `targetRole`, `potentialDiscussionAreas`, `atsScore`, `atsStrengths`, `atsImprovements`).
   - Security Validation: Memory-only upload processing via `multer.memoryStorage()`, 5MB size limit, PDF magic-byte verification (`%PDF-`), and encrypted/password-protected file rejection.
   - Strict Ownership & IDOR Protection: Resume retrieval, replacement, and deletion endpoints (`GET /api/resume/profile`, `DELETE /api/resume/profile`) enforce candidate user ID binding with 403 authorization guards.
   - Prompt Injection Defense: Resume content parsed via `pdf-parse` is sanitized and quarantined within `<candidate_resume_untrusted_input>` blocks with explicit evaluator directives that candidate resume text cannot override system instructions, scoring rules, or output schemas.
   - Verified Project Questions: In `resume-deep-dive` mode, AI interviewer generates technical questions strictly tied to the candidate's verified projects and claimed stack without hallucinating unlisted technologies.
3. **In-Interview Live Code Execution (Code-Aware AI):**
   - Live Code Runner: Embedded Monaco editor inside `InterviewPage.tsx` with a dual-tab switcher (Verbal/Text Answer vs. Live Code Solution) and multi-language support (JavaScript, TypeScript, Python 3, C++, Java).
   - Authenticated Execution Endpoint: `POST /api/submissions/run-code` leverages `judgeService.executeCustom` to run arbitrary candidate code against custom inputs via secure judge provider with per-user rate limiting.
   - Truthful AI Evaluation: Real execution metrics (`codeVerdict`, `passedCases`, `totalCases`, `runtimeMs`, `memoryKb`) are passed directly to the AI evaluator; the AI is strictly prohibited from fabricating execution results.
4. **Structured 6-Dimension AI Rubric & Adaptive Flow:**
   - 6 Evaluation Criteria: Technical Correctness, Problem Solving, Clarity of Explanation, Complexity Analysis, Edge Cases, and Communication.
   - Adaptive Follow-Ups: Dynamic generation of cross-questions adjusting difficulty based on candidate response quality.
   - Deterministic Fallback: When upstream AI services are unconfigured or unavailable, deterministic heuristic analysis computes authentic rubric scores based on keyword coverage, length, and code verdict without dropping interview sessions.
5. **Comprehensive Result Experience:**
   - Visual Scorecard: Prominent Educational Assessment Disclaimer ("not a certified hiring decision"), Mode / Difficulty / Duration badges, and 6-dimension visual progress meters.
   - Code History: Integrated Submitted Code Solutions drawer showing syntax-styled snippets, execution verdicts, and runtimes.
   - Curriculum Reconnection: Recommended revision topics linked directly to `/roadmap`, `/problems`, and `/core-cs`.

### 2.9 Company Preparation Tracks & Interview Experiences (Phase 7)
1. **Company Preparation Tracks Architecture:**
   - Database Model: `CompanyTrack` (`name`, `slug`, `tier`, `description`, `headquarters`, `website`, `hiringBarOverview`, `culturePrinciples`, `targetRoles`, `rounds`, `linkedProblemIds`, `linkedSystemDesignIds`, `linkedBehavioralIds`, `linkedAssessmentIds`, `coreCsTopics`, `status`, `stats`).
   - Clean Relational References: Problems, System Design cases, Behavioral questions, and Assessments are referenced strictly via MongoDB ObjectIds, preventing duplicate problem records.
   - Seeded 6 Major Tracks: Google (L3/L4/L5, GCA/RRK hiring bar), Amazon (SDE I/II, 16 Leadership Principles), Meta (E4/E5, speed problem solving & real-time messaging), Microsoft (SDE 1/2, growth mindset & cloud patterns), Uber (real-time dispatch & concurrency), and Stripe (pragmatic code & ledger idempotency).
2. **Community Interview Experience Platform:**
   - Database Model: `CompanyExperience` (`companyName`, `companySlug`, `companyTrackId`, `author`, `candidateHandle`, `isAnonymous`, `role`, `experienceLevel`, `interviewYear`, `interviewSeason`, `difficulty`, `outcome`, `provenance`, `rounds[]`, `questions[]`, `preparationTips`, `timelineNotes`, `moderationStatus`, `reports[]`, `moderationHistory[]`).
   - Moderation Lifecycle: New submissions automatically start in `pending` review. Only approved experiences are surfaced on the public feed and company track pages.
   - Candidate Visibility: Authors can review their own pending or rejected submissions with rejection notes at `GET /api/experiences/my/submissions` and `GET /api/experiences/:id`.
3. **PII Protection & Abuse Prevention:**
   - Automated PII Scanner: `moderationService.ts` checks for phone numbers (domestic & international regex), personal email addresses, interviewer/recruiter personal names, and government IDs. Submissions with PII violations are rejected with `HTTP 400` and specific itemized violation messages.
   - Rate Limiting: Max 5 experience submissions per user per 24 hours.
   - Content Reporting: Authenticated users can flag inappropriate experiences, instantly surfacing them on the administrator moderation queue.
4. **Administrator Moderation Console:**
   - Queue Management: `GET /api/admin/experiences` with status filtering (`pending`, `approved`, `rejected`, `hasReports`).
   - Decisions & Audit Trail: `PUT /api/admin/experiences/:id/moderate` for 1-click approvals or rejections with candidate feedback and immutable audit history.
5. **Interactive UI Workspaces:**
   - Company Track Catalog (`/companies`): Search, tier filtering (`All`, `FAANG & Tier 1`, `Enterprise SaaS`, `High-Growth Tech`, `FinTech`), role tags, and direct track links.
   - Company Track Workspace (`/companies/:slug`): 6 tabbed views: Hiring Process & Culture, Linked DSA Coding, System Design Cases, Core CS & Behavioral, Timed Assessments, and Approved Community Loops.
   - Experiences Feed (`/experiences`): Multi-filter feed by company, role, difficulty, outcome, and interview year.
   - Experience Detail (`/experiences/:id`): Full debrief view with round-by-round breakdown, questions asked (with workspace solve buttons), advice quote, and report modal.
   - Experience Submission Form (`/experiences/new`): Dynamic rounds builder, question builder, anonymity toggle, and real-time PII validation.
   - Admin Moderation Page (`/admin/experiences`): Dedicated review queue for platform administrators.

### 2.8 Progress Analytics, Bookmarks, Revision & Developer Profiles (Phase 8)
1. **Idempotent Progress Architecture (`UserProgress`):**
   - Data Truthfulness: Progress counts strictly reflect actual persisted events: accepted coding submissions (`status: 'accepted'`), Core CS concept quiz attempts (`ConceptAttempt`), System Design submissions (`SystemDesignSubmission`), mock interview results (`InterviewResult`), and assessment attempts (`AssessmentAttempt`).
   - Idempotency & Anti-Inflation: Unique accepted problem IDs are deduplicated. Repeated attempts and multiple accepted submissions for the same problem never double-count towards total solved numbers.
   - Comprehensive Difficulty Breakdown: Tracks easy, medium, and hard unique solved problems.
   - Synchronous & On-Demand Engine: `syncUserProgress(userId)` aggregates all historical events from collections with atomic Mongoose updates. `POST /api/analytics/sync` allows manual instant recalculation.
2. **Calendar-Based Study Streak & Timezone Boundaries:**
   - Evaluates streaks using user-configured timezone (`Intl.DateTimeFormat` with IANA timezone strings).
   - Streak Rules: First activity starts a 1-day streak. Same-day activity maintains the streak without double-incrementing. Activity on the immediate consecutive calendar day increments both current and longest streaks. Skipping a calendar day resets current streak to 1 while preserving all-time longest streak.
3. **Transparent Topic Mastery & Weak-Topic Detection:**
   - Multi-Factor Formula: Combines unique problems solved per topic with recent quiz accuracy.
   - Anti-Inflation Safeguard: Candidates cannot be labeled `Mastered` from solving 1 problem with 100% quiz accuracy. Mastered requires $\ge 10$ unique problems solved and $\ge 80\%$ accuracy. `Proficient` requires $\ge 5$ problems and $\ge 70\%$ accuracy.
   - Automated Weak-Topic Warnings: Identifies topics with $<60\%$ accuracy or high attempts but low unique solved counts, generating prioritized next practice recommendations with direct workspace links.
4. **Bookmarks & SuperMemo SM-2 Spaced Repetition Queue (`BookmarkList`, `RevisionItem`):**
   - Custom Lists: Candidates create named bookmark collections with custom descriptions, colors, and icons.
   - Unified Bookmark Target: Bookmarks link to problems, system design case studies, core CS items, or behavioral questions without deleting underlying platform entities.
   - Notes Attachment: Candidates attach and edit personal notes, complexity invariants, and trick reminders on any bookmark.
   - SM-2 Algorithm Implementation:
     - `Again` (Rating 1): Interval resets to 1 day; ease factor decreased by 0.2 (minimum 1.3).
     - `Good` (Rating 3): Interval scaled by current ease factor.
     - `Easy` (Rating 5): Bonus interval multiplier ($1.3 \times \text{easeFactor}$); ease factor increased by 0.15 (maximum 3.0).
5. **Developer Profiles & Privacy Boundary:**
   - Schema Extension: Extended `User` model with headline, targetRole, skills, githubUrl, linkedinUrl, experienceYears, bio, learningGoals, timezone, isPublic toggle, and sparse unique `username`.
   - Privacy Guardrail: Public endpoint `GET /api/profile/public/:username` strictly exposes only verified public stats, top mastered topics, bio, and social links. Registered email, password hash, and internal database identifiers are never exposed. Private profiles return `HTTP 404`.
6. **Frontend Workspaces:**
   - Analytics Dashboard (`/analytics`): Solved metrics, 52-week activity heatmap, topic mastery cards, weak-topic detection alert, and database sync trigger.
   - Revision Workspace (`/revision`): Spaced repetition due queue ("Due Today" vs "All Bookmarks"), SM-2 rating buttons (Again, Good, Easy), notes modal, and custom list creation.
   - Profile Settings (`/profile`): Full developer profile editing form, timezone selector, public switch, custom username configuration, and direct link to public showcase.
   - Public Developer Showcase (`/u/:username`): Public view showing verified solved metrics, streak, top mastered topics, and skills.
   - Coding Workspace Bookmark Button: Direct 1-click bookmarking in `/problems/:slug`.

---

## 3. Changed Files Log

| File | Change Summary |
| :--- | :--- |
| `backend/src/lib/jwt.ts` | Centralized JWT config enforcing required `JWT_SECRET` in non-test environments. |
| `backend/src/lib/models/RevokedToken.ts` | Added Mongoose schema with MongoDB TTL index for revoked JWT tracking. |
| `backend/src/lib/models/User.ts` | Updated `IUser` interface to include `'admin'`. |
| `backend/src/lib/validation.ts` | Added Zod validation schemas and `validateBody` Express middleware. |
| `backend/src/server/middleware/auth.ts` | Added revoked token check in `authenticateToken`, updated JWT secret validation. |
| `backend/src/server/routes/auth.ts` | Added Zod validation, token revocation on `POST /logout`, removed fallback JWT secret. |
| `backend/src/server/routes/admin.ts` | Fixed blog mass assignment with Zod validation and whitelisted fields. |
| `backend/src/server/routes/interviews.ts` | Added `authenticateToken` to AI proxy routes, participant checks, and `x-internal-service-key` headers. |
| `backend/src/server/routes/faq.ts` | Protected `POST /ask-ai` with `authenticateToken`. |
| `backend/src/server/routes/interview-tips.ts` | Protected `/coach/roadmap` and `/coach/review` with `authenticateToken`. |
| `backend/src/server/routes/resume.ts` | Protected `/analyze` and `/improve-bullet` with `authenticateToken`. |
| `backend/src/server/routes/blog.ts` | Protected `POST /:id/summarize` with `authenticateToken`. |
| `backend/src/services/aiService.ts` | Delegated AI text and JSON generation to centralized FastAPI evaluator with SDK fallback. |
| `backend/src/scripts/createAdmin.ts` | Safe server-side CLI tool for provisioning admin accounts. |
| `backend/src/app.ts` | Separated Express app creation from HTTP listener for clean integration testing. |
| `backend/src/index.ts` | Mounts `app` and connects to database. |
| `backend/tests/security.test.ts` | Vitest + Supertest automated regression test suite covering all mandatory security checks. |
| `backend/vitest.config.ts` | Vitest configuration. |
| `backend/package.json` | Added `zod`, `vitest`, `supertest`, `"test": "vitest run"`, `"create-admin"`, and `"lint": "tsc --noEmit"`. |
| `backend/.env` | Added `INTERNAL_SERVICE_KEY` and updated `EVALUATOR_SERVICE_URL=http://localhost:8001`. |
| `evaluator_service/main.py` | Centralized AI gateway with REST transport, `INTERNAL_SERVICE_KEY` auth, strict CORS, Pydantic validation, contiguous IDs. |
| `evaluator_service/tests/test_evaluator.py` | Pytest regression suite covering all evaluator functionality. |
| `evaluator_service/.env` | Added `INTERNAL_SERVICE_KEY`, `FRONTEND_URL`, `BACKEND_URL`. |
| `frontend/src/App.tsx` | Implemented route code splitting (`React.lazy`), `<Suspense>`, role-based `<ProtectedRoute>`, and `<AppShell>` workspace mounting. |
| `frontend/src/components/workspace/AppShell.tsx` | Reusable developer workspace shell with collapsible sidebar, drawer navigation, theme dropdown, profile menu, and breadcrumbs. |
| `frontend/src/components/CandidateDashboard.tsx` | Added Developer Practice & Curriculum tracks grid, streamlined workspace styling for AppShell. |
| `frontend/src/components/HRDashboard.tsx` | Added status filter tabs (All, Scheduled, Completed, Cancelled), candidate search filter, and empty states. |
| `frontend/src/pages/AdminDashboardPage.tsx` | Created Admin Console foundation with metrics, content governance links, and security controls. |
| `frontend/src/pages/ProfilePage.tsx` | Account profile overview, interactive theme selector (Light/Dark/System), and session revocation. |
| `frontend/src/pages/RoadmapPage.tsx` | NeetCode-style algorithmic pattern roadmap with 8 patterns and visual inspection panel. |
| `frontend/src/pages/ProblemsPage.tsx` | LeetCode-style problem bank table with search, difficulty filters, acceptance rates, and company tags. |
| `frontend/src/pages/AssessmentsPage.tsx` | Timed coding assessment foundation cards. |
| `frontend/src/pages/CoreCSPage.tsx` | Core computer science curriculum review cards for OS, DBMS, Networks, and OOP. |
| `frontend/src/pages/SystemDesignPage.tsx` | Distributed system design walkthrough cards. |
| `frontend/src/pages/CompaniesPage.tsx` | Company-specific interview tracks and round breakdowns. |
| `frontend/src/pages/HomePage.tsx` | Replaced fabricated metrics (`10K+`, `95%`, `4.9★`) with verified platform capabilities. |
| `frontend/src/components/Footer.tsx` | Removed dead placeholders; linked repo and support. |
| `frontend/src/pages/ResultDetailPage.tsx` | Supported `answer.answerText || answer.text` and role-aware back link. |
| `frontend/src/pages/ResultsPage.tsx` | Fixed broken dashboard paths. |
| `frontend/src/contexts/InterviewContext.tsx` | Awaited result persistence in `finishInterview`, removed fake random `50–70` score calculation. |
| `frontend/src/pages/InterviewPage.tsx` | Replaced missing `material-icons` ligatures with `lucide-react` icons. |
| `frontend/src/pages/InterviewRoomPage.tsx` | Removed `interview` and `stream` from `useEffect` dependencies. |
| `frontend/src/pages/LoginPage.tsx` | Linked forgot password to `/contact?subject=Password%20Reset%20Assistance`. |
| `frontend/eslint.config.js` | Configured `typescript-eslint` flat config. |
| `frontend/package.json` | Installed `typescript-eslint` and `@monaco-editor/react`. |
| `backend/src/lib/models/RoadmapNode.ts` | Schema for structured 16-topic curriculum with prerequisites and associated problems. |
| `backend/src/lib/models/Problem.ts` | Schema for multi-language coding problems, constraints, complexity, and company tags. |
| `backend/src/lib/models/TestCase.ts` | Schema for test cases with strict public/hidden confidentiality flag (`isHidden`). |
| `backend/src/scripts/seedDSA.ts` | Idempotent seeder populating 16 roadmap nodes, 18+ rich problems, and test cases. |
| `backend/src/server/routes/roadmaps.ts` | Endpoints for ordered roadmap listing and node detail with populated problems. |
| `backend/src/server/routes/problems.ts` | Paginated search/filter problem catalog and secure problem detail endpoint. |
| `backend/src/server/routes/admin.ts` | Added admin CRUD endpoints for problems and roadmaps with Zod validation. |
| `backend/tests/dsa.test.ts` | 13 automated tests covering roadmap, problem bank, confidentiality, and admin APIs. |
| `frontend/src/pages/ProblemWorkspacePage.tsx` | Split-pane Monaco coding workspace with multi-language selector, local drafts, hints, editorial, and Phase 4 notices. |
| `frontend/src/pages/RoadmapPage.tsx` | Live-connected roadmap curriculum linked directly to problem workspace. |
| `frontend/src/pages/ProblemsPage.tsx` | Live-connected problem catalog with search, filters, pagination, and direct problem workspace links. |
| `frontend/src/pages/AdminDashboardPage.tsx` | Problem governance table, problem and roadmap stats, and create problem modal. |
| `frontend/src/components/SignupForm.tsx` | Replaced false "50+ roles" copy with verified track and pattern descriptions. |
| `frontend/src/pages/HomePage.tsx` | Updated feature highlights to reflect 5 core tracks and 16 DSA patterns. |
| `frontend/src/pages/LoginPage.tsx` | Replaced fabricated marketing stats with truthful platform capabilities. |
| `docs/architecture/ONLINE_JUDGE_INFRASTRUCTURE.md` | Infrastructure evaluation and architecture specification for Judge0 CE sandboxing. |
| `backend/src/lib/models/Submission.ts` | Schema for solution submissions, execution metrics, verdicts, and sanitized test outputs. |
| `backend/src/lib/models/Assessment.ts` | Schema for timed assessments with problem sets, passing criteria, and tags. |
| `backend/src/lib/models/AssessmentAttempt.ts` | Schema for timed candidate attempts with authoritative expiry and tab-switch telemetry. |
| `backend/src/services/judge/types.ts` | Interface definitions for online judge providers and execution contracts. |
| `backend/src/services/judge/judge0Provider.ts` | Production Judge0 CE client implementation with REST dispatch. |
| `backend/src/services/judge/mockJudgeProvider.ts` | Deterministic mock judge provider supporting all execution verdicts. |
| `backend/src/services/judge/judgeService.ts` | Concurrency queue orchestrator and per-user rate limiter for code execution. |
| `backend/src/server/routes/submissions.ts` | APIs for running sample test cases, official submission, and history. |
| `backend/src/server/routes/assessments.ts` | Endpoints for catalog listing, starting/resuming attempts, submit, and telemetry. |
| `backend/tests/judge.test.ts` | 11 automated unit & integration tests for execution verdicts, confidentiality, and rate limiting. |
| `backend/tests/assessment.test.ts` | 7 automated tests for assessment attempts, server expiry, and score calculation. |
| `frontend/src/pages/AssessmentWorkspacePage.tsx` | Timed assessment environment with countdown timer, problem switching, and Monaco IDE. |
| `backend/src/lib/models/CoreCSQuizItem.ts` | Schema for conceptual curriculum questions, explanations, MCQs, scenarios, and flashcards. |
| `backend/src/lib/models/ConceptAttempt.ts` | Schema for candidate concept mastery attempts and progress tracking. |
| `backend/src/lib/models/SystemDesignCase.ts` | Schema for HLD and LLD case studies, capacity math, APIs, data models, Mermaid diagrams, and tradeoffs. |
| `backend/src/lib/models/SystemDesignSubmission.ts` | Schema for candidate architectural drafts, Mermaid diagrams, notes, and rubric scores. |
| `backend/src/lib/models/BehavioralPrep.ts` | Schemas for `BehavioralQuestion` bank and candidate `StarStory` records. |
| `backend/src/server/routes/coreCS.ts` | Endpoints for subject overview, topic curriculum, questions with confidentiality, attempts, and stats. |
| `backend/src/server/routes/systemDesign.ts` | Endpoints for case catalog, case detail, saving drafts, and architectural reviews. |
| `backend/src/server/routes/behavioral.ts` | Endpoints for behavioral questions, candidate STAR story CRUD with IDOR protection, and rubric analysis. |
| `backend/src/scripts/seedCoreCS.ts` | Seed script populating 15 Core CS items, 4 interactive system design cases, and 4 behavioral competency questions. |
| `backend/tests/coreCS.test.ts` | 19 automated integration tests covering Core CS confidentiality, grading, system design, and STAR stories. |
| `frontend/src/components/system-design/MermaidViewer.tsx` | Sanitized Mermaid.js architecture topology renderer with instant error boundary. |
| `frontend/src/pages/CoreCSPage.tsx` | Interactive 4-subject workspace with Study, Quiz & Scenario Drill, and 3D Flashcards Deck modes. |
| `frontend/src/pages/SystemDesignPage.tsx` | Catalog of distributed architecture cases with HLD/LLD filtering and direct workspace links. |
| `frontend/src/pages/SystemDesignWorkspacePage.tsx` | Interactive split-screen studio with Requirements, Capacity Math, APIs, Tradeoffs, Rubric sliders, and Mermaid editor. |
| `frontend/src/pages/InterviewTipsPage.tsx` | Integrated Behavioral Hub with STAR Story Builder, personal story bank, competency bank, and strategy guides. |
| `backend/src/lib/models/ResumeProfile.ts` | Schema for parsed candidate resume profiles, extracted skills, projects, and ATS score. |
| `backend/src/lib/models/InterviewResult.ts` | Schema updated with `interviewMode`, `difficulty`, `duration`, `resumeProfileId`, `codeSubmissions`, `rubricBreakdown`, and `suggestedTopicsToRevise`. |
| `backend/src/services/resumeService.ts` | Secure PDF extraction service with magic byte header validation, prompt injection quarantine, and profile structuring. |
| `backend/src/services/aiInterviewerService.ts` | Centralized interview orchestrator for 7 modes, verified resume grounding, code-aware evaluations, and deterministic heuristic fallback. |
| `backend/src/services/judge/judgeService.ts` | Added `executeCustom` method for ad-hoc in-interview code execution. |
| `backend/src/server/routes/submissions.ts` | Added `POST /api/submissions/run-code` with per-user rate limiting and live execution. |
| `backend/src/server/routes/interviews.ts` | Upgraded question generation and answer evaluation with 7 modes and resume grounding. |
| `backend/src/server/routes/interviewResults.ts` | Updated persistence and retrieval for Phase 6 metrics and resume population. |
| `backend/src/server/routes/resume.ts` | Implemented `POST /upload`, `GET /profile`, and `DELETE /profile` with IDOR protection. |
| `backend/tests/interviewPhase6.test.ts` | Automated test suite covering PDF validation, prompt quarantine, resume CRUD, 7 interview modes, code execution, and rubric evaluation. |
| `frontend/src/contexts/InterviewContext.tsx` | Upgraded context with 7 modes, difficulty, duration, resume profile options, live code submissions, and rubric persistence. |
| `frontend/src/pages/SetupPage.tsx` | Interactive setup interface with 7 interview mode cards, role/difficulty/duration selectors, and resume upload dropzone. |
| `frontend/src/pages/InterviewPage.tsx` | Split-screen interview room with verbal text and Monaco code editor tabs, live judge execution, and adaptive difficulty indicator. |
| `frontend/src/pages/ResultDetailPage.tsx` | Upgraded results page with educational disclaimer, mode badges, 6-dimension rubric meters, code solution drawer, and revision topic links. |
| `backend/src/lib/models/CompanyTrack.ts` | Schema for company preparation tracks, target roles, interview rounds, and linked references. |
| `backend/src/lib/models/CompanyExperience.ts` | Schema for candidate interview loop debriefs, round stages, questions, moderation state, and reports. |
| `backend/src/services/moderationService.ts` | PII detection service validating content against phone numbers, emails, and interviewer personal names. |
| `backend/src/server/routes/companyTracks.ts` | Public catalog, detailed track view with populated references, and admin CRUD endpoints. |
| `backend/src/server/routes/experiences.ts` | Public approved feed, candidate submission with PII validation, author submission views, and reporting. |
| `backend/src/scripts/seedCompanyTracks.ts` | Seeder populating 6 top company tracks (Google, Amazon, Meta, Microsoft, Uber, Stripe) and approved sample loops. |
| `backend/tests/companyTracks.test.ts` | Automated test suite covering PII validation, track relationships, pending visibility, and admin moderation. |
| `frontend/src/pages/CompaniesPage.tsx` | Catalog of company preparation tracks with tier filter tabs, live metrics, and role tags. |
| `frontend/src/pages/CompanyDetailPage.tsx` | Comprehensive track workspace with 6 tabbed views for hiring bar, DSA, system design, CS, and loops. |
| `frontend/src/pages/ExperiencesPage.tsx` | Filterable and searchable feed of approved community interview loops. |
| `frontend/src/pages/ExperienceDetailPage.tsx` | Detailed interview debrief view with round-by-round breakdown, questions asked, and reporting modal. |
| `frontend/src/pages/ExperienceSubmitPage.tsx` | Dynamic submission form for interview loops with real-time PII validation and anonymity options. |
| `frontend/src/pages/AdminExperiencesPage.tsx` | Administrator governance console for reviewing, approving, rejecting, and handling reported loops. |
| `frontend/src/components/workspace/AppShell.tsx` | Updated sidebar navigation with Company Tracks, Interview Loops, and Admin Moderation. |
| `frontend/src/App.tsx` | Configured routes for `/companies/:slug`, `/experiences`, `/experiences/new`, `/experiences/:id`, and `/admin/experiences`. |
| `backend/src/lib/models/UserProgress.ts` | Schema for progress tracking, unique solved problem sets, streak, daily activity map, and topic mastery. |
| `backend/src/lib/models/Bookmark.ts` | Schemas for custom bookmark lists and spaced repetition revision queue items (SM-2 intervals). |
| `backend/src/lib/models/User.ts` | Extended user schema with developer profile subdocument and sparse unique username. |
| `backend/src/services/progressService.ts` | Idempotent progress calculation engine, timezone-aware streak tracking, and anti-inflation mastery logic. |
| `backend/src/server/routes/analytics.ts` | Endpoints for overview metrics, 365-day heatmap, topic mastery breakdown, and full progress resync. |
| `backend/src/server/routes/bookmarks.ts` | Endpoints for bookmark list CRUD, item save/unsave, notes editing, and SM-2 review rating. |
| `backend/src/server/routes/profile.ts` | Endpoints for authenticated profile editing and privacy-guarded public profile showcase (`/api/profile/public/:username`). |
| `backend/tests/analyticsPhase8.test.ts` | Automated test suite covering streak formulas, anti-inflation safeguards, SM-2 ratings, and privacy isolation. |
| `frontend/src/pages/AnalyticsPage.tsx` | Analytics dashboard with solved breakdown, streak counter, 52-week activity heatmap, and weak-topic detection. |
| `frontend/src/pages/RevisionPage.tsx` | Spaced repetition revision queue ("Due Today" vs "All"), SM-2 rating buttons, notes modal, and list filters. |
| `frontend/src/pages/ProfilePage.tsx` | Account and developer profile editor with custom username, timezone selector, and public profile toggle. |
| `frontend/src/pages/PublicProfilePage.tsx` | Public developer showcase route (`/u/:username`) displaying verified stats and top mastered topics. |
| `frontend/src/pages/ProblemWorkspacePage.tsx` | Added 1-click revision bookmark button in coding workspace header. |
| `frontend/src/components/CandidateDashboard.tsx` | Added quick-action tiles for Progress & Analytics and Revision & Spaced Repetition. |

---

## 4. Test & Verification Log

| Suite | Checks Run | Passed | Failed | Key Verification Results |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend TypeScript Compile** | `npx tsc --noEmit` | **PASS** | 0 | Exit code 0, zero TypeScript errors across all company track and experience components. |
| **Frontend Production Build** | `npm run build` (`vite`) | **PASS** | 0 | Built 80+ chunks with clean lazy loading and zero fatal errors. |
| **Frontend Lint** | `npm run lint` (`eslint`) | **PASS** | 0 | Exit code 0, 0 errors across all frontend files. |
| **Backend TypeScript Compile** | `npx tsc --noEmit` | **PASS** | 0 | Exit code 0, zero TypeScript errors across all models, routers, and services. |
| **Backend Production Build** | `npm run build` (`tsc -p tsconfig.json`) | **PASS** | 0 | Built cleanly to `dist/` with zero compiler errors. |
| **Backend Phase 8 Analytics & Profile** | `tests/analyticsPhase8.test.ts` | **PASS** | 0 | Unit & integration tests for streak calculation across timezones, anti-inflation mastery, SM-2 ratings, and privacy boundaries. |
| **Backend Phase 7 Company & Experiences** | `tests/companyTracks.test.ts` | **17** | **0** | Verified PII regex scanner, track catalog, pending experience isolation, candidate author access, admin moderation, and cross-user edit rejection. |
| **Backend Phase 6 AI & Resume Suite** | `tests/interviewPhase6.test.ts` | **14** | **0** | Verified PDF magic byte validation, prompt injection quarantine, resume CRUD IDOR isolation, 7 interview modes, code-aware rubric evaluation, and result persistence. |
| **Backend Core CS & System Design** | `vitest run tests/coreCS.test.ts` | **19** | **0** | All 19 Phase 5 automated tests pass (confidentiality, server grading, system design drafts, IDOR story CRUD). |
| **Backend Judge & Execution Suite** | `vitest run tests/judge.test.ts` | **11** | **0** | All 11 Phase 4 judge tests pass (AC, WA, TLE, CE, RE, confidentiality, rate limiting). |
| **Backend Assessment Suite** | `vitest run tests/assessment.test.ts` | **7** | **0** | All 7 Phase 4 assessment tests pass (start, resume, late expiry 403, scorecard). |
| **Backend DSA API Suite** | `vitest run tests/dsa.test.ts` | **13** | **0** | All 13 Phase 3 automated unit & integration tests pass (roadmaps, problem catalog, confidentiality, admin CRUD). |
| **Backend Security Regression** | `vitest run tests/security.test.ts` | **8** | **0** | All 8 Phase 1 security regression tests continue to pass. |
| **Total Backend Test Coverage** | Vitest test suites (all 7 suites) | **89** | **0** | **89 passing tests, 0 failures, 0 regressions.** |
