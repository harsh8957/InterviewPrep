import mongoose, { Document, Schema } from 'mongoose';

export interface ITestCase extends Document {
  problemId: mongoose.Types.ObjectId;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 1 },
  },
  { timestamps: true }
);

testCaseSchema.index({ problemId: 1, isHidden: 1 });

export const TestCase = mongoose.models.TestCase || mongoose.model<ITestCase>('TestCase', testCaseSchema);
export default TestCase;
