import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { UserProgress } from '../../lib/models/UserProgress';
import { syncUserProgress } from '../../services/progressService';

const router = express.Router();

router.use(authenticateToken);

// GET /api/analytics/overview - Core overview metrics
router.get('/overview', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    let progress: any = await UserProgress.findOne({ userId });

    if (!progress) {
      progress = await syncUserProgress(userId);
    }

    res.json({
      success: true,
      overview: {
        totalSolved: progress.totalSolved || 0,
        solvedByDifficulty: progress.solvedByDifficulty || { easy: 0, medium: 0, hard: 0 },
        totalAttempts: progress.totalAttempts || 0,
        streak: progress.streak || { current: 0, longest: 0, lastActiveDate: '' },
        coreCsStats: progress.coreCsStats || { totalAttempts: 0, totalCorrect: 0, overallAccuracy: 0, bySubject: [] },
        systemDesignStats: progress.systemDesignStats || { totalSubmitted: 0, averageScore: 0 },
        mockInterviewStats: progress.mockInterviewStats || { totalCompleted: 0, averageScore: 0, scoreHistory: [] },
        assessmentStats: progress.assessmentStats || { totalAttempts: 0, passedCount: 0, averageScore: 0 },
        weakTopics: progress.weakTopics || [],
        nextRecommendations: progress.nextRecommendations || [],
        lastCalculatedAt: progress.lastCalculatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics overview' });
  }
});

// GET /api/analytics/heatmap - 365-day daily activity map
router.get('/heatmap', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    let progress: any = await UserProgress.findOne({ userId }).select('dailyActivity streak');

    if (!progress) {
      progress = await syncUserProgress(userId);
    }

    // Convert Mongoose Map to plain object
    const dailyActivity = progress.dailyActivity instanceof Map
      ? Object.fromEntries(progress.dailyActivity)
      : (progress.dailyActivity || {});

    res.json({
      success: true,
      streak: progress.streak,
      dailyActivity,
    });
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve activity heatmap' });
  }
});

// GET /api/analytics/topic-mastery - Detailed topic mastery breakdown
router.get('/topic-mastery', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    let progress: any = await UserProgress.findOne({ userId }).select('topicMastery weakTopics');

    if (!progress) {
      progress = await syncUserProgress(userId);
    }

    res.json({
      success: true,
      topicMastery: progress.topicMastery || [],
      weakTopics: progress.weakTopics || [],
    });
  } catch (error) {
    console.error('Error fetching topic mastery:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve topic mastery' });
  }
});

// GET /api/analytics/history - Interview score trends and assessment history
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    let progress: any = await UserProgress.findOne({ userId })
      .select('mockInterviewStats assessmentStats')
      .populate('mockInterviewStats.scoreHistory.resultId', 'jobRole totalScore createdAt');

    if (!progress) {
      progress = await syncUserProgress(userId);
    }

    res.json({
      success: true,
      mockInterviewStats: progress.mockInterviewStats,
      assessmentStats: progress.assessmentStats,
    });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve performance history' });
  }
});

// POST /api/analytics/sync - Force full idempotent progress recalculation
router.post('/sync', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const progress = await syncUserProgress(userId);

    res.json({
      success: true,
      message: 'User progress successfully synchronized directly from database events',
      progress,
    });
  } catch (error) {
    console.error('Error synchronizing user progress:', error);
    res.status(500).json({ success: false, message: 'Failed to synchronize user progress' });
  }
});

export default router;
