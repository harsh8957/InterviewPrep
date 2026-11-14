import mongoose, { Document, Schema } from 'mongoose';
import { CoreCSSubject } from './CoreCSQuizItem';

export interface IConceptAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  subject: CoreCSSubject;
  topic: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const conceptAttemptSchema = new Schema<IConceptAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'CoreCSQuizItem',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: ['os', 'dbms', 'cn', 'oop'],
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      index: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// One consolidated record per user per quiz item (upserted with latest result & incremented attempt count)
conceptAttemptSchema.index({ userId: 1, itemId: 1 }, { unique: true });
conceptAttemptSchema.index({ userId: 1, subject: 1, isCorrect: 1 });

export const ConceptAttempt = mongoose.model<IConceptAttempt>('ConceptAttempt', conceptAttemptSchema);
