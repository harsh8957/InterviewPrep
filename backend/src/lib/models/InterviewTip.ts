import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewTip extends Document {
  title: string;
  slug: string;
  content: string;
  category: 'behavioral' | 'technical' | 'general' | 'role-specific';
  role?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

const interviewTipSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['behavioral', 'technical', 'general', 'role-specific'],
    required: true 
  },
  role: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
}, { timestamps: true });

export const InterviewTip = mongoose.model<IInterviewTip>('InterviewTip', interviewTipSchema);
