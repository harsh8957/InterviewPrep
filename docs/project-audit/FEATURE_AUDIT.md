# Feature & Product Gap Audit

**Audit Date:** 2026-11-12  
**Classification Criteria:** Verified against source code (`D:\InterviewPrep\InterviewPrep`) and isolated runtime tests (`50/58` Express API checks passed, `14/15` mocked evaluator unit checks passed, `3/3` live Gemini calls returned `500` due to retired `gemini-2.5-flash`).

---

## 1. Existing Feature Inventory

| Existing Feature | Status | Exact Location | Observed Behavior & Gaps |
| :--- | :--- | :--- | :--- |
| **JWT Signup, Login, `/me`, Logout** | **Existing but incomplete** | `backend/src/server/routes/auth.ts`, `AuthContext.tsx` | Works end-to-end (`200`/`201`), but `signup` permits self-assigning `role: "admin"`, fallback `JWT_SECRET` exists, and `logout` does not revoke JWTs. |
| **Role-Based Dashboards (`Candidate` / `HR`)** | **Existing but incomplete** | `CandidateDashboard.tsx`, `HRDashboard.tsx`, `App.tsx` | Role routing works for `candidate` and `hr`, but `admin` redirects to non-existent `/admin/dashboard`; `CandidateDashboard` lacks pagination/search/filtering/analytics charts. |
| **Practice Interview Setup & Session** | **Existing but incomplete** | `SetupPage.tsx`, `InterviewPage.tsx`, `InterviewContext.tsx` | Only 5 roles (`web-developer`, `app-developer`, `ml-ai`, `ux-designer`, `data-scientist`); adaptive loop relies on broken `gemini-2.5-flash`; falls back to random scores (`50–70`) on failure; `experienceLevel` dropped in `POST /api/interviews/gemini/questions`. |
| **HR Scheduled Interview Rooms** | **Existing but incomplete** | `interviews.ts`, `HRDashboard.tsx`, `InterviewRoomPage.tsx` | HR room creation, listing, and cancellation work (`POST /api/interviews`, `PUT /:id/cancel`); room details (`GET /room/:roomId`) are unauthenticated; no WebRTC/Socket.IO live HR-candidate audio/video stream exists. |
| **Interview Results & Detail View** | **Existing but incomplete** | `interviewResults.ts`, `ResultsPage.tsx`, `ResultDetailPage.tsx` | Backend stores and protects `InterviewResult` records, but `ResultDetailPage.tsx` reads `answer.text` instead of DB `answerText`, `ResultsPage.tsx` links to invalid `/hr-dashboard` & `/candidate-dashboard`, and `finishInterview` fails to `await` result persistence. |
| **AI Answer Evaluator Service** | **Existing but incomplete (Broken Live)** | `evaluator_service/main.py` | Unit/mock logic works (`14/15` passed), but uses retired `gemini-2.5-flash`, shifts question IDs (`2,3,4`) when `#` headers are filtered, returns silent `0.5` scores on malformed output, and lacks short-answer guard in `/evaluate-and-next`. |
| **Resume Guide & AI Resume Analyzer** | **Existing but incomplete** | `ResumeGuidePage.tsx`, `resume.ts`, `aiService.ts` | Guide CRUD/seed reads work (`200`), but `/api/resume/analyze` returns `500` when backend `GEMINI_API_KEY` is missing; accepts plain text only (no PDF/DOCX parsing). |
| **Careers / Job Board & AI Match Score** | **Existing but incomplete** | `CareersPage.tsx`, `JobDetailPage.tsx`, `jobs.ts` | `GET /api/jobs` and `POST /:id/apply` work, falling back silently to `matchScore: 50` without `GEMINI_API_KEY`; documented `POST /api/jobs` is missing (`404`); HR cannot create jobs in UI. |
| **Blog, FAQ, Tips, Contact, Policy, Company** | **Existing and functional (CMS read-only in UI)** | `blog.ts`, `faq.ts`, `interview-tips.ts`, `contact.ts`, `policy.ts`, `company.ts` | All public GET endpoints and `POST /api/contact` / blog comments work cleanly; admin/editorial UI for managing content does not exist. |
| **Browser Text-to-Speech / Speech-to-Text** | **Existing but incomplete** | `InterviewContext.tsx`, `interviews.ts` (`/tts`) | `POST /api/interviews/tts` is a stub; frontend depends entirely on non-portable browser `SpeechRecognition`/`SpeechSynthesis` APIs; `@google-cloud/*` packages are unused. |

---

## 2. Target Platform Gap Analysis (18 Required Modules)

