import express from 'express';
import { Problem, IProblem } from '../../lib/models/Problem';
import { TestCase } from '../../lib/models/TestCase';

const router = express.Router();

/**
 * GET /api/problems
 * Search, filter and paginate published problems.
 * Query params: search, difficulty, topic, pattern, company, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { status: 'published' };

    if (req.query.difficulty && ['easy', 'medium', 'hard'].includes(req.query.difficulty as string)) {
      filter.difficulty = req.query.difficulty;
    }

    if (req.query.topic) {
      filter.topics = { $in: [req.query.topic as string] };
    }

    if (req.query.pattern) {
      filter.patterns = { $in: [req.query.pattern as string] };
    }

    if (req.query.company) {
      filter.companyTags = { $in: [new RegExp(`^${req.query.company}$`, 'i')] };
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { topics: searchRegex },
        { patterns: searchRegex },
        { companyTags: searchRegex }
      ];
    }

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('title slug difficulty topics patterns companyTags timeComplexity spaceComplexity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Problem.countDocuments(filter)
    ]);

    res.json({
      problems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Error fetching problems' });
  }
});

/**
 * GET /api/problems/:slug
 * Retrieves full details for a single published problem.
 * Explicitly excludes hidden test cases to protect evaluation integrity.
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug, status: 'published' });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Fetch only non-hidden test cases for display / playground preview
    const publicTestCases = await TestCase.find({
      problemId: problem._id,
      isHidden: false
    })
      .select('input expectedOutput order')
      .sort({ order: 1 })
      .lean();

    res.json({
      _id: problem._id,
      title: problem.title,
      slug: problem.slug,
      statement: problem.statement,
      difficulty: problem.difficulty,
      topics: problem.topics,
      patterns: problem.patterns,
      constraints: problem.constraints,
      examples: problem.examples,
      starterCode: problem.starterCode,
      hints: problem.hints,
      editorial: problem.editorial,
      timeComplexity: problem.timeComplexity,
      spaceComplexity: problem.spaceComplexity,
      companyTags: problem.companyTags,
      publicTestCases,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt
    });
  } catch (error) {
    console.error('Error fetching problem detail:', error);
    res.status(500).json({ message: 'Error fetching problem detail' });
  }
});

export default router;
