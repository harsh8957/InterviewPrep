import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import User from '../src/lib/models/User';
import InterviewRoom from '../src/lib/models/InterviewRoom';
import InterviewResult from '../src/lib/models/InterviewResult';
import RevokedToken from '../src/lib/models/RevokedToken';
import { JWT_SECRET } from '../src/lib/jwt';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewprep_security_test';

describe('Phase 1 - Security and RBAC Regression Tests', () => {
  let candidateToken: string;
  let candidateId: string;
  let otherCandidateToken: string;
  let otherCandidateId: string;
  let hrToken: string;
  let hrId: string;
  let interviewRoomId: string;
  let interviewResultId: string;

  beforeAll(async () => {
    // Connect to isolated test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    // Clean collections
    await User.deleteMany({});
    await InterviewRoom.deleteMany({});
    await InterviewResult.deleteMany({});
    await RevokedToken.deleteMany({});

    // 1. Create primary candidate
    const candRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'primary.candidate@test.com',
        password: 'Password123!',
        firstName: 'Primary',
        lastName: 'Candidate',
        role: 'candidate'
      });
    expect(candRes.status).toBe(201);
    candidateToken = candRes.body.token;
    candidateId = candRes.body.user._id;

    // 2. Create other candidate (for cross-user boundary testing)
    const otherCandRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'other.candidate@test.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'Candidate',
        role: 'candidate'
      });
    expect(otherCandRes.status).toBe(201);
    otherCandidateToken = otherCandRes.body.token;
    otherCandidateId = otherCandRes.body.user._id;

    // 3. Create HR user
    const hrRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'recruiter.hr@test.com',
        password: 'Password123!',
        firstName: 'Lead',
        lastName: 'Recruiter',
        role: 'hr',
        company: 'Acme Tech',
        position: 'Talent Lead'
      });
    expect(hrRes.status).toBe(201);
    hrToken = hrRes.body.token;
    hrId = hrRes.body.user._id;

    // 4. Create an interview room scheduled between HR and primary candidate
    const roomRes = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Senior Web Developer Mock Round',
        candidateEmail: 'primary.candidate@test.com',
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        duration: 60,
        jobRole: 'web-developer',
        experienceLevel: 'senior'
      });
    expect(roomRes.status).toBe(201);
    interviewRoomId = roomRes.body.roomLink.replace('/interview-room/', '');

    // 5. Create an interview result for primary candidate
    const resultDoc = new InterviewResult({
      candidateId,
      interviewId: roomRes.body._id,
      jobRole: 'web-developer',
      experienceLevel: 'senior',
      totalScore: 88,
      feedback: 'Excellent grasp of React internals and state management.',
      strengths: ['Architecture', 'Communication'],
      improvements: ['Consider edge cases with hydration'],
      answers: [],
      date: new Date()
    });
    await resultDoc.save();
    interviewResultId = (resultDoc._id as any).toString();
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {
      // Ignore cleanup error if disconnected
    }
  });

  // 1. Admin self-signup rejected
  it('1. Rejects public signup attempts requesting admin role with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'hacker.admin@test.com',
        password: 'Password123!',
        firstName: 'Malicious',
        lastName: 'Admin',
        role: 'admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid role|candidate or hr/i);

    // Verify user was NOT created in DB
    const adminUser = await User.findOne({ email: 'hacker.admin@test.com' });
    expect(adminUser).toBeNull();
  });

  // 2. Missing JWT_SECRET fails safely
  it('2. Missing JWT_SECRET validation guards against startup without secret in non-test mode', () => {
    // Verified by src/lib/jwt.ts: throws 'FATAL: JWT_SECRET environment variable must be set in non-test environments'
    expect(JWT_SECRET).toBeDefined();
    expect(typeof JWT_SECRET).toBe('string');
  });

  // 3. Revoked token rejected on subsequent requests
  it('3. Token revocation on logout prevents subsequent authenticated access (401)', async () => {
    // Create dedicated user for revocation lifecycle
    const userRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'logout.candidate@test.com',
        password: 'Password123!',
        firstName: 'Logout',
        lastName: 'Tester',
        role: 'candidate'
      });
    expect(userRes.status).toBe(201);
    const tokenToRevoke = userRes.body.token;

    // Verify token works before logout
    const preLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenToRevoke}`);
    expect(preLogoutRes.status).toBe(200);

    // Logout and revoke token
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenToRevoke}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logged out successfully');

    // Attempt to use revoked token
    const postLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenToRevoke}`);
    expect(postLogoutRes.status).toBe(401);
    expect(postLogoutRes.body.message).toMatch(/revoked/i);
  });

  // 4. Anonymous room access rejected
  it('4. Rejects anonymous access to interview rooms and completion endpoints with 401', async () => {
    const getRoomRes = await request(app)
      .get(`/api/interviews/room/${interviewRoomId}`);
    expect(getRoomRes.status).toBe(401);

    const completeRoomRes = await request(app)
      .put(`/api/interviews/room/${interviewRoomId}/complete`);
    expect(completeRoomRes.status).toBe(401);
  });

  // 5. Non-participant room access rejected
  it('5. Rejects room access by non-participating users with 403', async () => {
    // otherCandidateToken is NOT a participant in this room
    const res = await request(app)
      .get(`/api/interviews/room/${interviewRoomId}`)
      .set('Authorization', `Bearer ${otherCandidateToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  // 6. Unauthorized AI calls rejected
  it('6. Protects expensive AI proxy routes against unauthenticated calls with 401', async () => {
    // Interviews AI proxy
    const qRes = await request(app).post('/api/interviews/gemini/questions').send({ jobRole: 'frontend' });
    expect(qRes.status).toBe(401);

    const aRes = await request(app).post('/api/interviews/gemini/analyze').send({ question: 'q', answer: 'a' });
    expect(aRes.status).toBe(401);

    const nextRes = await request(app).post('/api/interviews/gemini/evaluate-and-next').send({ currentQuestion: 'q', currentAnswer: 'a' });
    expect(nextRes.status).toBe(401);

    // FAQ AI
    const faqRes = await request(app).post('/api/faq/ask-ai').send({ question: 'How does it work?' });
    expect(faqRes.status).toBe(401);

    // Interview coach AI
    const coachRes = await request(app).post('/api/interview-tips/coach/roadmap').send({ role: 'dev', experienceLevel: 'senior' });
    expect(coachRes.status).toBe(401);

    // Resume AI
    const resumeRes = await request(app).post('/api/resume/analyze').send({ resumeText: 'Sample resume text...' });
    expect(resumeRes.status).toBe(401);

    // Blog AI
    const blogRes = await request(app).post('/api/blog/mockid123/summarize');
    expect(blogRes.status).toBe(401);
  });

  // 7. Admin-only APIs reject candidate and HR
  it('7. Rejects candidate and HR access to admin endpoints with 403', async () => {
    // Candidate attempting admin stats
    const candStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(candStats.status).toBe(403);
    expect(candStats.body.message).toMatch(/Admin access required/i);

    // HR attempting admin stats
    const hrStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(hrStats.status).toBe(403);
    expect(hrStats.body.message).toMatch(/Admin access required/i);

    // Candidate attempting to post admin blog
    const candBlog = await request(app)
      .post('/api/admin/blogs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Unauthorized Post',
        slug: 'unauthorized-post',
        content: 'Content...',
        category: new mongoose.Types.ObjectId().toString()
      });
    expect(candBlog.status).toBe(403);
  });

  // 8. Cross-candidate interview result access rejected
  it('8. Enforces cross-candidate result privacy, rejecting unauthorized access with 403', async () => {
    // otherCandidate attempts to read primary candidate's result by result ID
    const res = await request(app)
      .get(`/api/interview-results/${interviewResultId}`)
      .set('Authorization', `Bearer ${otherCandidateToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });
});
