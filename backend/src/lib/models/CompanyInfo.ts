import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanyInfo extends Document {
  mission: string;
  vision: string;
  stats: {
    label: string;
    value: string;
  }[];
}

export interface ITeamMember extends Document {
  name: string;
  role: string;
  bio: string;
  image?: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  order: number;
}

const companyInfoSchema = new Schema({
  mission: { type: String, required: true },
  vision: { type: String, required: true },
  stats: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }]
}, { timestamps: true });

const teamMemberSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: { type: String, required: true },
  image: { type: String },
  socials: {
    linkedin: { type: String },
    twitter: { type: String },
    github: { type: String }
  },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const CompanyInfo = mongoose.model<ICompanyInfo>('CompanyInfo', companyInfoSchema);
export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);
