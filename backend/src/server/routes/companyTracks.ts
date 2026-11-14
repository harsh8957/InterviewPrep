import express from 'express';
import { z } from 'zod';
import { CompanyTrack } from '../../lib/models/CompanyTrack';
import { CompanyExperience } from '../../lib/models/CompanyExperience';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

const targetRoleSchema = z.object({
  role: z.string().min(2),
  level: z.string().min(1),
  focusAreas: z.array(z.string()).default([]),
});

const trackRoundSchema = z.object({
  roundName: z.string().min(2),
  type: z.enum(['oa', 'coding', 'system_design', 'core_cs', 'behavioral', 'hiring_manager']),
  description: z.string().min(5),
  durationMinutes: z.number().int().positive().default(45),
  keyTips: z.array(z.string()).default([]),
});

const companyTrackCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  tier: z.enum(['faang_tier', 'enterprise_saas', 'high_growth_startup', 'fintech']),
  logoUrl: z.string().optional(),
  brandColor: z.string().optional(),
  description: z.string().min(10),
  headquarters: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
  hiringBarOverview: z.string().min(20),
  culturePrinciples: z.array(z.string()).default([]),
  targetRoles: z.array(targetRoleSchema).default([]),
  rounds: z.array(trackRoundSchema).default([]),
  linkedProblemIds: z.array(z.string()).default([]),
  linkedSystemDesignIds: z.array(z.string()).default([]),
  linkedBehavioralIds: z.array(z.string()).default([]),
  linkedAssessmentIds: z.array(z.string()).default([]),
  coreCsTopics: z.array(z.string()).default([]),
  status: z.enum(['published', 'draft']).default('published'),
});

// GET /api/company-tracks - Public catalog
router.get('/', async (req, res) => {
  try {
    const { tier, search } = req.query;
    const filter: Record<string, any> = { status: 'published' };

    if (tier && typeof tier === 'string' && tier !== 'all') {
      filter.tier = tier;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'targetRoles.role': { $regex: search, $options: 'i' } },
      ];
    }

    const tracks = await CompanyTrack.find(filter)
      .select('-__v')
      .sort({ name: 1 })
      .lean();

    // Populate live experience count for each track
    const tracksWithLiveStats = await Promise.all(
      tracks.map(async (t) => {
        const approvedCount = await CompanyExperience.countDocuments({
          companySlug: t.slug,
          moderationStatus: 'approved',
        });
        return {
          ...t,
          stats: {
            totalProblems: t.linkedProblemIds?.length || 0,
            totalSystemDesign: t.linkedSystemDesignIds?.length || 0,
            experienceCount: approvedCount,
          },
        };
      })
    );

    res.json({
      success: true,
      count: tracksWithLiveStats.length,
      tracks: tracksWithLiveStats,
    });
  } catch (error) {
    console.error('Error fetching company tracks:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company tracks' });
  }
});

// GET /api/company-tracks/:slug - Public detailed track view
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const track = await CompanyTrack.findOne({ slug, status: 'published' })
      .populate('linkedProblemIds', 'title slug difficulty topics patterns timeComplexity spaceComplexity')
      .populate('linkedSystemDesignIds', 'title slug type summary difficulty')
      .populate('linkedBehavioralIds', 'prompt category competency')
      .populate('linkedAssessmentIds', 'title slug durationMinutes difficulty problemIds')
      .lean();

    if (!track) {
      return res.status(404).json({ success: false, message: 'Company preparation track not found' });
    }

    // Fetch approved community interview experiences for this track
    const experiences = await CompanyExperience.find({
      companySlug: slug,
      moderationStatus: 'approved',
    })
      .select('companyName companySlug role experienceLevel interviewYear interviewSeason difficulty outcome provenance rounds questions preparationTips candidateHandle isAnonymous createdAt')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    res.json({
      success: true,
      track: {
        ...track,
        stats: {
          totalProblems: track.linkedProblemIds?.length || 0,
          totalSystemDesign: track.linkedSystemDesignIds?.length || 0,
          experienceCount: experiences.length,
        },
      },
      experiences,
    });
  } catch (error) {
    console.error('Error fetching company track detail:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company track details' });
  }
});

// POST /api/company-tracks - Admin create
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const parsed = companyTrackCreateSchema.parse(req.body);
    const existing = await CompanyTrack.findOne({ $or: [{ slug: parsed.slug }, { name: parsed.name }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Track with this name or slug already exists' });
    }

    const track = new CompanyTrack({
      ...parsed,
      stats: {
        totalProblems: parsed.linkedProblemIds.length,
        totalSystemDesign: parsed.linkedSystemDesignIds.length,
        experienceCount: 0,
      },
    });

    await track.save();
    res.status(201).json({ success: true, track });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid track data', errors: (error as any).errors || error.issues });
    }
    console.error('Error creating company track:', error);
    res.status(500).json({ success: false, message: 'Failed to create company track' });
  }
});

// PUT /api/company-tracks/:id - Admin update
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = companyTrackCreateSchema.partial().parse(req.body);

    const track = await CompanyTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Company track not found' });
    }

    Object.assign(track, parsed);
    if (parsed.linkedProblemIds) {
      track.stats.totalProblems = parsed.linkedProblemIds.length;
    }
    if (parsed.linkedSystemDesignIds) {
      track.stats.totalSystemDesign = parsed.linkedSystemDesignIds.length;
    }

    await track.save();
    res.json({ success: true, track });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid track data', errors: (error as any).errors || error.issues });
    }
    console.error('Error updating company track:', error);
    res.status(500).json({ success: false, message: 'Failed to update company track' });
  }
});

// DELETE /api/company-tracks/:id - Admin delete
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const track = await CompanyTrack.findByIdAndDelete(id);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Company track not found' });
    }
    res.json({ success: true, message: 'Company track deleted successfully' });
  } catch (error) {
    console.error('Error deleting company track:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company track' });
  }
});

export default router;
