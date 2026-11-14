import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ResumeGuide } from '../../lib/models/ResumeGuide';
import { ResumeProfile } from '../../lib/models/ResumeProfile';
import { aiService } from '../../services/aiService';
import { resumeService } from '../../services/resumeService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

interface MulterAuthRequest extends AuthRequest {
  file?: Express.Multer.File;
}

// Memory storage keeps uploaded PDF bytes in RAM during request processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Basic MIME filter
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only PDF documents (.pdf) are supported'));
    }
  },
});

/**
 * GET /api/resume/profile
 * Retrieve authenticated candidate's parsed resume profile
 */
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const profile = await ResumeProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    res.json(profile || null);
  } catch (error) {
    console.error('Error fetching resume profile:', error);
    res.status(500).json({ message: 'Error fetching resume profile' });
  }
});

/**
 * POST /api/resume/upload
 * Secure PDF resume upload, parsing, text extraction, and profile creation
 */
router.post(
  '/upload',
  authenticateToken,
  (req, res, next) => {
    upload.single('resume')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large: Resume cannot exceed 5MB' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message || 'File upload failed' });
      }
      next();
    });
  },
  async (req: MulterAuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'Please provide a PDF resume file' });
      }

      const targetRole = (req.body.targetRole || 'Full-Stack Software Engineer').trim();

      // 1. Extract text and validate PDF magic bytes
      let extractedText: string;
      try {
        extractedText = await resumeService.extractText(file.buffer);
      } catch (parseErr: any) {
        return res.status(400).json({ message: parseErr.message || 'Failed to parse PDF document' });
      }

      // 2. Extract structured profile via AI or deterministic fallback
      const analysis = await resumeService.extractStructuredProfile(extractedText, targetRole);

      // 3. Upsert ResumeProfile for authenticated user
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

      const profile = await ResumeProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            fileName: cleanFileName,
            fileSize: file.size,
            extractedText,
            targetRole,
            parsedProfile: analysis.parsedProfile,
            atsScore: analysis.atsScore,
            atsStrengths: analysis.atsStrengths,
            atsImprovements: analysis.atsImprovements,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({
        success: true,
        message: 'Resume parsed and profile generated successfully',
        profile,
      });
    } catch (error) {
      console.error('Error processing resume upload:', error);
      res.status(500).json({ message: 'Error processing resume upload' });
    }
  }
);

/**
 * DELETE /api/resume/profile
 * Remove candidate's resume profile (IDOR protected)
 */
router.delete('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const deleted = await ResumeProfile.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) {
      return res.status(404).json({ message: 'No resume profile found to delete' });
    }

    res.json({
      success: true,
      message: 'Resume profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resume profile:', error);
    res.status(500).json({ message: 'Error deleting resume profile' });
  }
});

// Existing Resume Guides Endpoints
router.get('/', async (req, res) => {
  try {
    const guides = await ResumeGuide.find().sort({ createdAt: -1 });
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume guides' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const guide = await ResumeGuide.findOne({ slug: req.params.slug });
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guide' });
  }
});

router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Resume text is required' });

    const prompt = `You are an expert ATS (Applicant Tracking System) and technical recruiter.
Analyze the following resume text. Provide an estimated ATS score (0-100), identify key strengths, missing elements (e.g., missing metrics, weak action verbs), and provide 3 actionable tips for improvement.

Resume Text:
${resumeText.substring(0, 10000)}

Return ONLY a JSON object exactly like this:
{
  "atsScore": 75,
  "strengths": ["Clear progression", "Good technical skills list"],
  "missingElements": ["Quantifiable metrics in bullet points", "Summary section"],
  "tips": ["Add impact metrics (e.g. improved X by Y%)", "Use stronger action verbs"]
}`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing resume' });
  }
});

router.post('/improve-bullet', authenticateToken, async (req, res) => {
  try {
    const { bulletPoint } = req.body;
    if (!bulletPoint) return res.status(400).json({ message: 'Bullet point is required' });

    const prompt = `Rewrite the following resume bullet point to make it more impactful, metric-driven, and professional. 
Provide 3 different variations (e.g., one focused on action, one on metrics, one on leadership).

Original: "${bulletPoint}"

Return ONLY a JSON object exactly like this:
{
  "variations": [
    "Improved [X] by [Y]% through [Action]",
    "Led development of [Z] resulting in [Outcome]",
    "Architected [System] to solve [Problem]"
  ]
}`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error improving bullet point' });
  }
});

export default router;
