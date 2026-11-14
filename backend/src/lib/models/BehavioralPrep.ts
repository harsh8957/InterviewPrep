import mongoose, { Document, Schema } from 'mongoose';

export type BehavioralCategory =
  | 'leadership'
  | 'conflict'
  | 'failure'
  | 'teamwork'
  | 'problem-solving'
  | 'adaptability'
  | 'general';

export interface IExampleSTAR {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface IBehavioralQuestion extends Document {
  slug: string;
  prompt: string;
  category: BehavioralCategory;
  targetCompetency: string;
  exampleSTAR: IExampleSTAR;
  tips: string[];
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStarStory extends Document {
  userId: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  title: string;
  category: BehavioralCategory;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics?: string;
  learnings?: string;
  companyTags: string[];
  aiReview?: {
    clarityScore: number;
    impactScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const behavioralQuestionSchema = new Schema<IBehavioralQuestion>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['leadership', 'conflict', 'failure', 'teamwork', 'problem-solving', 'adaptability', 'general'],
      required: true,
      index: true,
    },
    targetCompetency: {
      type: String,
      required: true,
    },
    exampleSTAR: {
      situation: { type: String, required: true },
      task: { type: String, required: true },
      action: { type: String, required: true },
      result: { type: String, required: true },
    },
    tips: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

behavioralQuestionSchema.index({ category: 1, order: 1 });

const starStorySchema = new Schema<IStarStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'BehavioralQuestion',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['leadership', 'conflict', 'failure', 'teamwork', 'problem-solving', 'adaptability', 'general'],
      default: 'general',
      required: true,
      index: true,
    },
    situation: {
      type: String,
      required: true,
    },
    task: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      required: true,
    },
    metrics: {
      type: String,
      default: '',
    },
    learnings: {
      type: String,
      default: '',
    },
    companyTags: {
      type: [String],
      default: [],
    },
    aiReview: {
      clarityScore: { type: Number, min: 0, max: 100 },
      impactScore: { type: Number, min: 0, max: 100 },
      feedback: { type: String },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

starStorySchema.index({ userId: 1, createdAt: -1 });

export const BehavioralQuestion = mongoose.model<IBehavioralQuestion>(
  'BehavioralQuestion',
  behavioralQuestionSchema
);

export const StarStory = mongoose.model<IStarStory>('StarStory', starStorySchema);
