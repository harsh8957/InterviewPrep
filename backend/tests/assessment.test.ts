import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import User from '../src/lib/models/User';
import { Problem } from '../src/lib/models/Problem';
import { TestCase } from '../src/lib/models/TestCase';
import { Assessment } from '../src/lib/models/Assessment';
import { AssessmentAttempt } from '../src/lib/models/AssessmentAttempt';
import { JWT_SECRET } from '../src/lib/jwt';
import judgeService from '../src/services/judge/judgeService';
import { MockJudgeProvider } from '../src/services/judge/mockJudgeProvider';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewprep_assessment_test';

describe('Phase 4 - Timed Assessments API Tests', () => {
  let candidateToken: string;
  let candidateId: string;
  let otherCandidateToken: string;
  let otherCandidateId: string;
  let testAssessmentId: string;
  let testProblemId: string;

  beforeAll(async () => {
    judgeService.setProvider(new MockJudgeProvider());

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    await User.deleteMany({});
    await Problem.deleteMany({});
    await TestCase.deleteMany({});
    await Assessment.deleteMany({});
    await AssessmentAttempt.deleteMany({});

    // 1. Create candidate 1
    const cand1 = new User({
      email: 'oa.cand1@test.com',
      password: 'hashedpassword123',
      firstName: 'Assessment',
      lastName: 'Candidate',
      role: 'candidate',
    });
    await cand1.save();
    candidateId = cand1._id.toString();
    candidateToken = jwt.sign(
      { userId: candidateId, email: cand1.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create candidate 2 (for IDOR)
    const cand2 = new User({
      email: 'oa.cand2@test.com',
      password: 'hashedpassword123',
      firstName: 'Other',
      lastName: 'Candidate',
      role: 'candidate',
    });
    await cand2.save();
    otherCandidateId = cand2._id.toString();
    otherCandidateToken = jwt.sign(
      { userId: otherCandidateId, email: cand2.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create test problem
    const problem = new Problem({
      title: 'OA Problem 1',
      slug: 'oa-problem-1',
      statement: 'Solve OA problem 1',
      difficulty: 'medium',
      topics: ['Arrays'],
      constraints: ['1 <= n <= 1000'],
      examples: [{ input: '1', output: '1' }],
      status: 'published',
    });
    await problem.save();
    testProblemId = problem._id.toString();

    await TestCase.create({
      problemId: problem._id,
      input: '1',
      expectedOutput: '1',
      isHidden: false,
      order: 1,
    });

    // 4. Create test assessment (60 minutes)
    const assessment = new Assessment({
      title: 'Senior Software Engineer OA',
      slug: 'senior-swe-oa',
      description: 'Timed 60-minute technical assessment.',
      durationMinutes: 60,
      problemIds: [problem._id],
      difficulty: 'medium',
      passingScore: 70,
      isPublished: true,
      tags: ['Engineering', 'OA'],
    });
    await assessment.save();
    testAssessmentId = assessment._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Catalog & Attempt Lifecycle', () => {
    it('GET /api/assessments returns published assessments', async () => {
      const res = await request(app).get('/api/assessments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].slug).toBe('senior-swe-oa');
      expect(res.body[0].problemCount).toBe(1);
    });

    it('GET /api/assessments/:slug returns assessment with populated problem details', async () => {
      const res = await request(app).get('/api/assessments/senior-swe-oa');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('senior-swe-oa');
      expect(res.body.problemIds.length).toBe(1);
      expect(res.body.problemIds[0].title).toBe('OA Problem 1');
    });

    it('POST /api/assessments/:slug/start starts a new attempt with authoritative expiresAt', async () => {
      const res = await request(app)
        .post('/api/assessments/senior-swe-oa/start')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(201);
      expect(res.body.attempt).toBeDefined();
      expect(res.body.attempt.status).toBe('in-progress');
      expect(res.body.remainingSeconds).toBeGreaterThan(3500); // ~3600 seconds
      expect(res.body.resumed).toBe(false);

      const attempt = res.body.attempt;
      const started = new Date(attempt.startedAt).getTime();
      const expires = new Date(attempt.expiresAt).getTime();
      expect(expires - started).toBe(60 * 60 * 1000); // exactly 60 minutes
    });

    it('POST /api/assessments/:slug/start resumes active in-progress attempt instead of duplicating', async () => {
      const res = await request(app)
        .post('/api/assessments/senior-swe-oa/start')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.resumed).toBe(true);
      expect(res.body.attempt.status).toBe('in-progress');
    });
  });

  describe('Authoritative Expiry & Submission Security', () => {
    it('rejects submissions after attempt time limit has expired', async () => {
      // Create an expired attempt manually
      const expiredAttempt = new AssessmentAttempt({
        assessmentId: testAssessmentId,
        userId: candidateId,
        startedAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
        status: 'in-progress',
        problemSubmissions: [{ problemId: testProblemId, passed: false, score: 0 }],
      });
      await expiredAttempt.save();

      // Submit code linked to this expired attempt
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): return 1',
          attemptId: expiredAttempt._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('expired');

      // Verify attempt marked expired in database
      const check = await AssessmentAttempt.findById(expiredAttempt._id);
      expect(check?.status).toBe('expired');
    });

    it('enforces IDOR: candidate cannot access or submit another user attempt', async () => {
      // Create attempt belonging to candidate 1
      const attempt = new AssessmentAttempt({
        assessmentId: testAssessmentId,
        userId: candidateId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600 * 1000),
        status: 'in-progress',
      });
      await attempt.save();

      // Attempt access by otherCandidate -> 403
      const getRes = await request(app)
        .get(`/api/assessments/attempts/${attempt._id}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);
      expect(getRes.status).toBe(403);

      // Attempt submit by otherCandidate -> 403
      const submitRes = await request(app)
        .post(`/api/assessments/attempts/${attempt._id}/submit`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);
      expect(submitRes.status).toBe(403);
    });

    it('POST /api/assessments/attempts/:attemptId/submit finalizes attempt and calculates scorecard', async () => {
      // Create active attempt with passed problem
      const attempt = new AssessmentAttempt({
        assessmentId: testAssessmentId,
        userId: candidateId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600 * 1000),
        status: 'in-progress',
        problemSubmissions: [{ problemId: testProblemId, passed: true, score: 100 }],
        totalScore: 100,
        passed: true,
      });
      await attempt.save();

      const res = await request(app)
        .post(`/api/assessments/attempts/${attempt._id}/submit`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.scorecard).toBeDefined();
      expect(res.body.scorecard.totalScore).toBe(100);
      expect(res.body.scorecard.passed).toBe(true);
      expect(res.body.attempt.status).toBe('submitted');
    });
  });
});
