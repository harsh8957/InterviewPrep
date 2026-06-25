import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicyDocument extends Document {
  type: 'privacy' | 'terms';
  content: string;
  version: string;
  isActive: boolean;
}

const policyDocumentSchema = new Schema({
  type: { type: String, enum: ['privacy', 'terms'], required: true },
  content: { type: String, required: true },
  version: { type: String, required: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

export const PolicyDocument = mongoose.model<IPolicyDocument>('PolicyDocument', policyDocumentSchema);
