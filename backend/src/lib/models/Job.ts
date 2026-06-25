import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  isActive: boolean;
}

export interface IJobApplication extends Document {
  job: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  resumeText: string;
  coverLetter?: string;
  matchScore?: number; // AI generated
  status: 'pending' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
}

const jobSchema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  responsibilities: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const jobApplicationSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resumeText: { type: String, required: true }, // Simplified from file upload to handle AI processing easier
  coverLetter: { type: String },
  matchScore: { type: Number },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'interviewing', 'rejected', 'hired'],
    default: 'pending'
  }
}, { timestamps: true });

export const Job = mongoose.model<IJob>('Job', jobSchema);
export const JobApplication = mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
