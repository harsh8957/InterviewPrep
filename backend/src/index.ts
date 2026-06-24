import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/db';
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

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 