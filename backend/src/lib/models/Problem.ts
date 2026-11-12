import mongoose, { Document, Schema } from 'mongoose';

export interface IProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface IStarterCode {
  cpp?: string;
  java?: string;
  python?: string;
  javascript?: string;
  typescript?: string;
}

export interface IProblem extends Document {
  title: string;
  slug: string;
  statement: string; // Markdown
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  patterns: string[];
  constraints: string[];
  examples: IProblemExample[];
  starterCode: IStarterCode;
  hints: string[];
  editorial?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  status: 'published' | 'draft';
  companyTags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    statement: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },
    topics: [{ type: String, required: true, trim: true, index: true }],
    patterns: [{ type: String, trim: true }],
    constraints: [{ type: String, required: true }],
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String },
      },
    ],
    starterCode: {
      cpp: { type: String },
      java: { type: String },
      python: { type: String },
      javascript: { type: String },
      typescript: { type: String },
    },
    hints: [{ type: String }],
    editorial: { type: String },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      index: true,
    },
    companyTags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

problemSchema.index({ difficulty: 1, status: 1 });
problemSchema.index({ topics: 1, status: 1 });
problemSchema.index({ slug: 1, status: 1 });

export const Problem = mongoose.models.Problem || mongoose.model<IProblem>('Problem', problemSchema);
export default Problem;
