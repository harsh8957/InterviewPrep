# Judge Infrastructure & Production Deployment Guide

## 1. Overview & Architecture Boundary

InterviewPrep evaluates untrusted user-submitted source code in 5 programming languages (Python 3, JavaScript, TypeScript, C++ 20, Java 21).

### Critical Security Principles
1. **Never execute untrusted code in Node.js or Python backend processes:** Backend Express and FastAPI processes must never call `child_process.exec`, `subprocess.Popen`, or native eval on submitted code.
2. **Never expose the host Docker daemon socket (`/var/run/docker.sock`) to web applications:** Exposing the Docker socket allows complete root container breakout to the host system.
3. **Dedicated Judge Host:** Code execution is strictly delegated to Judge0 CE running in an isolated execution sandbox.

---

## 2. Environment Comparison: Windows Dev vs. Linux Production

| Dimension | Windows Development Machine | Hardened Linux Production Host |
| :--- | :--- | :--- |
| **Execution Mechanism** | Hosted Judge0 CE API (`judge0-ce.p.rapidapi.com`) | Self-Hosted Judge0 CE or Managed Enterprise Judge0 |
| **Sandboxing Engine** | Managed by cloud provider sandbox | Linux Kernel namespaces + `cgroups v2` + `isolate` |
| **Network Isolation** | Outbound requests blocked at provider boundary | Network namespace with `--network none` (no internet access) |
| **Local Resource Impact** | Zero local container overhead on Windows dev workstation | Dedicated 4-8 vCPU instance with memory limits |
| **File System Boundary** | Sandboxed ephemeral tmpfs | Ephemeral tmpfs mounts with no host filesystem access |
| **Privileges** | Unprivileged unauthenticated client | Unprivileged `judge` user (UID 1001), `no-new-privileges` |

> [!IMPORTANT]
> Running self-hosted Judge0 on Windows (Docker Desktop / WSL2) creates severe concurrency bottlenecks, unstable file locking on mounts, and privilege mismatches. Windows development must always use the hosted provider configuration (`rapidapi_judge0`). Linux host is mandatory for self-hosted production deployment.

---

## 3. Production Linux Deployment Instructions (Self-Hosted Judge0)

For organizations hosting their own execution cluster on Ubuntu 22.04 / 24.04 LTS:

### Step 3.1: Host Hardening
1. Ensure `cgroups v2` is active on the Linux host:
   ```bash
   grep cgroup /proc/filesystems
   ```
2. Enable swap accounting in GRUB:
   Edit `/etc/default/grub` and add:
   ```
   GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1"
   ```
   Run `sudo update-grub` and reboot.

### Step 3.2: Deploy Judge0 CE Stack
Create `/opt/judge0/docker-compose.yml`:
```yaml
services:
  server:
    image: judge0/judge0:1.13.1
    restart: always
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=judge0
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=replace_with_strong_password
    depends_on:
      - db
      - redis
    ports:
      - "127.0.0.1:2358:2358" # Bound strictly to localhost; never expose to 0.0.0.0

  workers:
    image: judge0/judge0:1.13.1
    restart: always
    privileged: true # Required strictly for Linux isolate cgroup namespace management
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=judge0
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=replace_with_strong_password
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=judge0
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=replace_with_strong_password
    volumes:
      - judge0-postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - judge0-redis-data:/data

volumes:
  judge0-postgres-data:
  judge0-redis-data:
```

### Step 3.3: Execution Quotas Enforced
- **CPU Time Limit:** Default 2.0 seconds (`cpu_time_limit: 2.0`). Hard timeout: 5.0 seconds.
- **Memory Limit:** Default 256 MB (`memory_limit: 262144`). Maximum 512 MB.
- **File Output Limit:** 1024 KB to prevent disk-fill denial of service.
- **Process / Thread Limit:** Max 30 processes (prevents fork bombs).
- **Network:** `--network none` prohibits socket connections or outbound data exfiltration.

---

## 4. Database Backup and Restore Procedures

### 4.1 Automated Daily Backup (MongoDB)
Run via cron on the database server:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Perform backup with gzip compression
docker exec interviewprep-mongo mongodump --db echoprep_prod --gzip --archive > "$BACKUP_DIR/echoprep_${TIMESTAMP}.archive.gz"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "echoprep_*.archive.gz" -mtime +14 -delete
```

### 4.2 Database Restore
To restore from an archive backup:
```bash
# Clean restore into production database
docker exec -i interviewprep-mongo mongorestore --db echoprep_prod --gzip --archive --drop < "/var/backups/mongodb/echoprep_20261114_000000.archive.gz"
```
