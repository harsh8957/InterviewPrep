import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import User from '../src/lib/models/User';
import { CoreCSQuizItem } from '../src/lib/models/CoreCSQuizItem';
import { ConceptAttempt } from '../src/lib/models/ConceptAttempt';
import { SystemDesignCase } from '../src/lib/models/SystemDesignCase';
import { SystemDesignSubmission } from '../src/lib/models/SystemDesignSubmission';
import { BehavioralQuestion, StarStory } from '../src/lib/models/BehavioralPrep';
import { JWT_SECRET } from '../src/lib/jwt';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewprep_core_cs_test';

describe('Phase 5 - Core CS, System Design & Behavioral Preparation Suite', () => {
  let candidateToken: string;
  let candidateId: string;
  let otherCandidateToken: string;
  let otherCandidateId: string;

  let testQuizItemId: string;
  let testCaseSlug: string;
  let testStarStoryId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    await User.deleteMany({});
    await CoreCSQuizItem.deleteMany({});
    await ConceptAttempt.deleteMany({});
    await SystemDesignCase.deleteMany({});
    await SystemDesignSubmission.deleteMany({});
    await BehavioralQuestion.deleteMany({});
    await StarStory.deleteMany({});

    // 1. Create candidate user 1
    const cand1 = await User.create({
      email: 'corecs.cand1@test.com',
      password: 'hashedpassword123',
      firstName: 'CoreCS',
      lastName: 'Candidate',
      role: 'candidate',
    });
    candidateId = cand1._id.toString();
    candidateToken = jwt.sign(
      { userId: candidateId, email: cand1.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create candidate user 2 (for IDOR checks)
    const cand2 = await User.create({
      email: 'corecs.cand2@test.com',
      password: 'hashedpassword123',
      firstName: 'Other',
      lastName: 'Candidate',
      role: 'candidate',
    });
    otherCandidateId = cand2._id.toString();
    otherCandidateToken = jwt.sign(
      { userId: otherCandidateId, email: cand2.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Seed test Core CS Quiz item
    const item = await CoreCSQuizItem.create({
      subject: 'os',
      topic: 'Virtual Memory & Paging',
      slug: 'test-os-paging',
      title: 'Virtual Memory Mechanics',
      format: 'mcq',
      difficulty: 'medium',
      conceptExplanation: 'Paging divides memory into physical frames and logical pages.',
      prompt: 'What hardware component translates virtual addresses to physical addresses?',
      options: ['ALU', 'Memory Management Unit (MMU)', 'PCIe Controller', 'DMA Controller'],
      correctAnswerIndex: 1,
      explanation: 'The MMU in the CPU hardware translates virtual addresses using page tables and TLB.',
      keyTakeaway: 'Address translation is hardware-assisted via the MMU.',
      order: 1,
      isPublished: true,
    });
    testQuizItemId = item._id.toString();

    // 4. Seed test System Design Case
    const designCase = await SystemDesignCase.create({
      slug: 'test-rate-limiter',
      title: 'Distributed Rate Limiter',
      type: 'hld',
      difficulty: 'medium',
      scale: '100K QPS',
      summary: 'Design a distributed rate limiter.',
      functionalRequirements: ['Limit requests by IP/User', 'Return 429 when quota exceeded'],
      nonFunctionalRequirements: ['Low latency < 5ms', 'High availability'],
      capacityEstimation: {
        rps: '100K QPS',
        storage: '6.4 GB',
        bandwidth: '50 MB/s',
        memory: '16 GB',
        notes: 'Redis cluster cache',
      },
      apiDesign: [
        {
          endpoint: '/api/v1/check',
          method: 'POST',
          description: 'Check rate limit',
        },
      ],
      dataModels: [
        {
          entity: 'TokenBucket',
          fields: ['key', 'tokens'],
          storageType: 'Redis',
        },
      ],
      architecturePillars: ['Token Bucket', 'Redis Cluster'],
      mermaidDiagram: 'flowchart TD\n  Client --> Gateway\n  Gateway --> Redis[(Redis)]',
      tradeoffs: [
        {
          decision: 'Token Bucket vs Sliding Log',
          pros: ['O(1) memory'],
          cons: ['Bursts allowed'],
          rationale: 'Lower memory footprint',
        },
      ],
      deepDives: [
        {
          topic: 'Concurrency in Redis',
          content: 'Use atomic Lua scripts.',
        },
      ],
      evaluationRubric: {
        requirements: 'Requirements coverage',
        dataModel: 'Data model selection',
        architecture: 'Tier separation',
        scalability: 'Horizontal scaling',
        availability: 'Fail open',
        reliability: 'Atomic scripts',
        security: 'Rate limiting',
        tradeoffs: 'Memory vs accuracy',
      },
      order: 1,
      isPublished: true,
    });
    testCaseSlug = designCase.slug;

    // 5. Seed test Behavioral Question
    await BehavioralQuestion.create({
      slug: 'test-leadership-ownership',
      prompt: 'Tell me about a time you took initiative.',
      category: 'leadership',
      targetCompetency: 'Ownership',
      exampleSTAR: {
        situation: 'Service had no automated testing.',
        task: 'Add end-to-end tests.',
        action: 'Created CI pipeline with Supertest.',
        result: 'Reduced release defects by 80%.',
      },
      tips: ['Use I not We', 'Quantify metrics'],
      order: 1,
      isPublished: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await CoreCSQuizItem.deleteMany({});
    await ConceptAttempt.deleteMany({});
    await SystemDesignCase.deleteMany({});
    await SystemDesignSubmission.deleteMany({});
    await BehavioralQuestion.deleteMany({});
    await StarStory.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // SECTION 1: CORE CS ENDPOINTS & CONFIDENTIALITY
  // ==========================================
  describe('1. Core CS Curriculum & Confidentiality', () => {
    it('GET /api/core-cs/subjects - returns all 4 subjects with topic counts and metadata', async () => {
      const res = await request(app).get('/api/core-cs/subjects');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);

      const subjects = res.body.map((s: any) => s.id);
      expect(subjects).toContain('os');
      expect(subjects).toContain('dbms');
      expect(subjects).toContain('cn');
      expect(subjects).toContain('oop');

      const osSubj = res.body.find((s: any) => s.id === 'os');
      expect(osSubj.totalQuestions).toBeGreaterThanOrEqual(1);
      expect(osSubj.topics).toContain('Virtual Memory & Paging');
    });

    it('GET /api/core-cs/:subject/topics - returns topic breakdown for valid subject', async () => {
      const res = await request(app).get('/api/core-cs/os/topics');
      expect(res.status).toBe(200);
      expect(res.body.subject).toBe('os');
      expect(res.body.topics).toBeDefined();
      expect(Array.isArray(res.body.topics)).toBe(true);
      expect(res.body.topics[0].name).toBe('Virtual Memory & Paging');
    });

    it('GET /api/core-cs/:subject/items - NEVER leaks correctAnswerIndex or explanation before submission', async () => {
      const res = await request(app).get('/api/core-cs/os/items');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const item = res.body.find((i: any) => i._id === testQuizItemId);
      expect(item).toBeDefined();
      expect(item.prompt).toBe('What hardware component translates virtual addresses to physical addresses?');
      expect(item.options.length).toBe(4);

      // CRITICAL CONFIDENTIALITY ASSERTION
      expect(item.correctAnswerIndex).toBeUndefined();
      expect(item.explanation).toBeUndefined();
    });

    it('POST /api/core-cs/attempts - rejects unauthenticated submission with 401', async () => {
      const res = await request(app)
        .post('/api/core-cs/attempts')
        .send({ itemId: testQuizItemId, selectedOption: 1 });
      expect(res.status).toBe(401);
    });

    it('POST /api/core-cs/attempts - grades correct answer and reveals official explanation', async () => {
      const res = await request(app)
        .post('/api/core-cs/attempts')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ itemId: testQuizItemId, selectedOption: 1, timeSpentSeconds: 15 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isCorrect).toBe(true);
      expect(res.body.correctAnswerIndex).toBe(1);
      expect(res.body.explanation).toContain('MMU in the CPU hardware');
      expect(res.body.keyTakeaway).toBeDefined();
    });

    it('POST /api/core-cs/attempts - duplicate attempt increments count without inflating progress', async () => {
      const res = await request(app)
        .post('/api/core-cs/attempts')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ itemId: testQuizItemId, selectedOption: 0, timeSpentSeconds: 10 });

      expect(res.status).toBe(200);
      expect(res.body.attemptCount).toBe(2);

      // Verify DB has only 1 concept attempt document for this user & item
      const attemptsCount = await ConceptAttempt.countDocuments({
        userId: new mongoose.Types.ObjectId(candidateId),
        itemId: new mongoose.Types.ObjectId(testQuizItemId),
      });
      expect(attemptsCount).toBe(1);
    });

    it('GET /api/core-cs/attempts - returns candidate attempts history & subject metrics', async () => {
      const res = await request(app)
        .get('/api/core-cs/attempts')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalAttempted).toBe(1);
      expect(res.body.totalCorrect).toBe(1);
      expect(res.body.accuracy).toBe(100);
      expect(Array.isArray(res.body.subjectBreakdown)).toBe(true);
    });
  });

  // ==========================================
  // SECTION 2: SYSTEM DESIGN
  // ==========================================
  describe('2. System Design Architectures & Rubrics', () => {
    it('GET /api/system-design - lists published system design cases', async () => {
      const res = await request(app).get('/api/system-design');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].slug).toBe('test-rate-limiter');
    });

    it('GET /api/system-design/:slug - returns full case with capacity, APIs, and tradeoffs', async () => {
      const res = await request(app).get(`/api/system-design/${testCaseSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Distributed Rate Limiter');
      expect(res.body.capacityEstimation).toBeDefined();
      expect(res.body.mermaidDiagram).toContain('flowchart');
      expect(res.body.evaluationRubric).toBeDefined();
      expect(res.body.tradeoffs.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/system-design/:slug/save - saves candidate diagram and rubric self-scores', async () => {
      const candidateDiagram = 'flowchart LR\n  Client --> RateLimiter\n  RateLimiter --> Redis';
      const notes = 'Token bucket implementation in Redis with 100K QPS.';

      const res = await request(app)
        .post(`/api/system-design/${testCaseSlug}/save`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          mermaidDiagram: candidateDiagram,
          notes,
          rubricSelfScore: {
            requirements: 4,
            dataModel: 4,
            architecture: 5,
            scalability: 4,
            reliability: 4,
            security: 3,
            tradeoffs: 4,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.mermaidDiagram).toBe(candidateDiagram);
    });

    it('GET /api/system-design/:slug/attempt - retrieves candidate saved draft', async () => {
      const res = await request(app)
        .get(`/api/system-design/${testCaseSlug}/attempt`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.attempt).toBeDefined();
      expect(res.body.attempt.mermaidDiagram).toContain('RateLimiter');
      expect(res.body.attempt.rubricSelfScore.architecture).toBe(5);
    });

    it('POST /api/system-design/:slug/critique - generates structured architectural critique', async () => {
      const res = await request(app)
        .post(`/api/system-design/${testCaseSlug}/critique`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          notes: 'Using Redis cluster with Token Bucket algorithm. Horizontal scaling with load balancer.',
          mermaidDiagram: 'flowchart TD\n  Client --> Gateway\n  Gateway --> Redis',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.critique).toBeDefined();
      expect(res.body.critique.score).toBeGreaterThanOrEqual(50);
      expect(Array.isArray(res.body.critique.strengths)).toBe(true);
      expect(Array.isArray(res.body.critique.improvements)).toBe(true);
    });
  });

  // ==========================================
  // SECTION 3: BEHAVIORAL PREPARATION & STAR BUILDER
  // ==========================================
  describe('3. Behavioral Questions & STAR Story Builder', () => {
    it('GET /api/behavioral/questions - returns curated competency questions', async () => {
      const res = await request(app).get('/api/behavioral/questions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].category).toBe('leadership');
      expect(res.body[0].exampleSTAR).toBeDefined();
    });

    it('POST /api/behavioral/stories - creates STAR story bound to candidate', async () => {
      const res = await request(app)
        .post('/api/behavioral/stories')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Resolved Database Connection Pool Exhaustion Outage',
          category: 'failure',
          situation: 'Our production database crashed during a sudden 5x traffic spike due to connection pool exhaustion.',
          task: 'I had to lead the recovery response and reconfigure pool limits to restore service.',
          action: 'I identified unclosed connections in background workers, introduced HikariCP connection pooling, and set aggressive lease timeouts.',
          result: 'Restored service in 11 minutes with zero recurring connection exhaustion incidents over the next 12 months.',
          metrics: '99.99% uptime restored, connection latency dropped by 35ms.',
          learnings: 'Always enforce connection lease timeouts and monitor connection pool metrics in APM.',
          companyTags: ['Amazon', 'Google'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.story._id).toBeDefined();
      expect(res.body.story.title).toBe('Resolved Database Connection Pool Exhaustion Outage');
      expect(res.body.story.userId).toBe(candidateId);
      testStarStoryId = res.body.story._id;
    });

    it('GET /api/behavioral/stories - lists candidate stories', async () => {
      const res = await request(app)
        .get('/api/behavioral/stories')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(testStarStoryId);
    });

    it('GET /api/behavioral/stories/:id - protects against IDOR (other user receives 403)', async () => {
      const res = await request(app)
        .get(`/api/behavioral/stories/${testStarStoryId}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access forbidden');
    });

    it('PUT /api/behavioral/stories/:id - updates story when accessed by owner', async () => {
      const res = await request(app)
        .put(`/api/behavioral/stories/${testStarStoryId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          metrics: '99.995% uptime restored, connection latency dropped by 42ms.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.story.metrics).toContain('99.995%');
    });

    it('POST /api/behavioral/stories/:id/feedback - generates STAR rubric feedback', async () => {
      const res = await request(app)
        .post(`/api/behavioral/stories/${testStarStoryId}/feedback`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review).toBeDefined();
      expect(res.body.review.clarityScore).toBeGreaterThanOrEqual(70);
      expect(res.body.review.impactScore).toBeGreaterThanOrEqual(70);
      expect(res.body.review.strengths.length).toBeGreaterThan(0);
    });

    it('DELETE /api/behavioral/stories/:id - deletes story when accessed by owner', async () => {
      const res = await request(app)
        .delete(`/api/behavioral/stories/${testStarStoryId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const findDeleted = await StarStory.findById(testStarStoryId);
      expect(findDeleted).toBeNull();
    });
  });
});
