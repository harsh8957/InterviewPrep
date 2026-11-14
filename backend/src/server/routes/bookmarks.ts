import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { BookmarkList, RevisionItem } from '../../lib/models/Bookmark';
import { recordUserActivity } from '../../services/progressService';

const router = express.Router();

router.use(authenticateToken);

const createListSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z.string().optional(),
});

const saveItemSchema = z.object({
  itemType: z.enum(['problem', 'system_design', 'core_cs', 'behavioral']),
  itemId: z.string(),
  itemSlug: z.string().min(1),
  itemTitle: z.string().min(1),
  difficulty: z.string().optional(),
  notes: z.string().max(2000).optional(),
  listId: z.string().optional(),
});

// ==================== BOOKMARK LISTS ====================

// GET /api/bookmarks/lists - User's custom lists
router.get('/lists', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const lists = await BookmarkList.find({ userId }).sort({ createdAt: 1 }).lean();

    // Attach item count to each list
    const listsWithCount = await Promise.all(
      lists.map(async (l) => {
        const count = await RevisionItem.countDocuments({ userId, listId: l._id });
        return { ...l, itemCount: count };
      })
    );

    res.json({
      success: true,
      lists: listsWithCount,
    });
  } catch (error) {
    console.error('Error fetching bookmark lists:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookmark lists' });
  }
});

// POST /api/bookmarks/lists - Create a list
router.post('/lists', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const parsed = createListSchema.parse(req.body);

    const existing = await BookmarkList.findOne({ userId, name: parsed.name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A list with this name already exists' });
    }

    const list = new BookmarkList({
      userId,
      name: parsed.name.trim(),
      description: parsed.description?.trim(),
      color: parsed.color || 'from-blue-600 to-indigo-600',
    });

    await list.save();
    res.status(201).json({ success: true, list });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid list data', errors: (error as any).errors || error.issues });
    }
    console.error('Error creating bookmark list:', error);
    res.status(500).json({ success: false, message: 'Failed to create bookmark list' });
  }
});

// DELETE /api/bookmarks/lists/:id - Delete list without deleting items
router.delete('/lists/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const list = await BookmarkList.findOneAndDelete({ _id: id, userId });
    if (!list) {
      return res.status(404).json({ success: false, message: 'Bookmark list not found' });
    }

    // Unlink items from deleted list
    await RevisionItem.updateMany({ userId, listId: id }, { $unset: { listId: 1 } });

    res.json({ success: true, message: 'Bookmark list deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark list:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bookmark list' });
  }
});

// ==================== BOOKMARK ITEMS ====================

// GET /api/bookmarks/items - List all saved bookmarks
router.get('/items', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { listId, itemType, search } = req.query;

    const filter: Record<string, any> = { userId };
    if (listId && typeof listId === 'string' && listId !== 'all') {
      filter.listId = listId;
    }
    if (itemType && typeof itemType === 'string' && itemType !== 'all') {
      filter.itemType = itemType;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { itemTitle: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await RevisionItem.find(filter)
      .populate('listId', 'name color')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error fetching bookmark items:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookmarks' });
  }
});

// POST /api/bookmarks/items - Save/Bookmark an item (idempotent)
router.post('/items', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const parsed = saveItemSchema.parse(req.body);

    const item = await RevisionItem.findOneAndUpdate(
      {
        userId,
        itemType: parsed.itemType,
        itemId: new mongoose.Types.ObjectId(parsed.itemId),
      },
      {
        $set: {
          itemSlug: parsed.itemSlug,
          itemTitle: parsed.itemTitle,
          difficulty: parsed.difficulty || 'medium',
          notes: parsed.notes || '',
          listId: parsed.listId ? new mongoose.Types.ObjectId(parsed.listId) : undefined,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // First review in 24 hours
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Item saved to bookmarks and revision queue',
      item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid bookmark data', errors: (error as any).errors || error.issues });
    }
    console.error('Error saving bookmark item:', error);
    res.status(500).json({ success: false, message: 'Failed to save bookmark item' });
  }
});

// DELETE /api/bookmarks/items/:id - Remove item from bookmarks
router.delete('/items/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await RevisionItem.findOneAndDelete({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Bookmark item not found' });
    }

    res.json({ success: true, message: 'Item removed from bookmarks' });
  } catch (error) {
    console.error('Error removing bookmark item:', error);
    res.status(500).json({ success: false, message: 'Failed to remove bookmark item' });
  }
});

// PATCH /api/bookmarks/items/:id/notes - Update notes on a bookmark
router.patch('/items/:id/notes', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const item = await RevisionItem.findOneAndUpdate(
      { _id: id, userId },
      { $set: { notes: typeof notes === 'string' ? notes.trim() : '' } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Bookmark item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating bookmark notes:', error);
    res.status(500).json({ success: false, message: 'Failed to update notes' });
  }
});

// ==================== SPACED REPETITION REVISION QUEUE ====================

// GET /api/bookmarks/revision-queue - Items due for revision today
router.get('/revision-queue', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const [dueItems, totalActiveCount, completedCount] = await Promise.all([
      RevisionItem.find({
        userId,
        isCompleted: false,
        nextReviewAt: { $lte: now },
      })
        .sort({ nextReviewAt: 1 })
        .lean(),
      RevisionItem.countDocuments({ userId, isCompleted: false }),
      RevisionItem.countDocuments({ userId, isCompleted: true }),
    ]);

    res.json({
      success: true,
      dueCount: dueItems.length,
      totalActiveCount,
      completedCount,
      items: dueItems,
    });
  } catch (error) {
    console.error('Error fetching revision queue:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve revision queue' });
  }
});

// POST /api/bookmarks/revision-queue/:id/review - Record spaced repetition review
router.post('/revision-queue/:id/review', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { rating } = req.body; // 1: Again (Hard/Failed), 3: Good (Passed), 5: Easy (Mastered)

    if (![1, 3, 5].includes(rating)) {
      return res.status(400).json({ success: false, message: 'Rating must be 1 (Again), 3 (Good), or 5 (Easy)' });
    }

    const item = await RevisionItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Revision item not found' });
    }

    // SuperMemo SM-2 Interval Calculation
    let intervalDays = item.intervalDays || 1;
    let easeFactor = item.easeFactor || 2.5;

    if (rating === 1) {
      // Again: reset interval to 1 day, reduce ease
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 3) {
      // Good: multiply interval by ease factor
      intervalDays = Math.max(2, Math.round(intervalDays * easeFactor));
    } else if (rating === 5) {
      // Easy: bonus multiplier and increase ease factor
      intervalDays = Math.max(4, Math.round(intervalDays * easeFactor * 1.3));
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    }

    const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
    const reviewCount = (item.reviewCount || 0) + 1;
    const isCompleted = reviewCount >= 4 && rating === 5; // Marked mastered after multiple successful intervals

    item.reviewCount = reviewCount;
    item.lastReviewedAt = new Date();
    item.nextReviewAt = nextReviewAt;
    item.intervalDays = intervalDays;
    item.easeFactor = easeFactor;
    item.isCompleted = isCompleted;

    await item.save();

    // Record review activity for daily streak
    await recordUserActivity(userId, { type: 'revision' });

    res.json({
      success: true,
      message: 'Revision outcome recorded',
      intervalDays,
      nextReviewAt,
      isCompleted,
      item,
    });
  } catch (error) {
    console.error('Error recording revision outcome:', error);
    res.status(500).json({ success: false, message: 'Failed to record revision outcome' });
  }
});

export default router;
