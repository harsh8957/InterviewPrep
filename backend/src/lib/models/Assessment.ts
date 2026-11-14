import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  title: string;
  slug: string;
  description: string;
  instructions: string[];
  durationMinutes: number;
  problemIds: mongoose.Types.ObjectId[];
  difficulty: 'easy' | 'medium' | 'hard';
  passingScore: number; // Percentage, e.g. 70
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    instructions: [{ type: String }],
    durationMinutes: { type: Number, required: true, default: 60 },
    problemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    passingScore: { type: Number, default: 70 },
    isPublished: { type: Boolean, default: true, index: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

assessmentSchema.index({ isPublished: 1, createdAt: -1 });

export const Assessment =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema);
export default Assessment;
