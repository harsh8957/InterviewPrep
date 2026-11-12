# Project Overview

**Audit Date:** 2026-11-12  
**Repository:** `D:\InterviewPrep\InterviewPrep`  
**Audit Scope:** Read-only codebase, build, API, and service verification (source code unmodified; live browser UI automation **Pending** due to `ORIGIN_PERMISSION_REQUIRED` timeout on `localhost:5173`).

---

## 1. Project Purpose

**InterviewPrep** (internally referenced as *EchoPrep* in `evaluator_service/main.py` via `FastAPI(title="EchoPrep Evaluator Service")`) is currently a **role-based AI mock interview and HR scheduling web application** built with a React/TypeScript frontend, a Node.js/Express/MongoDB backend, and a Python/FastAPI Gemini AI evaluator microservice.

Its **current implemented scope** centers on:
- Conversational/Q&A mock interview practice for 5 broad tracks (`web-developer`, `app-developer`, `ml-ai`, `ux-designer`, `data-scientist`).
- HR-scheduled interview rooms (`InterviewRoom`) with UUID room links and candidate scorecards (`InterviewResult`).
- Static/CMS-backed career content (FAQ + AI Q&A, Interview Tips + AI Coach, Resume Guide + AI Analyzer, Career Blog, Careers/Jobs board, Contact form, Policy & Company pages).

Its **target platform scope** (per owner objectives) expands InterviewPrep into a comprehensive **software engineering interview preparation platform** covering DSA, Competitive Programming, Online Coding Rounds/Judge, Core CS, System Design, Backend/Full-Stack, Behavioral/HR, Company-Specific Prep, AI Mock Interviews, and Learning Progress Analytics.

---

## 2. Target Users & Roles

| Role | Current Support (`backend/src/lib/models/User.ts`) | Intended Target Platform Persona |
| :--- | :--- | :--- |
| **`candidate`** | Implemented (`CandidateDashboard`, `/setup`, `/interview`, `/results`, job applications) | SWE / CS students & professionals preparing for DSA, coding rounds, system design, core CS, and behavioral interviews. |
| **`hr`** | Implemented (`HRDashboard`, schedule interview rooms, view candidate results linked to HR rooms) | Technical recruiters / hiring managers scheduling structured screening interviews and reviewing candidate scorecards. |
| **`admin`** | **Partially Implemented / Vulnerable** (`User` schema supports `admin` enum, `backend/src/server/routes/admin.ts` exists, but `/signup` allows anyone to self-register as `admin` and no `/admin/dashboard` frontend route exists) | Platform administrators / content curators managing DSA problems, system design modules, company tracks, blogs, and moderation. |

---

## 3. Repository Structure & State

| Path | Role | Verified State |
| :--- | :--- | :--- |
| `frontend/` | React 18 + Vite + TypeScript + Tailwind SPA (`:5173`) | Production build passes (`tsc && vite build` -> 3 files, `462.98 KiB` on disk). |
| `backend/` | Express + TypeScript + Mongoose REST API (`:5000`) | TypeScript & `tsup` build pass (`dist/index.js`). Root `eslint.config.js` broken (`@eslint/js` missing). |
| `evaluator_service/` | Python FastAPI + Pydantic + `google-generativeai` (`:8001`) | Starts and serves endpoints; live Gemini calls fail with `404` on retired `gemini-2.5-flash`. |
| `interview-preparation/` | Untracked local Markdown/PDF documentation folder | Present in working tree (`git status -s` shows `?? interview-preparation/`); not part of runtime app. |
| `eslint.config.js` / `package.json` | Root workspace config files | Incomplete dependencies (`npm run lint` fails in both `frontend` and `backend`). |

---

## 4. Summary of Verified Working Functionality vs. Gaps

| Area | Verified Status | Evidence |
| :--- | :--- | :--- |
| **Auth (Signup / Login / JWT / `/me`)** | **Working (with security flaw)** | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` succeed; `POST /api/auth/signup` allows `role: "admin"` (`201`). |
| **HR Room Scheduling & Lifecycle** | **Working (with room endpoint exposure)** | HR creates/lists/cancels rooms (`POST /api/interviews`, `PUT /:id/cancel`); tenant isolation between HR-1 and HR-2 passes; `GET /api/interviews/room/:roomId` lacks auth. |
| **Result Persistence & Ownership** | **Working (with UI mismatch)** | `POST /api/interview-results` and `GET /api/interview-results` persist and enforce ownership; `ResultDetailPage.tsx` reads wrong field (`answer.text` instead of `answerText`). |
| **AI Interview Evaluator (Live)** | **Broken** | Live Google Gemini requests fail (`HTTP 500`) because `gemini-2.5-flash` is deprecated/unavailable (`404`) and `backend/.env` targets wrong evaluator port (`8000` vs `8001`). |
| **Backend Direct Gemini Features** | **Degraded / Failing** | `backend/.env` omits `GEMINI_API_KEY`; `/api/resume/analyze` returns `500`; `/api/jobs/:id/apply` falls back to `matchScore: 50`; `/api/faq/ask-ai` returns fallback text. |
| **Public CMS Content APIs** | **Working** | `GET /api/faq`, `/api/blog`, `/api/jobs`, `/api/company`, `/api/policy/*`, `/api/interview-tips`, `/api/resume`, `POST /api/contact` all return `200`/`201`. |
| **DSA / Coding Judge / Core CS / System Design** | **Missing** | Zero models, routes, code execution sandbox, problem bank, or interactive coding IDE exist in the repository. |
| **Real-time Video/Socket Interviewing** | **Not Implemented** | `socket.io`, `socket.io-client`, `@google-cloud/speech`, and `@google-cloud/text-to-speech` are installed in `package.json` but never imported anywhere. |
