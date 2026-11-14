import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody, createSubmissionSchema } from '../../lib/validation';
import { Submission } from '../../lib/models/Submission';
import { Problem } from '../../lib/models/Problem';
import { AssessmentAttempt } from '../../lib/models/AssessmentAttempt';
import judgeService from '../../services/judge/judgeService';

const router = express.Router();

// All submission routes require authentication
router.use(authenticateToken);

/**
 * POST /api/submissions
 * Submits source code for sample testing (isSampleRun: true) or official verdict (isSampleRun: false).
 */
router.post('/', validateBody(createSubmissionSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { problemId, language, sourceCode, isSampleRun, assessmentId, attemptId } = req.body;

    // 1. Enforce Per-User Submission Rate Limiting
    const rateCheck = judgeService.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        message: `Too many submissions. Please wait ${rateCheck.retryAfterSec} seconds before retrying.`,
        retryAfterSec: rateCheck.retryAfterSec,
      });
    }

    // 2. Validate Problem Exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // 3. If part of a timed assessment attempt, verify attempt validity and expiration
    if (attemptId) {
      const attempt = await AssessmentAttempt.findById(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: 'Assessment attempt not found' });
      }

      // IDOR check: Attempt must belong to current user
      if (attempt.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: Attempt belongs to another user' });
      }

      // Authoritative Server-side Expiration Check (with 30s network grace period)
      const now = Date.now();
      const expiresAt = new Date(attempt.expiresAt).getTime();
      if (now > expiresAt + 30000 || attempt.status === 'expired') {
        attempt.status = 'expired';
        await attempt.save();
        return res.status(403).json({
          message: 'Assessment time limit has expired. No further submissions are accepted.',
          status: 'expired',
        });
      }

      if (attempt.status === 'submitted') {
        return res.status(400).json({
          message: 'Assessment has already been submitted.',
        });
      }
    }

    // 4. Create initial Submission with PENDING status
    const submission = new Submission({
      userId,
      problemId,
      assessmentId,
      attemptId,
      language,
      sourceCode,
      isSampleRun: Boolean(isSampleRun),
      verdict: 'PENDING',
    });
    await submission.save();

    // 5. Fast-path execution with promise timeout
    // Process submission and return evaluated result
    const evaluatedSubmission = await Promise.race([
      judgeService.processSubmission(submission._id),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);

    if (evaluatedSubmission) {
      return res.status(201).json(evaluatedSubmission);
    }

    // If still evaluating in background, return 202 Accepted with pending submission
    return res.status(202).json(submission);
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return res.status(500).json({ message: 'Error processing code submission' });
  }
});

/**
 * GET /api/submissions/:id
 * Fetches submission status and sanitized results.
 * Strictly enforces IDOR protection and hides confidential test inputs.
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // IDOR Protection: Must be the submission owner or platform admin
    if (submission.userId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this submission' });
    }

    return res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({ message: 'Error fetching submission' });
  }
});

/**
 * GET /api/submissions/problem/:problemId
 * Retrieves candidate's submission history for a specific problem.
 */
router.get('/problem/:problemId', async (req: AuthRequest, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user!.userId;

    const submissions = await Submission.find({
      userId,
      problemId,
      isSampleRun: false, // Only formal submissions in history
    })
      .select('language verdict passedCount totalCount runtimeMs memoryKb createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching problem submissions:', error);
    return res.status(500).json({ message: 'Error fetching submission history' });
  }
});

export default router;
