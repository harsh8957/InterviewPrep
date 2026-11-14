import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/echoprep_test';

describe('Phase 9: Production Hardening, Security & Health Subsystem', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // 1. Security Headers (Helmet)
  describe('HTTP Security Headers & Protection', () => {
    it('sets X-Content-Type-Options: nosniff to prevent MIME-sniffing', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options or CSP frame-ancestors to prevent clickjacking', async () => {
      const res = await request(app).get('/api/health');
      // Helmet either sets x-frame-options or content-security-policy
      const frameOpt = res.headers['x-frame-options'];
      const csp = res.headers['content-security-policy'];
      expect(frameOpt || csp).toBeDefined();
    });

    it('includes Content-Security-Policy directives', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  // 2. Request Correlation IDs
  describe('Request Tracing & Correlation ID Propagation', () => {
    it('generates a new unique UUID correlation ID when none is provided', async () => {
      const res = await request(app).get('/api/health');
      const correlationId = res.headers['x-correlation-id'];
      expect(correlationId).toBeDefined();
      // Should match standard UUID format
      expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('preserves and propagates an existing client X-Correlation-ID', async () => {
      const customId = 'client-trace-abc-12345';
      const res = await request(app)
        .get('/api/health')
        .set('X-Correlation-ID', customId);

      expect(res.headers['x-correlation-id']).toBe(customId);
      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  // 3. Health & Telemetry Subsystem
  describe('System Health Monitoring Endpoint (/api/health)', () => {
    it('returns system health status and database connectivity metrics', async () => {
      const res = await request(app).get('/api/health');

      expect([200, 503]).toContain(res.status);
      expect(res.body.status).toBeDefined();
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.system).toBeDefined();
      expect(res.body.system.memoryMb).toBeDefined();
      expect(res.body.subsystems).toBeDefined();
      expect(res.body.subsystems.database).toBeDefined();
    });
  });

  // 4. Payload Size Limiting (DoS Prevention)
  describe('Payload Size Enforcements', () => {
    it('rejects oversized JSON payloads exceeding 1MB limit', async () => {
      // Create a payload larger than 1MB (~1.2MB)
      const oversizedString = 'x'.repeat(1.2 * 1024 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', payload: oversizedString });

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('limit');
    });
  });

  // 5. NoSQL Injection & Query Sanitization
  describe('NoSQL Operator Sanitization', () => {
    it('strips dangerous MongoDB $ operators from untrusted input bodies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' }, // Classic NoSQL injection attempt
          password: 'password123',
        });

      // Email was stripped because key started with $; schema validation should reject missing email
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 6. Rate Limiting Enforcements
  describe('Rate Limiting Throttling Guardrails', () => {
    it('throttles excessive requests with 429 Too Many Requests when limit exceeded', async () => {
      // Send 35 requests with rate limit test header enabled
      let lastStatus = 200;
      for (let i = 0; i < 35; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'ratelimit@example.com', password: 'pass' });

        lastStatus = res.status;
        if (res.status === 429) break;
      }

      expect(lastStatus).toBe(429);
    });
  });
});
