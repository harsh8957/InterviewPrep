import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import User from '../src/lib/models/User';
import { Problem } from '../src/lib/models/Problem';
import { TestCase } from '../src/lib/models/TestCase';
import { Submission } from '../src/lib/models/Submission';
import { JWT_SECRET } from '../src/lib/jwt';
import judgeService from '../src/services/judge/judgeService';
import { MockJudgeProvider } from '../src/services/judge/mockJudgeProvider';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewprep_judge_test';

describe('Phase 4 - Online Coding Judge & Execution Tests', () => {
  let candidateToken: string;
  let candidateId: string;
  let otherCandidateToken: string;
  let otherCandidateId: string;
  let adminToken: string;
  let testProblemId: string;

  beforeAll(async () => {
    // Force MockJudgeProvider for deterministic testing
    judgeService.setProvider(new MockJudgeProvider());

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    await User.deleteMany({});
    await Problem.deleteMany({});
    await TestCase.deleteMany({});
    await Submission.deleteMany({});

    // 1. Create primary candidate
    const cand1 = new User({
      email: 'judge.cand1@test.com',
      password: 'hashedpassword123',
      firstName: 'Candidate',
      lastName: 'One',
      role: 'candidate',
    });
    await cand1.save();
    candidateId = cand1._id.toString();
    candidateToken = jwt.sign(
      { userId: candidateId, email: cand1.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create other candidate (for IDOR tests)
    const cand2 = new User({
      email: 'judge.cand2@test.com',
      password: 'hashedpassword123',
      firstName: 'Candidate',
      lastName: 'Two',
      role: 'candidate',
    });
    await cand2.save();
    otherCandidateId = cand2._id.toString();
    otherCandidateToken = jwt.sign(
      { userId: otherCandidateId, email: cand2.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Create admin
    const adminUser = new User({
      email: 'judge.admin@test.com',
      password: 'hashedpassword123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Create problem with 1 public test case and 1 hidden test case
    const problem = new Problem({
      title: 'Two Sum Judge Test',
      slug: 'two-sum-judge-test',
      statement: 'Return indices of the two numbers that add up to target.',
      difficulty: 'easy',
      topics: ['Arrays', 'Hash Table'],
      constraints: ['2 <= nums.length <= 10^4'],
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
      status: 'published',
    });
    await problem.save();
    testProblemId = problem._id.toString();

    // Create 1 public test case and 1 hidden test case
    await TestCase.create([
      {
        problemId: problem._id,
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        isHidden: false,
        order: 1,
      },
      {
        problemId: problem._id,
        input: 'nums = [3,2,4], target = 6 (SECRET_HIDDEN_INPUT)',
        expectedOutput: '[1,2] (SECRET_HIDDEN_OUTPUT)',
        isHidden: true,
        order: 2,
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    judgeService.resetRateLimits();
  });

  describe('Authentication & Validation', () => {
    it('POST /api/submissions rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/submissions').send({
        problemId: testProblemId,
        language: 'python',
        sourceCode: 'def solve(): pass',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/submissions validates language and rejects empty source code', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'unsupported-lang',
          sourceCode: '',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('Execution & Verdicts', () => {
    it('executes sample run (isSampleRun: true) and evaluates ONLY public test cases', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): return [0, 1]',
          isSampleRun: true,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('AC');
      expect(res.body.totalCount).toBe(1); // Only 1 public test case
      expect(res.body.isSampleRun).toBe(true);
      expect(res.body.testCaseResults[0].stdin).toContain('nums = [2,7,11,15]');
    });

    it('executes official submission and marks AC when all public & hidden cases pass', async () => {
      // Sleep slightly to respect rate limit
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): return [0, 1]',
          isSampleRun: false,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('AC');
      expect(res.body.totalCount).toBe(2); // Both public + hidden
      expect(res.body.passedCount).toBe(2);
    });

    it('returns WA when solution produces wrong answer', async () => {
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): WRONG_ANSWER return -1',
          isSampleRun: false,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('WA');
    });

    it('returns TLE when code exceeds time limit', async () => {
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): INFINITE_LOOP while True: pass',
          isSampleRun: false,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('TLE');
    });

    it('returns CE when code contains syntax errors', async () => {
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'SYNTAX_ERROR def @@INVALID@@',
          isSampleRun: false,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('CE');
      expect(res.body.compileOutput).toBeDefined();
    });

    it('returns RE when code triggers runtime exception', async () => {
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'RUNTIME_EXCEPTION raise Exception("crash")',
          isSampleRun: false,
        });

      expect([201, 202]).toContain(res.status);
      expect(res.body.verdict).toBe('RE');
    });
  });

  describe('Security & Hidden Test Case Confidentiality', () => {
    it('NEVER leaks hidden test case input or expected output in submission response', async () => {
      await new Promise((r) => setTimeout(r, 1100));

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): return [0, 1]',
          isSampleRun: false,
        });

      expect(res.body.testCaseResults).toBeDefined();
      const hiddenResults = res.body.testCaseResults.filter((r: any) => r.isHidden);
      expect(hiddenResults.length).toBe(1);

      // Verify strict sanitization
      for (const hr of hiddenResults) {
        expect(hr.stdin).toBe('[Hidden Test Case]');
        expect(hr.expectedStdout).toBe('[Hidden]');
        expect(hr.actualStdout).toBe('[Hidden]');
        // Verify raw secret string is not in response payload anywhere
        expect(JSON.stringify(res.body)).not.toContain('SECRET_HIDDEN_INPUT');
        expect(JSON.stringify(res.body)).not.toContain('SECRET_HIDDEN_OUTPUT');
      }
    });

    it('enforces IDOR protection on GET /api/submissions/:id', async () => {
      // Create a submission belonging to cand1
      const sub = new Submission({
        userId: candidateId,
        problemId: testProblemId,
        language: 'python',
        sourceCode: 'pass',
        verdict: 'AC',
      });
      await sub.save();

      // Attempt access by otherCandidate -> 403
      const forbiddenRes = await request(app)
        .get(`/api/submissions/${sub._id}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);
      expect(forbiddenRes.status).toBe(403);

      // Access by owner -> 200
      const ownerRes = await request(app)
        .get(`/api/submissions/${sub._id}`)
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(ownerRes.status).toBe(200);

      // Access by admin -> 200
      const adminRes = await request(app)
        .get(`/api/submissions/${sub._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
    });

    it('enforces per-user submission rate limit (429 on spam)', async () => {
      // Send first submission
      const res1 = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): pass',
          isSampleRun: true,
        });

      // Send second submission immediately without delay
      const res2 = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          problemId: testProblemId,
          language: 'python',
          sourceCode: 'def solve(): pass',
          isSampleRun: true,
        });

      expect(res2.status).toBe(429);
      expect(res2.body.message).toContain('Too many submissions');
    });
  });
});
