import mongoose, { Document, Schema } from 'mongoose';

export interface IRubricSelfScore {
  requirements: number;
  dataModel: number;
  architecture: number;
  scalability: number;
  reliability: number;
  security: number;
  tradeoffs: number;
}

export interface IAiCritique {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  evaluatedAt: Date;
}

export interface ISystemDesignSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  caseId: mongoose.Types.ObjectId;
  caseSlug: string;
  mermaidDiagram: string;
  notes: string;
  rubricSelfScore: IRubricSelfScore;
  aiCritique?: IAiCritique;
  createdAt: Date;
  updatedAt: Date;
}

const systemDesignSubmissionSchema = new Schema<ISystemDesignSubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'SystemDesignCase',
      required: true,
      index: true,
    },
    caseSlug: {
      type: String,
      required: true,
      index: true,
    },
    mermaidDiagram: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    rubricSelfScore: {
      requirements: { type: Number, default: 3, min: 1, max: 5 },
      dataModel: { type: Number, default: 3, min: 1, max: 5 },
      architecture: { type: Number, default: 3, min: 1, max: 5 },
      scalability: { type: Number, default: 3, min: 1, max: 5 },
      reliability: { type: Number, default: 3, min: 1, max: 5 },
      security: { type: Number, default: 3, min: 1, max: 5 },
      tradeoffs: { type: Number, default: 3, min: 1, max: 5 },
    },
    aiCritique: {
      score: { type: Number, min: 0, max: 100 },
      feedback: { type: String },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      evaluatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Unique draft/submission per user per case
systemDesignSubmissionSchema.index({ userId: 1, caseSlug: 1 }, { unique: true });

export const SystemDesignSubmission = mongoose.model<ISystemDesignSubmission>(
  'SystemDesignSubmission',
  systemDesignSubmissionSchema
);
