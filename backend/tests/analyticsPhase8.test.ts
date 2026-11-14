import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { getJwtSecret } from '../src/lib/jwt';
import { User } from '../src/lib/models/User';
import { UserProgress } from '../src/lib/models/UserProgress';
import { BookmarkList, RevisionItem } from '../src/lib/models/Bookmark';
import { Submission } from '../src/lib/models/Submission';
import { Problem } from '../src/lib/models/Problem';
import {
  calculateUpdatedStreak,
  getMasteryLevel,
  syncUserProgress,
} from '../src/services/progressService';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep_test';

const candidateId = new mongoose.Types.ObjectId().toString();
const candidateToken = jwt.sign({ userId: candidateId, role: 'candidate' }, getJwtSecret(), { expiresIn: '1h' });

const otherCandidateId = new mongoose.Types.ObjectId().toString();
const otherCandidateToken = jwt.sign({ userId: otherCandidateId, role: 'candidate' }, getJwtSecret(), { expiresIn: '1h' });

describe('Phase 8: Analytics, Bookmarks, Revision & Developer Profiles', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }

    // Clean test records
    await User.deleteMany({ _id: { $in: [candidateId, otherCandidateId] } });
    await UserProgress.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await BookmarkList.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await RevisionItem.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await Submission.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });

    // Seed test users
    await User.create({
      _id: new mongoose.Types.ObjectId(candidateId),
      email: 'cand8@example.com',
      password: 'hashedpassword',
      firstName: 'Alice',
      lastName: 'Dev',
      role: 'candidate',
      profile: {
        username: 'alicedev',
        headline: 'Staff Systems Engineer',
        skills: ['TypeScript', 'Go', 'Distributed Systems'],
        timezone: 'UTC',
        isPublic: true,
      },
    });

    await User.create({
      _id: new mongoose.Types.ObjectId(otherCandidateId),
      email: 'bob8@example.com',
      password: 'hashedpassword',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'candidate',
      profile: {
        username: 'bobsmith',
        isPublic: false,
      },
    });
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [candidateId, otherCandidateId] } });
    await UserProgress.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await BookmarkList.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await RevisionItem.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await Submission.deleteMany({ userId: { $in: [candidateId, otherCandidateId] } });
    await mongoose.disconnect();
  });

  // 1. Progress Engine Unit Calculations
  describe('Progress Calculation Formulas & Safeguards', () => {
    it('calculates study streaks correctly across consecutive days and gaps', () => {
      // New streak from inactive
      const initial = calculateUpdatedStreak(
        { current: 0, longest: 0, lastActiveDate: '' },
        '2026-11-14',
        '2026-11-13'
      );
      expect(initial.current).toBe(1);
      expect(initial.longest).toBe(1);

      // Same day activity does not increment streak
      const sameDay = calculateUpdatedStreak(
        { current: 1, longest: 1, lastActiveDate: '2026-11-14' },
        '2026-11-14',
        '2026-11-13'
      );
      expect(sameDay.current).toBe(1);

      // Consecutive day increments streak
      const nextDay = calculateUpdatedStreak(
        { current: 1, longest: 1, lastActiveDate: '2026-11-13' },
        '2026-11-14',
        '2026-11-13'
      );
      expect(nextDay.current).toBe(2);
      expect(nextDay.longest).toBe(2);

      // Missed day resets current streak to 1, preserves longest
      const gapDay = calculateUpdatedStreak(
        { current: 5, longest: 10, lastActiveDate: '2026-11-10' },
        '2026-11-14',
        '2026-11-13'
      );
      expect(gapDay.current).toBe(1);
      expect(gapDay.longest).toBe(10);
    });

    it('safeguards against labeling a candidate Mastered with few problems', () => {
      // 1 problem solved with 100% quiz accuracy should NOT be Mastered
      const level = getMasteryLevel(1, 100);
      expect(level).toBe('Learning');

      // 5 problems with 90% accuracy is Proficient
      const proficient = getMasteryLevel(5, 90);
      expect(proficient).toBe('Proficient');

      // 10 problems with 85% accuracy is Mastered
      const mastered = getMasteryLevel(10, 85);
      expect(mastered).toBe('Mastered');

      // 0 problems with low accuracy is Needs Practice
      const weak = getMasteryLevel(0, 40);
      expect(weak).toBe('Needs Practice');
    });
  });

  // 2. Idempotent Progress Sync from Database Events
  describe('Idempotent User Progress Sync', () => {
    it('aggregates unique accepted submissions without double-counting', async () => {
      const p1 = new mongoose.Types.ObjectId();
      const p2 = new mongoose.Types.ObjectId();

      // Seed 2 accepted submissions for p1 (duplicate accepted), 1 for p2, 1 wrong answer
      await Submission.create([
        {
          userId: candidateId,
          problemId: p1,
          language: 'python',
          code: 'print("hello")',
          status: 'accepted',
          passedTests: 5,
          totalTests: 5,
          runtimeMs: 40,
        },
        {
          userId: candidateId,
          problemId: p1,
          language: 'python',
          code: 'print("hello v2")',
          status: 'accepted',
          passedTests: 5,
          totalTests: 5,
          runtimeMs: 35,
        },
        {
          userId: candidateId,
          problemId: p2,
          language: 'javascript',
          code: 'console.log("ok")',
          status: 'accepted',
          passedTests: 10,
          totalTests: 10,
          runtimeMs: 60,
        },
        {
          userId: candidateId,
          problemId: new mongoose.Types.ObjectId(),
          language: 'python',
          code: 'bug()',
          status: 'wrong_answer',
          passedTests: 2,
          totalTests: 5,
          runtimeMs: 50,
        },
      ]);

      const progress = await syncUserProgress(candidateId);

      // Even though there are 3 accepted submissions, only 2 unique problems are solved
      expect(progress.totalSolved).toBe(2);
      expect(progress.uniqueSolvedProblemIds.length).toBe(2);
      expect(progress.totalAttempts).toBe(4);
    });

    it('returns analytics overview via authenticated API', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview.totalSolved).toBe(2);
      expect(res.body.overview.totalAttempts).toBe(4);
      expect(res.body.overview.streak).toBeDefined();
    });

    it('returns 365-day activity heatmap data', async () => {
      const res = await request(app)
        .get('/api/analytics/heatmap')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dailyActivity).toBeDefined();
    });
  });

  // 3. Bookmarks & Spaced Repetition System
  describe('Bookmarks & Spaced Repetition Queue', () => {
    let listId: string;
    let itemId: string;
    const sampleProblemId = new mongoose.Types.ObjectId().toString();

    it('creates a custom bookmark list', async () => {
      const res = await request(app)
        .post('/api/bookmarks/lists')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          name: 'Dynamic Programming Top Picks',
          description: 'Hard DP problems for FAANG prep',
          color: '#8b5cf6',
          icon: 'Flame',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.list.name).toBe('Dynamic Programming Top Picks');
      listId = res.body.list._id;
    });

    it('adds an item to bookmarks and schedules spaced repetition', async () => {
      const res = await request(app)
        .post('/api/bookmarks/items')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          itemType: 'problem',
          itemId: sampleProblemId,
          title: 'Longest Increasing Subsequence',
          category: 'Dynamic Programming',
          difficulty: 'medium',
          url: '/problems/longest-increasing-subsequence',
          notes: 'Remember O(N log N) patience sorting trick.',
          tags: ['dp', 'binary-search'],
          listId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.item.title).toBe('Longest Increasing Subsequence');
      expect(res.body.item.intervalDays).toBe(1);
      itemId = res.body.item._id;
    });

    it('updates personal notes for a bookmarked item', async () => {
      const res = await request(app)
        .patch(`/api/bookmarks/items/${itemId}/notes`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ notes: 'Updated note: remember tails array invariant.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.item.notes).toContain('Updated note');
    });

    it('fetches revision queue and records review ratings (SM-2 algorithm)', async () => {
      // Check queue
      const queueRes = await request(app)
        .get('/api/bookmarks/revision-queue')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(queueRes.status).toBe(200);
      expect(queueRes.body.success).toBe(true);
      expect(Array.isArray(queueRes.body.items)).toBe(true);

      // Record 'easy' review (rating 5)
      const reviewRes = await request(app)
        .post(`/api/bookmarks/revision-queue/${itemId}/review`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ rating: 5 });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.item.reviewCount).toBe(1);
      // Rating 5 gives bonus interval > 1 day
      expect(reviewRes.body.item.intervalDays).toBeGreaterThan(1);
    });

    it('removes bookmark item cleanly without deleting underlying entity', async () => {
      const res = await request(app)
        .delete(`/api/bookmarks/items/${itemId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await RevisionItem.findById(itemId);
      expect(check).toBeNull();
    });

    it('prevents other candidates from modifying bookmarks', async () => {
      const res = await request(app)
        .delete(`/api/bookmarks/lists/${listId}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);

      expect(res.status).toBe(404);
    });
  });

  // 4. Developer Profiles & Privacy Boundary
  describe('Developer Profile & Public Showcase', () => {
    it('allows candidate to update their profile', async () => {
      const res = await request(app)
        .put('/api/profile/me')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          headline: 'Senior Full Stack & AI Engineer',
          targetRole: 'Staff Software Engineer',
          skills: ['TypeScript', 'Node.js', 'Python', 'System Design'],
          githubUrl: 'https://github.com/alicedev',
          bio: 'Passionate about high-throughput distributed systems and algorithmic puzzles.',
          timezone: 'America/New_York',
          isPublic: true,
          username: 'alice_superdev',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.username).toBe('alice_superdev');
      expect(res.body.profile.timezone).toBe('America/New_York');
    });

    it('rejects duplicate username collision', async () => {
      const res = await request(app)
        .put('/api/profile/me')
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({
          username: 'alice_superdev',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('taken');
    });

    it('serves public profile data without leaking private credentials or emails', async () => {
      const res = await request(app).get('/api/profile/public/alice_superdev');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.developer.name).toBe('Alice D.');
      expect(res.body.developer.username).toBe('alice_superdev');
      expect(res.body.developer.headline).toBe('Senior Full Stack & AI Engineer');
      expect(res.body.stats).toBeDefined();

      // SECURITY & PRIVACY CHECKS: must NEVER leak email, password or internal IDs
      expect(res.body.developer.email).toBeUndefined();
      expect(res.body.developer.password).toBeUndefined();
      expect(res.body.developer.id).toBeUndefined();
      expect(res.body.developer._id).toBeUndefined();
    });

    it('returns 404 for private developer profile', async () => {
      const res = await request(app).get('/api/profile/public/bobsmith');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('private or does not exist');
    });
  });
});
