import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

// Extend Express Request to include correlation ID
export interface SecureRequest extends Request {
  correlationId?: string;
  startTime?: number;
}

/**
 * Request Correlation ID Middleware
 * Assigns or propagates a unique correlation ID across requests and downstream microservices.
 */
export const correlationIdMiddleware = (req: SecureRequest, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const correlationId = (Array.isArray(existingId) ? existingId[0] : existingId) || uuidv4();

  req.correlationId = correlationId;
  req.startTime = Date.now();

  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);
  next();
};

/**
 * NoSQL Injection Sanitizer
 * Strips dangerous MongoDB operator keys ($where, $gt, etc.) from body and query strings.
 */
export const sanitizeMongoQuery = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Disallow keys starting with '$' or containing '.' in untrusted input
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleaned[key] = sanitize(value);
    }
    return cleaned;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  next();
};

/**
 * Standardized Rate Limiters
 */

// Global general API limiter (300 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Strict Authentication Limiter (30 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Strict AI Endpoint Limiter (40 requests per 15 minutes)
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    message: 'AI request quota temporarily exceeded. Please wait a few minutes before next prompt.',
  },
});

// Code Submission / Judge Execution Limiter (60 executions per 15 minutes)
export const judgeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    message: 'Code execution limit reached. Please wait before submitting additional runs.',
  },
});

/**
 * Structured Safe Logger
 * Logs request method, path, status, duration, and correlation ID without leaking passwords, tokens, or PII.
 */
export const requestLogger = (req: SecureRequest, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    // Exclude health checks from noisy logs in production
    if (req.path === '/api/health' && res.statusCode === 200) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 500) {
      console.error('[API_ERROR]', JSON.stringify(logEntry));
    } else if (res.statusCode >= 400) {
      console.warn('[API_WARN]', JSON.stringify(logEntry));
    } else {
      console.log('[API_ACCESS]', JSON.stringify(logEntry));
    }
  });
  next();
};
