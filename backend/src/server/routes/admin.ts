import express from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { BlogPost, BlogCategory } from '../../lib/models/Blog';
import { FAQ, FAQCategory } from '../../lib/models/FAQ';
import { Job } from '../../lib/models/Job';
import { PolicyDocument } from '../../lib/models/PolicyDocument';
import { CompanyInfo, TeamMember } from '../../lib/models/CompanyInfo';
import { Problem } from '../../lib/models/Problem';
import { TestCase } from '../../lib/models/TestCase';
import { RoadmapNode } from '../../lib/models/RoadmapNode';
import {
  validateBody,
  createBlogSchema,
  createProblemSchema,
  updateProblemSchema,
  createRoadmapSchema,
  updateRoadmapSchema,
} from '../../lib/validation';

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      blogs: await BlogPost.countDocuments(),
      faqs: await FAQ.countDocuments(),
      jobs: await Job.countDocuments(),
      team: await TeamMember.countDocuments(),
      problems: await Problem.countDocuments(),
      roadmaps: await RoadmapNode.countDocuments(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ==================== PROBLEM MANAGEMENT ====================

// List problems with admin filter and pagination
router.get('/problems', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [{ title: searchRegex }, { topics: searchRegex }, { slug: searchRegex }];
    }

    const [problems, total] = await Promise.all([
      Problem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Problem.countDocuments(filter)
    ]);

    res.json({
      problems,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin problems' });
  }
});

// Create Problem (with test cases)
router.post('/problems', validateBody(createProblemSchema), async (req: AuthRequest, res) => {
  try {
    const { testCases, ...problemData } = req.body;

    const existing = await Problem.findOne({ slug: problemData.slug });
    if (existing) {
      return res.status(400).json({ message: `Problem with slug '${problemData.slug}' already exists` });
    }

    const problem = new Problem(problemData);
    await problem.save();

    if (Array.isArray(testCases) && testCases.length > 0) {
      const docs = testCases.map((tc: any, index: number) => ({
        problemId: problem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: !!tc.isHidden,
        order: tc.order ?? index + 1
      }));
      await TestCase.insertMany(docs);
    }

    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ message: 'Error creating problem' });
  }
});

// Update Problem
router.put('/problems/:id', validateBody(updateProblemSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { testCases, ...problemData } = req.body;

    const problem = await Problem.findByIdAndUpdate(id, problemData, { new: true });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (Array.isArray(testCases)) {
      await TestCase.deleteMany({ problemId: problem._id });
      if (testCases.length > 0) {
        const docs = testCases.map((tc: any, index: number) => ({
          problemId: problem._id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: !!tc.isHidden,
          order: tc.order ?? index + 1
        }));
        await TestCase.insertMany(docs);
      }
    }

    res.json(problem);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ message: 'Error updating problem' });
  }
});

// Delete Problem
router.delete('/problems/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    await TestCase.deleteMany({ problemId: id });
    // Also pull from associated roadmaps
    await RoadmapNode.updateMany(
      { associatedProblemIds: id },
      { $pull: { associatedProblemIds: id } }
    );
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ message: 'Error deleting problem' });
  }
});

// ==================== ROADMAP MANAGEMENT ====================

// List all roadmap nodes
router.get('/roadmaps', async (req, res) => {
  try {
    const nodes = await RoadmapNode.find().sort({ order: 1 }).lean();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roadmap nodes' });
  }
});

// Create Roadmap Node
router.post('/roadmaps', validateBody(createRoadmapSchema), async (req: AuthRequest, res) => {
  try {
    const existing = await RoadmapNode.findOne({ slug: req.body.slug });
    if (existing) {
      return res.status(400).json({ message: `Roadmap node with slug '${req.body.slug}' already exists` });
    }

    const node = new RoadmapNode(req.body);
    await node.save();
    res.status(201).json(node);
  } catch (error) {
    res.status(500).json({ message: 'Error creating roadmap node' });
  }
});

// Update Roadmap Node
router.put('/roadmaps/:id', validateBody(updateRoadmapSchema), async (req: AuthRequest, res) => {
  try {
    const node = await RoadmapNode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!node) {
      return res.status(404).json({ message: 'Roadmap node not found' });
    }
    res.json(node);
  } catch (error) {
    res.status(500).json({ message: 'Error updating roadmap node' });
  }
});

// Delete Roadmap Node
router.delete('/roadmaps/:id', async (req: AuthRequest, res) => {
  try {
    const node = await RoadmapNode.findByIdAndDelete(req.params.id);
    if (!node) {
      return res.status(404).json({ message: 'Roadmap node not found' });
    }
    res.json({ message: 'Roadmap node deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting roadmap node' });
  }
});

// ==================== EXISTING BLOG & POLICY ====================

// Create Blog with explicitly whitelisted fields
router.post('/blogs', validateBody(createBlogSchema), async (req: AuthRequest, res) => {
  try {
    const { title, slug, content, summary, category, tags, coverImage, status, publishedAt } = req.body;
    const blog = new BlogPost({
      title,
      slug,
      content,
      summary,
      category,
      tags: tags || [],
      coverImage,
      status: status || 'draft',
      publishedAt: publishedAt || (status === 'published' ? new Date() : undefined),
      author: req.user!.userId,
      likes: 0,
      comments: []
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog' });
  }
});

// Example: Update Policy
router.post('/policies', async (req, res) => {
  try {
    // Inactivate old
    await PolicyDocument.updateMany({ type: req.body.type }, { isActive: false });
    // Create new
    const policy = new PolicyDocument({ ...req.body, isActive: true });
    await policy.save();
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error updating policy' });
  }
});

export default router;
