# 🚀 InterviewPrep — Production-Grade Developer Workspace & AI Interview Platform

[![CI/CD Pipeline](https://github.com/harsh8957/InterviewPrep/actions/workflows/ci.yml/badge.svg)](https://github.com/harsh8957/InterviewPrep/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)

**InterviewPrep** is an enterprise-grade technical interview preparation platform and developer workspace. It combines algorithmic coding practice, timed assessments, core computer science modules, interactive system design case studies, code-aware AI mock interviews, company hiring tracks, spaced-repetition revision, and verified developer showcases into a unified full-stack application.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        Browser["Modern Browser (Desktop & Mobile)<br/>React 18 • Monaco Code Editor • Audio Speech"]
    end

    subgraph Edge ["Edge Ingress & Reverse Proxy"]
        Nginx["Nginx Reverse Proxy (Port 80/443)<br/>SPA Static Routing • Gzip • HTTP Security Headers"]
    end

    subgraph AppNetwork ["Internal Docker Network (backend-net)"]
        Backend["Express API Gateway (Node.js 20)<br/>Helmet • Rate Limiting • Correlation IDs • RBAC"]
        Evaluator["AI Evaluator Microservice (FastAPI 3.11)<br/>Async SDK • Threadpool Offloading • 30s Timeout"]
        MongoDB[("MongoDB 7.0 Database<br/>Connection Pooling • Zero Public Port Exposure")]
    end

    subgraph JudgeHost ["Dedicated Execution Host"]
        Judge0["Judge0 CE Isolated Sandbox<br/>cgroups v2 • Ephemeral Tmpfs • Network: none"]
    end

    subgraph ExternalServices ["External Cloud Services"]
        Gemini["Google Gemini AI API (REST)"]
    end

    Browser -->|HTTPS / WSS| Nginx
    Nginx -->|/assets/| Nginx
    Nginx -->|/api/*| Backend
    Backend -->|Mongoose Pool (50 max)| MongoDB
    Backend -->|x-internal-service-key| Evaluator
    Backend -->|REST / RapidAPI| Judge0
    Evaluator -->|REST Transport| Gemini
```

---

## 🌟 Core Modules & Platform Capabilities

### 1. DSA Roadmap & Monaco Coding Workspace
- **16 Curriculum Nodes:** Structured progression covering Arrays, Two Pointers, Sliding Window, Trees, Graphs, Dynamic Programming, and Tries.
- **Problem Bank:** LeetCode-style problem catalog with difficulty filtering, topic badges, and complexity bounds.
- **Monaco Code Editor:** Split-screen developer workspace with multi-language starter templates (Python 3, JavaScript, TypeScript, C++ 20, Java 21), dark/light themes, and local draft autosave.

### 2. Secure Online Coding Judge & Timed Assessments
- **Judge0 CE Integration:** Untrusted candidate source code runs in hardened Linux execution sandboxes with memory quotas, CPU limits, and no network access.
- **Confidentiality Safeguards:** Public test cases preview in the editor; evaluation test cases remain strictly confidential on the backend.
- **HackerRank-Style Assessments:** Timed rounds with countdown clocks, late submission rejections, and automated scorecards.

### 3. Core CS & Interactive System Design Lab
- **4 Foundation Subjects:** Operating Systems, Database Management Systems, Computer Networks, and Object-Oriented Programming.
- **Graded Quizzes & Flashcards:** Concept explanations, scenario questions, and server-graded evaluations.
- **System Design Studio:** Architecture walkthroughs (Rate Limiters, URL Shorteners, Distributed Caches, Chat Engines) with interactive Mermaid/Cytoscape diagrams and trade-off rubrics.

### 4. Code-Aware & Resume-Driven AI Mock Interviews
- **7 Specialized Modes:** DSA Coding, Backend, Full-Stack, System Design, Core CS, Resume Deep-Dive, and Behavioral.
- **Speech Audio & Verbal Interaction:** Real-time speech-to-text recording, audio playback, and split-screen Monaco coding panel.
- **Dynamic Adaptive Questioning:** Cross-questions candidates based on their previous answers and evaluates complexity.
- **Secure PDF Resume Upload:** Strict MIME validation, magic-byte inspection, prompt injection sanitization, and PII isolation.

### 5. Company Tracks & Community Interview Loops
- **FAANG & Tech Tracks:** Dedicated preparation hubs for Google, Amazon, Meta, Microsoft, Uber, and Stripe.
- **Community Loops & Moderation:** Candidates submit interview debriefs with automated PII detection (phones, emails, interviewer names) and an admin review console.

### 6. Progress Analytics, Bookmarks & Developer Profiles
- **Idempotent Analytics:** Unique solved counts aggregated strictly from database events; repeated attempts never double-count.
- **Timezone-Aware Study Streak:** Accurate calendar-day streak tracking calculated in the candidate's preferred timezone.
- **52-Week Activity Heatmap:** GitHub-style yearly contribution graph.
- **Spaced Repetition (SuperMemo SM-2):** Bookmarking system scheduling challenging questions at scientifically spaced intervals (Again, Good, Easy ratings).
- **Public Developer Showcase (`/u/:username`):** Verifiable public profile highlighting solved challenges, streak, top mastered topics, and skills without leaking private credentials.

---

## 🛡️ Security & Production Hardening

| Control | Implementation Details |
| :--- | :--- |
| **HTTP Security Headers** | Helmet enforces `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`. |
| **Rate Limiting** | Tiered rate limiters: General API (300/15min), Auth (30/15min), Code Execution (60/15min), AI Operations (40/15min). |
| **Payload Limiting** | Strict 1MB JSON and URL-encoded body size limits to prevent memory exhaustion DoS. |
| **NoSQL Query Sanitization** | Strips dangerous MongoDB operator keys (`$where`, `$gt`, etc.) from client input bodies and queries. |
| **JWT Revocation** | Revoked tokens stored in MongoDB with automatic TTL expiry indexes. Explicit token validation on every authenticated request. |
| **Request Correlation** | Unique `X-Correlation-ID` generated or propagated across all requests for end-to-end distributed tracing. |
| **Non-Blocking AI Pipeline** | Python FastAPI offloads all synchronous Gemini operations to an asynchronous threadpool with a 30s timeout. |
| **Network Isolation** | MongoDB and the AI evaluator run on an internal Docker bridge network (`backend-net`) with zero public host port mappings. |

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7.0+

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/harsh8957/InterviewPrep.git
cd InterviewPrep

# 2. Configure environment
cp .env.example backend/.env
cp .env.example evaluator_service/.env

# 3. Install dependencies & run backend
cd backend
npm install --legacy-peer-deps
npm run dev

# 4. In a second terminal, run frontend
cd ../frontend
npm install
npm run dev

# 5. In a third terminal, run AI evaluator
cd ../evaluator_service
pip install -r requirements.txt
python main.py
```

---

## 🐳 Docker Production Deployment

InterviewPrep includes production Docker orchestration:

```bash
# 1. Clone and prepare configuration
git clone https://github.com/harsh8957/InterviewPrep.git /opt/interviewprep
cd /opt/interviewprep
cp .env.production.example .env.production

# 2. Start full-stack cluster
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Seed curriculum and tracks
docker compose exec backend npm run seed:dsa
docker compose exec backend npm run seed:core-cs
docker compose exec backend npm run seed:companies

# 4. Provision admin account
docker compose exec -it backend npm run create-admin
```

See [deploy/JUDGE_DEPLOYMENT.md](file:///d:/InterviewPrep/InterviewPrep/deploy/JUDGE_DEPLOYMENT.md) and [docs/DEPLOYMENT.md](file:///d:/InterviewPrep/InterviewPrep/docs/DEPLOYMENT.md) for full Linux deployment and backup instructions.

---

## 🧪 Testing & Quality Assurance

```bash
# Backend TypeScript & Lint
npm --prefix backend run lint

# Backend Production Build
npm --prefix backend run build

# Frontend TypeScript & ESLint
npm --prefix frontend run lint

# Frontend Production Bundle Build
npm --prefix frontend run build
```

---

## 📄 License & Attribution

InterviewPrep is licensed under the [MIT License](LICENSE).
Built with modern software engineering practices, verifiable metrics, and strict security boundaries.
