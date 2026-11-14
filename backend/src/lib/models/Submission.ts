import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionVerdict =
  | 'PENDING'
  | 'AC'
  | 'WA'
  | 'TLE'
  | 'MLE'
  | 'RE'
  | 'CE'
  | 'INTERNAL_ERROR';

export interface ITestCaseResult {
  testCaseId?: mongoose.Types.ObjectId;
  passed: boolean;
  verdict: SubmissionVerdict;
  runtimeMs: number;
  memoryKb: number;
  stdin?: string;
  expectedStdout?: string;
  actualStdout?: string;
  errorOutput?: string;
  isHidden?: boolean;
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  assessmentId?: mongoose.Types.ObjectId;
  attemptId?: mongoose.Types.ObjectId;
  language: 'python' | 'javascript' | 'typescript' | 'cpp' | 'java';
  sourceCode: string;
  isSampleRun: boolean;
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb: number;
  compileOutput?: string;
  error?: string;
  testCaseResults: ITestCaseResult[];
  createdAt: Date;
  updatedAt: Date;
}

const testCaseResultSchema = new Schema<ITestCaseResult>(
  {
    testCaseId: { type: Schema.Types.ObjectId, ref: 'TestCase' },
    passed: { type: Boolean, required: true },
    verdict: {
      type: String,
      enum: ['PENDING', 'AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'INTERNAL_ERROR'],
      required: true,
    },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    stdin: { type: String },
    expectedStdout: { type: String },
    actualStdout: { type: String },
    errorOutput: { type: String },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const submissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', index: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', index: true },
    language: {
      type: String,
      required: true,
      enum: ['python', 'javascript', 'typescript', 'cpp', 'java'],
    },
    sourceCode: { type: String, required: true },
    isSampleRun: { type: Boolean, default: false, index: true },
    verdict: {
      type: String,
      required: true,
      enum: ['PENDING', 'AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'INTERNAL_ERROR'],
      default: 'PENDING',
      index: true,
    },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    compileOutput: { type: String },
    error: { type: String },
    testCaseResults: [testCaseResultSchema],
  },
  { timestamps: true }
);

// Performance compound indexes
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, verdict: 1 });
submissionSchema.index({ problemId: 1, verdict: 1 });
submissionSchema.index({ attemptId: 1, problemId: 1 });

export const Submission =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', submissionSchema);
export default Submission;
