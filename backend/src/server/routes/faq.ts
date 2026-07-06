import express from 'express';
import { FAQ, FAQCategory } from '../../lib/models/FAQ';
import { aiService } from '../../services/aiService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await FAQCategory.find().sort({ order: 1 });
    const faqs = await FAQ.find().sort({ order: 1 });
    
    // Group by category
    const grouped = categories.map(cat => ({
      ...cat.toObject(),
      faqs: faqs.filter(faq => faq.category.toString() === cat._id.toString())
    }));
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs' });
  }
});

router.post('/ask-ai', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question required' });

    // Fetch all FAQs as context
    const allFaqs = await FAQ.find().populate('category', 'name');
    const faqContext = allFaqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    const prompt = `You are a helpful support assistant for the platform InterviewPrep (an AI mock interview platform).
    
Here are our official FAQs:
${faqContext}

User Question: "${question}"

First, see if the answer is completely covered in the FAQs. If so, provide the answer clearly.
If it is not covered or only partially covered, provide a polite, helpful response based on general knowledge of interview platforms, and suggest they contact support for account-specific issues.
Keep the answer under 3 paragraphs.`;

    const answer = await aiService.generateContent(prompt);
    
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: 'Error generating AI response' });
  }
});

export default router;
