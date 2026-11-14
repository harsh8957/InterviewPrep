import express from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../../lib/models/User';
import { UserProgress } from '../../lib/models/UserProgress';
import { syncUserProgress } from '../../services/progressService';

const router = express.Router();

const updateProfileSchema = z.object({
  headline: z.string().max(120).optional(),
  targetRole: z.string().max(80).optional(),
  skills: z.array(z.string().trim()).default([]),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  experienceYears: z.number().min(0).max(50).optional(),
  bio: z.string().max(1000).optional(),
  learningGoals: z.array(z.string().trim()).default([]),
  timezone: z.string().default('UTC'),
  isPublic: z.boolean().default(false),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/, 'Username must be lowercase alphanumeric with dashes or underscores').optional().or(z.literal('')),
});

// GET /api/profile/me - Authenticated current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// PUT /api/profile/me - Update profile fields
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const parsed = updateProfileSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check username uniqueness if changed
    if (parsed.username && parsed.username !== user.profile?.username) {
      const existing = await User.findOne({
        _id: { $ne: userId },
        'profile.username': parsed.username.toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username is already taken by another developer' });
      }
    }

    if (!user.profile) {
      user.profile = {};
    }

    Object.assign(user.profile, {
      ...parsed,
      username: parsed.username ? parsed.username.toLowerCase() : undefined,
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid profile data', errors: (error as any).errors || error.issues });
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// GET /api/profile/public/:username - Public developer profile
router.get('/public/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username required' });
    }

    const user = await User.findOne({
      'profile.username': username.toLowerCase(),
      'profile.isPublic': true,
    }).select('firstName lastName role profile createdAt');

    if (!user || !user.profile?.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Developer profile is private or does not exist.',
      });
    }

    // Fetch user public progress stats
    let progress: any = await UserProgress.findOne({ userId: user._id }).select(
      'totalSolved solvedByDifficulty streak topicMastery lastCalculatedAt'
    );

    if (!progress) {
      progress = await syncUserProgress(String(user._id));
    }

    res.json({
      success: true,
      developer: {
        name: `${user.firstName} ${user.lastName?.charAt(0) || ''}.`,
        username: user.profile.username,
        headline: user.profile.headline || 'Software Engineer',
        targetRole: user.profile.targetRole,
        skills: user.profile.skills || [],
        githubUrl: user.profile.githubUrl,
        linkedinUrl: user.profile.linkedinUrl,
        experienceYears: user.profile.experienceYears,
        bio: user.profile.bio,
        learningGoals: user.profile.learningGoals,
        memberSince: user.createdAt,
      },
      stats: {
        totalSolved: progress?.totalSolved || 0,
        solvedByDifficulty: progress?.solvedByDifficulty || { easy: 0, medium: 0, hard: 0 },
        streak: progress?.streak || { current: 0, longest: 0 },
        topMasteredTopics: (progress?.topicMastery || [])
          .filter((tm: any) => tm.masteryLevel === 'Mastered' || tm.masteryLevel === 'Proficient')
          .slice(0, 6)
          .map((tm: any) => ({ topic: tm.topic, level: tm.masteryLevel, solved: tm.problemsSolved })),
      },
    });
  } catch (error) {
    console.error('Error fetching public developer profile:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve developer profile' });
  }
});

export default router;
