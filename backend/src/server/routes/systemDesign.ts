import express from 'express';
import mongoose from 'mongoose';
import { SystemDesignCase } from '../../lib/models/SystemDesignCase';
import { SystemDesignSubmission } from '../../lib/models/SystemDesignSubmission';
import { authenticateToken } from '../middleware/auth';
import { validateBody, saveSystemDesignSubmissionSchema } from '../../lib/validation';
import { aiService } from '../../services/aiService';

const router = express.Router();

/**
 * Sanitize Mermaid diagram input:
 * Disallows script tags or harmful HTML while permitting standard Mermaid syntax
 */
function sanitizeMermaidCode(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .trim();
}

/**
 * GET /api/system-design
 * List all published system design cases with catalog metadata
 */
router.get('/', async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const filter: Record<string, any> = { isPublished: true };

    if (type && (type === 'hld' || type === 'lld')) {
      filter.type = type;
    }
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty as string)) {
      filter.difficulty = difficulty;
    }

    const cases = await SystemDesignCase.find(filter)
      .select('slug title type difficulty scale summary architecturePillars order createdAt')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(cases);
  } catch (error) {
    console.error('Error fetching system design catalog:', error);
    res.status(500).json({ message: 'Error fetching system design cases' });
  }
});

/**
 * GET /api/system-design/:slug
 * Full details for a single system design problem
 */
router.get('/:slug', async (req, res) => {
  try {
    const designCase = await SystemDesignCase.findOne({
      slug: req.params.slug.toLowerCase(),
      isPublished: true,
    }).lean();

    if (!designCase) {
      return res.status(404).json({ message: 'System design case not found' });
    }

    res.json(designCase);
  } catch (error) {
    console.error('Error fetching system design case:', error);
    res.status(500).json({ message: 'Error fetching system design case' });
  }
});

/**
 * GET /api/system-design/:slug/attempt
 * Retrieve candidate's saved diagram, notes, and rubric scores
 */
router.get('/:slug/attempt', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const designCase = await SystemDesignCase.findOne({
      slug: req.params.slug.toLowerCase(),
      isPublished: true,
    });

    if (!designCase) {
      return res.status(404).json({ message: 'System design case not found' });
    }

    const submission = await SystemDesignSubmission.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      caseSlug: designCase.slug,
    }).lean();

    res.json({
      attempt: submission || null,
    });
  } catch (error) {
    console.error('Error fetching user system design attempt:', error);
    res.status(500).json({ message: 'Error fetching user system design attempt' });
  }
});

/**
 * POST /api/system-design/:slug/save
 * Save or update candidate's working draft (Mermaid diagram, architectural notes, rubric self-score)
 */
router.post(
  '/:slug/save',
  authenticateToken,
  validateBody(saveSystemDesignSubmissionSchema),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const designCase = await SystemDesignCase.findOne({
        slug: req.params.slug.toLowerCase(),
        isPublished: true,
      });

      if (!designCase) {
        return res.status(404).json({ message: 'System design case not found' });
      }

      const { mermaidDiagram, notes, rubricSelfScore } = req.body;
      const sanitizedDiagram = sanitizeMermaidCode(mermaidDiagram || '');

      const submission = await SystemDesignSubmission.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(userId),
          caseSlug: designCase.slug,
        },
        {
          $set: {
            caseId: designCase._id,
            mermaidDiagram: sanitizedDiagram,
            notes: notes || '',
            ...(rubricSelfScore ? { rubricSelfScore } : {}),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json({
        success: true,
        message: 'System design progress saved successfully',
        submission,
      });
    } catch (error) {
      console.error('Error saving system design submission:', error);
      res.status(500).json({ message: 'Error saving system design submission' });
    }
  }
);

/**
 * POST /api/system-design/:slug/critique
 * Optional AI architectural critique & rubric assessment
 */
