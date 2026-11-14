import mongoose, { Schema, Document } from 'mongoose';

export interface IRevokedToken extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const revokedTokenSchema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL index to automatically remove expired tokens
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = mongoose.models.RevokedToken || mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);
export default RevokedToken;
