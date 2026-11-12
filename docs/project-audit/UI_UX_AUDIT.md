# UI / UX Audit

**Audit Date:** 2026-11-12  
**Live Browser Verification Status:** **PENDING / BLOCKED**  
Two attempts to inspect `http://localhost:5173` using Browser Automation (`e9c2e5fd-2f4d-4b9a-883a-7e8865879df2`) timed out with `BLOCKED / ORIGIN_PERMISSION_REQUIRED` waiting for interactive approval of `localhost:5173` (`visited_origins: none`, `latest_screenshot: none`). Consequently, **no rendered visual layout or live browser screenshots were verified**. All findings below are strictly verified from JSX/TSX, CSS, and React Router source inspection.

---

## 1. Platform-Wide UI/UX Assessment

Currently, the UI resembles an **AI marketing template + generic Q&A form**, rather than an engineering preparation workspace (such as LeetCode, NeetCode, HackerRank, or Interviewing.io):
- **Primary Navigation (`Navbar.tsx`):** Shows only `Home` (when logged out) or `Home`, `Dashboard`, `New Interview` (even for HR users!) when logged in. Core prep pillars (DSA, Coding Practice, Core CS, System Design, Mock Interviews, Resources) are completely absent from primary navigation and buried in `Footer.tsx`.
- **Broken Role-Based Routing (`Navbar.tsx`, `LoginPage.tsx`, `App.tsx`):** Both `Navbar` and `LoginPage` compute `/${user.role}/dashboard`. For `admin` users, this routes to `/admin/dashboard`, which does not exist in `App.tsx` -> renders `<NotFoundPage />`.
- **Broken Internal Links:**
  - `LoginPage.tsx` (line 128) links to `/forgot-password` -> `<NotFoundPage />` (404).
  - `ResultsPage.tsx` (lines 89, 119) links to `/hr-dashboard` and `/candidate-dashboard` (hyphens) instead of `/hr/dashboard` and `/candidate/dashboard` (slashes) -> `<NotFoundPage />` (404).
  - `ResultDetailPage.tsx` (line 238) hardcodes the back button to `/candidate/dashboard` even when viewed by an HR user.
  - `Footer.tsx` (lines 24–44, 52–56) uses `href="#"` placeholders for social links and exposes candidate-only links (`/candidate/dashboard`, `/results`) to unauthenticated visitors and HR users.
- **Credibility Anti-Patterns (`HomePage.tsx`, `LoginPage.tsx`):** Displays hardcoded vanity numbers (`10K+ Interviews Completed`, `95% Success Rate`, `50+ Job Roles`, `4.9★`) and static testimonials while only supporting 5 roles.

---

## 2. Page-by-Page Source Code UI/UX Findings

