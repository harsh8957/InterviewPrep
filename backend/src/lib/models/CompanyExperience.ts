import mongoose, { Document, Schema } from 'mongoose';

export interface IExperienceRound {
  roundNumber: number;
  roundName: string;
  roundType: 'oa' | 'technical_screen' | 'onsite_coding' | 'system_design' | 'behavioral' | 'hiring_manager';
  durationMinutes: number;
  questionsSummary: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IExperienceQuestion {
  questionText: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  linkedProblemId?: mongoose.Types.ObjectId;
}

export interface IModerationHistoryItem {
  action: 'submitted' | 'approved' | 'rejected' | 'edited' | 'reported';
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  notes?: string;
}

export interface IExperienceReport {
  reportedBy: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

export interface ICompanyExperience extends Document {
  companyName: string;
  companySlug: string;
  companyTrackId?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  candidateHandle: string;
  isAnonymous: boolean;
  role: string;
  experienceLevel: 'fresher' | 'junior' | 'mid-level' | 'senior' | 'lead';
  interviewYear: number;
  interviewSeason: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Spring' | 'Summer' | 'Fall' | 'Winter';
  difficulty: 'easy' | 'medium' | 'hard';
  outcome: 'Offer' | 'Rejected' | 'Pending' | 'Withdrawn' | 'Declined Offer';
  provenance: 'community_submission' | 'platform_verified' | 'recruiter_briefing';
  rounds: IExperienceRound[];
  questions: IExperienceQuestion[];
  preparationTips: string;
  timelineNotes?: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  moderationHistory: IModerationHistoryItem[];
  reports: IExperienceReport[];
  createdAt: Date;
  updatedAt: Date;
}

const companyExperienceSchema = new Schema<ICompanyExperience>(
  {
    companyName: { type: String, required: true, trim: true },
    companySlug: { type: String, required: true, trim: true, index: true },
    companyTrackId: { type: Schema.Types.ObjectId, ref: 'CompanyTrack', index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidateHandle: { type: String, default: 'Anonymous Candidate', trim: true },
    isAnonymous: { type: Boolean, default: true },
    role: { type: String, required: true, trim: true },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['fresher', 'junior', 'mid-level', 'senior', 'lead'],
      index: true,
    },
    interviewYear: { type: Number, required: true, min: 2018, max: 2030, index: true },
    interviewSeason: {
      type: String,
      required: true,
      enum: ['Q1', 'Q2', 'Q3', 'Q4', 'Spring', 'Summer', 'Fall', 'Winter'],
      default: 'Summer',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      index: true,
    },
    outcome: {
      type: String,
      required: true,
      enum: ['Offer', 'Rejected', 'Pending', 'Withdrawn', 'Declined Offer'],
      default: 'Pending',
      index: true,
    },
    provenance: {
      type: String,
      required: true,
      enum: ['community_submission', 'platform_verified', 'recruiter_briefing'],
      default: 'community_submission',
    },
    rounds: [
      {
        roundNumber: { type: Number, required: true },
        roundName: { type: String, required: true },
        roundType: {
          type: String,
          required: true,
          enum: ['oa', 'technical_screen', 'onsite_coding', 'system_design', 'behavioral', 'hiring_manager'],
        },
        durationMinutes: { type: Number, default: 45 },
        questionsSummary: { type: String, required: true },
        difficulty: {
          type: String,
          required: true,
          enum: ['easy', 'medium', 'hard'],
        },
      },
    ],
    questions: [
      {
        questionText: { type: String, required: true },
        topic: { type: String, required: true },
        difficulty: {
          type: String,
          required: true,
          enum: ['easy', 'medium', 'hard'],
        },
        linkedProblemId: { type: Schema.Types.ObjectId, ref: 'Problem' },
      },
    ],
    preparationTips: { type: String, required: true },
    timelineNotes: { type: String },
    moderationStatus: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    moderationHistory: [
      {
        action: {
          type: String,
          required: true,
          enum: ['submitted', 'approved', 'rejected', 'edited', 'reported'],
        },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    reports: [
      {
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for public feed
companyExperienceSchema.index({ companySlug: 1, moderationStatus: 1, createdAt: -1 });
companyExperienceSchema.index({ moderationStatus: 1, createdAt: -1 });

export const CompanyExperience = mongoose.model<ICompanyExperience>('CompanyExperience', companyExperienceSchema);
export default CompanyExperience;
