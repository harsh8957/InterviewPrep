import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../lib/jwt';
import { CompanyExperience } from '../../lib/models/CompanyExperience';
import { CompanyTrack } from '../../lib/models/CompanyTrack';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { validateExperiencePII } from '../../services/moderationService';

const router = express.Router();

const experienceRoundSchema = z.object({
  roundNumber: z.number().int().positive(),
  roundName: z.string().min(2),
  roundType: z.enum(['oa', 'technical_screen', 'onsite_coding', 'system_design', 'behavioral', 'hiring_manager']),
  durationMinutes: z.number().int().positive().default(45),
  questionsSummary: z.string().min(5),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const experienceQuestionSchema = z.object({
  questionText: z.string().min(5),
  topic: z.string().min(2),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  linkedProblemId: z.string().optional(),
});

const experienceCreateSchema = z.object({
  companyName: z.string().min(2).max(100),
  companySlug: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  experienceLevel: z.enum(['fresher', 'junior', 'mid-level', 'senior', 'lead']),
  interviewYear: z.number().int().min(2018).max(2030),
  interviewSeason: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'Spring', 'Summer', 'Fall', 'Winter']).default('Summer'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  outcome: z.enum(['Offer', 'Rejected', 'Pending', 'Withdrawn', 'Declined Offer']),
  isAnonymous: z.boolean().default(true),
  candidateHandle: z.string().optional(),
  rounds: z.array(experienceRoundSchema).min(1, 'Please add at least one interview round'),
  questions: z.array(experienceQuestionSchema).default([]),
  preparationTips: z.string().min(20, 'Please share helpful preparation tips or advice (min 20 characters)'),
  timelineNotes: z.string().optional(),
});

// GET /api/experiences - Public feed of approved experiences
router.get('/', async (req, res) => {
  try {
    const { company, role, difficulty, outcome, year, search, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { moderationStatus: 'approved' };

    if (company && typeof company === 'string' && company !== 'all') {
      filter.$or = [
        { companySlug: company.toLowerCase() },
        { companyName: { $regex: company, $options: 'i' } },
      ];
    }

    if (role && typeof role === 'string') {
      filter.role = { $regex: role, $options: 'i' };
    }

    if (difficulty && typeof difficulty === 'string' && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (outcome && typeof outcome === 'string' && outcome !== 'all') {
      filter.outcome = outcome;
    }

    if (year && typeof year === 'string' && year !== 'all') {
      filter.interviewYear = parseInt(year, 10);
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { preparationTips: { $regex: search, $options: 'i' } },
        { 'questions.questionText': { $regex: search, $options: 'i' } },
      ];
    }

    const [total, experiences] = await Promise.all([
      CompanyExperience.countDocuments(filter),
      CompanyExperience.find(filter)
        .select('-author -reports -moderationHistory -rejectionReason -__v')
        .populate('questions.linkedProblemId', 'title slug difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      experiences,
    });
  } catch (error) {
    console.error('Error fetching experiences feed:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve interview experiences' });
  }
});

// GET /api/experiences/my/submissions - Authenticated candidate's own submissions
router.get('/my/submissions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const submissions = await CompanyExperience.find({ author: userId })
      .select('-reports -__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('Error fetching candidate submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve your submissions' });
  }
});

// GET /api/experiences/:id - Detail view with access checks
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid experience ID' });
    }

    const experience = await CompanyExperience.findById(id)
      .populate('questions.linkedProblemId', 'title slug difficulty topics')
      .populate('companyTrackId', 'name slug tier logoUrl brandColor')
      .lean();

    if (!experience) {
      return res.status(404).json({ success: false, message: 'Interview experience not found' });
    }

    // If not approved, check if request is by the author or an admin
    if (experience.moderationStatus !== 'approved') {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(403).json({ success: false, message: 'This experience is pending moderation review' });
      }

      // Verify token manually for optional auth route
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        const isAuthor = decoded.userId === experience.author.toString();
        const isAdmin = decoded.role === 'admin';
        if (!isAuthor && !isAdmin) {
          return res.status(403).json({ success: false, message: 'This experience is pending moderation review' });
        }
      } catch (err) {
        return res.status(403).json({ success: false, message: 'This experience is pending moderation review' });
      }
    }

    // Sanitize author if anonymous
    const result: any = { ...experience };
    if (result.isAnonymous) {
      delete result.author;
    }

    res.json({
      success: true,
      experience: result,
    });
  } catch (error) {
    console.error('Error fetching experience detail:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve experience details' });
  }
});

