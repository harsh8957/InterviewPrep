import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { CoreCSQuizItem, CoreCSSubject } from '../../lib/models/CoreCSQuizItem';
import { ConceptAttempt } from '../../lib/models/ConceptAttempt';
import { authenticateToken } from '../middleware/auth';
import { validateBody, createConceptAttemptSchema } from '../../lib/validation';
import { getJwtSecret } from '../../lib/jwt';

const router = express.Router();

const VALID_SUBJECTS: CoreCSSubject[] = ['os', 'dbms', 'cn', 'oop'];

const SUBJECT_METADATA: Record<CoreCSSubject, { title: string; description: string; icon: string }> = {
  os: {
    title: 'Operating Systems & Concurrency',
    description: 'Process lifecycle, virtual memory, thread scheduling, deadlocks, and POSIX IPC primitives.',
    icon: 'Cpu',
  },
  dbms: {
    title: 'Database Management Systems',
    description: 'ACID guarantees, indexing structures, normalization, transaction isolation, and distributed scaling.',
    icon: 'Database',
  },
  cn: {
    title: 'Computer Networks & Protocols',
    description: 'OSI/TCP-IP models, TCP handshakes & congestion, DNS resolution, and HTTP/3 transport.',
    icon: 'Network',
  },
  oop: {
    title: 'Object-Oriented Design & Principles',
    description: 'SOLID engineering principles, core design patterns, abstraction, and compositional modeling.',
    icon: 'Boxes',
  },
};

// Helper to optionally resolve user from token without blocking public access
const getOptionalUserId = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string };
    return decoded.userId || null;
  } catch {
    return null;
  }
};

/**
 * GET /api/core-cs/subjects
 * Overview of all 4 subjects with topic counts, question counts, and user solved stats
 */
router.get('/subjects', async (req, res) => {
  try {
    const userId = getOptionalUserId(req);

    const subjectStats = await Promise.all(
      VALID_SUBJECTS.map(async (subj) => {
        const meta = SUBJECT_METADATA[subj];
        const publishedCount = await CoreCSQuizItem.countDocuments({ subject: subj, isPublished: true });
        const topics = await CoreCSQuizItem.distinct('topic', { subject: subj, isPublished: true });

        let solvedCount = 0;
        let attemptedCount = 0;

        if (userId) {
          solvedCount = await ConceptAttempt.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            subject: subj,
            isCorrect: true,
          });
          attemptedCount = await ConceptAttempt.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            subject: subj,
          });
        }

        return {
          id: subj,
          title: meta.title,
          description: meta.description,
          icon: meta.icon,
          totalQuestions: publishedCount,
          totalTopics: topics.length,
          topics,
          solvedCount,
          attemptedCount,
          masteryPercentage: publishedCount > 0 ? Math.round((solvedCount / publishedCount) * 100) : 0,
        };
      })
    );

    res.json(subjectStats);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching Core CS subjects' });
  }
});

/**
 * GET /api/core-cs/:subject/topics
 * Retrieve detailed topic curriculum for a given subject
 */
router.get('/:subject/topics', async (req, res) => {
  try {
    const subject = req.params.subject.toLowerCase() as CoreCSSubject;
    if (!VALID_SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(', ')}` });
    }

    const userId = getOptionalUserId(req);
    const topics = await CoreCSQuizItem.distinct('topic', { subject, isPublished: true });

    const topicStats = await Promise.all(
      topics.map(async (topic) => {
        const total = await CoreCSQuizItem.countDocuments({ subject, topic, isPublished: true });
        const formats = await CoreCSQuizItem.distinct('format', { subject, topic, isPublished: true });

        let solved = 0;
        if (userId) {
          const itemIds = await CoreCSQuizItem.find({ subject, topic, isPublished: true }).distinct('_id');
          solved = await ConceptAttempt.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            itemId: { $in: itemIds },
            isCorrect: true,
          });
        }

        return {
          name: topic,
          totalQuestions: total,
          solvedQuestions: solved,
          formats,
          isCompleted: total > 0 && solved >= total,
        };
      })
    );

    res.json({
      subject,
      metadata: SUBJECT_METADATA[subject],
      topics: topicStats,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Error fetching topic curriculum' });
  }
});

/**
 * GET /api/core-cs/:subject/items
 * Fetch conceptual quiz items and flashcards.
 * SECURITY: NEVER returns correctAnswerIndex or explanation before candidate attempts the item.
 */
router.get('/:subject/items', async (req, res) => {
  try {
    const subject = req.params.subject.toLowerCase() as CoreCSSubject;
    if (!VALID_SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(', ')}` });
    }

    const { topic, format, difficulty } = req.query;
    const filter: Record<string, any> = { subject, isPublished: true };

    if (topic && typeof topic === 'string') filter.topic = topic;
    if (format && typeof format === 'string') filter.format = format;
    if (difficulty && typeof difficulty === 'string') filter.difficulty = difficulty;

    const userId = getOptionalUserId(req);

    // Fetch user attempts if authenticated
    let userAttemptsMap: Record<string, { isCorrect: boolean; selectedOption: number; attemptCount: number }> = {};
    if (userId) {
      const attempts = await ConceptAttempt.find({
        userId: new mongoose.Types.ObjectId(userId),
        subject,
      }).lean();

      attempts.forEach((att) => {
        userAttemptsMap[att.itemId.toString()] = {
          isCorrect: att.isCorrect,
          selectedOption: att.selectedOption,
          attemptCount: att.attemptCount,
        };
      });
    }

    const items = await CoreCSQuizItem.find(filter)
      .sort({ topic: 1, order: 1 })
      .lean();

    // Sanitize items: DO NOT leak correctAnswerIndex or explanation unless already completed
    const sanitizedItems = items.map((item) => {
      const attempt = userAttemptsMap[item._id.toString()];
      const hasAttempted = Boolean(attempt);

      const baseItem = {
        _id: item._id,
        subject: item.subject,
        topic: item.topic,
        slug: item.slug,
        title: item.title,
        format: item.format,
        difficulty: item.difficulty,
        conceptExplanation: item.conceptExplanation,
        prompt: item.prompt,
        options: item.options,
        keyTakeaway: item.keyTakeaway,
        interviewTips: item.interviewTips,
        order: item.order,
        hasAttempted,
        userAttempt: attempt || null,
        // Flashcard back is visible in flashcard mode
        flashcardBack: item.format === 'flashcard' ? item.flashcardBack : undefined,
      };

      // Only reveal explanation and correct answer if user has already attempted this question
      if (hasAttempted || item.format === 'flashcard') {
        return {
          ...baseItem,
          correctAnswerIndex: item.correctAnswerIndex,
          explanation: item.explanation,
        };
      }

      return baseItem;
    });

    res.json(sanitizedItems);
  } catch (error) {
    console.error('Error fetching quiz items:', error);
    res.status(500).json({ message: 'Error fetching Core CS quiz items' });
  }
});

