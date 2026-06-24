import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQCategory extends Document {
  name: string;
  order: number;
}

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: mongoose.Types.ObjectId;
  order: number;
}

const faqCategorySchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'FAQCategory', required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const FAQCategory = mongoose.model<IFAQCategory>('FAQCategory', faqCategorySchema);
export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);
