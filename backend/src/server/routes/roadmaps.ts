import express from 'express';
import { RoadmapNode } from '../../lib/models/RoadmapNode';
import { Problem } from '../../lib/models/Problem';

const router = express.Router();

/**
 * GET /api/roadmaps
 * Lists all roadmap nodes in curriculum order with associated problems count and basic metadata.
 */
router.get('/', async (req, res) => {
  try {
    const nodes = await RoadmapNode.find()
      .sort({ order: 1 })
      .populate({
        path: 'associatedProblemIds',
        select: 'title slug difficulty topics patterns companyTags status',
        match: { status: 'published' }
      })
      .lean();

    const formattedNodes = nodes.map(node => ({
      _id: node._id,
      title: node.title,
      slug: node.slug,
      description: node.description,
      category: node.category,
      order: node.order,
      prerequisites: node.prerequisites || [],
      estimatedHours: node.estimatedHours,
      problemsCount: (node.associatedProblemIds || []).length,
      problems: node.associatedProblemIds || []
    }));

    res.json(formattedNodes);
  } catch (error) {
    console.error('Error fetching roadmap nodes:', error);
    res.status(500).json({ message: 'Error fetching roadmap nodes' });
  }
});

/**
 * GET /api/roadmaps/:slug
 * Retrieves a single roadmap node by slug with full associated problems.
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const node = await RoadmapNode.findOne({ slug })
      .populate({
        path: 'associatedProblemIds',
        select: 'title slug difficulty topics patterns companyTags constraints examples starterCode status',
        match: { status: 'published' }
      })
      .lean();

    if (!node) {
      return res.status(404).json({ message: 'Roadmap node not found' });
    }

    res.json(node);
  } catch (error) {
    console.error('Error fetching roadmap node:', error);
    res.status(500).json({ message: 'Error fetching roadmap node' });
  }
});

export default router;