| # | Module | Classification | Priority | Existing Coverage vs. What Is Required |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **DSA Learning Roadmap** | **Missing and recommended** | **Critical** | None. Need structured dependency graph (Arrays -> Two Pointers -> Trees -> Graphs -> DP) with difficulty progression and completion milestones. |
| 2 | **Topic-wise DSA Questions** | **Missing and recommended** | **Critical** | None. Need curated problem bank tagged by topic, difficulty (`Easy`/`Medium`/`Hard`), pattern, hints, editorial, and complexity notes. |
| 3 | **Coding Practice Workspace** | **Missing and recommended** | **Critical** | None (`InterviewPage` only has a plain textarea). Need split-pane workspace (problem statement, examples, constraints, multi-language editor, custom input, test results). |
| 4 | **Online Coding Judge & Test Cases** | **Missing and recommended** | **Critical** | None. Need isolated execution sandbox (Docker/Judge0 or isolated worker pool) running public/hidden test cases with CPU/memory limits and verdicts (`AC`, `WA`, `TLE`, `MLE`, `RE`, `CE`). |
| 5 | **Timed Coding Assessments** | **Missing and recommended** | **High** | None. Need multi-problem timed OA simulations (`60–90m`), auto-submit timer, tab-switch telemetry (opt-in), and assessment scorecards. |
| 6 | **Company-wise Coding Questions** | **Missing and recommended** | **High** | None (`Job` model is internal careers, not prep tracks). Need company problem sets, role-targeted frequency tags, and prep playlists. |
| 7 | **Competitive Programming Contests** | **Missing and recommended** | **Medium** | None. Need weekly/virtual rated contests, live leaderboards, penalty scoring, and rating history (build after Judge + Problems stabilize). |
| 8 | **Mock Technical Interviews** | **Existing but incomplete** | **Critical** | Exists for Q&A sessions (`/setup`, `/interview`, `/interview-room/:id`), but lacks live collaborative code editor, whiteboarding, and real WebRTC/Socket.IO HR-candidate sessions. |
| 9 | **AI Interviewer** | **Existing but incomplete** | **Critical** | Core `/fetch-questions`, `/evaluate-answer`, `/evaluate-and-next` exist in FastAPI, but live model is broken (`gemini-2.5-flash` 404), prompts lack strict JSON schema, and code complexity evaluation is superficial. |
| 10 | **Resume-Based Interview Preparation** | **Existing but incomplete** | **High** | Text-only `/api/resume/analyze` & `/improve-bullet` exist in `resume.ts`, but crash (`500`) without `GEMINI_API_KEY`, lack PDF parsing, and are disconnected from AI interview question generation. |
| 11 | **Core CS Preparation (OS, DBMS, CN, OOP)** | **Missing and recommended** | **High** | None. Need topic modules, conceptual quizzes, flashcards, scenario MCQs, and AI oral/written drill questions per CS subject. |
| 12 | **System Design Preparation** | **Missing and recommended** | **High** | Only a single seeded blog slug (`ace-system-design`) exists. Need HLD/LLD curriculum, architecture trade-off rubrics, diagramming workspace (e.g., Mermaid/canvas), and capacity estimation drills. |
| 13 | **Behavioral Interview Preparation** | **Existing but incomplete** | **Medium** | Only static `InterviewTip` (`star-method`) exists. Need interactive STAR story builder, behavioral question bank, and rubric-graded practice. |
| 14 | **Company Interview Experiences** | **Missing and recommended** | **Medium** | None. Need structured user-submitted / curated round-by-round experience reports (role, outcome, rounds, difficulty, questions asked, moderation queue). |
| 15 | **Learning Progress Dashboard** | **Existing but incomplete** | **High** | `CandidateDashboard` shows only flat score lists. Need unified mastery radar/heatmap across DSA, Core CS, System Design, and Mock Interviews, plus daily streaks and weak-topic detection. |
| 16 | **Bookmarks and Revision Lists** | **Missing and recommended** | **Medium** | None. Need problem/question/note bookmarking, custom revision collections, and spaced-repetition / "re-solve due" queues. |
| 17 | **User Profiles and Statistics** | **Existing but incomplete** | **Medium** | Only basic `User` fields (`firstName`, `lastName`, `email`, `role`). Need public/private developer profile, target role, solved count by difficulty, submission heatmap, and skill badges. |
| 18 | **Admin Dashboard and Content Management** | **Existing but incomplete** | **High** | `admin.ts` has 3 stub endpoints behind `requireAdmin`, no frontend UI exists, and `/signup` allows self-signup as `admin`. Need full RBAC-protected CMS for problems, test cases, CS modules, blogs, and moderation. |

---

## 3. Unnecessary, Duplicate, or Misaligned Features

| Item | Current Location | Recommendation | Rationale |
| :--- | :--- | :--- | :--- |
| **Marketing Career Site Bloat (`About`, `Careers` self-hiring, `TeamMember`, `ContactMessage` intent classifier)** | `AboutPage.tsx`, `CareersPage.tsx`, `JobDetailPage.tsx`, `company.ts`, `jobs.ts` | **De-prioritize / Simplify** | Company hiring workflows compete with core interview prep; `/careers` is confusingly presented alongside candidate prep without company-prep tracks. |
| **Simulated Live Rooms (`InterviewRoomPage`) without Real-Time Transport** | `InterviewRoomPage.tsx`, `interviews.ts` (`auto-complete` duplicate routes) | **Consolidate or Re-architect** | Contains duplicate unauthenticated routes (`PUT /:id/auto-complete` and `PUT /auto-complete/:id`), unused `socket.io` packages, and misleading "room" UX without peer video/audio. |
| **Hardcoded Fake Social Proof Stats & Testimonials** | `HomePage.tsx`, `LoginPage.tsx` | **Remove / Replace** | Claims `10K+ Interviews`, `95% Success Rate`, `50+ Job Roles`, `4.9★` despite only 5 roles existing. Replace with accurate product capabilities. |
| **Unused Heavy Dependencies** | `package.json`, `requirements.txt` | **Prune Unused** | `@google-cloud/speech`, `@google-cloud/text-to-speech`, `formik`, `yup`, `react-datepicker`, `nodemailer`, `multer`, `spacy`, and root `package.json` bloat installs without runtime usage. |