| Page / Component | Source Path | Verified Defects & UX Issues | Redesign Recommendation |
| :--- | :--- | :--- | :--- |
| **Navbar & Footer** | `Navbar.tsx`, `Footer.tsx` | Single flat bar missing prep tracks (`DSA`, `Coding`, `System Design`, `Core CS`, `Mock AI`, `History`); shows `New Interview` (`/setup`) to HR users; footer uses dead `href="#"` links. | Introduce role-aware sidebar/workspace shell for authenticated prep (`Roadmap`, `Problems`, `Mock Interview`, `System Design`, `Core CS`, `Analytics`, `Bookmarks`). |
| **Homepage** | `HomePage.tsx` | Generic SaaS marketing copy + unverified `10K+`/`95%`/`50+` claims; lacks interactive problem preview, curriculum overview, or authentic demo flow. | Reframe into a clean technical landing page showcasing live DSA workspace preview, supported languages/tracks, and authentic workflow. |
| **Auth Pages** | `LoginPage.tsx`, `SignupForm.tsx`, `SignupPage.tsx` | Broken `/forgot-password` link; `SignupForm` allows `candidate`/`hr` toggle, while backend leaves `admin` exposed; repeats vanity stats on split panel. | Implement password reset flow (or remove dead link until built), clarify Candidate vs Recruiter onboarding, and improve inline field validation feedback. |
| **Candidate Dashboard** | `CandidateDashboard.tsx` | Shows only flat upcoming interviews + past mock score list; zero DSA solved counts, topic mastery breakdown, streaks, bookmarks, or weak-area insights. | Replace with a modular Developer Analytics Dashboard: skill mastery bars, study streak calendar, recommended next problems/topics, and interview history table with filters. |
| **HR Dashboard** | `HRDashboard.tsx` | Sends client `hr: user?._id` in POST payload; basic interview table + schedule modal; lacks candidate filter/search, structured rubric configuration, or coding assessment templates. | Add structured assessment/round templates, candidate search & status filters, inline scorecard drawer, and link to technical coding evaluations. |
| **Setup & AI Interview** | `SetupPage.tsx`, `InterviewPage.tsx`, `InterviewContext.tsx` | `SetupPage` restricts to 5 static cards and requires webcam/mic permission up front; `InterviewPage` uses unloaded `material-icons` CSS ligatures (renders raw text like `"mic"` / `"videocam_off"` if font isn't loaded!); single plain textarea with no syntax highlighting or code runner; silent random fallback scores (`50–70`) masquerade as AI evaluation. | Decouple text/coding mode from mandatory webcam; fix broken `material-icons` to `lucide-react` consistently; embed Monaco/CodeMirror IDE for technical questions; display explicit error banner instead of fake `50–70` fallback scores. |
| **Interview Room** | `InterviewRoomPage.tsx` | `useEffect` dependency array includes `[id, API_BASE_URL, interview, stream]`, causing redundant `fetchInterview()` re-fetches whenever state updates; lacks real-time HR-candidate media connection. | Fix `useEffect` dependencies immediately; separate async AI solo rooms from true WebRTC/WebSocket live interviews or remove misleading multi-party framing. |
| **Results & Detail** | `ResultsPage.tsx`, `ResultDetailPage.tsx` | Broken `/hr-dashboard` & `/candidate-dashboard` links; `ResultDetailPage` reads `answer.text` instead of schema field `answerText`, displaying blank/`No answer provided` for candidate answers. | Fix `answerText` field mapping and route paths; add per-question code diff/complexity breakdown and trend comparison across attempts. |
| **Resource / CMS Pages** | `FAQPage.tsx`, `CareerBlogPage.tsx`, `InterviewTipsPage.tsx`, `ResumeGuidePage.tsx`, `CareersPage.tsx` | Uses generic marketing layouts; disconnected from actual learning tracks; AI features inside FAQ/Resume fail or degrade silently when backend `GEMINI_API_KEY` is absent. | Convert `InterviewTips` and `ResumeGuide` into interactive prep modules tied directly to candidate profile & AI mock interviewer context. |

---

## 3. Responsiveness, Theme, State & Accessibility Gaps (Source-Verified)

- **Theming (`ThemeContext.tsx`, `index.css`, `tailwind.config.js`):** Light, dark, and system theme state is wired, **live visual contrast verification is Pending browser access**.
- **Broken Icon Font Dependency:** `index.html` must load Google Material Icons for `InterviewPage.tsx` lines 1014 & 1029 (`className="material-icons"`), whereas the rest of the app uses `lucide-react`. Mixing icon systems creates broken button text fallbacks.
- **Loading / Empty / Error States:** Generic UI helpers (`EmptyState.tsx`, `LoadingSkeleton.tsx`) exist under `components/ui/`, yet key interview failure paths (`InterviewContext.tsx` catch blocks) mask AI failures with random scores (`50–70`) and pre-canned mock questions instead of actionable error banners and retry controls.
- **Accessibility Gaps to Verify/Fix:**
  - Icon-only/control buttons in `InterviewPage.tsx` and custom dropdown menus (`ThemeToggle` in `Navbar.tsx`) lack `aria-expanded`, `role="menu"`, and focus-trap/Escape handling.
  - Non-awaited result saving in `finishInterview` risks silent data loss if user navigates quickly after finishing.
- **Pending Live Verification Checklist (for when `localhost:5173` browser permission is granted):**
  1. Desktop (`1280x800`) and mobile (`375x812`) overflow/hamburger menu checks across `/`, `/login`, `/candidate/dashboard`, `/setup`, `/interview`, `/results/:id`, `/hr/dashboard`.
  2. Light/dark contrast inspection across cards, charts, and code blocks.
  3. Real runtime console error and failed HTTP network capture across full user flows.
