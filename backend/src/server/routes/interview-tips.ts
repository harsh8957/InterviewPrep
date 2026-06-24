import express from 'express';
import { InterviewTip } from '../../lib/models/InterviewTip';
import { aiService } from '../../services/aiService';

const router = express.Router();

// Get tips
router.get('/', async (req, res) => {
  try {
    const { category, role, difficulty } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (role) query.role = role;
    if (difficulty) query.difficulty = difficulty;

    const tips = await InterviewTip.find(query).sort({ createdAt: -1 });
    res.json(tips);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interview tips' });
  }
});

// Single tip
router.get('/:slug', async (req, res) => {
  try {
    const tip = await InterviewTip.findOne({ slug: req.params.slug });
    if (!tip) return res.status(404).json({ message: 'Tip not found' });
    res.json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tip' });
  }
});

// AI Interview Coach - Roadmap
router.post('/coach/roadmap', async (req, res) => {
  try {
    const { company, role, experienceLevel } = req.body;
    
    if (!role || !experienceLevel) {
      return res.status(400).json({ message: 'Role and experience level are required' });
    }

    const prompt = `You are an expert technical recruiter and interview coach. 
Create a detailed interview preparation roadmap for a candidate preparing for a ${role} role at ${company || 'a top tech company'} with ${experienceLevel} experience.

Return ONLY a JSON object exactly like this:
{
  "roadmap": [
    {"week": "Week 1", "topic": "Core Fundamentals", "focus": "Data structures and algorithms review", "resources": ["Resource A", "Resource B"]},
    {"week": "Week 2", "topic": "System Design", "focus": "Scalability patterns", "resources": ["Resource C"]}
  ],
  "expectedQuestions": ["Question 1", "Question 2", "Question 3"]
}

Do not return any markdown wrapping, just the JSON string.`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error generating roadmap' });
  }
});

// AI Answer Review
router.post('/coach/review', async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer required' });

    const prompt = `You are an expert interview coach. Review the candidate's answer to the interview question.
    
    Question: ${question}
    Answer: ${answer}
    
    Score the answer out of 100 on these four criteria: communication, technical_depth, confidence, clarity.
    Then provide 2 actionable improvement suggestions.
    
    Return ONLY a JSON object exactly like this:
    {
      "scores": {
        "communication": 85,
        "technical_depth": 70,
        "confidence": 90,
        "clarity": 80
      },
      "overall": 81,
      "suggestions": ["Use the STAR method", "Include more specific metrics"]
    }
    
    Do not return any markdown wrapping, just the JSON string.`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing answer' });
  }
});

export default router;
