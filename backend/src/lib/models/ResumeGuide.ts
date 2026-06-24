import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeGuide extends Document {
  title: string;
  slug: string;
  content: string;
  category: 'formatting' | 'content' | 'ats' | 'examples';
}

const resumeGuideSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['formatting', 'content', 'ats', 'examples'],
    required: true 
  }
}, { timestamps: true });

export const ResumeGuide = mongoose.model<IResumeGuide>('ResumeGuide', resumeGuideSchema);
