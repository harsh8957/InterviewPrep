import 'dotenv/config';
import mongoose from 'mongoose';
import { CoreCSQuizItem } from '../lib/models/CoreCSQuizItem';
import { SystemDesignCase } from '../lib/models/SystemDesignCase';
import { BehavioralQuestion } from '../lib/models/BehavioralPrep';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep';

export const CORE_CS_QUIZ_SEED = [
  // ==========================================
  // OPERATING SYSTEMS (OS)
  // ==========================================
  {
    subject: 'os',
    topic: 'Process vs Thread Lifecycle',
    slug: 'os-process-vs-thread-context-switch',
    title: 'Process vs Thread Context Switching Mechanics',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'Processes have isolated virtual memory spaces managed via separate Page Directories and Process Control Blocks (PCB). Switching processes requires flushing or invalidating the CPU Translation Lookaside Buffer (TLB), incurring substantial cache misses. Threads share the same address space, heap, open file descriptors, and global variables within a process, maintaining only private program counters, registers, and stacks (Thread Control Block - TCB). Consequently, thread context switching does not require TLB flushes and is significantly cheaper.',
    prompt:
      'Why is context switching between two threads in the same process measurably faster than context switching between two distinct processes?',
    options: [
      'Threads do not use hardware CPU registers, so register save and restore is skipped.',
      'Threads share the same virtual address space, avoiding Translation Lookaside Buffer (TLB) invalidation and page table swaps.',
      'Threads run in kernel mode by default without requiring CPU privilege transitions.',
      'Operating systems execute all threads on a single core without hardware preemption.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Because threads share the same page table and virtual address space, the MMU does not need to reload CR3 / switch page tables, preserving warm TLB entries. Switching distinct processes forces a page directory reload and flushes non-global TLB entries, causing subsequent memory accesses to incur costly page table walks.',
    keyTakeaway:
      'Thread context switches preserve the virtual memory mapping and TLB cache, whereas process switches incur page table reloads and cache coldness.',
    interviewTips:
      'Mention ASID (Address Space Identifier) tagged TLBs in modern CPUs (like ARM and Intel PCID) which mitigate some process-switch penalty, demonstrating senior systems knowledge.',
    order: 1,
    isPublished: true,
  },
  {
    subject: 'os',
    topic: 'Process vs Thread Lifecycle',
    slug: 'os-scenario-native-thread-exhaustion',
    title: 'Scenario: JVM OutOfMemoryError Unable to Create New Native Thread',
    format: 'scenario',
    difficulty: 'hard',
    conceptExplanation:
      'Every OS thread allocated by a runtime (e.g. JVM, Go OS threads) requires a reserved kernel stack (typically 512KB to 1MB) and consumes a process file descriptor / task struct entry within OS limits (`max user processes` / `ulimit -u` and `sys.kernel.pid_max`). An OutOfMemoryError stating "unable to create new native thread" indicates the OS refused to allocate another kernel thread due to OS PID limits or virtual address space exhaustion, not JVM heap exhaustion.',
    prompt:
      'A high-throughput backend service starts throwing "java.lang.OutOfMemoryError: unable to create new native thread". Your monitoring confirms JVM heap utilization is only at 35%. Which investigation step addresses the root cause?',
    options: [
      'Increase the maximum heap size via `-Xmx` to grant more memory for thread instances.',
      'Inspect OS limits (`ulimit -u`), thread leaks in unbounded thread pools, and decrease thread stack size (`-Xss`).',
      'Trigger explicit `System.gc()` calls before every new thread instantiation.',
      'Switch the garbage collector from G1GC to SerialGC to free up background threads.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Thread stacks live in off-heap virtual memory allocated via `pthread_create()`. Increasing `-Xmx` actually worsens the problem by stealing virtual memory space from off-heap thread stacks. The proper remedy is checking `ulimit -u`, adopting bounded thread pools (e.g. `Executors.newFixedThreadPool`), reducing `-Xss` (e.g. 512k), or migrating to lightweight user-space threads (Java Virtual Threads / Project Loom).',
    keyTakeaway:
      'Native thread creation failures are caused by OS task limits (`ulimit -u`) or off-heap virtual memory exhaustion, never heap memory shortages.',
    interviewTips:
      'Explain that increasing `-Xmx` makes native thread allocation worse because the JVM reserves virtual memory for the heap that native thread stacks can no longer claim.',
    order: 2,
    isPublished: true,
  },
  {
    subject: 'os',
    topic: 'Process vs Thread Lifecycle',
    slug: 'os-flashcard-pcb-components',
    title: 'Flashcard: Process Control Block (PCB)',
    format: 'flashcard',
    difficulty: 'easy',
    conceptExplanation:
      'The Process Control Block (PCB) is the primary data structure in the operating system kernel representing a process state.',
    prompt: 'What core data fields are stored inside an OS Process Control Block (PCB)?',
    options: [],
    correctAnswerIndex: 0,
    explanation:
      'The PCB contains: 1) Process ID (PID), 2) Process State (Running, Ready, Blocked), 3) Program Counter (PC) & CPU Registers, 4) CPU Scheduling info (priority, queue pointers), 5) Memory Management info (page tables, base/limit registers), 6) Accounting info (CPU time used), and 7) I/O status info (list of open file descriptors).',
    flashcardBack:
      '1. PID & Process State\n2. Program Counter (PC) & CPU Registers\n3. Memory Management Pointers (Page Tables / CR3)\n4. Open File Descriptor Table\n5. Scheduling Priority & CPU Accounting',
    keyTakeaway: 'The PCB encapsulates all hardware and software state needed to pause and resume a process cleanly.',
    order: 3,
    isPublished: true,
  },
  {
    subject: 'os',
    topic: 'Virtual Memory & Paging',
    slug: 'os-page-fault-handling-sequence',
    title: 'Page Fault Handling Sequence',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'When a thread references a virtual memory address whose page table entry has the valid/present bit set to 0, the MMU generates a hardware page fault interrupt (Trap 14 on x86). The CPU transitions to kernel mode, the OS checks if the reference was a valid memory access, locates a free physical frame (or evicts one via replacement algorithms), schedules an asynchronous disk I/O to read the page into RAM, updates the page table entry present bit, and restarts the faulting CPU instruction.',
    prompt:
      'During a page fault, when the operating system fetches the missing page from backing disk storage, what does the CPU do while waiting for the disk I/O to complete?',
    options: [
      'The CPU executes busy-wait spinlocks until the disk hardware controller interrupts.',
      'The kernel changes the faulting process state to Blocked/Waiting and schedules another Ready process to run.',
      'The CPU executes the next instruction in the faulting program speculatively.',
      'The memory controller re-executes the page table walk in hardware loop mode.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Disk access is roughly 100,000 times slower than RAM. The OS context switches the faulting process into a blocked state (waiting on I/O) and assigns the CPU core to another ready process in the runqueue. When disk transfer finishes, a hardware interrupt transitions the process back to the Ready queue.',
    keyTakeaway:
      'Page faults are blocking I/O operations; the OS preempts the faulting thread to maximize CPU core utilization.',
    interviewTips:
      'Highlight the difference between a major page fault (requires disk access) and a minor page fault (page is already in memory, e.g. shared library or reclaimed frame, but not mapped in process page table).',
    order: 4,
    isPublished: true,
  },
  {
    subject: 'os',
    topic: 'Deadlock Detection & Prevention',
    slug: 'os-deadlock-coffman-circular-wait',
    title: 'Coffman Conditions & Lock Ordering',
    format: 'scenario',
    difficulty: 'medium',
    conceptExplanation:
      'Deadlock requires all four Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Eliminating any single condition prevents deadlocks. The most practical engineering technique in software systems is eliminating Circular Wait by establishing a strict global lock hierarchy (ordering locks by ID).',
    prompt:
      'A banking backend deadlocks when Transfer(Account A, Account B) runs concurrently with Transfer(Account B, Account A). Both acquire the source lock first, then destination lock. How should this be fixed to guarantee deadlock freedom?',
    options: [
      'Add a random sleep duration before acquiring the second lock.',
      'Always acquire locks in a deterministic order based on account unique ID (e.g. acquire min(idA, idB) first).',
      'Disable multithreading and process all banking transactions sequentially on a single thread.',
      'Increase thread priority for whichever transfer initiated first.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'By sorting account locks deterministically (e.g. `lock(min(from.id, to.id))` followed by `lock(max(from.id, to.id))`), both concurrent transactions will attempt to acquire the lock for Account A first. One wins, and the other blocks before holding any resource that the first transaction needs, breaking the Circular Wait condition.',
    keyTakeaway:
      'Enforcing a global deterministic lock acquisition order breaks the Circular Wait condition and mathematically guarantees deadlock freedom.',
    interviewTips:
      'Cite Dijkstra’s Dining Philosophers solution where one philosopher picks up forks in reverse order to illustrate the exact same principle.',
    order: 5,
    isPublished: true,
  },

  // ==========================================
  // DATABASE MANAGEMENT SYSTEMS (DBMS)
  // ==========================================
  {
    subject: 'dbms',
    topic: 'ACID Properties & Isolation Levels',
    slug: 'dbms-isolation-levels-anomalies',
    title: 'ANSI SQL Isolation Levels & Concurrency Anomalies',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'The ANSI SQL isolation levels define trade-offs between concurrency and safety: Read Uncommitted (allows dirty reads), Read Committed (prevents dirty reads via short-term read locks or MVCC snapshots at statement level), Repeatable Read (prevents non-repeatable reads by keeping transaction snapshot), and Serializable (prevents phantom reads and write skew using two-phase locking 2PL or serializable snapshot isolation SSI).',
    prompt:
      'Which concurrency anomaly is prevented by REPEATABLE READ that is permitted under READ COMMITTED?',
    options: [
      'Dirty Read: Reading uncommitted changes from another transaction.',
      'Non-Repeatable Read: Reading a row, having another transaction commit an update to it, and re-reading different values in the same transaction.',
      'Write Skew: Concurrent transactions satisfying conflicting business constraints based on overlapping reads.',
      'Lost Update: Two transactions writing to the exact same column concurrently.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Under READ COMMITTED, each query receives a fresh snapshot of committed data; hence, reading row X twice can yield different data if another transaction committed an update between queries. REPEATABLE READ locks the transaction snapshot to the start of the transaction, ensuring re-reading row X yields identical values.',
    keyTakeaway:
      'REPEATABLE READ guarantees that any row read during a transaction will not change on subsequent reads within that same transaction.',
    interviewTips:
      'Be prepared to explain how PostgreSQL implements Repeatable Read using MVCC snapshots and why Write Skew can still happen under Snapshot Isolation unless explicit row locks (`FOR UPDATE`) are used.',
    order: 1,
    isPublished: true,
  },
  {
    subject: 'dbms',
    topic: 'ACID Properties & Isolation Levels',
    slug: 'dbms-scenario-write-skew-prevention',
    title: 'Scenario: Doctor On-Call Write Skew Anomaly',
    format: 'scenario',
    difficulty: 'hard',
    conceptExplanation:
      'Write Skew occurs under Snapshot Isolation when two concurrent transactions read overlapping data sets, determine that a business rule holds (e.g., "at least one doctor must remain on call"), and then update disjoint rows (Doctor A goes off call; Doctor B goes off call simultaneously). Both transactions commit successfully under standard Snapshot Isolation because neither updated the other’s row, leaving zero doctors on call.',
    prompt:
      'Two doctors simultaneously request leave in a hospital database. The rule requires at least one doctor on duty. Under standard PostgreSQL Snapshot Isolation, both requests succeed and 0 doctors remain on duty. How do you prevent this Write Skew anomaly?',
    options: [
      'Change the column data type from VARCHAR to TEXT.',
      'Use `SELECT ... FOR UPDATE` or set the transaction isolation level to `SERIALIZABLE`.',
      'Wrap each query in an unindexed stored procedure.',
      'Switch the primary key from integer to UUIDv4.',
    ],
    correctAnswerIndex: 1,
    explanation:
      '`SELECT ... FOR UPDATE` acquires row-level locks on the evaluated roster rows, forcing the second transaction to wait until the first commits. Alternatively, PostgreSQL `SERIALIZABLE` uses Serializable Snapshot Isolation (SSI) with SIREAD lock tracking, automatically aborting one transaction with a serialization failure (`40001`).',
    keyTakeaway:
      'Write skew happens when transactions make decisions on shared state but write to disjoint records; solve with `FOR UPDATE` locks or `SERIALIZABLE` isolation.',
    order: 2,
    isPublished: true,
  },
  {
    subject: 'dbms',
    topic: 'B-Trees & Indexing Mechanics',
    slug: 'dbms-btree-fanout-vs-bst',
    title: 'B+ Tree Index Fanout & Disk I/O',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'B+ Trees are multi-way search trees optimized for block storage. Unlike Binary Search Trees (fanout = 2), a B+ Tree node matches the disk block size (e.g. 4KB to 16KB), giving it a high fanout (e.g., 100 to 1,000 pointers per node). With high fanout, a tree of depth 3 can index 1 billion records, requiring only 3 disk seeks to locate any record.',
    prompt:
      'Why do relational databases like PostgreSQL and MySQL InnoDB use B+ Trees instead of balanced Binary Search Trees (AVL / Red-Black) for table indexes?',
    options: [
      'Binary Search Trees cannot store string data types.',
      'B+ Trees have a high fanout matching disk block size, minimizing the number of disk I/O seeks needed to find a row.',
      'Binary Search Trees require O(N) memory while B+ Trees require O(1) memory.',
      'B+ Trees do not require rebalancing during insertions.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Disk seeks are the primary bottleneck in databases. A balanced BST indexing 10 million rows requires ~24 pointer hops (24 disk reads). A B+ Tree with fanout 100 requires only 3 to 4 levels, meaning only 3 to 4 disk reads. Furthermore, all leaf nodes in a B+ Tree are linked in a doubly linked list, enabling fast range scans.',
    keyTakeaway:
      'High fanout minimizes tree depth, translating directly to fewer disk block reads for lookups and fast sequential range scans along leaf pointers.',
    interviewTips:
      'Point out the two critical differences of B+ Tree vs B-Tree: B+ Trees store all actual record pointers in leaf nodes (increasing internal node fanout) and link leaf nodes sequentially.',
    order: 3,
    isPublished: true,
  },
  {
    subject: 'dbms',
    topic: 'B-Trees & Indexing Mechanics',
    slug: 'dbms-composite-index-leftmost-prefix',
    title: 'Flashcard: Composite Index Leftmost Prefix Rule',
    format: 'flashcard',
    difficulty: 'easy',
    conceptExplanation:
      'A composite index on columns `(A, B, C)` is sorted primarily by `A`, then by `B`, then by `C`.',
    prompt:
      'What is the Leftmost Prefix Rule in composite indexes, and will an index on `(status, created_at)` be used for `WHERE created_at > NOW()`?',
    options: [],
    correctAnswerIndex: 0,
    explanation:
      'The Leftmost Prefix rule states that the database can only use a composite index if the query filters include the leading (leftmost) column of the index. For an index on `(status, created_at)`, a query filtering only by `created_at` CANNOT use the index efficiently because the rows are sorted primarily by `status`.',
    flashcardBack:
      'Leftmost Prefix Rule:\nQueries must filter by the leftmost index column to leverage the tree ordering.\n\nQuery `WHERE created_at > NOW()` on index `(status, created_at)` will NOT use index seek because records are ordered by status first. It requires an index starting with `created_at`.',
    keyTakeaway:
      'Always order composite index columns based on equality filter columns first, followed by range filter columns.',
    order: 4,
    isPublished: true,
  },

  // ==========================================
  // COMPUTER NETWORKS (CN)
  // ==========================================
  {
    subject: 'cn',
    topic: 'OSI Model vs TCP/IP Protocol Stack',
    slug: 'cn-transport-vs-network-layer',
    title: 'Transport Layer vs Network Layer Demarcation',
    format: 'mcq',
    difficulty: 'easy',
    conceptExplanation:
      'The Network Layer (IP) is responsible for host-to-host packet delivery across internetworks using logical IP addresses. The Transport Layer (TCP/UDP) is responsible for process-to-process communication between specific applications running on those hosts, multiplexing and demultiplexing data via port numbers.',
    prompt:
      'What is the fundamental functional distinction between the Network Layer (Layer 3) and the Transport Layer (Layer 4)?',
    options: [
      'The Network layer encrypts data while the Transport layer compresses data.',
      'The Network layer handles host-to-host communication; the Transport layer handles process-to-process communication using ports.',
      'The Transport layer manages physical cables while the Network layer manages MAC addresses.',
      'The Network layer guarantees delivery; the Transport layer only provides best-effort routing.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'IP routes packets from Machine A to Machine B. Once the packet arrives at Machine B, Layer 4 (TCP/UDP) inspects the destination port number to deliver the payload to the specific running process (e.g. port 443 for web server, port 5432 for Postgres).',
    keyTakeaway: 'Layer 3 connects hosts (IP address); Layer 4 connects applications/processes (Port number).',
    order: 1,
    isPublished: true,
  },
  {
    subject: 'cn',
    topic: 'TCP 3-Way Handshake & Congestion Control',
    slug: 'cn-tcp-time-wait-state-purpose',
    title: 'TCP TIME_WAIT State Purpose',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'During TCP connection teardown, the party that initiates active close (sends the first FIN) enters the TIME_WAIT state after sending the final ACK. It remains in TIME_WAIT for 2 * MSL (Maximum Segment Lifetime, usually 1 to 2 minutes) before fully releasing the socket resources.',
    prompt:
      'Why does the active closing endpoint of a TCP connection spend 2*MSL in the TIME_WAIT state instead of immediately closing?',
    options: [
      'To allow the operating system time to flush memory to permanent swap storage.',
      'To ensure the final ACK was received by the remote peer and prevent delayed duplicate packets from corrupting future connections.',
      'To renegotiate encryption cipher suites before the connection terminates.',
      'To wait for the client browser window to close completely.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'If the final ACK is dropped in transit, the remote peer will retransmit its FIN. The active closer must stay in TIME_WAIT to resend the ACK. Additionally, waiting 2*MSL ensures all wandering packets from the old connection expire in internet routers before a new connection reuses the same IP:Port tuple.',
    keyTakeaway:
      'TIME_WAIT guarantees graceful connection termination and prevents delayed packets from ghosting into new connections.',
    interviewTips:
      'In high-throughput microservices, explain how thousands of sockets stuck in TIME_WAIT can cause ephemeral port exhaustion, and how `SO_REUSEADDR` or persistent HTTP connection pools solve it.',
    order: 2,
    isPublished: true,
  },
  {
    subject: 'cn',
    topic: 'HTTPS / TLS 1.3 Cryptographic Handshake',
    slug: 'cn-forward-secrecy-ephemeral-diffie-hellman',
    title: 'Forward Secrecy & Ephemeral Diffie-Hellman',
    format: 'scenario',
    difficulty: 'hard',
    conceptExplanation:
      'Forward Secrecy (PFS) ensures that compromise of a server’s long-term private key does not compromise past encrypted session traffic. It achieves this by using Ephemeral Diffie-Hellman (ECDHE) to generate temporary session keys for each connection. Even if an adversary records encrypted internet traffic for years and later steals the server’s RSA private key, they cannot compute the ephemeral session keys.',
    prompt:
      'A regulatory audit requires your API to guarantee Forward Secrecy (PFS) for all client traffic. Which cryptographic design satisfies this requirement?',
    options: [
      'Encrypt the symmetric session key directly with the static server RSA private key.',
      'Use Ephemeral Diffie-Hellman key exchange (ECDHE) where session keys are discarded immediately after connection teardown.',
      'Store all past symmetric keys in an encrypted hardware HSM module.',
      'Switch the protocol from HTTPS to unencrypted HTTP over a private VPN tunnel.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'With static RSA key exchange (TLS 1.2 and older), the client encrypts the pre-master secret with the server public key. If the private key is ever exposed, all historical recorded sessions can be decrypted. TLS 1.3 mandates Ephemeral Diffie-Hellman (ECDHE), guaranteeing Forward Secrecy because session keys are ephemeral and discarded.',
    keyTakeaway:
      'Forward Secrecy decouples past session security from long-term private key storage by generating ephemeral key pairs per connection.',
    order: 3,
    isPublished: true,
  },

  // ==========================================
  // OBJECT-ORIENTED PROGRAMMING (OOP)
  // ==========================================
  {
    subject: 'oop',
    topic: 'SOLID Design Principles',
    slug: 'oop-liskov-substitution-violation',
    title: 'Liskov Substitution Principle (LSP) Classic Violation',
    format: 'mcq',
    difficulty: 'medium',
    conceptExplanation:
      'The Liskov Substitution Principle (LSP) states that objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program. A classic violation occurs when a Square class inherits from a Rectangle class and overrides `setWidth` to update both width and height to maintain squareness, violating the caller expectation that changing width leaves height unchanged.',
    prompt:
      'Why is deriving a `Square` class from a `Rectangle` class considered a classic violation of the Liskov Substitution Principle (LSP)?',
    options: [
      'A Square has 4 equal sides while a Rectangle has only 2 equal sides.',
      'Functions that manipulate a Rectangle reference and alter width assume height remains invariant; Square breaks this invariant.',
      'Subclasses are forbidden from overriding setter methods defined on superclasses in OOP.',
      'Square requires more memory than Rectangle because it has stricter geometric constraints.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'If code accepts `Rectangle r` and calls `r.setWidth(5); r.setHeight(4); assert(r.area() == 20)`, passing an instance of `Square` causes `area()` to return 16 because setting height altered width. The subclass altered expected behavioral invariants of the superclass.',
    keyTakeaway:
      'Subtypes must preserve the behavioral contracts and invariants of their base types, not just signature compatibility.',
    order: 1,
    isPublished: true,
  },
  {
    subject: 'oop',
    topic: 'SOLID Design Principles',
    slug: 'oop-scenario-open-closed-strategy-refactoring',
    title: 'Scenario: Open/Closed Principle & Strategy Pattern',
    format: 'scenario',
    difficulty: 'medium',
    conceptExplanation:
      'The Open/Closed Principle (OCP) states that software entities should be open for extension, but closed for modification. Code with giant `switch` or `if/else` ladders checking payment type (CreditCard, PayPal, Crypto) violates OCP because adding ApplePay requires editing and risking regressions in existing tested code.',
    prompt:
      'A PaymentService has a 200-line method with `if (type == "STRIPE") ... else if (type == "PAYPAL") ...`. Every new gateway requires altering this class. How do you refactor this to comply with the Open/Closed Principle?',
    options: [
      'Combine all gateway logic into a single private native C++ function.',
      'Define a `PaymentStrategy` interface and inject a registry/factory of strategy implementations.',
      'Use inheritance so Stripe inherits from PayPal and overrides checkout.',
      'Increase unit test coverage to 100% and keep the `if/else` blocks.',
    ],
    correctAnswerIndex: 1,
    explanation:
      'By introducing a `PaymentStrategy` interface with method `processPayment(PaymentRequest)`, each payment provider becomes an independent class. Adding ApplePay simply requires writing a new `ApplePayStrategy` class and registering it in a map, without modifying or retesting existing Stripe or PayPal code.',
    keyTakeaway:
      'Use polymorphism and the Strategy Pattern to make modules open for new behaviors without modifying existing classes.',
    order: 2,
    isPublished: true,
  },
  {
    subject: 'oop',
    topic: 'Composition Over Inheritance',
    slug: 'oop-composition-vs-inheritance-fragile-base',
    title: 'Flashcard: Fragile Base Class Problem',
    format: 'flashcard',
    difficulty: 'easy',
    conceptExplanation:
      'The Fragile Base Class problem occurs when innocent modifications to a base class unintentionally break the functionality or invariants of derived classes due to tight coupling.',
    prompt:
      'What is the "Fragile Base Class" problem, and how does Composition Over Inheritance prevent it?',
    options: [],
    correctAnswerIndex: 0,
    explanation:
      'In deep inheritance hierarchies, derived classes depend on implementation details of base class methods (e.g. `add()` calling `addAll()`). If the base class is changed, subclasses override or double-count behaviors unpredictably. Composition avoids this by holding a reference to the collaborator through an interface and delegating calls explicitly, eliminating hidden coupling.',
    flashcardBack:
      'Fragile Base Class Problem:\nChanges to superclass internal implementation break subclass behavior without any compiler errors.\n\nSolution (Composition):\nInstead of `class CustomList extends ArrayList`, use `class CustomList { private List innerList; }`. Encapsulates internal behavior and controls explicit delegation.',
    keyTakeaway:
      'Favor object composition ("has-a") over class inheritance ("is-a") for flexible, loosely coupled codebases.',
    order: 3,
    isPublished: true,
  },
];

export const SYSTEM_DESIGN_SEED = [
  {
    slug: 'distributed-rate-limiter',
    title: 'Distributed API Rate Limiter',
    type: 'hld',
    difficulty: 'medium',
    scale: '100K QPS, <5ms P99 Latency SLA, 500M Daily Requests',
    summary:
      'Design a distributed, highly available rate limiting service to protect backend microservices from denial of service (DoS), brute-force attacks, and abusive web scrapers across multiple data centers.',
    functionalRequirements: [
      'Rate limit requests based on client IP, authenticated User ID, or API Key.',
      'Return HTTP 429 Too Many Requests with informative Retry-After headers when quota is exhausted.',
      'Support configurable tier limits (e.g., Free Tier: 60 req/min; Pro Tier: 10,000 req/min).',
      'Provide an admin interface to dynamically adjust rules without service redeployments.',
    ],
    nonFunctionalRequirements: [
      'Ultra-low latency: Rate limiting evaluation must complete in < 5ms to avoid degrading API response times.',
      'High availability: If the rate limiter cluster fails, fail-open or degrade gracefully rather than blocking all traffic.',
      'Distributed accuracy: Must accurately enforce global limits across multiple application servers without race conditions.',
      'Horizontal scalability: Must scale smoothly from 10K to 500K QPS.',
    ],
    capacityEstimation: {
      rps: '100,000 requests per second at peak.',
      storage:
        '50M daily active users * 128 bytes per tracking key = ~6.4 GB RAM for Redis tracking counters.',
      bandwidth:
        '100K QPS * 500 bytes per metadata payload = ~50 MB/sec internal network throughput.',
      memory: 'Under 16 GB Redis cluster RAM sufficient to hold 24-hour rolling windows.',
      notes:
        'Memory footprint is remarkably small; the primary architectural challenge is minimizing network round-trip time (RTT) between API Gateway and Redis.',
    },
    apiDesign: [
      {
        endpoint: '/api/v1/check-rate-limit',
        method: 'POST',
        description: 'Internal endpoint called by API Gateway middleware to check allowance.',
        requestBody: '{"key": "user:12345", "tier": "PRO", "cost": 1}',
        responseBody: '{"allowed": true, "remaining": 9999, "resetAt": 1794599900}',
      },
    ],
    dataModels: [
      {
        entity: 'RateLimitRule',
        fields: ['ruleId', 'entityType (IP/User/Key)', 'maxTokens', 'refillRatePerSec', 'windowSeconds'],
        storageType: 'PostgreSQL (Persistent) + Redis Hash (Cached)',
        notes: 'Cached in API Gateway memory for zero-latency rule lookups.',
      },
      {
        entity: 'TokenBucketCounter',
        fields: ['key', 'tokensRemaining', 'lastRefillTimestamp'],
        storageType: 'Redis Hash or Sorted Set',
        notes: 'Updated atomically via Redis Lua scripts to eliminate race conditions.',
      },
    ],
    architecturePillars: [
      'API Gateway Middleware Integration',
      'Atomic Redis Lua Scripting for Token Bucket',
      'Sliding Window Counter with Multi-AZ Replication',
      'Fail-Open Graceful Degradation',
    ],
    mermaidDiagram: `flowchart TD
  Client[API Clients & Mobile Apps] -->|HTTPS Request| LB[AWS ALB / Cloudflare Anycast]
  LB --> Gateway[API Gateway Cluster]

  subgraph RateLimitingTier["Rate Limiting Tier (< 3ms)"]
    Gateway -->|1. Atomic Token Check| RedisMaster[(Redis Sentinel / Cluster)]
    RedisMaster -->|Lua Script Return (Allowed / Denied)| Gateway
    RuleCache[(Local Gateway LRU Cache)] -.->|Rules| Gateway
  end

  Gateway -->|2a. If Exceeded: HTTP 429| Client
  Gateway -->|2b. If Allowed: Route Request| CoreServices[Core Microservices]

  CoreServices --> DB[(Database Tier)]`,
    tradeoffs: [
      {
        decision: 'Token Bucket vs Sliding Window Log',
        pros: ['Token bucket uses constant O(1) memory per user key (only 2 numbers: tokens and timestamp).'],
        cons: ['Allows bursts up to bucket capacity within short intervals.'],
        rationale:
          'Sliding Window Log requires storing a timestamp for every single request, requiring gigabytes of memory under high QPS. Token Bucket provides optimal O(1) space and time complexity.',
      },
      {
        decision: 'Centralized Redis vs Local In-Memory Counters',
        pros: ['Redis provides unified global rate enforcement across 50 API Gateway instances.'],
        cons: ['Incurs a 1-2ms network round-trip per request.'],
        rationale:
          'Local memory counters permit clients to bypass limits by spraying requests across different gateway servers. Centralized Redis with atomic Lua scripts guarantees global consistency.',
      },
    ],
    deepDives: [
      {
        topic: 'Concurrency & Race Conditions in Redis',
        content:
          'A naive `GET tokens` followed by `SET tokens (tokens - 1)` causes race conditions when 10 requests hit simultaneously. Solution: Execute a Lua script on Redis, which runs single-threaded and atomically performs time calculation, refill, deduction, and TTL refresh in one round-trip.',
      },
      {
        topic: 'Fail-Open vs Fail-Closed Strategy',
        content:
          'If the Redis cluster is partitioned or goes down, should you drop all user requests (fail-closed) or allow them through (fail-open)? For typical SaaS APIs, fail-open is selected with circuit breakers to preserve business uptime, while logging alerts to security monitors.',
      },
    ],
    evaluationRubric: {
      requirements: 'Identified IP vs User ID throttling and 429 response structure.',
      dataModel: 'Calculated memory requirements for counter keys and selected appropriate Redis data types.',
      architecture: 'Placed rate limiter at API Gateway tier before reaching downstream microservices.',
      scalability: 'Addressed multi-gateway coordination and Redis cluster sharding by key hash.',
      availability: 'Documented fail-open circuit breaker strategy in case Redis becomes unreachable.',
      reliability: 'Used atomic Redis Lua scripts to eliminate check-then-set race conditions.',
      security: 'Protected against distributed IP spoofing using verified client tokens or X-Forwarded-For validation.',
      tradeoffs: 'Articulated Token Bucket vs Sliding Window Log memory and burstiness trade-offs.',
    },
    order: 1,
    isPublished: true,
  },
  {
    slug: 'url-shortener-tinyurl',
    title: 'URL Shortener (TinyURL / Bitly)',
    type: 'hld',
    difficulty: 'easy',
    scale: '100M URLs created/year, 100:1 Read-to-Write Ratio, 10B Redirects/month',
    summary:
      'Design a globally distributed URL shortening service capable of encoding long URLs into 7-character aliases, redirecting users in under 10ms, and capturing analytics.',
    functionalRequirements: [
      'Given a long URL, generate a unique 7-character short URL (e.g. https://iprep.io/xY7z9a).',
      'Redirect short URL visitors to original URL with HTTP 301 Permanent or 302 Found.',
      'Allow custom alias creation (if available).',
      'URLs expire after an optional configurable lifetime (default: 5 years).',
    ],
    nonFunctionalRequirements: [
      'High Read Performance: Redirection must complete with P99 latency < 15ms.',
      'High Availability: System cannot go down; redirection links must always work.',
      'Zero collision rate: Two distinct long URLs must never generate the identical short code.',
    ],
    capacityEstimation: {
      rps: 'Write: ~30 URLs/sec. Read: ~3,000 redirects/sec (Peak: 10,000 QPS).',
      storage:
        '100M URLs * 500 bytes per record = 50 GB per year. 5 years = 250 GB total storage (easily handled by single replica set).',
      bandwidth: 'Read: 3,000 QPS * 500 bytes = 1.5 MB/sec. Very light network footprint.',
      memory: '80-20 Pareto Rule: Cache 20% of hot URLs. 20% of 10B monthly reads = ~5 GB Redis cache RAM.',
      notes: 'Extremely read-heavy system. Aggressive caching at CDN and Redis tiers absorbs 98% of database load.',
    },
    apiDesign: [
      {
        endpoint: '/api/v1/urls',
        method: 'POST',
        description: 'Create short URL alias.',
        requestBody: '{"longUrl": "https://example.com/very/long/path", "customAlias": "custom1"}',
        responseBody: '{"shortUrl": "https://iprep.io/custom1", "expiresAt": "2031-01-01T00:00:00Z"}',
      },
      {
        endpoint: '/:shortCode',
        method: 'GET',
        description: 'Redirect to original destination.',
        responseBody: 'HTTP 301 Redirect -> Location: https://example.com/very/long/path',
      },
    ],
    dataModels: [
      {
        entity: 'UrlMapping',
        fields: ['shortCode (PK)', 'longUrl', 'userId', 'createdAt', 'expiresAt', 'clickCount'],
        storageType: 'PostgreSQL or DynamoDB (Key-Value)',
        notes: 'Clustered index on shortCode for instant primary key lookup.',
      },
    ],
    architecturePillars: [
      'Base62 Encoding (62^7 = 3.5 Trillion combinations)',
      'Snowflake Distributed ID Generator / KGS Service',
      'Multi-Tier Caching (Cloudflare Edge CDN + Redis)',
      'HTTP 301 (Browser Cache) vs 302 (Analytics Tracking)',
    ],
    mermaidDiagram: `flowchart LR
  User[Global Users] -->|GET /shortCode| Edge[Cloudflare Edge CDN Cache]
  Edge -->|Cache Hit (301 Redirect)| User
  Edge -->|Cache Miss| LB[Application Load Balancer]
  LB --> Web[Redirection API Service]

  Web --> Redis[(Redis Cache - Hot URLs)]
  Redis -->|Hit| Web
  Redis -->|Miss| DB[(PostgreSQL / DynamoDB Primary)]

  Writer[URL Creation Service] --> KGS[Distributed Key Generator / Snowflake]
  Writer --> DB`,
    tradeoffs: [
      {
        decision: 'HTTP 301 Permanent vs HTTP 302 Temporary Redirect',
        pros: ['HTTP 301 caches the redirect in browser, eliminating server calls completely on subsequent clicks.'],
        cons: ['HTTP 301 prevents the server from counting click analytics on repeat visits.'],
        rationale:
          'If detailed click analytics are a core requirement, use HTTP 302 so every request reaches the server or CDN. If raw latency and minimum server cost are the priority, use HTTP 301.',
      },
      {
        decision: 'Hashing (MD5/SHA) vs Distributed Sequence (Snowflake/KGS)',
        pros: ['Pre-generating 64-bit integer IDs with Snowflake guarantees zero collisions.'],
        cons: ['Requires managing an ID generator service.'],
        rationale:
          'Hashing `MD5(longUrl)` produces a 128-bit string; truncating to 7 chars causes collisions that require expensive database re-checks. Generating auto-increment IDs and converting to Base62 mathematically guarantees uniqueness.',
      },
    ],
    deepDives: [
      {
        topic: 'Why Base62 and 7 Characters?',
        content:
          'Base62 uses [a-z, A-Z, 0-9]. 62^7 = 3,521,614,606,208 (3.5 Trillion) combinations. At 1,000 URLs created every single second, it would take over 110 years to exhaust 7-character combinations.',
      },
    ],
    evaluationRubric: {
      requirements: 'Shortening, redirection, custom alias, and expiration covered.',
      dataModel: 'Key-value schema mapped with shortCode as primary key.',
      architecture: 'Clean tier separation: CDN -> Load Balancer -> Web -> Redis -> DB.',
      scalability: 'Handled read-to-write ratio (100:1) with caching.',
      availability: 'Multi-AZ database replica set with read replicas.',
      reliability: 'Zero ID collision guarantee via Snowflake or sequence generator.',
      security: 'Rate limiting on creation and sanitizing destination URLs against phishing.',
      tradeoffs: 'Explained HTTP 301 vs 302 redirect browser caching tradeoff.',
    },
    order: 2,
    isPublished: true,
  },
  {
    slug: 'real-time-chat-engine',
    title: 'Real-Time Chat & Messaging Engine (WhatsApp / Slack)',
    type: 'hld',
    difficulty: 'hard',
    scale: '20M Concurrent Connected WebSockets, 500K Messages/sec Peak',
    summary:
      'Design a horizontally scalable, persistent real-time messaging system supporting 1-on-1 direct messaging, group channels, online presence, and message delivery receipts (sent, delivered, read).',
    functionalRequirements: [
      'Low-latency 1-on-1 and group messaging (< 100ms end-to-end delivery).',
      'Real-time online presence status (Online, Away, Offline, Last Seen).',
      'Message history persistence and search across devices.',
      'Delivery acknowledgments (Sent, Delivered, Read receipts).',
      'Offline push notifications when client connection drops.',
    ],
    nonFunctionalRequirements: [
      'High concurrency: Support 20 Million active persistent connections simultaneously.',
      'Message durability: Messages must never be lost once acknowledged.',
      'Strict message ordering per conversation.',
    ],
    capacityEstimation: {
      rps: '500,000 messages/second at peak.',
      storage: '500K msg/sec * 200 bytes = 100 MB/sec = ~8.6 TB of new chat history per day.',
      bandwidth: '100 MB/sec incoming + 200 MB/sec outgoing fanout = ~2.4 Gbps network bandwidth.',
      memory: '20M open WebSockets * 10KB socket buffer = ~200 GB RAM across connection gateways.',
      notes: 'Requires distributed NoSQL wide-column store (e.g. Apache Cassandra or ScyllaDB) for write-heavy chat history.',
    },
    apiDesign: [
      {
        endpoint: 'WSS /chat/v1/connect',
        method: 'GET (WebSocket Upgrade)',
        description: 'Persistent bi-directional WebSocket connection for message transport.',
      },
      {
        endpoint: '/api/v1/conversations/:id/messages',
        method: 'GET',
        description: 'Paginated historical message retrieval on app launch.',
      },
    ],
    dataModels: [
      {
        entity: 'ChatMessage',
        fields: ['conversationId (Partition Key)', 'messageId / TimeUUID (Clustering Key)', 'senderId', 'content', 'status'],
        storageType: 'Apache Cassandra / ScyllaDB',
        notes: 'Partitioning by conversationId groups all messages for a chat on the same node, ordered sequentially by TimeUUID.',
      },
    ],
    architecturePillars: [
      'Stateful WebSocket Connection Gateways',
      'Apache Kafka Message Queue for Decoupled Routing',
      'Redis Cluster for Active Connection Mapping (UserId -> GatewayId)',
      'Cassandra Wide-Column Store for Time-Series Message History',
    ],
    mermaidDiagram: `flowchart TD
  ClientA[User A (Sender)] -->|WebSocket| GW1[WebSocket Gateway 1]
  ClientB[User B (Receiver)] -->|WebSocket| GW2[WebSocket Gateway 2]

  GW1 -->|1. Publish Message| Kafka[Apache Kafka Message Bus]
  Kafka --> ChatWorker[Chat Ingestion Worker]

  ChatWorker -->|2. Persist| Cassandra[(Cassandra Message Store)]
  ChatWorker -->|3. Query Session| RedisSession[(Redis Session Store)]

  RedisSession -.->|User B on GW2| ChatWorker
  ChatWorker -->|4. Forward| GW2
  GW2 -->|5. Deliver WebSocket| ClientB`,
    tradeoffs: [
      {
        decision: 'Cassandra vs Relational DB (PostgreSQL) for Messages',
        pros: ['Cassandra provides sequential LSM-tree disk writes handling 500K writes/sec without locking.'],
        cons: ['Lacks complex multi-table JOINs and cross-partition transactions.'],
        rationale:
          'Chat messages are append-only time-series records accessed by conversationId. Cassandra wide-column partitions fit this access pattern with linear horizontal write scaling.',
      },
    ],
    deepDives: [
      {
        topic: 'How WebSocket Gateways Route to the Recipient',
        content:
          'When User A sends a message to User B: 1) Gateway 1 writes to Kafka. 2) Worker queries Redis: "Which Gateway holds User B’s open socket?" 3) Redis replies: "Gateway 2". 4) Worker routes message to Gateway 2 via internal RPC. 5) Gateway 2 pushes to User B’s socket.',
      },
    ],
    evaluationRubric: {
      requirements: 'Real-time delivery, presence, receipts, and offline push notifications addressed.',
      dataModel: 'Cassandra composite key: partition key (conversationId) + clustering key (messageId/timestamp).',
      architecture: 'Stateful WebSocket gateways separated from stateless worker services via Kafka.',
      scalability: 'Analyzed socket memory limits and horizontal gateway clustering.',
      availability: 'Graceful fallback to mobile APNs/FCM push notifications when user is offline.',
      reliability: 'End-to-end delivery acknowledgments preventing message loss.',
      security: 'TLS termination, mutual authentication, and channel membership validation.',
      tradeoffs: 'Justified Cassandra over RDBMS for high write volume.',
    },
    order: 3,
    isPublished: true,
  },
  {
    slug: 'ecommerce-flash-sale-checkout',
    title: 'E-Commerce Flash Sale & Distributed Inventory',
    type: 'hld',
    difficulty: 'hard',
    scale: '100,000 Checkout Requests/sec, 5,000 Limited Stock Items',
    summary:
      'Design a high-concurrency flash sale inventory reservation and order processing system that prevents overselling, handles massive checkout bursts, and ensures ACID consistency under extreme traffic.',
    functionalRequirements: [
      'Reserve stock atomically during checkout (prevent overselling under any circumstance).',
      'Hold inventory for 10 minutes while customer completes payment.',
      'Automatically release reserved inventory if payment times out.',
      'Ensure exactly-once payment processing (idempotency).',
    ],
    nonFunctionalRequirements: [
      'Zero Overselling: Even if 100,000 users click "Buy" at the same second, exactly 5,000 items are sold.',
      'High Peak Throughput: Protect relational order database from crashing under sudden 100x traffic spikes.',
      'Strict Idempotency: Duplicate clicks or network retries must never double-charge or double-reserve.',
    ],
    capacityEstimation: {
      rps: '100K checkout requests per second during the first 60 seconds.',
      storage: 'Relational database handles ~5,000 successful orders and 95,000 rejected order records.',
      bandwidth: 'Standard HTTP payload sizes (~2KB per order request) = 200 MB/sec network ingress.',
      memory: 'Redis inventory key requires mere kilobytes of RAM, but requires high network IOPS.',
      notes: 'The core challenge is write contention on a single row (the item inventory counter).',
    },
    apiDesign: [
      {
        endpoint: '/api/v1/checkout/reserve',
        method: 'POST',
        description: 'Reserve inventory slot with idempotency key.',
        requestBody: '{"itemId": "PROD-99", "quantity": 1, "idempotencyKey": "uuid-v4"}',
        responseBody: '{"reservationId": "res_888", "expiresAt": 1794600600}',
      },
    ],
    dataModels: [
      {
        entity: 'Inventory',
        fields: ['itemId (PK)', 'totalStock', 'reservedStock', 'version (Optimistic Lock)'],
        storageType: 'PostgreSQL Primary + Redis Pre-decremented Counter',
        notes: 'Pre-decremented in Redis to shield PostgreSQL from 100K QPS write lock contention.',
      },
    ],
    architecturePillars: [
      'Atomic Redis Pre-Decrementation (`DECR` / Lua Script)',
      'Asynchronous Checkout Queue (RabbitMQ / Kafka) to Level Traffic Load',
      'Distributed Saga Pattern for Multi-Step Payment Fulfillment',
      'Idempotency Key Verification at Gateway',
    ],
    mermaidDiagram: `flowchart TD
  Shoppers[100K Concurrent Shoppers] --> WAF[Cloudflare WAF / Anti-Bot]
  WAF --> LB[Load Balancer]
  LB --> Gateway[Order Gateway Cluster]

  subgraph InvalidationFilter["Stage 1: In-Memory Fast Path"]
    Gateway -->|1. Atomic Lua DECR| RedisStock[(Redis Atomic Stock: 5,000)]
  end

  RedisStock -->|Stock <= 0: Sold Out (Instant 409)| Gateway
  RedisStock -->|Stock > 0: Reserved| Queue[Checkout Asynchronous Queue]

  subgraph OrderFulfillment["Stage 2: Asynchronous Fulfillment"]
    Queue --> Worker[Order Processing Service]
    Worker --> Payment[Stripe / Payment Gateway]
    Worker --> DB[(PostgreSQL Order DB - ACID)]
  end`,
    tradeoffs: [
      {
        decision: 'Redis Atomic DECR vs Relational DB Row Lock (`SELECT FOR UPDATE`)',
        pros: ['Redis in-memory Lua script handles 100K operations/sec with zero lock contention.'],
        cons: ['Redis and PostgreSQL can fall out of sync if server crashes before queueing.'],
        rationale:
          'Executing `SELECT stock FROM items WHERE id = 1 FOR UPDATE` in PostgreSQL serializes all 100K transactions on a single disk row, bringing the database to an immediate halt. Redis fast-path shields the database.',
      },
    ],
    deepDives: [
      {
        topic: 'Handling Payment Expiration with Redis Keyspace Notifications',
        content:
          'When stock is reserved, a Redis key `reservation:{id}` is set with a 10-minute TTL. If payment webhook does not confirm the order within 10 minutes, Redis expiration triggers an event that worker listens to, automatically restoring `INCR stock` back to inventory.',
      },
    ],
    evaluationRubric: {
      requirements: 'Addressed atomic reservation, 10-minute hold window, and idempotency.',
      dataModel: 'Pre-decrement counter combined with ACID relational order records.',
      architecture: 'Buffer queue (Kafka/RabbitMQ) leveling sudden 100K traffic spikes into steady database writes.',
      scalability: 'Shielded single-row database lock contention using Redis in-memory fast-path.',
      availability: 'Circuit breaking and rate limiting non-inventory traffic.',
      reliability: 'Distributed Saga pattern ensuring consistency between payment and stock release.',
      security: 'Anti-bot CAPTCHA / rate limiting at WAF preventing automated script scalpers.',
      tradeoffs: 'Analyzed Redis in-memory consistency vs RDBMS pessimistic lock throughput.',
    },
    order: 4,
    isPublished: true,
  },
];

export const BEHAVIORAL_QUESTIONS_SEED = [
  {
    slug: 'leadership-unclear-ownership',
    prompt:
      'Tell me about a time you took ownership of a critical engineering project or initiative when there was no clear leader or roadmap.',
    category: 'leadership',
    targetCompetency: 'Ownership, Bias for Action, Initiative',
    exampleSTAR: {
      situation:
        'At our previous company, our monolith was failing every Friday afternoon during peak deployments, causing 45 minutes of customer downtime. No team owned deployment infrastructure; backend and DevOps pointed fingers at each other.',
      task:
        'I stepped up to identify the deployment bottlenecks, create a stabilized release pipeline, and align both teams on standard operating procedures without being asked.',
      action:
        'I conducted a blameless post-mortem, instrumented deployment metrics in Datadog, discovered that database migrations were locking user tables during container rollouts, and implemented blue/green zero-downtime deployment scripts with automatic rollback on HTTP 5xx spikes.',
      result:
        'Deployment-related incidents plummeted from 4 per month to 0 over the subsequent two quarters. Release duration shrank from 40 minutes to 8 minutes, unblocking 35 software engineers.',
    },
    tips: [
      'Focus on "I" rather than "We" when detailing specific decisions and actions.',
      'Quantify the business and developer impact with concrete metrics (percentages, minutes saved, incident counts).',
      'Explain how you influenced without direct authority.',
    ],
    order: 1,
    isPublished: true,
  },
  {
    slug: 'technical-failure-production-outage',
    prompt:
      'Describe a situation where a system you designed or maintained failed in production. How did you react, resolve it, and prevent recurrence?',
    category: 'failure',
    targetCompetency: 'Accountability, Grace Under Pressure, Root Cause Analysis',
    exampleSTAR: {
      situation:
        'During a Black Friday marketing push, a newly deployed caching change caused our Redis cluster memory to spike to 100%, causing the caching layer to evict user sessions and logging out 200,000 active shoppers.',
      task:
        'As the on-call engineer, I had to immediately stabilize checkout traffic, mitigate customer session loss, and lead the technical incident response.',
      action:
        'I immediately declared a P0 incident, spun up secondary Redis nodes, toggled our feature flag to fail-open so checkout relied temporarily on read-replica databases, and safely rolled back the caching PR within 12 minutes. That evening, I identified a missing TTL on temporary cart tokens.',
      result:
        'Restored complete site operation in 14 minutes with zero lost orders. Authored a thorough post-mortem, added memory alert thresholds at 75%, and mandated automated TTL tests in CI/CD.',
    },
    tips: [
      'Never blame colleagues or third-party vendors; take personal ownership of the outcome.',
      'Highlight speed of diagnosis, communication with stakeholders, and preventive safeguards added afterward.',
    ],
    order: 2,
    isPublished: true,
  },
  {
    slug: 'conflict-architectural-disagreement',
    prompt:
      'Tell me about a time you had a technical disagreement with a senior engineer or architect regarding a system design decision. How did you resolve it?',
    category: 'conflict',
    targetCompetency: 'Constructive Disagreement, Data-Driven Decision Making, Collaboration',
    exampleSTAR: {
      situation:
        'When designing our real-time notification engine, a Staff Engineer advocated building a custom WebSocket server in C++, while I proposed leveraging an existing managed Kafka cluster with Node.js connection gateways.',
      task:
        'I needed to demonstrate the operational trade-offs and maintenance risks of custom C++ infrastructure without creating adversarial friction.',
      action:
        'Rather than arguing opinions, I created an objective evaluation rubric scoring development time, team skillset, fault tolerance, and operational monitoring. Over a weekend, I built a prototype benchmark showing Node.js + Kafka sustained 80,000 msgs/sec with 8ms latency, easily exceeding our 20,000 target.',
      result:
        'The senior engineer appreciated the concrete benchmarking data and agreed to the Kafka approach. We shipped 6 weeks ahead of schedule and our team easily maintained the service without specialized C++ hiring.',
    },
    tips: [
      'Emphasize bringing data, benchmarks, and prototypes to the table rather than personal ego.',
      'Show that you respect the other party’s perspective and demonstrate how the team grew closer as a result.',
    ],
    order: 3,
    isPublished: true,
  },
  {
    slug: 'delivering-under-ambiguity',
    prompt:
      'Describe a situation where you had to make a critical technical decision with incomplete information or shifting product requirements.',
    category: 'problem-solving',
    targetCompetency: 'Dealing with Ambiguity, Pragmatism, Iterative Delivery',
    exampleSTAR: {
      situation:
        'Our startup needed to support enterprise SAML Single Sign-On (SSO) for a Fortune 500 prospect within 3 weeks to close an enterprise contract, but the enterprise had not finalized which identity provider (Okta, Azure AD, or PingIdentity) they were deploying.',
      task:
        'I had to architect an authentication architecture that would support any SAML 2.0 / OIDC provider without waiting for their multi-week IT review.',
      action:
        'I designed an abstraction layer around our auth middleware using Passport.js and standardized metadata ingestion, decoupling the IDP configuration from our user database. I mocked Okta and Azure responses in local integration tests to verify edge cases.',
      result:
        'When the client finally confirmed Azure AD 48 hours before the signing deadline, we plugged in their tenant credentials in under 20 minutes without code changes. We closed the $180,000 annual contract on time.',
    },
    tips: [
      'Explain how you bounded the risk through abstraction and modularity.',
      'Demonstrate business awareness: how technical pragmatism protected company revenue or timelines.',
    ],
    order: 4,
    isPublished: true,
  },
];

export async function seedCoreCS() {
  console.log('Connecting to MongoDB for Phase 5 Seeding:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log('--- Seeding Core CS Quiz Items ---');
  let quizCount = 0;
  for (const item of CORE_CS_QUIZ_SEED) {
    await CoreCSQuizItem.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    quizCount++;
  }
  console.log(`Successfully seeded ${quizCount} Core CS Quiz Items across OS, DBMS, CN, and OOP.`);

  console.log('--- Seeding System Design Cases ---');
  let caseCount = 0;
  for (const designCase of SYSTEM_DESIGN_SEED) {
    await SystemDesignCase.findOneAndUpdate(
      { slug: designCase.slug },
      { $set: designCase },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    caseCount++;
  }
  console.log(`Successfully seeded ${caseCount} Interactive System Design Cases.`);

  console.log('--- Seeding Behavioral Questions ---');
  let bCount = 0;
  for (const bq of BEHAVIORAL_QUESTIONS_SEED) {
    await BehavioralQuestion.findOneAndUpdate(
      { slug: bq.slug },
      { $set: bq },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    bCount++;
  }
  console.log(`Successfully seeded ${bCount} Behavioral Interview Questions & STAR guides.`);

  console.log('Phase 5 seeding completed successfully.');
}

if (process.argv[1]?.includes('seedCoreCS')) {
  seedCoreCS()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
