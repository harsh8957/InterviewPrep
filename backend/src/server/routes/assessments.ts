import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Assessment } from '../../lib/models/Assessment';
import { AssessmentAttempt } from '../../lib/models/AssessmentAttempt';
import { Problem } from '../../lib/models/Problem';

const router = express.Router();

/**
 * GET /api/assessments
 * Lists all active published assessments.
 */
router.get('/', async (req, res) => {
  try {
    const assessments = await Assessment.find({ isPublished: true })
      .select('title slug description durationMinutes difficulty passingScore tags problemIds createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = assessments.map((a) => ({
      ...a,
      problemCount: a.problemIds?.length || 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
});

/**
 * GET /api/assessments/:slug
 * Retrieves assessment details with populated problems (statement, constraints, examples, starterCode).
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const assessment = await Assessment.findOne({ slug, isPublished: true })
      .populate({
        path: 'problemIds',
        select: 'title slug difficulty topics patterns constraints examples starterCode',
        match: { status: 'published' },
      })
      .lean();

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment detail:', error);
    res.status(500).json({ message: 'Error fetching assessment' });
  }
});

// Authentication required for attempt management
router.use(authenticateToken);

/**
 * POST /api/assessments/:slug/start
 * Starts a new timed attempt or resumes an existing in-progress attempt.
 * Server authoritatively computes expiresAt based on durationMinutes.
 */
router.post('/:slug/start', async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.userId;

    const assessment = await Assessment.findOne({ slug, isPublished: true });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const now = new Date();

    // Check if an in-progress attempt already exists for this candidate
    let attempt = await AssessmentAttempt.findOne({
      assessmentId: assessment._id,
      userId,
      status: 'in-progress',
    });

    if (attempt) {
      // Check if existing attempt has expired
      if (now.getTime() > new Date(attempt.expiresAt).getTime()) {
        attempt.status = 'expired';
        await attempt.save();
      } else {
        // Resume existing active attempt
        const remainingSeconds = Math.max(
          0,
          Math.floor((new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000)
        );
        return res.json({
          attempt,
          assessment,
          remainingSeconds,
          resumed: true,
        });
      }
    }

    // Create new attempt with authoritative server-side timestamps
    const startedAt = now;
    const expiresAt = new Date(startedAt.getTime() + assessment.durationMinutes * 60 * 1000);

    attempt = new AssessmentAttempt({
      assessmentId: assessment._id,
      userId,
      startedAt,
      expiresAt,
      status: 'in-progress',
      problemSubmissions: assessment.problemIds.map((pId: any) => ({
        problemId: pId,
        passed: false,
        score: 0,
      })),
      totalScore: 0,
      passed: false,
      tabSwitchCount: 0,
    });

    await attempt.save();

    const remainingSeconds = Math.floor((expiresAt.getTime() - startedAt.getTime()) / 1000);

    return res.status(201).json({
      attempt,
      assessment,
      remainingSeconds,
      resumed: false,
    });
  } catch (error) {
    console.error('Error starting assessment attempt:', error);
    return res.status(500).json({ message: 'Error starting assessment attempt' });
  }
});

/**
 * GET /api/assessments/attempts/:attemptId
 * Retrieves attempt status, remaining time, and solved problem checklist.
 * IDOR Protected.
 */
router.get('/attempts/:attemptId', async (req: AuthRequest, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const attempt = await AssessmentAttempt.findById(attemptId)
      .populate({
        path: 'assessmentId',
        select: 'title slug durationMinutes passingScore problemIds',
        populate: {
          path: 'problemIds',
          select: 'title slug difficulty topics constraints examples starterCode',
        },
      });

    if (!attempt) {
      return res.status(404).json({ message: 'Assessment attempt not found' });
    }

    // IDOR Protection: Must be attempt owner or platform admin
    if (attempt.userId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Access to another candidate attempt is denied' });
    }

    const now = Date.now();
    const expiresAt = new Date(attempt.expiresAt).getTime();
    let status = attempt.status;

    // Check expiration with 30s grace window
    if (status === 'in-progress' && now > expiresAt + 30000) {
      status = 'expired';
      await AssessmentAttempt.findByIdAndUpdate(attemptId, { status: 'expired' });
    }

    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return res.json({
      attempt: {
        ...attempt,
        status,
      },
      remainingSeconds,
    });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return res.status(500).json({ message: 'Error fetching assessment attempt' });
  }
});

/**
 * POST /api/assessments/attempts/:attemptId/submit
 * Finalizes assessment attempt, generates scorecard, and marks attempt submitted.
 * Rejects submissions after authoritative expiry.
 */
router.post('/attempts/:attemptId/submit', async (req: AuthRequest, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user!.userId;

    const attempt = await AssessmentAttempt.findById(attemptId).populate('assessmentId');
    if (!attempt) {
      return res.status(404).json({ message: 'Assessment attempt not found' });
    }

    // IDOR Protection
    if (attempt.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Cannot submit attempt belonging to another user' });
    }

    if (attempt.status === 'submitted') {
      return res.json({
        message: 'Assessment already submitted',
        attempt,
      });
    }

    const now = new Date();
    const expiresAt = new Date(attempt.expiresAt).getTime();

    // Check if submitted after expiration
    const isLate = now.getTime() > expiresAt + 30000;
    if (isLate && attempt.status !== 'expired') {
      attempt.status = 'expired';
    } else {
      attempt.status = 'submitted';
    }

    attempt.submittedAt = now;

    // Compute final scorecard
    const assessment = attempt.assessmentId as any;
    const passingThreshold = assessment?.passingScore || 70;

    const totalProblems = attempt.problemSubmissions.length || 1;
    const passedCount = attempt.problemSubmissions.filter((p: any) => p.passed).length;
    const totalScore = Math.round(
      attempt.problemSubmissions.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / totalProblems
    );

    attempt.totalScore = totalScore;
    attempt.passed = totalScore >= passingThreshold;

    await attempt.save();

    return res.json({
      message: isLate ? 'Assessment expired' : 'Assessment successfully submitted',
      attempt,
      scorecard: {
        totalScore,
        passingThreshold,
        passed: attempt.passed,
        passedProblemsCount: passedCount,
        totalProblemsCount: totalProblems,
        tabSwitchCount: attempt.tabSwitchCount,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
      },
    });
  } catch (error) {
    console.error('Error submitting assessment attempt:', error);
    return res.status(500).json({ message: 'Error submitting assessment' });
  }
});

/**
 * POST /api/assessments/attempts/:attemptId/telemetry
 * Transparent, opt-in tab switch tracking.
 */
router.post('/attempts/:attemptId/telemetry', async (req: AuthRequest, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user!.userId;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status === 'in-progress') {
      attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
      await attempt.save();
    }

    return res.json({ tabSwitchCount: attempt.tabSwitchCount });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating telemetry' });
  }
});

export default router;
