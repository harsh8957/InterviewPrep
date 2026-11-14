# InterviewPrep — Online Coding Judge Infrastructure & Security Specification

**Document Version:** 1.0.0
**Phase:** Phase 4 — Secure Online Coding Judge & Timed Assessments
**Author:** Software Architecture & Security Team
**Date:** 2026-11-14

---

## 1. Executive Summary & Evaluation

Executing untrusted user-submitted source code is one of the highest-risk operations in modern web applications. Malicious payloads can perform Denial-of-Service (fork bombs, CPU loops, memory exhaustion), network reconnaissance (SSRF, outbound botnet connections), filesystem exfiltration, and privilege escalation.

We evaluated three potential execution architectures for the **InterviewPrep** platform:

| Criteria | Self-Hosted Judge0 on Dev Node | Dedicated Linux Worker (nsjail/gVisor) | Managed/Hosted Judge0 CE API |
| :--- | :--- | :--- | :--- |
| **OS Compatibility** | Poor on Windows host (requires WSL2/cgroups) | Requires Linux kernel (gVisor/KVM) | Native HTTP REST (OS agnostic) |
| **Security Isolation** | Risk of container breakout if misconfigured | Best (kernel micro-isolation, read-only root) | High (isolated external sandbox cluster) |
| **Host Resource Impact**| Heavy (compilers, Redis, Postgres, Docker) | Dedicated instance only | Zero impact on application server |
| **Setup & Maintenance** | Complex multi-container orchestration | Significant DevOps engineering | Immediate configuration via standard REST API |
| **Cost** | Local machine wear | Cloud infrastructure cost ($20-50/mo) | Free tier available / Pay-per-use |

### Architecture Decision:
1. **Standardized Provider Interface (`IJudgeProvider`):** We adopt the **Judge0 CE** API specification as the primary integration contract. This allows seamless switching between:
   - Managed Judge0 instances (e.g., RapidAPI or dedicated Judge0 cloud).
   - Dedicated hardened Linux worker pools running Judge0 CE inside private VPCs.
   - Deterministic test sandbox provider for automated testing and CI pipelines.
2. **Strict Host Process Isolation (Non-Negotiable Guardrails):**
   - Untrusted source code is **NEVER** executed inside the Node.js/Express or Python/FastAPI application processes.
   - Unrestricted `child_process.exec` or Python `subprocess` execution is strictly forbidden in application code.
   - The application server is never granted Docker daemon socket access (`/var/run/docker.sock`).
   - No resource-intensive judge containers are automatically spawned on the Windows host machine.

---

## 2. Execution Pipeline & Threat Model

```
+-----------------------------------------------------------------------------------------+
|                                    CANDIDATE BROWSER                                    |
|   - Monaco Code Workspace (Python, JS, TS, C++, Java)                                    |
|   - Sample Test Runner & Final Submission Forms                                          |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP POST /api/submissions (JWT Authenticated)
                                             v
+-----------------------------------------------------------------------------------------+
|                             EXPRESS BACKEND APPLICATION                                 |
|   1. Rate Limiter (Token Bucket: max 1 sub / 5s per user)                                |
|   2. Input Validation (Language check, max code size: 64KB, Zod schema)                 |
|   3. Database Write (Submission created with PENDING verdict)                            |
|   4. Asynchronous Execution Queue (Bounded concurrency: max 5 concurrent jobs)           |
+--------------------------------------------+--------------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   | Orchestrator fetches TestCases from MongoDB       |
                   | (Public sample cases for Run; Public+Hidden for   |
                   | Submit. Hidden cases NEVER leaked to browser)    |
                   v                                                   v
+---------------------------------------+   +---------------------------------------------+
|          JUDGE0 CE PROVIDER           |   |            MOCK TEST PROVIDER               |
|  - Authenticated via RapidAPI/Key     |   |  - Isolated in-memory runner for unit tests |
|  - Language mapping & Base64 payload  |   |  - Validates verdict normalization, rate     |
|  - Timeouts & Memory limits enforced  |   |    limiting, concurrency, and IDOR          |
+-------------------+-------------------+   +----------------------+----------------------+
                    |                                              |
                    +----------------------+-----------------------+
                                           v
+-----------------------------------------------------------------------------------------+
|                                  RESULT NORMALIZATION                                   |
|   - Standard Verdicts: AC, WA, TLE, MLE, RE, CE, INTERNAL_ERROR                         |
|   - Sanitization: Strip hidden test inputs and expected outputs                          |
|   - Persist to MongoDB Submission collection                                            |
|   - Update Assessment Attempt score if submission was part of a timed OA                |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Sandboxing & Resource Limit Specifications

Every test case evaluated by the judge orchestrator must enforce the following strict boundaries:

1. **CPU Execution Time Limit:**
   - Default: `2.0 seconds` per test case.
   - Hard maximum cap: `5.0 seconds` (client or problem cannot override beyond this cap).
2. **Memory Limit:**
   - Default: `128,000 KB (128 MB)`.
   - Hard maximum cap: `256,000 KB (256 MB)`.
3. **Source Code Size Limit:**
   - Maximum: `65,536 bytes (64 KB)`.
4. **Standard Output & Error Truncation:**
   - Output truncated at `10,000 characters` to prevent memory flooding via infinite print loops.
5. **Network Access in Sandbox:**
   - Disabled (`enable_network = false` on execution host). Untrusted code has zero outbound network connectivity.
6. **Filesystem Isolation:**
   - Ephemeral, read-only root with temporary `/tmp` mounted in memory (tmpfs) and wiped immediately after execution.

---

## 4. Verdict Mapping Matrix

| Raw Judge Status | Standardized Verdict | Description | User Visibility |
| :--- | :--- | :--- | :--- |
| `Accepted (3)` | **`AC`** | Output matches expected output exactly. | Green badge, execution metrics |
| `Wrong Answer (4)` | **`WA`** | Output does not match expected output. | Yellow badge, diff (sample cases only) |
| `Time Limit Exceeded (5)` | **`TLE`** | Execution exceeded CPU time limit. | Orange badge, time limit indicator |
| `Compilation Error (6)` | **`CE`** | Code failed to compile or syntax error. | Red badge, compiler error trace |
| `Runtime Error (7-12)` | **`RE`** | Non-zero exit code, segfault, uncaught exception. | Red badge, exception message |
| `Memory Limit Exceeded (13)`| **`MLE`** | Memory exceeded allocated limit. | Purple badge, memory limit indicator |
| `Internal Error / Timeout` | **`INTERNAL_ERROR`**| Judge service unavailable or network fault. | Warning banner with retry option |

---

## 5. Environment Variables & Production Deployment

To connect an enterprise Judge0 cluster or managed provider, configure the following in `backend/.env`:

```env
# Online Judge Provider Configuration
JUDGE_PROVIDER=judge0             # Options: 'judge0', 'mock'
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com  # Or self-hosted http://judge0-linux.internal:2358
JUDGE0_API_KEY=your-rapidapi-key  # Optional if direct self-hosted instance without API key
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com # Required for RapidAPI

# Concurrency & Rate Limiting
JUDGE_QUEUE_CONCURRENCY=5         # Maximum parallel submissions sent to judge
JUDGE_SUBMISSION_RATE_LIMIT_SEC=5 # Minimum delay between submissions per user
```

When deploying the judge in production on AWS / GCP:
1. Deploy Judge0 CE using Docker Compose with `cgroup v2` on an Ubuntu 22.04 LTS instance with `nsjail` enabled.
2. Place the Judge0 instance in a private VPC subnet accessible only to the Express backend security group.
3. Restrict outbound egress traffic completely from execution containers using iptables rules.
