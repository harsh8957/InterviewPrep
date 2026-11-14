import mongoose, { Document, Schema } from 'mongoose';

export interface IParsedEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface IParsedExperience {
  title: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface IParsedProject {
  name: string;
  description: string;
  technologies: string[];
  highlights: string[];
}

export interface IParsedResumeProfile {
  skills: string[];
  education: IParsedEducation[];
  experience: IParsedExperience[];
  projects: IParsedProject[];
  technologies: string[];
  achievements: string[];
  potentialDiscussionAreas: string[];
}

export interface IResumeProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  extractedText: string;
  targetRole: string;
  parsedProfile: IParsedResumeProfile;
  atsScore?: number;
  atsStrengths?: string[];
  atsImprovements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const resumeProfileSchema = new Schema<IResumeProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
      maxlength: 30000,
    },
    targetRole: {
      type: String,
      default: 'Full-Stack Software Engineer',
      trim: true,
    },
    parsedProfile: {
      skills: { type: [String], default: [] },
      education: [
        {
          degree: { type: String, default: '' },
          institution: { type: String, default: '' },
          year: { type: String },
        },
      ],
      experience: [
        {
          title: { type: String, default: '' },
          company: { type: String, default: '' },
          duration: { type: String },
          description: { type: String },
        },
      ],
      projects: [
        {
          name: { type: String, default: '' },
          description: { type: String, default: '' },
          technologies: { type: [String], default: [] },
          highlights: { type: [String], default: [] },
        },
      ],
      technologies: { type: [String], default: [] },
      achievements: { type: [String], default: [] },
      potentialDiscussionAreas: { type: [String], default: [] },
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    atsStrengths: {
      type: [String],
      default: [],
    },
    atsImprovements: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const ResumeProfile = mongoose.model<IResumeProfile>('ResumeProfile', resumeProfileSchema);

export default ResumeProfile;
