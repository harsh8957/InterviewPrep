import express from 'express';
import { Job, JobApplication } from '../../lib/models/Job';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { aiService } from '../../services/aiService';

const router = express.Router();

// Get active jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Apply for job
router.post('/:id/apply', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { resumeText, coverLetter } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job || !job.isActive) return res.status(404).json({ message: 'Job not available' });

    // Prevent duplicate applications
    const existing = await JobApplication.findOne({ job: job._id, user: req.user!.userId });
    if (existing) return res.status(400).json({ message: 'You have already applied for this role.' });

    // AI Match Score calculation
    let matchScore = 0;
    try {
      const prompt = `You are an AI ATS system. Rate the candidate's resume match against the job description on a scale of 0 to 100.
      
Job Title: ${job.title}
Job Description: ${job.description}
Job Requirements: ${job.requirements.join(', ')}

Candidate Resume:
${resumeText}

Return ONLY a JSON object exactly like this:
{"score": 85}

Do not return any markdown wrapping, just the JSON string.`;

      const aiResponse = await aiService.generateJSON(prompt);
      matchScore = aiResponse.score || 50;
    } catch (aiError) {
      console.error('AI match score failed:', aiError);
      // Fallback
      matchScore = 50;
    }

    const application = new JobApplication({
      job: job._id,
      user: req.user!.userId,
      resumeText,
      coverLetter,
      matchScore
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', matchScore });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application' });
  }
});

export default router;
