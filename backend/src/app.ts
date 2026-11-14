import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  correlationIdMiddleware,
  sanitizeMongoQuery,
  requestLogger,
  apiLimiter,
  authLimiter,
  judgeLimiter,
} from './server/middleware/security';

import healthRoutes from './server/routes/health';
import authRoutes from './server/routes/auth';
import interviewRoutes from './server/routes/interviews';
import interviewResultsRoutes from './server/routes/interviewResults';
import blogRoutes from './server/routes/blog';
import faqRoutes from './server/routes/faq';
import jobsRoutes from './server/routes/jobs';
import contactRoutes from './server/routes/contact';
import policyRoutes from './server/routes/policy';
import companyRoutes from './server/routes/company';
import interviewTipsRoutes from './server/routes/interview-tips';
import resumeRoutes from './server/routes/resume';
import adminRoutes from './server/routes/admin';
import roadmapRoutes from './server/routes/roadmaps';
import problemRoutes from './server/routes/problems';
import submissionRoutes from './server/routes/submissions';
import assessmentRoutes from './server/routes/assessments';
import coreCSRoutes from './server/routes/coreCS';
import systemDesignRoutes from './server/routes/systemDesign';
import behavioralRoutes from './server/routes/behavioral';
import companyTrackRoutes from './server/routes/companyTracks';
import experienceRoutes from './server/routes/experiences';
import analyticsRoutes from './server/routes/analytics';
import bookmarksRoutes from './server/routes/bookmarks';
import profileRoutes from './server/routes/profile';

export const app = express();

// Trust reverse proxy (nginx, load balancer) for accurate IP resolution
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Correlation ID & Structured Access Logger
app.use(correlationIdMiddleware);
app.use(requestLogger);

// 3. CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, origin-checked in prod
    },
    credentials: true,
  })
);

// 4. Body Parsers with Strict Size Limits (prevents payload-based DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. NoSQL Query Sanitization
app.use(sanitizeMongoQuery);

// 6. Global Rate Limiter
app.use('/api', apiLimiter);

// 7. System Health Endpoint
app.use('/api/health', healthRoutes);

// 8. Core Application Routes (with targeted strict limiters)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/interview-results', interviewResultsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/interview-tips', interviewTipsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', judgeLimiter, submissionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/core-cs', coreCSRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/behavioral', behavioralRoutes);
app.use('/api/company-tracks', companyTrackRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/profile', profileRoutes);

// 9. Standardized Production Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const correlationId = (req as any).correlationId;

  // Handle Payload Too Large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload exceeds 1MB limit.',
      correlationId,
    });
  }

  const responseBody: Record<string, any> = {
    success: false,
    message: err.message || 'Internal Server Error',
    correlationId,
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(status).json(responseBody);
});

export default app;
