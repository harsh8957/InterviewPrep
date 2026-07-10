import express from 'express';
import { ResumeGuide } from '../../lib/models/ResumeGuide';
import { aiService } from '../../services/aiService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const guides = await ResumeGuide.find().sort({ createdAt: -1 });
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume guides' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const guide = await ResumeGuide.findOne({ slug: req.params.slug });
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guide' });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Resume text is required' });

    const prompt = `You are an expert ATS (Applicant Tracking System) and technical recruiter.
Analyze the following resume text. Provide an estimated ATS score (0-100), identify key strengths, missing elements (e.g., missing metrics, weak action verbs), and provide 3 actionable tips for improvement.

Resume Text:
${resumeText}

Return ONLY a JSON object exactly like this:
{
  "atsScore": 75,
  "strengths": ["Clear progression", "Good technical skills list"],
  "missingElements": ["Quantifiable metrics in bullet points", "Summary section"],
  "tips": ["Add impact metrics (e.g. improved X by Y%)", "Use stronger action verbs"]
}

Do not return any markdown wrapping, just the JSON string.`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing resume' });
  }
});

router.post('/improve-bullet', async (req, res) => {
  try {
    const { bulletPoint } = req.body;
    if (!bulletPoint) return res.status(400).json({ message: 'Bullet point is required' });

    const prompt = `Rewrite the following resume bullet point to make it more impactful, metric-driven, and professional. 
Provide 3 different variations (e.g., one focused on action, one on metrics, one on leadership).

Original: "${bulletPoint}"

Return ONLY a JSON object exactly like this:
{
  "variations": [
    "Improved [X] by [Y]% through [Action]",
    "Led development of [Z] resulting in [Outcome]",
    "Architected [System] to solve [Problem]"
  ]
}

Do not return any markdown wrapping, just the JSON string.`;

    const aiResponse = await aiService.generateJSON(prompt);
    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ message: 'Error improving bullet point' });
  }
});

export default router;
