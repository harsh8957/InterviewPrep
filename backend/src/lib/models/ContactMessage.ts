import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  intentTag?: 'Support' | 'Sales' | 'Feedback' | 'Partnership' | 'Hiring' | 'Other'; // AI classified
  status: 'new' | 'read' | 'replied';
}

const contactMessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  intentTag: { 
    type: String, 
    enum: ['Support', 'Sales', 'Feedback', 'Partnership', 'Hiring', 'Other'],
    default: 'Other'
  },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
}, { timestamps: true });

export const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
