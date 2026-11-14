import 'dotenv/config';
import mongoose from 'mongoose';
import { CompanyTrack } from '../lib/models/CompanyTrack';
import { CompanyExperience } from '../lib/models/CompanyExperience';
import { Problem } from '../lib/models/Problem';
import { SystemDesignCase } from '../lib/models/SystemDesignCase';
import { BehavioralQuestion } from '../lib/models/BehavioralPrep';
import { Assessment } from '../lib/models/Assessment';
import { User } from '../lib/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep';

export async function seedCompanyTracks() {
  console.log('Seeding Company Preparation Tracks & Interview Experiences...');

  // Fetch reference IDs for Problem, SystemDesignCase, BehavioralQuestion, Assessment
  const [
    twoSum,
    validAnagram,
    validPalindrome,
    containerWater,
    longestSubstring,
    subarraySumK,
    binarySearch,
    rotatedSearch,
    mergeIntervals,
    subsets,
    reverseList,
    validParentheses,
    dailyTemperatures,
    maxDepthTree,
    kthLargest,
    numberOfIslands,
    climbingStairs,
    coinChange,
  ] = await Promise.all([
    Problem.findOne({ slug: 'two-sum' }),
    Problem.findOne({ slug: 'valid-anagram' }),
    Problem.findOne({ slug: 'valid-palindrome' }),
    Problem.findOne({ slug: 'container-with-most-water' }),
    Problem.findOne({ slug: 'longest-substring-without-repeating-characters' }),
    Problem.findOne({ slug: 'subarray-sum-equals-k' }),
    Problem.findOne({ slug: 'binary-search' }),
    Problem.findOne({ slug: 'search-in-rotated-sorted-array' }),
    Problem.findOne({ slug: 'merge-intervals' }),
    Problem.findOne({ slug: 'subsets' }),
    Problem.findOne({ slug: 'reverse-linked-list' }),
    Problem.findOne({ slug: 'valid-parentheses' }),
    Problem.findOne({ slug: 'daily-temperatures' }),
    Problem.findOne({ slug: 'maximum-depth-of-binary-tree' }),
    Problem.findOne({ slug: 'kth-largest-element-in-an-array' }),
    Problem.findOne({ slug: 'number-of-islands' }),
    Problem.findOne({ slug: 'climbing-stairs' }),
    Problem.findOne({ slug: 'coin-change' }),
  ]);

  const [rateLimiterCase, tinyUrlCase, chatEngineCase, flashSaleCase] = await Promise.all([
    SystemDesignCase.findOne({ slug: 'distributed-rate-limiter' }),
    SystemDesignCase.findOne({ slug: 'url-shortener-tinyurl' }),
    SystemDesignCase.findOne({ slug: 'real-time-chat-engine' }),
    SystemDesignCase.findOne({ slug: 'ecommerce-flash-sale-checkout' }),
  ]);

  const [leadershipQ, failureQ, conflictQ, ambiguityQ] = await Promise.all([
    BehavioralQuestion.findOne({ slug: 'leadership-unclear-ownership' }),
    BehavioralQuestion.findOne({ slug: 'technical-failure-production-outage' }),
    BehavioralQuestion.findOne({ slug: 'conflict-architectural-disagreement' }),
    BehavioralQuestion.findOne({ slug: 'delivering-under-ambiguity' }),
  ]);

  const [fullstackOA, coreDsaOA] = await Promise.all([
    Assessment.findOne({ slug: 'fullstack-swe-oa' }),
    Assessment.findOne({ slug: 'core-dsa-oa' }),
  ]);

  const helperIds = (arr: any[]) => arr.filter(Boolean).map(item => item._id);

  // 1. Google Track
  const googleTrack = {
    name: 'Google',
    slug: 'google',
    tier: 'faang_tier' as const,
    brandColor: 'from-blue-600 to-red-500',
    description: 'Tier-1 tech giant known for rigorous algorithmic problem solving, graph algorithms, strict Big-O runtime analysis, and scalable system design.',
    headquarters: 'Mountain View, CA',
    website: 'https://careers.google.com',
    hiringBarOverview: 'Google evaluates candidates on four pillars: General Cognitive Ability (GCA), Role-Related Knowledge (RRK), Leadership, and Googleyness. Coding interviews strictly emphasize optimal time and space complexity, test-driven thinking, and edge case coverage before writing code.',
    culturePrinciples: [
      'Focus on the user and all else will follow',
      'Fast is better than slow',
      'Democracy on the web works',
      'You can be serious without a suit',
      'Great just isn\'t good enough',
    ],
    targetRoles: [
      { role: 'Software Engineer (L3 / Early Career)', level: 'L3', focusAreas: ['DSA', 'Data Structures', 'Clean Code', 'Recursion'] },
      { role: 'Software Engineer (L4 / Mid-Level)', level: 'L4', focusAreas: ['Graphs', 'Dynamic Programming', 'Concurrency', 'System Design'] },
      { role: 'Senior Software Engineer (L5)', level: 'L5', focusAreas: ['Distributed Systems', 'High Availability', 'Architecture', 'Mentorship'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Recruiter & Technical Phone Screen',
        type: 'coding' as const,
        description: '45-minute Google Docs or CoderPad interview solving 1 medium algorithmic problem with focus on complexity bounds.',
        durationMinutes: 45,
        keyTips: ['State assumptions out loud', 'Confirm edge cases (empty input, negatives)', 'Calculate Big-O before coding'],
      },
      {
        roundNumber: 2,
        roundName: 'Onsite Coding Round 1: Data Structures',
        type: 'coding' as const,
        description: 'Focus on arrays, hash tables, sliding windows, and amortized complexity.',
        durationMinutes: 45,
        keyTips: ['Write clean modular helper functions', 'Avoid global variables'],
      },
      {
        roundNumber: 3,
        roundName: 'Onsite Coding Round 2: Graphs & Recursion',
        type: 'coding' as const,
        description: 'Graph traversals (BFS/DFS), topological sort, or tree algorithms.',
        durationMinutes: 45,
        keyTips: ['Trace your code with an example dry-run', 'Handle disconnected components'],
      },
      {
        roundNumber: 4,
        roundName: 'System Design & Scalability (L4+)',
        type: 'system_design' as const,
        description: 'Designing distributed microservices, caching layers, and storage models.',
        durationMinutes: 45,
        keyTips: ['Start with requirements and capacity math', 'Justify database selection (SQL vs NoSQL)'],
      },
      {
        roundNumber: 5,
        roundName: 'Googleyness & Leadership',
        type: 'behavioral' as const,
        description: 'Navigating ambiguity, constructive collaboration, and learning from technical failures.',
        durationMinutes: 45,
        keyTips: ['Use the STAR method', 'Demonstrate intellectual humility and curiosity'],
      },
    ],
    linkedProblemIds: helperIds([twoSum, longestSubstring, rotatedSearch, numberOfIslands, subsets]),
    linkedSystemDesignIds: helperIds([rateLimiterCase]),
    linkedBehavioralIds: helperIds([failureQ, conflictQ]),
    linkedAssessmentIds: helperIds([coreDsaOA]),
    coreCsTopics: ['Operating Systems', 'Computer Networks'],
    status: 'published' as const,
    stats: {
      totalProblems: 5,
      totalSystemDesign: 1,
      experienceCount: 1,
    },
  };

  // 2. Amazon Track
  const amazonTrack = {
    name: 'Amazon',
    slug: 'amazon',
    tier: 'faang_tier' as const,
    brandColor: 'from-amber-500 to-orange-600',
    description: 'E-commerce and cloud infrastructure leader (AWS). Interviews feature a balanced mix of DSA and 16 Leadership Principles (LP) woven into every round.',
    headquarters: 'Seattle, WA',
    website: 'https://amazon.jobs',
    hiringBarOverview: 'Amazon uses "Bar Raisers" to ensure every hire is better than 50% of current employees at that level. Every interview round allocates at least 15-20 minutes strictly for Leadership Principles behavioral questions using the STAR framework with concrete metrics.',
    culturePrinciples: [
      'Customer Obsession',
      'Ownership',
      'Invent and Simplify',
      'Are Right, A Lot',
      'Learn and Be Curious',
      'Bias for Action',
      'Frugality',
      'Earn Trust',
      'Dive Deep',
      'Have Backbone; Disagree and Commit',
      'Deliver Results',
    ],
    targetRoles: [
      { role: 'Software Development Engineer I (SDE I)', level: 'L4', focusAreas: ['Arrays', 'Trees', 'Strings', 'OOP', 'LP'] },
      { role: 'Software Development Engineer II (SDE II)', level: 'L5', focusAreas: ['System Design', 'DP', 'Heaps', 'Concurrency', 'LP'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Online Assessment (OA)',
        type: 'oa' as const,
        description: '90-minute HackerRank assessment with 2 coding problems + 15-minute work simulation assessment.',
        durationMinutes: 90,
        keyTips: ['Pass all hidden test cases', 'Write explanations of your approach in the text box'],
      },
      {
        roundNumber: 2,
        roundName: 'Coding & Leadership Principles: Trees & Graphs',
        type: 'coding' as const,
        description: 'Tree traversals, BFS/DFS, plus 2 STAR behavioral stories on Ownership and Customer Obsession.',
        durationMinutes: 60,
        keyTips: ['Prepare 2 stories per Leadership Principle', 'Use metrics: "% improvement", "$ savings"'],
      },
      {
        roundNumber: 3,
        roundName: 'Coding & Leadership Principles: Dynamic Programming / Heaps',
        type: 'coding' as const,
        description: 'Medium-hard problem solving plus Bias for Action behavioral questions.',
        durationMinutes: 60,
        keyTips: ['Identify optimal substructure early', 'Write working executable code'],
      },
      {
        roundNumber: 4,
        roundName: 'High-Level System Design (SDE II)',
        type: 'system_design' as const,
        description: 'Design a distributed service (e.g. TinyURL, Distributed Cache) under AWS-scale traffic.',
        durationMinutes: 60,
        keyTips: ['Discuss partitioning, replication, and caching strategies', 'Identify single points of failure'],
      },
      {
        roundNumber: 5,
        roundName: 'Bar Raiser Round',
        type: 'hiring_manager' as const,
        description: 'Independent interviewer outside the hiring team assessing cultural fit and long-term trajectory.',
        durationMinutes: 60,
        keyTips: ['Be authentic and detailed about challenges and tradeoffs'],
      },
    ],
    linkedProblemIds: helperIds([climbingStairs, coinChange, kthLargest, maxDepthTree, twoSum]),
    linkedSystemDesignIds: helperIds([tinyUrlCase]),
    linkedBehavioralIds: helperIds([leadershipQ, ambiguityQ]),
    linkedAssessmentIds: helperIds([coreDsaOA]),
    coreCsTopics: ['DBMS', 'Operating Systems'],
    status: 'published' as const,
    stats: {
      totalProblems: 5,
      totalSystemDesign: 1,
      experienceCount: 1,
    },
  };

  // 3. Meta Track
  const metaTrack = {
    name: 'Meta',
    slug: 'meta',
    tier: 'faang_tier' as const,
    brandColor: 'from-blue-600 to-indigo-700',
    description: 'Social networking and AI pioneer. Coding rounds demand rapid, bug-free implementation (two medium problems in 40 minutes) followed by pragmatic architectural design.',
    headquarters: 'Menlo Park, CA',
    website: 'https://metacareers.com',
    hiringBarOverview: 'Meta places tremendous emphasis on coding velocity and execution speed. Candidates are expected to explain the optimal algorithm in 3-5 minutes, code it cleanly in 12-15 minutes, and verify it with manual test cases to leave time for a second problem.',
    culturePrinciples: [
      'Move Fast',
      'Focus on Long-Term Impact',
      'Build Awesome Things',
      'Live in the Future',
      'Be Direct and Respect Your Colleagues',
    ],
    targetRoles: [
      { role: 'Software Engineer (E4 / Mid-Level)', level: 'E4', focusAreas: ['Rapid Coding', 'Strings', 'Two Pointers', 'Product Architecture'] },
      { role: 'Software Engineer (E5 / Senior)', level: 'E5', focusAreas: ['Distributed Systems', 'Real-Time Messaging', 'Load Balancing', 'Data Pipelines'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Technical Screen: 2 Coding Problems',
        type: 'coding' as const,
        description: '45 minutes with 2 LeetCode-medium algorithmic questions. Aim to finish the first in 18 minutes.',
        durationMinutes: 45,
        keyTips: ['Do not spend > 3 mins talking before coding', 'Use standard library methods fluently'],
      },
      {
        roundNumber: 2,
        roundName: 'Onsite Coding Round 1',
        type: 'coding' as const,
        description: 'Arrays, hashing, sliding window, and backtracking.',
        durationMinutes: 45,
        keyTips: ['Check boundary conditions before declaring done'],
      },
      {
        roundNumber: 3,
        roundName: 'Onsite Coding Round 2',
        type: 'coding' as const,
        description: 'Trees, graphs, and topological sort.',
        durationMinutes: 45,
        keyTips: ['Dry run step by step with the interviewer'],
      },
      {
        roundNumber: 4,
        roundName: 'System Design: Real-Time Services',
        type: 'system_design' as const,
        description: 'Designing high-throughput feed, chat, or notification architectures.',
        durationMinutes: 45,
        keyTips: ['Discuss WebSocket connection pooling', 'Detail database sharding and index strategy'],
      },
      {
        roundNumber: 5,
        roundName: 'Behavioral: Collaboration & Impact',
        type: 'behavioral' as const,
        description: 'Evaluating how you resolve conflict, push back with data, and prioritize impactful work.',
        durationMinutes: 45,
        keyTips: ['Highlight cross-functional work with product and design'],
      },
    ],
    linkedProblemIds: helperIds([subsets, validPalindrome, subarraySumK, validParentheses, numberOfIslands]),
    linkedSystemDesignIds: helperIds([chatEngineCase]),
    linkedBehavioralIds: helperIds([ambiguityQ, conflictQ]),
    linkedAssessmentIds: helperIds([fullstackOA]),
    coreCsTopics: ['Computer Networks', 'DBMS'],
    status: 'published' as const,
    stats: {
      totalProblems: 5,
      totalSystemDesign: 1,
      experienceCount: 1,
    },
  };

  // 4. Microsoft Track
  const microsoftTrack = {
    name: 'Microsoft',
    slug: 'microsoft',
    tier: 'enterprise_saas' as const,
    brandColor: 'from-sky-500 to-emerald-600',
    description: 'Cloud and productivity leader (Azure, Office, GitHub). Known for collaborative, pragmatic engineering interviews emphasizing code readability, maintainability, and OOP.',
    headquarters: 'Redmond, WA',
    website: 'https://careers.microsoft.com',
    hiringBarOverview: 'Microsoft looks for growth mindset, collaborative communication, and practical code that can survive in production enterprise systems. Interviewers value clean naming, modular structure, and handling error scenarios.',
    culturePrinciples: [
      'Growth Mindset',
      'Customer Obsession',
      'Diversity and Inclusion',
      'One Microsoft',
      'Making a Difference',
    ],
    targetRoles: [
      { role: 'Software Engineer (SDE 1 / Level 59-60)', level: 'L59-60', focusAreas: ['Data Structures', 'OOP', 'Strings', 'Debugging'] },
      { role: 'Software Engineer (SDE 2 / Level 61-62)', level: 'L61-62', focusAreas: ['System Design', 'Cloud Patterns', 'Concurrency', 'Refactoring'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Online Assessment: Codility',
        type: 'oa' as const,
        description: '3 problems in 75 minutes testing edge cases, boundary values, and asymptotic runtime.',
        durationMinutes: 75,
        keyTips: ['Watch out for integer overflow', 'Test empty array, 1 element, and duplicates'],
      },
      {
        roundNumber: 2,
        roundName: 'Technical Interview: Data Structures & OOP',
        type: 'coding' as const,
        description: 'Linked lists, stacks, and object-oriented class design.',
        durationMinutes: 45,
        keyTips: ['Apply SOLID principles', 'Explain why composition is preferred over inheritance'],
      },
      {
        roundNumber: 3,
        roundName: 'System Architecture & Azure Services',
        type: 'system_design' as const,
        description: 'Designing resilient distributed services with messaging queues and relational/NoSQL backends.',
        durationMinutes: 45,
        keyTips: ['Discuss retry policies with exponential backoff and dead-letter queues'],
      },
      {
        roundNumber: 4,
        roundName: 'Partner Director / Manager Round (The "As-Appropriate")',
        type: 'hiring_manager' as const,
        description: 'High-level behavioral and cultural alignment round testing vision and growth mindset.',
        durationMinutes: 45,
        keyTips: ['Share examples of learning from past failures and mentoring peers'],
      },
    ],
    linkedProblemIds: helperIds([reverseList, mergeIntervals, validParentheses, dailyTemperatures, twoSum]),
    linkedSystemDesignIds: helperIds([flashSaleCase]),
    linkedBehavioralIds: helperIds([failureQ, leadershipQ]),
    linkedAssessmentIds: helperIds([fullstackOA]),
    coreCsTopics: ['Operating Systems', 'Object-Oriented Programming'],
    status: 'published' as const,
    stats: {
      totalProblems: 5,
      totalSystemDesign: 1,
      experienceCount: 0,
    },
  };

  // 5. Uber Track
  const uberTrack = {
    name: 'Uber',
    slug: 'uber',
    tier: 'high_growth_startup' as const,
    brandColor: 'from-neutral-800 to-black',
    description: 'Mobility and logistics tech leader. Engineering loops emphasize high-throughput distributed architectures, geospatial indexing, concurrency, and robust graph traversal.',
    headquarters: 'San Francisco, CA',
    website: 'https://uber.com/careers',
    hiringBarOverview: 'Uber technical interviews are known for challenging concurrency and real-time distributed systems scenarios. Candidates must demonstrate deep understanding of consensus, message ordering, and high QPS caching.',
    culturePrinciples: [
      'Go Get It',
      'Trip-Obsessed',
      'Build with Heart',
      'Stand for Safety',
      'Great Minds Don\'t Think Alike',
    ],
    targetRoles: [
      { role: 'Software Engineer II (L4)', level: 'L4', focusAreas: ['Concurrency', 'Graphs', 'Queues', 'High QPS APIs'] },
      { role: 'Senior Software Engineer (L5)', level: 'L5', focusAreas: ['Geospatial Sharding', 'Kafka', 'Consensus', 'Fault Tolerance'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Codesignal General Coding Assessment',
        type: 'oa' as const,
        description: '70-minute proctored 4-question assessment.',
        durationMinutes: 70,
        keyTips: ['Aim for 840+ CodeSignal score', 'Manage time carefully: Q3 and Q4 are harder'],
      },
      {
        roundNumber: 2,
        roundName: 'Coding Round: Graph Traversals & Search',
        type: 'coding' as const,
        description: 'Shortest path, BFS/DFS, or matrix reachability.',
        durationMinutes: 60,
        keyTips: ['Verify visited state handling to prevent infinite loops'],
      },
      {
        roundNumber: 3,
        roundName: 'System Design: Distributed Real-Time Dispatch',
        type: 'system_design' as const,
        description: 'Design rate limiting, trip matching, or live telemetry streaming systems.',
        durationMinutes: 60,
        keyTips: ['Address write-heavy ingestion and Redis cluster partitioning'],
      },
    ],
    linkedProblemIds: helperIds([numberOfIslands, mergeIntervals, containerWater, rotatedSearch]),
    linkedSystemDesignIds: helperIds([rateLimiterCase, chatEngineCase]),
    linkedBehavioralIds: helperIds([ambiguityQ, failureQ]),
    linkedAssessmentIds: helperIds([coreDsaOA]),
    coreCsTopics: ['Computer Networks', 'Operating Systems'],
    status: 'published' as const,
    stats: {
      totalProblems: 4,
      totalSystemDesign: 2,
      experienceCount: 0,
    },
  };

  // 6. Stripe Track
  const stripeTrack = {
    name: 'Stripe',
    slug: 'stripe',
    tier: 'fintech' as const,
    brandColor: 'from-violet-600 to-indigo-600',
    description: 'Financial infrastructure leader. Famous for practical, IDE-based coding interviews testing idempotency, API design, data modeling, and debugging real-world codebases.',
    headquarters: 'San Francisco & Dublin',
    website: 'https://stripe.com/jobs',
    hiringBarOverview: 'Stripe replaces whiteboard algorithmic brainteasers with practical engineering tasks: building a CLI tool, refactoring a payment ledger, or implementing an HTTP webhook endpoint in your own local environment.',
    culturePrinciples: [
      'Move with Urgency and Focus',
      'Think Rigorously',
      'Trust and Amplify',
      'Global Optimism',
      'Users First',
    ],
    targetRoles: [
      { role: 'Software Engineer (L2 / L3)', level: 'L2-L3', focusAreas: ['API Design', 'Idempotency', 'Concurrency', 'Unit Testing'] },
    ],
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Practical Coding: API Integration & Data Parsing',
        type: 'coding' as const,
        description: '60 minutes in your own IDE writing a clean, runnable parser or HTTP client with test suites.',
        durationMinutes: 60,
        keyTips: ['Run unit tests frequently', 'Organize code into clean helper methods', 'Handle malformed payloads'],
      },
      {
        roundNumber: 2,
        roundName: 'System Architecture & Data Modeling',
        type: 'system_design' as const,
        description: 'Designing transactional payment ledgers, idempotency keys, and webhook delivery pipelines.',
        durationMinutes: 60,
        keyTips: ['Emphasize exact-once delivery constraints and double-entry bookkeeping'],
      },
    ],
    linkedProblemIds: helperIds([subarraySumK, validParentheses, mergeIntervals, coinChange]),
    linkedSystemDesignIds: helperIds([rateLimiterCase, flashSaleCase]),
    linkedBehavioralIds: helperIds([conflictQ, failureQ]),
    linkedAssessmentIds: helperIds([fullstackOA]),
    coreCsTopics: ['DBMS', 'Computer Networks'],
    status: 'published' as const,
    stats: {
      totalProblems: 4,
      totalSystemDesign: 2,
      experienceCount: 0,
    },
  };

  const tracks = [googleTrack, amazonTrack, metaTrack, microsoftTrack, uberTrack, stripeTrack];

  for (const trackData of tracks) {
    await CompanyTrack.findOneAndUpdate(
      { slug: trackData.slug },
      { $set: trackData },
      { upsert: true, new: true }
    );
    console.log(`Saved Company Track: ${trackData.name}`);
  }

  // Seed sample approved experiences
  const sampleUser = await User.findOne({ role: 'candidate' });
  const adminUser = await User.findOne({ role: 'admin' });

  if (sampleUser && adminUser) {
    const googleTrackDoc = await CompanyTrack.findOne({ slug: 'google' });
    const amazonTrackDoc = await CompanyTrack.findOne({ slug: 'amazon' });
    const metaTrackDoc = await CompanyTrack.findOne({ slug: 'meta' });

    const sampleExperiences = [
      {
        companyName: 'Google',
        companySlug: 'google',
        companyTrackId: googleTrackDoc?._id,
        author: sampleUser._id,
        candidateHandle: 'Anonymous L4 Candidate',
        isAnonymous: true,
        role: 'Software Engineer (L4)',
        experienceLevel: 'mid-level' as const,
        interviewYear: 2025,
        interviewSeason: 'Fall' as const,
        difficulty: 'hard' as const,
        outcome: 'Offer' as const,
        provenance: 'community_submission' as const,
        rounds: [
          {
            roundNumber: 1,
            roundName: 'Phone Screen: Sliding Window',
            roundType: 'coding' as const,
            durationMinutes: 45,
            questionsSummary: 'Asked to find the longest substring with at most k distinct characters. Started with brute force, then optimized with two pointers and a frequency hash map to O(N) runtime.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 2,
            roundName: 'Onsite Round 1: Rotated Array Search',
            roundType: 'coding' as const,
            durationMinutes: 45,
            questionsSummary: 'Variant of search in rotated sorted array. Interviewer asked follow up on handling duplicates and worst case degradation.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 3,
            roundName: 'Onsite Round 2: Graph Island Counting & Union Find',
            roundType: 'coding' as const,
            durationMinutes: 45,
            questionsSummary: 'Matrix connected components problem. Implemented BFS with visited set, then discussed Disjoint Set Union (DSU) trade-offs for dynamic streaming edges.',
            difficulty: 'hard' as const,
          },
          {
            roundNumber: 4,
            roundName: 'Onsite Round 3: Distributed Rate Limiter',
            roundType: 'system_design' as const,
            durationMinutes: 45,
            questionsSummary: 'Design an API rate limiter supporting 100k requests per second across multiple regional data centers. Walked through Token Bucket vs Sliding Window Counter with Redis and Lua scripts.',
            difficulty: 'hard' as const,
          },
          {
            roundNumber: 5,
            roundName: 'Googleyness & Leadership',
            roundType: 'behavioral' as const,
            durationMinutes: 45,
            questionsSummary: 'Discussed handling ambiguous specifications, resolving disagreements with tech leads, and post-mortem analysis of a production memory leak.',
            difficulty: 'medium' as const,
          },
        ],
        questions: [
          {
            questionText: 'Given a string s, find the length of the longest substring without repeating characters.',
            topic: 'Sliding Window',
            difficulty: 'medium' as const,
            linkedProblemId: longestSubstring?._id,
          },
          {
            questionText: 'Search for a target value in a sorted array that has been rotated at an unknown pivot.',
            topic: 'Binary Search',
            difficulty: 'medium' as const,
            linkedProblemId: rotatedSearch?._id,
          },
          {
            questionText: 'Count the number of islands in a 2D binary grid, and scale for dynamic stream of cell updates.',
            topic: 'Graphs',
            difficulty: 'hard' as const,
            linkedProblemId: numberOfIslands?._id,
          },
        ],
        preparationTips: 'Focus heavily on problem-solving patterns rather than memorizing individual solutions. In every Google round, write down the function signature, state constraints and edge cases first, and walk through at least one manual test case before writing code.',
        timelineNotes: 'Recruiter reach out in September, phone screen 2 weeks later, onsite scheduled 3 weeks after phone screen. Verbal offer arrived 5 days after onsite loop.',
        moderationStatus: 'approved' as const,
        moderatedBy: adminUser._id,
        moderatedAt: new Date(),
        moderationHistory: [
          {
            action: 'submitted' as const,
            performedBy: sampleUser._id,
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            notes: 'Initial submission',
          },
          {
            action: 'approved' as const,
            performedBy: adminUser._id,
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            notes: 'Approved: verified accurate loop format and PII-clean',
          },
        ],
        reports: [],
      },
      {
        companyName: 'Amazon',
        companySlug: 'amazon',
        companyTrackId: amazonTrackDoc?._id,
        author: sampleUser._id,
        candidateHandle: 'Anonymous SDE II',
        isAnonymous: true,
        role: 'Software Development Engineer II (SDE II)',
        experienceLevel: 'mid-level' as const,
        interviewYear: 2025,
        interviewSeason: 'Summer' as const,
        difficulty: 'medium' as const,
        outcome: 'Offer' as const,
        provenance: 'community_submission' as const,
        rounds: [
          {
            roundNumber: 1,
            roundName: 'Online Assessment',
            roundType: 'oa' as const,
            durationMinutes: 90,
            questionsSummary: 'Two coding problems on arrays and prefix sums. Passed 100% test cases.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 2,
            roundName: 'Onsite: Trees & Customer Obsession',
            roundType: 'coding' as const,
            durationMinutes: 60,
            questionsSummary: 'Binary tree depth and path sum calculations. 20 minutes spent discussing a situation where I advocated for the end customer.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 3,
            roundName: 'Onsite: System Design: URL Shortener',
            roundType: 'system_design' as const,
            durationMinutes: 60,
            questionsSummary: 'Design a scalable TinyURL service. Covered base62 encoding, hash collisions, caching tier with Redis, and DB sharding.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 4,
            roundName: 'Bar Raiser: Dynamic Programming & Disagree and Commit',
            roundType: 'hiring_manager' as const,
            durationMinutes: 60,
            questionsSummary: 'Coin Change variation with limited quantities. In-depth dive into a time I disagreed with a product roadmap decision but executed anyway.',
            difficulty: 'hard' as const,
          },
        ],
        questions: [
          {
            questionText: 'Find the minimum number of coins needed to make up a given amount given coins of different denominations.',
            topic: 'Dynamic Programming',
            difficulty: 'medium' as const,
            linkedProblemId: coinChange?._id,
          },
          {
            questionText: 'Calculate the maximum depth of a binary tree.',
            topic: 'Trees',
            difficulty: 'easy' as const,
            linkedProblemId: maxDepthTree?._id,
          },
        ],
        preparationTips: 'Do not underestimate the Leadership Principles. Prepare at least 2 structured STAR stories with quantified business outcomes for each principle. Bar Raisers will probe deeply into numbers and personal accountability.',
        timelineNotes: 'OA in July, Onsite loop in August, Offer letter received within 4 business days.',
        moderationStatus: 'approved' as const,
        moderatedBy: adminUser._id,
        moderatedAt: new Date(),
        moderationHistory: [
          {
            action: 'submitted' as const,
            performedBy: sampleUser._id,
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            notes: 'Initial submission',
          },
          {
            action: 'approved' as const,
            performedBy: adminUser._id,
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
            notes: 'Approved by admin',
          },
        ],
        reports: [],
      },
      {
        companyName: 'Meta',
        companySlug: 'meta',
        companyTrackId: metaTrackDoc?._id,
        author: sampleUser._id,
        candidateHandle: 'Anonymous E4 Candidate',
        isAnonymous: true,
        role: 'Software Engineer (E4)',
        experienceLevel: 'junior' as const,
        interviewYear: 2024,
        interviewSeason: 'Winter' as const,
        difficulty: 'hard' as const,
        outcome: 'Offer' as const,
        provenance: 'community_submission' as const,
        rounds: [
          {
            roundNumber: 1,
            roundName: 'Technical Screen: 2 Coding Problems',
            roundType: 'coding' as const,
            durationMinutes: 45,
            questionsSummary: 'Valid Palindrome II and Subarray Sum Equals K. Completed both in 38 minutes.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 2,
            roundName: 'Onsite Coding: Subsets & Backtracking',
            roundType: 'coding' as const,
            durationMinutes: 45,
            questionsSummary: 'Generating all power set subsets and handling duplicates.',
            difficulty: 'medium' as const,
          },
          {
            roundNumber: 3,
            roundName: 'Onsite System Design: Real-Time Chat Engine',
            roundType: 'system_design' as const,
            durationMinutes: 45,
            questionsSummary: 'Designing WhatsApp/Messenger style 1-on-1 and group chat. Covered WebSocket gateways, message ordering, and read receipts.',
            difficulty: 'hard' as const,
          },
        ],
        questions: [
          {
            questionText: 'Given an array of integers and an integer k, find the total number of continuous subarrays whose sum equals k.',
            topic: 'Prefix Sum & Hashing',
            difficulty: 'medium' as const,
            linkedProblemId: subarraySumK?._id,
          },
          {
            questionText: 'Given an integer array nums of unique elements, return all possible subsets (the power set).',
            topic: 'Backtracking',
            difficulty: 'medium' as const,
            linkedProblemId: subsets?._id,
          },
        ],
        preparationTips: 'Speed is king at Meta. Practice writing bug-free code quickly without relying on a compiler. Always manually trace edge cases with a short sample input.',
        timelineNotes: 'Recruiter reached out on LinkedIn, screen 1 week later, onsite 3 weeks later.',
        moderationStatus: 'approved' as const,
        moderatedBy: adminUser._id,
        moderatedAt: new Date(),
        moderationHistory: [
          {
            action: 'submitted' as const,
            performedBy: sampleUser._id,
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            notes: 'Initial submission',
          },
          {
            action: 'approved' as const,
            performedBy: adminUser._id,
            timestamp: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
            notes: 'Approved by admin',
          },
        ],
        reports: [],
      },
    ];

    for (const exp of sampleExperiences) {
      await CompanyExperience.findOneAndUpdate(
        { companySlug: exp.companySlug, role: exp.role },
        { $set: exp },
        { upsert: true, new: true }
      );
      console.log(`Saved approved Experience for: ${exp.companyName} - ${exp.role}`);
    }
  }

  console.log('Company Preparation Tracks & Interview Experiences seeded successfully!');
}

if (process.argv[1].endsWith('seedCompanyTracks.ts') || process.argv[1].endsWith('seedCompanyTracks.js')) {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      await seedCompanyTracks();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed company tracks:', err);
      process.exit(1);
    });
}
