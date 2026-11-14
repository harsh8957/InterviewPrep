import mongoose, { Document, Schema } from 'mongoose';

export type SystemDesignType = 'hld' | 'lld';
export type DesignDifficulty = 'easy' | 'medium' | 'hard';

export interface ICapacityEstimation {
  rps: string;
  storage: string;
  bandwidth: string;
  memory: string;
  notes: string;
}

export interface IApiDesignEndpoint {
  endpoint: string;
  method: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}

export interface IDataModelDefinition {
  entity: string;
  fields: string[];
  storageType: string;
  notes?: string;
}

export interface ITradeoffItem {
  decision: string;
  pros: string[];
  cons: string[];
  rationale: string;
}

export interface IDeepDiveItem {
  topic: string;
  content: string;
}

export interface IEvaluationRubric {
  requirements: string;
  dataModel: string;
  architecture: string;
  scalability: string;
  availability: string;
  reliability: string;
  security: string;
  tradeoffs: string;
}

export interface ISystemDesignCase extends Document {
  slug: string;
  title: string;
  type: SystemDesignType;
  difficulty: DesignDifficulty;
  scale: string;
  summary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  capacityEstimation: ICapacityEstimation;
  apiDesign: IApiDesignEndpoint[];
  dataModels: IDataModelDefinition[];
  architecturePillars: string[];
  mermaidDiagram: string;
  tradeoffs: ITradeoffItem[];
  deepDives: IDeepDiveItem[];
  evaluationRubric: IEvaluationRubric;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const systemDesignCaseSchema = new Schema<ISystemDesignCase>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['hld', 'lld'],
      default: 'hld',
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      required: true,
      index: true,
    },
    scale: {
      type: String,
      required: true,
      default: '100K QPS',
    },
    summary: {
      type: String,
      required: true,
    },
    functionalRequirements: {
      type: [String],
      default: [],
    },
    nonFunctionalRequirements: {
      type: [String],
      default: [],
    },
    capacityEstimation: {
      rps: { type: String, default: '' },
      storage: { type: String, default: '' },
      bandwidth: { type: String, default: '' },
      memory: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    apiDesign: [
      {
        endpoint: { type: String, required: true },
        method: { type: String, required: true },
        description: { type: String, required: true },
        requestBody: { type: String },
        responseBody: { type: String },
      },
    ],
    dataModels: [
      {
        entity: { type: String, required: true },
        fields: { type: [String], default: [] },
        storageType: { type: String, required: true },
        notes: { type: String },
      },
    ],
    architecturePillars: {
      type: [String],
      default: [],
    },
    mermaidDiagram: {
      type: String,
      required: true,
    },
    tradeoffs: [
      {
        decision: { type: String, required: true },
        pros: { type: [String], default: [] },
        cons: { type: [String], default: [] },
        rationale: { type: String, required: true },
      },
    ],
    deepDives: [
      {
        topic: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
    evaluationRubric: {
      requirements: { type: String, default: 'Covers all functional and non-functional constraints.' },
      dataModel: { type: String, default: 'Normalized schema vs NoSQL sharding tradeoffs addressed.' },
      architecture: { type: String, default: 'Clear component separation, stateless services, load balancing.' },
      scalability: { type: String, default: 'Horizontal scaling, caching layers, database sharding.' },
      availability: { type: String, default: 'Multi-AZ replication, failover strategy, graceful degradation.' },
      reliability: { type: String, default: 'Data backup, idempotency, retry mechanisms with exponential backoff.' },
      security: { type: String, default: 'TLS encryption, authentication, authorization, rate limiting.' },
      tradeoffs: { type: String, default: 'Explicit discussion of CAP theorem, consistency vs latency.' },
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

systemDesignCaseSchema.index({ type: 1, difficulty: 1, order: 1 });

export const SystemDesignCase = mongoose.model<ISystemDesignCase>('SystemDesignCase', systemDesignCaseSchema);
