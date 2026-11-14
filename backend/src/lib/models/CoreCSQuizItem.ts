import mongoose, { Document, Schema } from 'mongoose';

export type CoreCSSubject = 'os' | 'dbms' | 'cn' | 'oop';
export type QuestionFormat = 'mcq' | 'scenario' | 'flashcard';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ICoreCSQuizItem extends Document {
  subject: CoreCSSubject;
  topic: string;
  slug: string;
  title: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  conceptExplanation: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  flashcardBack?: string;
  keyTakeaway: string;
  interviewTips?: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const coreCSQuizItemSchema = new Schema<ICoreCSQuizItem>(
  {
    subject: {
      type: String,
      enum: ['os', 'dbms', 'cn', 'oop'],
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ['mcq', 'scenario', 'flashcard'],
      default: 'mcq',
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      required: true,
    },
    conceptExplanation: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    explanation: {
      type: String,
      required: true,
    },
    flashcardBack: {
      type: String,
    },
    keyTakeaway: {
      type: String,
      default: '',
    },
    interviewTips: {
      type: String,
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

coreCSQuizItemSchema.index({ subject: 1, topic: 1, order: 1 });
coreCSQuizItemSchema.index({ subject: 1, format: 1 });

export const CoreCSQuizItem = mongoose.model<ICoreCSQuizItem>('CoreCSQuizItem', coreCSQuizItemSchema);
