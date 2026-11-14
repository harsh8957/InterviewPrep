# Product Roadmap

**Audit Date:** 2026-11-12  
**Product Goal:** Transform InterviewPrep from a partial AI Q&A / HR scheduling prototype into a cohesive, production-grade **Software Engineering & Computer Science Interview Preparation Platform**.

---

## 1. Strategic Product Decisions

| Decision | Rationale |
| :--- | :--- |
| **Fix & harden foundation before adding modules** | Today, live AI calls fail (`404 gemini-2.5-flash`), self-signup permits `role=admin`, room PII leaks unauthenticated, and result answers render blank. Adding DSA/Judge features on top of broken core workflows compounds technical debt. |
| **Unify around a Workspace UX (Problem + Practice + Review)** | Serious prep platforms (LeetCode, NeetCode, Interviewing.io) keep navigation task-oriented (`Roadmap`, `Problems`, `Mock Interview`, `System Design`, `Core CS`, `Analytics`), not footer-driven CMS pages. |
| **Sequence Online Coding Judge before Timed Assessments & Contests** | Timed OAs and Competitive Programming contests depend on a rock-solid, sandboxed code-execution engine (`Problem`, `TestCase`, `Submission`). Build Judge once cleanly; reuse everywhere. |
| **Tightly couple AI + Resume + Coding Context** | Instead of siloed `/api/resume/analyze` vs `/api/faq/ask-ai` vs `/fetch-questions`, feed the candidate's target role, weak DSA topics, and parsed resume skills into the AI Mock Interviewer. |
| **De-prioritize Marketing/Self-Hiring Pages** | `About`, `TeamMember`, and internal company `Careers` (`jobs.ts`) distract from engineering interview prep. Keep static legal/contact pages lightweight; repurpose "Companies" toward **Company Prep Tracks & Interview Experiences**. |

---

## 2. Prioritized Feature Matrix

| Priority | Module / Initiative | Target Audience | Implementation Phase | Business / Learner Value |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | Security & Auth Hardening (`admin` signup block, JWT secret enforcement, room auth, rate limiting, Zod validation) | All Users | Phase 1 | Eliminates critical privilege escalation, PII leakage, and open AI quota abuse. |
| **Critical** | AI Evaluator Repair (`google-genai` SDK migration, active model config, structured JSON output, port `8001` alignment, honest error UI) | Candidates, HR | Phase 1 | Restores broken AI question generation and answer evaluation. |
| **Critical** | Fix Existing UX Bugs (`ResultDetailPage` `answerText`, `ResultsPage` links, `finishInterview` await, `material-icons` removal, `InterviewRoomPage` loop) | Candidates, HR | Phase 1 | Ensures existing mock interviews and scorecards work end-to-end. |
| **Critical** | Developer Workspace Navigation & Responsive Shell | Candidates, HR, Admin | Phase 2 | Replaces marketing layout with a scalable sidebar/topbar prep workspace. |
| **Critical** | DSA Learning Roadmap & Topic-Wise Question Bank | Candidates | Phase 3 | Establishes core SWE prep spine (patterns, difficulty tiers, hints, editorials). |
| **Critical** | Split-Pane Coding Practice Workspace (Monaco Editor + Test Runner) | Candidates | Phase 3–4 | Enables hands-on coding rather than plain-textarea typing. |
| **Critical** | Isolated Online Coding Judge & Multi-Case Evaluation (`AC`/`WA`/`TLE`/`MLE`) | Candidates, HR | Phase 4 | Powers coding practice, timed OAs, and future technical screening rounds. |
| **High** | Timed Coding Assessments (Simulated Online Assessments) | Candidates, HR | Phase 4 | Replicates real company OAs (`60–90m` multi-problem tests). |
| **High** | Core CS Modules (OS, DBMS, CN, OOP Quizzes & Concept Drills) | Candidates | Phase 5 | Covers essential CS fundamentals alongside coding rounds. |
| **High** | System Design Prep (HLD/LLD Case Studies, Rubrics, Backend/Full-Stack Scenarios) | Mid/Senior SWEs | Phase 5 | Differentiates platform for backend, full-stack, and senior interviews. |
| **High** | Code-Aware AI Mock Interviewer & Resume-Driven Questioning (PDF upload) | Candidates | Phase 6 | Upgrades AI interviewer from generic text Q&A to realistic technical + resume deep-dives. |
| **High** | Company-Specific Coding & Prep Tracks | Candidates | Phase 7 | Lets candidates filter roadmaps/problems by company pattern and role. |
| **High** | Learning Progress Dashboard (Topic Mastery, Streaks, Weak-Area Detection) | Candidates | Phase 8 | Drives retention through measurable skill progression. |
| **High** | Production Admin CMS & Problem/Content Authoring UI | Admins | Phase 2 / 8 | Unlocks safe content curation without manual DB seed scripts. |
| **Medium** | Behavioral Prep Interactive STAR Builder & Drills | Candidates | Phase 5–6 | Expands existing static STAR tip into graded behavioral practice. |
| **Medium** | Company Interview Experiences (Structured Round Logs + Moderation) | Candidates | Phase 7 | Community/curated insight into real interview loops. |
| **Medium** | Bookmarks, Revision Lists & Spaced Repetition Queue | Candidates | Phase 8 | High-utility retention feature built cleanly atop Problem/Topic IDs. |
| **Medium** | Developer Profiles & Public/Private Skill Stats | Candidates | Phase 8 | Showcases solved stats, heatmaps, and readiness summaries. |
| **Medium** | Real-Time Live Interview Rooms (WebRTC/Socket.IO + Shared Code Pad) | HR, Candidates | Phase 6 / Backlog | Turns existing `InterviewRoom` stub + unused `socket.io` into real collaborative HR technical interviews (optional if async AI screening stays primary). |
| **Low** | Competitive Programming Weekly / Virtual Contests & Leaderboards | Advanced Students | Backlog / Phase 8+ | High operational/moderation cost; add only after Online Judge throughput and anti-cheating stabilize. |
| **Low / Cut** | Internal Company Recruitment Board (`/careers`), Team Bios (`/about`), Fake Homepage Metrics | — | Phase 1–2 | Remove fabricated stats; archive or simplify self-hiring pages out of primary prep flow. |
