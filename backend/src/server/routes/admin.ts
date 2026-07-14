import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { BlogPost, BlogCategory } from '../../lib/models/Blog';
import { FAQ, FAQCategory } from '../../lib/models/FAQ';
import { Job } from '../../lib/models/Job';
import { PolicyDocument } from '../../lib/models/PolicyDocument';
import { CompanyInfo, TeamMember } from '../../lib/models/CompanyInfo';

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
      team: await TeamMember.countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Generic generic CRUD structure for the admin panel could go here. 
// For production, we'd have full endpoints for creating/updating/deleting all entities.

// Example: Create Blog
router.post('/blogs', async (req, res) => {
  try {
    const blog = new BlogPost({ ...req.body, author: req.user!.userId });
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

// We will keep admin routes minimal for this iteration as the focus is on the footer pages, 
// but the architecture is here for the admin scalable dashboard.

export default router;