router.post('/:slug/critique', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const designCase = await SystemDesignCase.findOne({
      slug: req.params.slug.toLowerCase(),
      isPublished: true,
    });

    if (!designCase) {
      return res.status(404).json({ message: 'System design case not found' });
    }

    const { notes, mermaidDiagram } = req.body;
    const candidateNotes = (notes || '').trim();
    const candidateDiagram = (mermaidDiagram || '').trim();

    if (!candidateNotes && !candidateDiagram) {
      return res.status(400).json({
        message: 'Please provide design notes or a diagram for architectural review.',
      });
    }

    // Attempt AI review via central AI service
    let critiqueResult;
    try {
      const prompt = `You are a Principal Distributed Systems Architect conducting a System Design Interview for:
Title: "${designCase.title}" (Target Scale: ${designCase.scale})
Functional Requirements: ${designCase.functionalRequirements.join(', ')}
Non-Functional Requirements: ${designCase.nonFunctionalRequirements.join(', ')}

Candidate Architecture Notes:
${candidateNotes.substring(0, 4000) || 'None provided'}

Candidate Architecture Diagram (Mermaid syntax):
${candidateDiagram.substring(0, 3000) || 'None provided'}

Evaluate the candidate's architecture against these 8 core dimensions:
1. Requirements Coverage
2. Data Modeling & Storage
3. High-Level Architecture & Separation of Concerns
4. Scalability & Bottlenecks
5. High Availability & Disaster Recovery
6. Fault Tolerance & Reliability
7. Security & API Protection
8. Trade-offs (CAP, Latency vs Consistency)

Return ONLY valid JSON matching this exact structure:
{
  "score": 85,
  "feedback": "Comprehensive architectural critique summary...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}`;

      const aiResponse = await aiService.generateJSON(prompt);
      if (
        aiResponse &&
        typeof aiResponse.score === 'number' &&
        Array.isArray(aiResponse.strengths) &&
        Array.isArray(aiResponse.improvements)
      ) {
        critiqueResult = {
          score: Math.min(100, Math.max(0, Math.round(aiResponse.score))),
          feedback: aiResponse.feedback || 'Architectural review generated.',
          strengths: aiResponse.strengths.slice(0, 5),
          improvements: aiResponse.improvements.slice(0, 5),
          evaluatedAt: new Date(),
        };
      }
    } catch (aiErr) {
      console.warn('AI critique service failed, using structured heuristic evaluation:', aiErr);
    }

    // Deterministic fallback critique if AI service is offline or unconfigured
    if (!critiqueResult) {
      const hasDiagram = candidateDiagram.length > 20;
      const notesWordCount = candidateNotes.split(/\s+/).filter(Boolean).length;
      let calculatedScore = 50;

      const strengths: string[] = [];
      const improvements: string[] = [];

      if (hasDiagram) {
        calculatedScore += 20;
        strengths.push('Included visual Mermaid topology showing component relationships.');
      } else {
        improvements.push('Add an architecture diagram illustrating load balancers, services, caches, and databases.');
      }

      if (notesWordCount >= 100) {
        calculatedScore += 15;
        strengths.push('Detailed written explanation covering operational behavior.');
      } else {
        improvements.push('Expand notes with concrete capacity math, QPS estimates, and storage projections.');
      }

      if (/cache|redis|memcache/i.test(candidateNotes)) {
        calculatedScore += 5;
        strengths.push('Explicitly identified caching strategy to reduce database load.');
      } else {
        improvements.push('Consider adding a dedicated caching tier (e.g., Redis) to satisfy read latencies.');
      }

      if (/shard|partition|replica/i.test(candidateNotes)) {
        calculatedScore += 5;
        strengths.push('Addressed data partitioning and replication strategies for horizontal scaling.');
      } else {
        improvements.push('Clarify database sharding keys and multi-region replication topology.');
      }

      critiqueResult = {
        score: Math.min(95, calculatedScore),
        feedback: `Automated architectural critique completed. Evaluated ${notesWordCount} words of design notes and ${hasDiagram ? 'valid' : 'no'} diagram topology against the target scale of ${designCase.scale}.`,
        strengths: strengths.length ? strengths : ['Clear attempt outlining initial components.'],
        improvements: improvements.length ? improvements : ['Evaluate edge failure scenarios and database failover.'],
        evaluatedAt: new Date(),
      };
    }

    // Persist critique in user submission
    await SystemDesignSubmission.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        caseSlug: designCase.slug,
      },
      {
        $set: {
          caseId: designCase._id,
          aiCritique: critiqueResult,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      critique: critiqueResult,
    });
  } catch (error) {
    console.error('Error generating system design critique:', error);
    res.status(500).json({ message: 'Error evaluating system design' });
  }
});

export default router;
