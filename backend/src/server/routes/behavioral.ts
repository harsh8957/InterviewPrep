import express from 'express';
import mongoose from 'mongoose';
import { BehavioralQuestion, StarStory } from '../../lib/models/BehavioralPrep';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  validateBody,
  createStarStorySchema,
  updateStarStorySchema,
} from '../../lib/validation';
import { aiService } from '../../services/aiService';

const router = express.Router();

/**
 * GET /api/behavioral/questions
 * List curated behavioral questions categorized by competency
 */
router.get('/questions', async (req, res) => {
  try {
    const { category } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (category && typeof category === 'string') {
      filter.category = category;
    }

    const questions = await BehavioralQuestion.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(questions);
  } catch (error) {
    console.error('Error fetching behavioral questions:', error);
    res.status(500).json({ message: 'Error fetching behavioral questions' });
  }
});

/**
 * GET /api/behavioral/stories
 * Retrieve all saved STAR stories for the authenticated candidate
 */
router.get('/stories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const stories = await StarStory.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('questionId', 'prompt category targetCompetency')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(stories);
  } catch (error) {
    console.error('Error fetching candidate STAR stories:', error);
    res.status(500).json({ message: 'Error fetching STAR stories' });
  }
});

/**
 * POST /api/behavioral/stories
 * Create a new STAR story bound to the candidate
 */
router.post(
  '/stories',
  authenticateToken,
  validateBody(createStarStorySchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const {
        title,
        category,
        questionId,
        situation,
        task,
        action,
        result,
        metrics,
        learnings,
        companyTags,
      } = req.body;

      const story = await StarStory.create({
        userId: new mongoose.Types.ObjectId(userId),
        ...(questionId && mongoose.Types.ObjectId.isValid(questionId)
          ? { questionId: new mongoose.Types.ObjectId(questionId) }
          : {}),
        title,
        category: category || 'general',
        situation,
        task,
        action,
        result,
        metrics: metrics || '',
        learnings: learnings || '',
        companyTags: companyTags || [],
      });

      res.status(201).json({
        success: true,
        story,
      });
    } catch (error) {
      console.error('Error creating STAR story:', error);
      res.status(500).json({ message: 'Error creating STAR story' });
    }
  }
);

/**
 * GET /api/behavioral/stories/:id
 * Retrieve a single STAR story (IDOR protected)
 */
router.get('/stories/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }

    const story = await StarStory.findById(req.params.id)
      .populate('questionId', 'prompt category targetCompetency')
      .lean();

    if (!story) {
      return res.status(404).json({ message: 'STAR story not found' });
    }

    // IDOR protection: candidate can only access their own story (admins can view)
    if (story.userId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden: you do not own this story' });
    }

    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ message: 'Error fetching story' });
  }
});

/**
 * PUT /api/behavioral/stories/:id
 * Update an existing STAR story (IDOR protected)
 */
router.put(
  '/stories/:id',
  authenticateToken,
  validateBody(updateStarStorySchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid story ID' });
      }

      const story = await StarStory.findById(req.params.id);
      if (!story) {
        return res.status(404).json({ message: 'STAR story not found' });
      }

      // IDOR protection
      if (story.userId.toString() !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access forbidden: you cannot edit this story' });
      }

      const {
        title,
        category,
        questionId,
        situation,
        task,
        action,
        result,
        metrics,
        learnings,
        companyTags,
      } = req.body;

      if (title !== undefined) story.title = title;
      if (category !== undefined) story.category = category;
      if (questionId !== undefined) {
        story.questionId = mongoose.Types.ObjectId.isValid(questionId)
          ? new mongoose.Types.ObjectId(questionId)
          : undefined;
      }
      if (situation !== undefined) story.situation = situation;
      if (task !== undefined) story.task = task;
      if (action !== undefined) story.action = action;
      if (result !== undefined) story.result = result;
      if (metrics !== undefined) story.metrics = metrics;
      if (learnings !== undefined) story.learnings = learnings;
      if (companyTags !== undefined) story.companyTags = companyTags;

      const updated = await story.save();

      res.json({
        success: true,
        story: updated,
      });
    } catch (error) {
      console.error('Error updating STAR story:', error);
      res.status(500).json({ message: 'Error updating STAR story' });
    }
  }
);

