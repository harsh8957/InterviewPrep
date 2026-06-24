import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: mongoose.Types.ObjectId;
  tags: string[];
  author: mongoose.Types.ObjectId;
  coverImage?: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  likes: number;
  comments: {
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
}

const blogCategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
}, { timestamps: true });

const blogPostSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  summary: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'BlogCategory', required: true },
  tags: [{ type: String }],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt: { type: Date },
  likes: { type: Number, default: 0 },
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Pre-save to auto-generate summary if empty (simplified, usually handled by service layer but good to have fallback or manual)
// Actually we will handle AI summary in the service layer.

export const BlogCategory = mongoose.model<IBlogCategory>('BlogCategory', blogCategorySchema);
export const BlogPost = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
