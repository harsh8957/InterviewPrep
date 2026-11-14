import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { getJwtSecret } from '../src/lib/jwt';
import { CompanyTrack } from '../src/lib/models/CompanyTrack';
import { CompanyExperience } from '../src/lib/models/CompanyExperience';
import { scanForPII, validateExperiencePII } from '../src/services/moderationService';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep_test';

const candidateId = new mongoose.Types.ObjectId().toString();
const candidateToken = jwt.sign({ userId: candidateId, role: 'candidate' }, getJwtSecret(), { expiresIn: '1h' });

const otherCandidateId = new mongoose.Types.ObjectId().toString();
const otherCandidateToken = jwt.sign({ userId: otherCandidateId, role: 'candidate' }, getJwtSecret(), { expiresIn: '1h' });

const adminId = new mongoose.Types.ObjectId().toString();
const adminToken = jwt.sign({ userId: adminId, role: 'admin' }, getJwtSecret(), { expiresIn: '1h' });

describe('Phase 7: Company Tracks & Interview Experiences', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }
    // Clean test collections
    await CompanyTrack.deleteMany({ slug: { $in: ['test-corp', 'test-fintech'] } });
    await CompanyExperience.deleteMany({ companySlug: 'test-corp' });

    // Seed test company track
    await CompanyTrack.create({
      name: 'Test Corp',
      slug: 'test-corp',
      tier: 'faang_tier',
      description: 'Top-tier tech test company with rigorous coding standards.',
      headquarters: 'Seattle, WA',
      hiringBarOverview: 'Evaluates candidates on deep algorithmic analysis and scalability.',
      culturePrinciples: ['Customer Obsession', 'Ownership'],
      targetRoles: [{ role: 'Software Engineer', level: 'L4', focusAreas: ['DSA', 'System Design'] }],
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Online Assessment',
          type: 'oa',
          description: 'HackerRank test with 2 questions',
          durationMinutes: 90,
          keyTips: ['Pass all tests'],
        },
      ],
      linkedProblemIds: [],
      linkedSystemDesignIds: [],
      linkedBehavioralIds: [],
      linkedAssessmentIds: [],
      coreCsTopics: ['Operating Systems', 'DBMS'],
      status: 'published',
      stats: { totalProblems: 0, totalSystemDesign: 0, experienceCount: 0 },
    });
  });

  afterAll(async () => {
    await CompanyTrack.deleteMany({ slug: { $in: ['test-corp', 'test-fintech'] } });
    await CompanyExperience.deleteMany({ companySlug: 'test-corp' });
    await mongoose.disconnect();
  });

  // 1. PII Validation Tests
  describe('PII Sanitizer & Moderation Safeguards', () => {
    it('detects and flags phone numbers', () => {
      const res = scanForPII('Call me at 9876543210 or 123-456-7890 if you need more details.');
      expect(res.hasViolations).toBe(true);
      expect(res.violations.some(v => v.includes('Phone number detected'))).toBe(true);
      expect(res.sanitizedText).toContain('[PHONE REDACTED]');
    });

    it('detects and flags email addresses', () => {
      const res = scanForPII('You can email interviewer.jane@example.com for referrals.');
      expect(res.hasViolations).toBe(true);
      expect(res.violations.some(v => v.includes('Email address detected'))).toBe(true);
      expect(res.sanitizedText).toContain('[EMAIL REDACTED]');
    });

    it('detects interviewer and recruiter names', () => {
      const res = scanForPII('My interviewer was John Smith and the recruiter Jane Doe was friendly.');
      expect(res.hasViolations).toBe(true);
      expect(res.violations.some(v => v.includes('Personal interviewer/recruiter name detected'))).toBe(true);
      expect(res.sanitizedText).toContain('[INTERVIEWER NAME REDACTED]');
    });

    it('passes clean, professional interview advice without false positives', () => {
      const cleanText = 'The interviewer asked to optimize two pointers solution from O(N^2) to O(N) time with O(1) extra space.';
      const res = scanForPII(cleanText);
      expect(res.hasViolations).toBe(false);
      expect(res.violations).toHaveLength(0);
    });

    it('validates comprehensive experience payload and blocks PII across all sections', () => {
      const badPayload = {
        preparationTips: 'Reach out to recruiter Bob Smith for advice.',
        rounds: [{ questionsSummary: 'Interviewer was Alice Johnson from New York.' }],
      };
      const check = validateExperiencePII(badPayload);
      expect(check.isValid).toBe(false);
      expect(check.violations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 2. Company Tracks Public Catalog
  describe('Company Tracks Public APIs', () => {
    it('GET /api/company-tracks returns published company tracks', async () => {
      const res = await request(app).get('/api/company-tracks');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tracks)).toBe(true);
      const testCorp = res.body.tracks.find((t: any) => t.slug === 'test-corp');
      expect(testCorp).toBeDefined();
      expect(testCorp.name).toBe('Test Corp');
    });

    it('GET /api/company-tracks?tier=faang_tier filters by tier', async () => {
      const res = await request(app).get('/api/company-tracks?tier=faang_tier');
      expect(res.status).toBe(200);
      expect(res.body.tracks.every((t: any) => t.tier === 'faang_tier')).toBe(true);
    });

    it('GET /api/company-tracks/:slug returns track details and approved experiences', async () => {
      const res = await request(app).get('/api/company-tracks/test-corp');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.track.slug).toBe('test-corp');
      expect(res.body.track.culturePrinciples).toContain('Customer Obsession');
      expect(Array.isArray(res.body.experiences)).toBe(true);
    });

    it('GET /api/company-tracks/:slug returns 404 for unknown track', async () => {
      const res = await request(app).get('/api/company-tracks/non-existent-company-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. Interview Experience Submission & Moderation Lifecycle
  describe('Company Experience Submission, Moderation & Access Control', () => {
    let experienceId: string;

    it('POST /api/experiences requires authentication (rejects 401 unauthenticated)', async () => {
      const res = await request(app)
        .post('/api/experiences')
        .send({ companyName: 'Test Corp', companySlug: 'test-corp' });
      expect(res.status).toBe(401);
    });

    it('POST /api/experiences rejects submission containing PII (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/experiences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          companyName: 'Test Corp',
          companySlug: 'test-corp',
          role: 'Software Engineer',
          experienceLevel: 'mid-level',
          interviewYear: 2025,
          difficulty: 'medium',
          outcome: 'Offer',
          rounds: [
            {
              roundNumber: 1,
              roundName: 'Round 1: Screening',
              roundType: 'coding',
              durationMinutes: 45,
              questionsSummary: 'My interviewer was Johnathan Davis and email was jdavis@testcorp.com.',
              difficulty: 'medium',
            },
          ],
          preparationTips: 'Call me at 987-654-3210 for mock interviews!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.violations).toBeDefined();
      expect(res.body.violations.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/experiences accepts clean submission and sets status to pending', async () => {
      const res = await request(app)
        .post('/api/experiences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          companyName: 'Test Corp',
          companySlug: 'test-corp',
          role: 'Software Engineer',
          experienceLevel: 'mid-level',
          interviewYear: 2025,
          interviewSeason: 'Summer',
          difficulty: 'medium',
          outcome: 'Offer',
          isAnonymous: true,
          candidateHandle: 'Anonymous Engineer',
          rounds: [
            {
              roundNumber: 1,
              roundName: 'Round 1: Online Assessment',
              roundType: 'oa',
              durationMinutes: 90,
              questionsSummary: 'Two coding problems on sliding window and prefix sums.',
              difficulty: 'medium',
            },
          ],
          questions: [
            {
              questionText: 'Given an array of integers, return indices of two numbers that add up to target.',
              topic: 'Arrays and Hashing',
              difficulty: 'easy',
            },
          ],
          preparationTips: 'Practice foundational LeetCode patterns. Focus on clean variable naming and edge cases.',
          timelineNotes: 'Entire process took 3 weeks from screen to offer.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.moderationStatus).toBe('pending');
      expect(res.body.experienceId).toBeDefined();

      experienceId = res.body.experienceId;
    });

    it('Pending experience is NOT visible in public feed GET /api/experiences', async () => {
      const res = await request(app).get('/api/experiences?company=test-corp');
      expect(res.status).toBe(200);
      const found = res.body.experiences.find((e: any) => e._id === experienceId);
      expect(found).toBeUndefined();
    });

    it('Pending experience is NOT accessible by unauthenticated user GET /api/experiences/:id (HTTP 403)', async () => {
      const res = await request(app).get(`/api/experiences/${experienceId}`);
      expect(res.status).toBe(403);
    });

    it('Pending experience IS accessible by the submitting author (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.experience._id).toBe(experienceId);
      expect(res.body.experience.moderationStatus).toBe('pending');
    });

    it('Candidate can view their own submissions via GET /api/experiences/my/submissions', async () => {
      const res = await request(app)
        .get('/api/experiences/my/submissions')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const myExp = res.body.submissions.find((s: any) => s._id === experienceId);
      expect(myExp).toBeDefined();
    });

    it('Cross-user modification rejection: Other user cannot edit another candidate experience (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({ preparationTips: 'Attempting unauthorized edit of preparation tips.' });

      expect(res.status).toBe(403);
    });

    it('Cross-user modification rejection: Other user cannot delete another candidate experience (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${otherCandidateToken}`);

      expect(res.status).toBe(403);
    });

    it('Candidate cannot access admin moderation endpoints (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/admin/experiences/${experienceId}/moderate`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ action: 'approve' });

      expect(res.status).toBe(403);
    });

    it('Admin can list pending experiences via GET /api/admin/experiences', async () => {
      const res = await request(app)
        .get('/api/admin/experiences?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pendingCount).toBeGreaterThanOrEqual(1);
      const found = res.body.experiences.find((e: any) => e._id === experienceId);
      expect(found).toBeDefined();
    });

    it('Admin approves experience via PUT /api/admin/experiences/:id/moderate', async () => {
      const res = await request(app)
        .put(`/api/admin/experiences/${experienceId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'approve',
          notes: 'Verified content adheres to community guidelines and is PII-free.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.experience.moderationStatus).toBe('approved');
    });

    it('Approved experience is now visible in public feed GET /api/experiences', async () => {
      const res = await request(app).get('/api/experiences?company=test-corp');
      expect(res.status).toBe(200);
      const found = res.body.experiences.find((e: any) => e._id === experienceId);
      expect(found).toBeDefined();
      expect(found.companySlug).toBe('test-corp');
    });

    it('Candidate can report an approved experience via POST /api/experiences/:id/report', async () => {
      const res = await request(app)
        .post(`/api/experiences/${experienceId}/report`)
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({ reason: 'Checking report mechanism: testing inappropriate content flagging.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify report is visible to admin
      const adminRes = await request(app)
        .get('/api/admin/experiences?hasReports=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      const reported = adminRes.body.experiences.find((e: any) => e._id === experienceId);
      expect(reported).toBeDefined();
      expect(reported.reports.length).toBeGreaterThanOrEqual(1);
    });
  });
});