/**
 * DELETE /api/behavioral/stories/:id
 * Delete a STAR story (IDOR protected)
 */
router.delete('/stories/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }

    const story = await StarStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'STAR story not found' });
    }

    // IDOR protection
    if (story.userId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden: you cannot delete this story' });
    }

    await StarStory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'STAR story deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting STAR story:', error);
    res.status(500).json({ message: 'Error deleting STAR story' });
  }
});

/**
 * POST /api/behavioral/stories/:id/feedback
 * Generate structured feedback for a STAR story using evaluation rubric
 */
router.post('/stories/:id/feedback', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }

    const story = await StarStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'STAR story not found' });
    }

    if (story.userId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    let reviewResult;
    try {
      const prompt = `You are a Senior Technical Recruiter and Behavioral Interview Coach evaluating a candidate's STAR story.
Title: "${story.title}"
Category: ${story.category}
Situation: ${story.situation}
Task: ${story.task}
Action: ${story.action}
Result: ${story.result}
Metrics / Quantifiable Outcomes: ${story.metrics || 'None provided'}
Learnings: ${story.learnings || 'None provided'}

Evaluate the story based on the Amazon/Google behavioral bar:
1. Situation & Task: Was the context concise and the conflict/challenge clear?
2. Action: Did the candidate use "I" instead of "We"? Are specific engineering/leadership steps detailed?
3. Result & Metrics: Is the business impact quantified (% improvement, latency drop, revenue, downtime avoided)?
4. Reflection: Are mature self-learnings present?

Return ONLY valid JSON matching this exact structure:
{
  "clarityScore": 88,
  "impactScore": 82,
  "feedback": "Overall impression...",
  "strengths": ["Clear technical ownership", "Measurable latency reduction"],
  "improvements": ["Emphasize cross-functional stakeholder alignment"]
}`;

      const aiResponse = await aiService.generateJSON(prompt);
      if (
        aiResponse &&
        typeof aiResponse.clarityScore === 'number' &&
        typeof aiResponse.impactScore === 'number'
      ) {
        reviewResult = {
          clarityScore: Math.min(100, Math.max(0, Math.round(aiResponse.clarityScore))),
          impactScore: Math.min(100, Math.max(0, Math.round(aiResponse.impactScore))),
          feedback: aiResponse.feedback || 'Story feedback generated.',
          strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths.slice(0, 4) : [],
          improvements: Array.isArray(aiResponse.improvements) ? aiResponse.improvements.slice(0, 4) : [],
        };
      }
    } catch (aiErr) {
      console.warn('AI feedback service failed, using rubric heuristics:', aiErr);
    }

    // Heuristic fallback if AI unavailable
    if (!reviewResult) {
      const hasMetrics = Boolean(story.metrics && story.metrics.trim().length > 5);
      const actionLength = story.action.trim().length;
      let clarity = 75;
      let impact = hasMetrics ? 85 : 60;

      const strengths: string[] = ['Structured narrative following the STAR framework.'];
      const improvements: string[] = [];

      if (actionLength > 150) {
        clarity += 10;
        strengths.push('Detailed description of actions taken and personal ownership.');
      } else {
        improvements.push('Expand the Action section with specific tools, frameworks, and decision points.');
      }

      if (hasMetrics) {
        strengths.push('Included quantifiable outcome metrics demonstrating business impact.');
      } else {
        improvements.push('Quantify the result (e.g. "% latency reduced", "X engineers unblocked", "cost savings").');
      }

      if (story.learnings && story.learnings.trim().length > 20) {
        clarity += 5;
        strengths.push('Demonstrated self-awareness with explicit key learnings.');
      }

      reviewResult = {
        clarityScore: Math.min(95, clarity),
        impactScore: Math.min(95, impact),
        feedback: 'Heuristic evaluation based on STAR behavioral rubric.',
        strengths,
        improvements,
      };
    }

    story.aiReview = reviewResult;
    await story.save();

    res.json({
      success: true,
      review: reviewResult,
    });
  } catch (error) {
    console.error('Error reviewing STAR story:', error);
    res.status(500).json({ message: 'Error evaluating story' });
  }
});

export default router;
