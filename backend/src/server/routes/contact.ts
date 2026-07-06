import express from 'express';
import { ContactMessage } from '../../lib/models/ContactMessage';
import { aiService } from '../../services/aiService';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // AI Intent Classification
    let intentTag = 'Other';
    try {
      const prompt = `Classify the intent of the following contact form message.
      Valid categories: Support, Sales, Feedback, Partnership, Hiring, Other.
      
      Subject: ${subject}
      Message: ${message}
      
      Return ONLY a JSON object exactly like this:
      {"intent": "Support"}
      
      Do not return any markdown wrapping, just the JSON string.`;
      
      const aiResponse = await aiService.generateJSON(prompt);
      if (['Support', 'Sales', 'Feedback', 'Partnership', 'Hiring', 'Other'].includes(aiResponse.intent)) {
        intentTag = aiResponse.intent;
      }
    } catch (e) {
      console.error('AI intent classification failed', e);
    }

    const contactMsg = new ContactMessage({
      name,
      email,
      subject,
      message,
      intentTag
    });

    await contactMsg.save();

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting contact message' });
  }
});

export default router;
