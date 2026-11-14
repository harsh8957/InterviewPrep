import mongoose, { Document, Schema } from 'mongoose';

export type AttemptStatus = 'in-progress' | 'submitted' | 'expired';

export interface IProblemSubmissionRecord {
  problemId: mongoose.Types.ObjectId;
  submissionId?: mongoose.Types.ObjectId;
  passed: boolean;
  score: number;
}

export interface IAssessmentAttempt extends Document {
  assessmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  expiresAt: Date; // Authoritative server-side expiration timestamp
  submittedAt?: Date;
  status: AttemptStatus;
  problemSubmissions: IProblemSubmissionRecord[];
  totalScore: number;
  passed: boolean;
  tabSwitchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const problemSubmissionRecordSchema = new Schema<IProblemSubmissionRecord>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
    passed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const assessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'expired'],
      default: 'in-progress',
      index: true,
    },
    problemSubmissions: [problemSubmissionRecordSchema],
    totalScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    tabSwitchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, status: 1 });
assessmentAttemptSchema.index({ userId: 1, createdAt: -1 });

export const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model<IAssessmentAttempt>('AssessmentAttempt', assessmentAttemptSchema);
export default AssessmentAttempt;
