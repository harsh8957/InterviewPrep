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
import { Assessment } from '../../lib/models/Assessment';
import { Submission } from '../../lib/models/Submission';
import { CompanyTrack } from '../../lib/models/CompanyTrack';
import { CompanyExperience } from '../../lib/models/CompanyExperience';
import {
  validateBody,
  createBlogSchema,
  createProblemSchema,
  updateProblemSchema,
  createRoadmapSchema,
  updateRoadmapSchema,
  createAssessmentSchema,
  updateAssessmentSchema,
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
      assessments: await Assessment.countDocuments(),
      submissions: await Submission.countDocuments(),
      companyTracks: await CompanyTrack.countDocuments(),
      experiences: await CompanyExperience.countDocuments(),
      pendingExperiences: await CompanyExperience.countDocuments({ moderationStatus: 'pending' }),
      reportedExperiences: await CompanyExperience.countDocuments({ 'reports.0': { $exists: true } }),
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

// ==================== ASSESSMENT MANAGEMENT ====================

// List all assessments
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate('problemIds', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .lean();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessments' });
  }
});

// Create Assessment
router.post('/assessments', validateBody(createAssessmentSchema), async (req: AuthRequest, res) => {
  try {
    const existing = await Assessment.findOne({ slug: req.body.slug });
    if (existing) {
      return res.status(400).json({ message: `Assessment with slug '${req.body.slug}' already exists` });
    }

    const assessment = new Assessment(req.body);
    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assessment' });
  }
});

// Update Assessment
router.put('/assessments/:id', validateBody(updateAssessmentSchema), async (req: AuthRequest, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assessment' });
  }
});

// Delete Assessment
router.delete('/assessments/:id', async (req: AuthRequest, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assessment' });
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

// ==================== INTERVIEW EXPERIENCE MODERATION ====================

// List experiences for moderation review
router.get('/experiences', async (req, res) => {
  try {
    const { status, hasReports, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (status && typeof status === 'string' && status !== 'all') {
      filter.moderationStatus = status;
    }
    if (hasReports === 'true') {
      filter['reports.0'] = { $exists: true };
    }

    const [total, pendingCount, reportedCount, experiences] = await Promise.all([
      CompanyExperience.countDocuments(filter),
      CompanyExperience.countDocuments({ moderationStatus: 'pending' }),
      CompanyExperience.countDocuments({ 'reports.0': { $exists: true } }),
      CompanyExperience.find(filter)
        .populate('author', 'firstName lastName email')
        .populate('moderatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      pendingCount,
      reportedCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      experiences,
    });
  } catch (error) {
    console.error('Admin error fetching experiences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch experiences for moderation' });
  }
});

// Moderate experience: approve or reject
router.put('/experiences/:id/moderate', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, notes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
    }

    const experience = await CompanyExperience.findById(id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    const adminUserId = req.user!.userId;
    experience.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
    experience.moderatedBy = adminUserId as any;
    experience.moderatedAt = new Date();
    if (action === 'reject') {
      experience.rejectionReason = rejectionReason || 'Content does not meet publication standards';
    } else {
      experience.rejectionReason = undefined;
    }

    experience.moderationHistory.push({
      action: action === 'approve' ? 'approved' : 'rejected',
      performedBy: adminUserId as any,
      timestamp: new Date(),
      notes: notes || `Moderator marked as ${experience.moderationStatus}`,
    });

    await experience.save();

    res.json({
      success: true,
      message: `Experience successfully ${experience.moderationStatus}`,
      experience,
    });
  } catch (error) {
    console.error('Error moderating experience:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate experience' });
  }
});

// Admin edit content: remove or sanitize inappropriate sections
router.put('/experiences/:id/content', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { preparationTips, timelineNotes, notes } = req.body;

    const experience = await CompanyExperience.findById(id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }

    if (preparationTips) experience.preparationTips = preparationTips;
    if (timelineNotes !== undefined) experience.timelineNotes = timelineNotes;

    experience.moderationHistory.push({
      action: 'edited',
      performedBy: req.user!.userId as any,
      timestamp: new Date(),
      notes: notes || 'Admin content redaction / edit',
    });

    await experience.save();

    res.json({
      success: true,
      message: 'Experience content updated by moderator',
      experience,
    });
  } catch (error) {
    console.error('Error editing experience content:', error);
    res.status(500).json({ success: false, message: 'Failed to edit experience content' });
  }
});

// Admin delete experience
router.delete('/experiences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await CompanyExperience.findByIdAndDelete(id);
    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' });
    }
    res.json({ success: true, message: 'Experience permanently removed by admin' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ success: false, message: 'Failed to delete experience' });
  }
});

export default router;
