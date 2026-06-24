import express from 'express';
import { PolicyDocument } from '../../lib/models/PolicyDocument';

const router = express.Router();

router.get('/privacy', async (req, res) => {
  try {
    const policy = await PolicyDocument.findOne({ type: 'privacy', isActive: true }).sort({ createdAt: -1 });
    if (!policy) return res.status(404).json({ message: 'Privacy policy not found' });
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy' });
  }
});

router.get('/terms', async (req, res) => {
  try {
    const terms = await PolicyDocument.findOne({ type: 'terms', isActive: true }).sort({ createdAt: -1 });
    if (!terms) return res.status(404).json({ message: 'Terms of service not found' });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching terms' });
  }
});

export default router;
