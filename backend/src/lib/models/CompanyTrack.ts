import mongoose, { Document, Schema } from 'mongoose';

export interface ITargetRole {
  role: string;
  level: string;
  focusAreas: string[];
}

export interface ITrackRound {
  roundName: string;
  type: 'oa' | 'coding' | 'system_design' | 'core_cs' | 'behavioral' | 'hiring_manager';
  description: string;
  durationMinutes: number;
  keyTips: string[];
}

export interface ICompanyTrack extends Document {
  name: string;
  slug: string;
  tier: 'faang_tier' | 'enterprise_saas' | 'high_growth_startup' | 'fintech';
  logoUrl?: string;
  brandColor?: string;
  description: string;
  headquarters: string;
  website?: string;
  hiringBarOverview: string;
  culturePrinciples: string[];
  targetRoles: ITargetRole[];
  rounds: ITrackRound[];
  linkedProblemIds: mongoose.Types.ObjectId[];
  linkedSystemDesignIds: mongoose.Types.ObjectId[];
  linkedBehavioralIds: mongoose.Types.ObjectId[];
  linkedAssessmentIds: mongoose.Types.ObjectId[];
  coreCsTopics: string[];
  status: 'published' | 'draft';
  stats: {
    totalProblems: number;
    totalSystemDesign: number;
    experienceCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const companyTrackSchema = new Schema<ICompanyTrack>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    tier: {
      type: String,
      required: true,
      enum: ['faang_tier', 'enterprise_saas', 'high_growth_startup', 'fintech'],
      default: 'faang_tier',
      index: true,
    },
    logoUrl: { type: String },
    brandColor: { type: String, default: 'from-blue-600 to-indigo-600' },
    description: { type: String, required: true },
    headquarters: { type: String, required: true },
    website: { type: String },
    hiringBarOverview: { type: String, required: true },
    culturePrinciples: [{ type: String, trim: true }],
    targetRoles: [
      {
        role: { type: String, required: true },
        level: { type: String, required: true },
        focusAreas: [{ type: String }],
      },
    ],
    rounds: [
      {
        roundName: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: ['oa', 'coding', 'system_design', 'core_cs', 'behavioral', 'hiring_manager'],
        },
        description: { type: String, required: true },
        durationMinutes: { type: Number, default: 45 },
        keyTips: [{ type: String }],
      },
    ],
    linkedProblemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    linkedSystemDesignIds: [{ type: Schema.Types.ObjectId, ref: 'SystemDesignCase' }],
    linkedBehavioralIds: [{ type: Schema.Types.ObjectId, ref: 'BehavioralQuestion' }],
    linkedAssessmentIds: [{ type: Schema.Types.ObjectId, ref: 'Assessment' }],
    coreCsTopics: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      index: true,
    },
    stats: {
      totalProblems: { type: Number, default: 0 },
      totalSystemDesign: { type: Number, default: 0 },
      experienceCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const CompanyTrack = mongoose.model<ICompanyTrack>('CompanyTrack', companyTrackSchema);
export default CompanyTrack;
