import mongoose, { Document, Schema } from 'mongoose';

export interface IRoadmapNode extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  order: number;
  prerequisites: string[]; // slugs of prerequisite roadmap nodes
  estimatedHours: number;
  associatedProblemIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const roadmapNodeSchema = new Schema<IRoadmapNode>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    order: { type: Number, required: true, index: true },
    prerequisites: [{ type: String, trim: true }],
    estimatedHours: { type: Number, required: true, default: 4 },
    associatedProblemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  },
  { timestamps: true }
);

export const RoadmapNode = mongoose.models.RoadmapNode || mongoose.model<IRoadmapNode>('RoadmapNode', roadmapNodeSchema);
export default RoadmapNode;