/**
 * POST /api/core-cs/attempts
 * Server-side grading of candidate answer, saving attempt and returning official explanation.
 */
router.post('/attempts', authenticateToken, validateBody(createConceptAttemptSchema), async (req, res) => {
  try {
    const { itemId, selectedOption, timeSpentSeconds } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await CoreCSQuizItem.findById(itemId);
    if (!item || !item.isPublished) {
      return res.status(404).json({ message: 'Quiz item not found' });
    }

    // Server-side grading
    const isCorrect = item.format === 'flashcard' ? true : item.correctAnswerIndex === selectedOption;

    // Upsert attempt to prevent duplicate progress inflation
    const existingAttempt = await ConceptAttempt.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      itemId: item._id,
    });

    let attempt;
    if (existingAttempt) {
      existingAttempt.selectedOption = selectedOption;
      existingAttempt.isCorrect = isCorrect || existingAttempt.isCorrect; // Preserve master status if ever solved correctly
      existingAttempt.timeSpentSeconds += timeSpentSeconds || 0;
      existingAttempt.attemptCount += 1;
      attempt = await existingAttempt.save();
    } else {
      attempt = await ConceptAttempt.create({
        userId: new mongoose.Types.ObjectId(userId),
        itemId: item._id,
        subject: item.subject,
        topic: item.topic,
        selectedOption,
        isCorrect,
        timeSpentSeconds: timeSpentSeconds || 0,
        attemptCount: 1,
      });
    }

    // Return grading result and explanation
    res.json({
      success: true,
      isCorrect,
      correctAnswerIndex: item.correctAnswerIndex,
      explanation: item.explanation,
      keyTakeaway: item.keyTakeaway,
      conceptExplanation: item.conceptExplanation,
      interviewTips: item.interviewTips,
      attemptCount: attempt.attemptCount,
    });
  } catch (error) {
    console.error('Error submitting concept attempt:', error);
    res.status(500).json({ message: 'Error submitting concept attempt' });
  }
});

/**
 * GET /api/core-cs/attempts
 * Retrieve candidate's attempt history and mastery metrics
 */
router.get('/attempts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const attempts = await ConceptAttempt.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('itemId', 'title slug format difficulty subject topic')
      .sort({ updatedAt: -1 })
      .lean();

    const totalAttempted = attempts.length;
    const totalCorrect = attempts.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    // Breakdown by subject
    const subjectBreakdown = VALID_SUBJECTS.map((subj) => {
      const subjectAttempts = attempts.filter((a) => a.subject === subj);
      const correct = subjectAttempts.filter((a) => a.isCorrect).length;
      return {
        subject: subj,
        title: SUBJECT_METADATA[subj].title,
        attempted: subjectAttempts.length,
        correct,
        accuracy: subjectAttempts.length > 0 ? Math.round((correct / subjectAttempts.length) * 100) : 0,
      };
    });

    res.json({
      totalAttempted,
      totalCorrect,
      accuracy,
      subjectBreakdown,
      history: attempts,
    });
  } catch (error) {
    console.error('Error fetching attempts history:', error);
    res.status(500).json({ message: 'Error fetching attempts history' });
  }
});

export default router;