// POST /api/experiences - Submit a new interview experience
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const parsed = experienceCreateSchema.parse(req.body);

    // Rate limit check: max 5 submissions in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissionsCount = await CompanyExperience.countDocuments({
      author: userId,
      createdAt: { $gte: oneDayAgo },
    });

    if (recentSubmissionsCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Submission limit reached. You can submit up to 5 experiences per 24 hours.',
      });
    }

    // PII Detection and validation
    const piiCheck = validateExperiencePII({
      preparationTips: parsed.preparationTips,
      timelineNotes: parsed.timelineNotes,
      rounds: parsed.rounds,
      questions: parsed.questions,
    });

    if (!piiCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'PII Protection Violation: Personal Identifiable Information detected.',
        violations: piiCheck.violations,
      });
    }

    // Resolve matching CompanyTrack if present
    const track = await CompanyTrack.findOne({ slug: parsed.companySlug.toLowerCase() });

    const experience = new CompanyExperience({
      ...parsed,
      companySlug: parsed.companySlug.toLowerCase(),
      companyTrackId: track ? track._id : undefined,
      author: new mongoose.Types.ObjectId(userId),
      candidateHandle: parsed.isAnonymous
        ? (parsed.candidateHandle || 'Anonymous Candidate')
        : (parsed.candidateHandle || 'Candidate'),
      moderationStatus: 'pending',
      moderationHistory: [
        {
          action: 'submitted',
          performedBy: new mongoose.Types.ObjectId(userId),
          timestamp: new Date(),
          notes: 'Initial candidate submission awaiting moderation',
        },
      ],
    });

    await experience.save();

    res.status(201).json({
      success: true,
      message: 'Interview experience submitted successfully. It is now pending moderation review before public listing.',
      experienceId: experience._id,
      moderationStatus: experience.moderationStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid submission data', errors: (error as any).errors || error.issues });
    }
    console.error('Error submitting interview experience:', error);
    res.status(500).json({ success: false, message: 'Failed to submit interview experience' });
  }
});

// PUT /api/experiences/:id - Author edit of pending/rejected experience
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const experience = await CompanyExperience.findById(id);

    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    if (experience.author.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only edit your own interview experience' });
    }

    const parsed = experienceCreateSchema.partial().parse(req.body);

    // Validate PII on updated fields
    const piiCheck = validateExperiencePII({
      preparationTips: parsed.preparationTips || experience.preparationTips,
      timelineNotes: parsed.timelineNotes || experience.timelineNotes,
      rounds: parsed.rounds || experience.rounds,
      questions: parsed.questions || experience.questions,
    });

    if (!piiCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'PII Protection Violation: Personal Identifiable Information detected.',
        violations: piiCheck.violations,
      });
    }

    Object.assign(experience, parsed);
    // Reset to pending if edited by user
    if (req.user?.role !== 'admin') {
      experience.moderationStatus = 'pending';
    }

    experience.moderationHistory.push({
      action: 'edited',
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
      notes: 'Experience revised by author',
    });

    await experience.save();

    res.json({
      success: true,
      message: 'Experience updated and resubmitted for moderation review',
      experience,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid submission data', errors: (error as any).errors || error.issues });
    }
    console.error('Error updating experience:', error);
    res.status(500).json({ success: false, message: 'Failed to update experience' });
  }
});

// DELETE /api/experiences/:id - Author or admin deletion
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const experience = await CompanyExperience.findById(id);

    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    if (experience.author.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this experience' });
    }

    await CompanyExperience.findByIdAndDelete(id);
    res.json({ success: true, message: 'Interview experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ success: false, message: 'Failed to delete experience' });
  }
});

// POST /api/experiences/:id/report - Report an inappropriate experience
router.post('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid reason for reporting (min 5 chars)' });
    }

    const experience = await CompanyExperience.findById(id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    experience.reports.push({
      reportedBy: new mongoose.Types.ObjectId(userId),
      reason: reason.trim(),
      createdAt: new Date(),
    });

    experience.moderationHistory.push({
      action: 'reported',
      performedBy: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
      notes: `Reported by user for: ${reason.trim().slice(0, 100)}`,
    });

    await experience.save();

    res.json({
      success: true,
      message: 'Thank you for reporting. Our moderation team has been notified.',
    });
  } catch (error) {
    console.error('Error reporting experience:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
});

export default router;
