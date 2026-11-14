import express from 'express';
import cors from 'cors';
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

export const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
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
app.use('/api/submissions', submissionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/core-cs', coreCSRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/behavioral', behavioralRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
