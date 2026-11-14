import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmarkList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRevisionItem extends Document {
  userId: mongoose.Types.ObjectId;
  listId?: mongoose.Types.ObjectId;
  itemType: 'problem' | 'system_design' | 'core_cs' | 'behavioral';
  itemId: mongoose.Types.ObjectId;
  itemSlug: string;
  itemTitle: string;
  difficulty?: string;
  notes?: string;
  reviewCount: number;
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  intervalDays: number;
  easeFactor: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkListSchema = new Schema<IBookmarkList>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    color: { type: String, default: 'from-blue-600 to-indigo-600' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookmarkListSchema.index({ userId: 1, name: 1 }, { unique: true });

const revisionItemSchema = new Schema<IRevisionItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listId: { type: Schema.Types.ObjectId, ref: 'BookmarkList', index: true },
    itemType: {
      type: String,
      required: true,
      enum: ['problem', 'system_design', 'core_cs', 'behavioral'],
      index: true,
    },
    itemId: { type: Schema.Types.ObjectId, required: true },
    itemSlug: { type: String, required: true, trim: true },
    itemTitle: { type: String, required: true, trim: true },
    difficulty: { type: String, default: 'medium' },
    notes: { type: String, default: '' },
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), index: true },
    intervalDays: { type: Number, default: 1 },
    easeFactor: { type: Number, default: 2.5 },
    isCompleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for user bookmarks and revision scheduling
revisionItemSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
revisionItemSchema.index({ userId: 1, nextReviewAt: 1, isCompleted: 1 });

export const BookmarkList = mongoose.model<IBookmarkList>('BookmarkList', bookmarkListSchema);
export const RevisionItem = mongoose.model<IRevisionItem>('RevisionItem', revisionItemSchema);
