import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import User from '../src/lib/models/User';
import { Problem } from '../src/lib/models/Problem';
import { RoadmapNode } from '../src/lib/models/RoadmapNode';
import { TestCase } from '../src/lib/models/TestCase';
import { JWT_SECRET } from '../src/lib/jwt';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewprep_dsa_test';

describe('Phase 3 - DSA Roadmap and Problems API Tests', () => {
  let adminToken: string;
  let candidateToken: string;
  let testProblemId: string;
  let testRoadmapId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    await User.deleteMany({});
    await Problem.deleteMany({});
    await RoadmapNode.deleteMany({});
    await TestCase.deleteMany({});

    // Create admin user directly
    const adminUser = new User({
      email: 'admin.dsa@test.com',
      password: 'hashedpassword123',
      firstName: 'Admin',
      lastName: 'DSA',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create candidate user
    const candUser = new User({
      email: 'candidate.dsa@test.com',
      password: 'hashedpassword123',
      firstName: 'Candidate',
      lastName: 'DSA',
      role: 'candidate',
    });
    await candUser.save();
    candidateToken = jwt.sign(
      { userId: candUser._id.toString(), email: candUser.email, role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Seed test problem
    const problem = new Problem({
      title: 'Two Sum Test',
      slug: 'two-sum-test',
      statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'easy',
      topics: ['Arrays', 'Hash Table'],
      patterns: ['Hashing'],
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'nums[0] + nums[1] == 9, so return [0, 1].',
        },
      ],
      starterCode: {
        python: 'def twoSum(nums: List[int], target: int) -> List[int]:\n    pass',
        javascript: 'function twoSum(nums, target) {\n    // your code\n}',
      },
      hints: ['Try using a hash map for O(n) lookup time.'],
      editorial: 'Store visited elements in a map: target - current.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      status: 'published',
      companyTags: ['Google', 'Amazon'],
    });
    await problem.save();
    testProblemId = problem._id.toString();

    // Create test cases (one public, one hidden)
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
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        isHidden: true, // STRICT HIDDEN TEST CASE
        order: 2,
      },
    ]);

    // Seed test roadmap node
    const node = new RoadmapNode({
      title: 'Arrays & Hashing Test',
      slug: 'arrays-and-hashing-test',
      description: 'Foundations of arrays and hash tables.',
      category: 'Data Structures',
      order: 1,
      prerequisites: [],
      estimatedHours: 5,
      associatedProblemIds: [problem._id],
    });
    await node.save();
    testRoadmapId = node._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Roadmap APIs', () => {
    it('GET /api/roadmaps should return ordered roadmap nodes with problem counts', async () => {
      const res = await request(app).get('/api/roadmaps');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const firstNode = res.body[0];
      expect(firstNode.slug).toBe('arrays-and-hashing-test');
      expect(firstNode.order).toBe(1);
      expect(firstNode.problemsCount).toBe(1);
      expect(firstNode.problems[0].title).toBe('Two Sum Test');
    });

    it('GET /api/roadmaps/:slug should return single roadmap node with populated problems', async () => {
      const res = await request(app).get('/api/roadmaps/arrays-and-hashing-test');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('arrays-and-hashing-test');
      expect(res.body.associatedProblemIds.length).toBe(1);
      expect(res.body.associatedProblemIds[0].slug).toBe('two-sum-test');
    });

    it('GET /api/roadmaps/:slug should return 404 for unknown slug', async () => {
      const res = await request(app).get('/api/roadmaps/non-existent-roadmap');
      expect(res.status).toBe(404);
    });
  });

  describe('Problems APIs', () => {
    it('GET /api/problems should return paginated problems list', async () => {
      const res = await request(app).get('/api/problems');
      expect(res.status).toBe(200);
      expect(res.body.problems).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
      expect(res.body.problems[0].title).toBe('Two Sum Test');
    });

    it('GET /api/problems should filter by difficulty and search query', async () => {
      const resEasy = await request(app).get('/api/problems?difficulty=easy&search=Two');
      expect(resEasy.status).toBe(200);
      expect(resEasy.body.problems.length).toBe(1);
      expect(resEasy.body.problems[0].slug).toBe('two-sum-test');

      const resHard = await request(app).get('/api/problems?difficulty=hard');
      expect(resHard.status).toBe(200);
      expect(resHard.body.problems.length).toBe(0);
    });

    it('GET /api/problems/:slug should return problem detail and public test cases', async () => {
      const res = await request(app).get('/api/problems/two-sum-test');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('two-sum-test');
      expect(res.body.starterCode.python).toBeDefined();
      expect(res.body.hints.length).toBe(1);
      expect(res.body.editorial).toBeDefined();
      expect(res.body.publicTestCases.length).toBe(1);
      expect(res.body.publicTestCases[0].input).toBe('nums = [2,7,11,15], target = 9');
    });

    it('GET /api/problems/:slug MUST NEVER leak hidden test cases', async () => {
      const res = await request(app).get('/api/problems/two-sum-test');
      expect(res.status).toBe(200);
      // Verify hidden test case is not returned in publicTestCases
      const hasHidden = res.body.publicTestCases.some((tc: any) => tc.input.includes('nums = [3,2,4]'));
      expect(hasHidden).toBe(false);
      // Verify no isHidden: true in any returned test case
      for (const tc of res.body.publicTestCases) {
        expect(tc.isHidden).toBeUndefined();
      }
    });

    it('GET /api/problems/:slug should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/problems/unknown-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin Problem and Roadmap Management', () => {
    it('POST /api/admin/problems should reject unauthorized or candidate requests', async () => {
      const unauthRes = await request(app)
        .post('/api/admin/problems')
        .send({ title: 'Hack', slug: 'hack' });
      expect(unauthRes.status).toBe(401);

      const candidateRes = await request(app)
        .post('/api/admin/problems')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ title: 'Hack', slug: 'hack' });
      expect(candidateRes.status).toBe(403);
    });

    it('POST /api/admin/problems allows admin to create new problem with test cases', async () => {
      const newProblem = {
        title: 'Admin Created Problem',
        slug: 'admin-created-problem',
        statement: 'Problem created by admin.',
        difficulty: 'medium',
        topics: ['Greedy'],
        patterns: ['Intervals'],
        constraints: ['1 <= n <= 1000'],
        examples: [{ input: '[1, 2]', output: '2' }],
        starterCode: { python: 'def solve(): pass' },
        hints: ['Consider greedy choice'],
        testCases: [
          { input: '[1, 2]', expectedOutput: '2', isHidden: false, order: 1 },
          { input: '[3, 4]', expectedOutput: '4', isHidden: true, order: 2 },
        ],
      };

      const res = await request(app)
        .post('/api/admin/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProblem);

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe('admin-created-problem');

      // Verify test cases created in database
      const testCases = await TestCase.find({ problemId: res.body._id });
      expect(testCases.length).toBe(2);
    });

    it('PUT /api/admin/problems/:id allows admin to update problem', async () => {
      const res = await request(app)
        .put(`/api/admin/problems/${testProblemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ difficulty: 'medium' });

      expect(res.status).toBe(200);
      expect(res.body.difficulty).toBe('medium');
    });

    it('DELETE /api/admin/problems/:id allows admin to delete problem', async () => {
      const created = await Problem.create({
        title: 'Delete Me',
        slug: 'delete-me',
        statement: 'Temp',
        difficulty: 'easy',
        topics: ['Misc'],
        constraints: ['None'],
        examples: [{ input: '1', output: '1' }],
      });

      const res = await request(app)
        .delete(`/api/admin/problems/${created._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const check = await Problem.findById(created._id);
      expect(check).toBeNull();
    });

    it('POST /api/admin/roadmaps allows admin to create roadmap node', async () => {
      const newRoadmap = {
        title: 'Advanced Dynamic Programming',
        slug: 'advanced-dp',
        description: 'Bitmask and tree DP techniques.',
        category: 'Algorithms',
        order: 99,
        prerequisites: ['dynamic-programming'],
        estimatedHours: 8,
      };

      const res = await request(app)
        .post('/api/admin/roadmaps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoadmap);

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe('advanced-dp');
    });
  });
});
