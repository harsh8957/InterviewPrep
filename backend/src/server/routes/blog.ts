import express from 'express';
import { BlogPost, BlogCategory } from '../../lib/models/Blog';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { aiService } from '../../services/aiService';

const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get blogs
router.get('/', async (req, res) => {
  try {
    const { category, tag, limit = 10, page = 1 } = req.query;
    const query: any = { status: 'published' };
    
    if (category) {
      const cat = await BlogCategory.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }
    if (tag) {
      query.tags = tag;
    }

    const blogs = await BlogPost.find(query)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
      
    const total = await BlogPost.countDocuments(query);

    res.json({ blogs, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs' });
  }
});

// Get single blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await BlogPost.findOne({ slug: req.params.slug, status: 'published' })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .populate('comments.user', 'firstName lastName');
      
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog' });
  }
});

// AI Summarize blog
router.post('/:id/summarize', async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const prompt = `Summarize the following career blog post in 2-3 concise bullet points:\n\nTitle: ${blog.title}\nContent: ${blog.content}`;
    const summary = await aiService.generateContent(prompt);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Error summarizing blog' });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const blog = await BlogPost.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.comments.push({
      user: req.user!.userId as any,
      text,
      createdAt: new Date()
    });
    
    await blog.save();
    
    // Return populated comment
    await blog.populate('comments.user', 'firstName lastName');
    const newComment = blog.comments[blog.comments.length - 1];
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// AI Learning Recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id).populate('category');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // In a real app, we might pass the user's reading history to AI. 
    // Here we just fetch related published posts in the same category or tags.
    const recommendations = await BlogPost.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    }).limit(3).select('title slug coverImage publishedAt summary');

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

export default router;
