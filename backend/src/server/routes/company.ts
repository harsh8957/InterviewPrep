import express from 'express';
import { CompanyInfo, TeamMember } from '../../lib/models/CompanyInfo';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // There should only be one active company info document usually
    const info = await CompanyInfo.findOne().sort({ createdAt: -1 });
    const team = await TeamMember.find().sort({ order: 1 });
    
    res.json({ info, team });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company info' });
  }
});

export default router;
