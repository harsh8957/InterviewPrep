import mongoose from 'mongoose';

export type InterviewMode =
  | 'dsa'
  | 'backend'
  | 'fullstack'
  | 'system-design'
  | 'core-cs'
  | 'resume-deep-dive'
  | 'behavioral';

export interface ICodeSubmissionRecord {
  questionId: string;
  language: string;
  code: string;
  verdict: string;
  passedCases: number;
  totalCases: number;
  runtimeMs?: number;
  memoryKb?: number;
}

export interface IRubricBreakdown {
  technicalCorrectness: number;
  problemSolving: number;
  clarityOfExplanation: number;
  complexityAnalysis?: number;
  edgeCases?: number;
  communication: number;
}

export interface IInterviewAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  codeSnippet?: string;
  codeVerdict?: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  complexityAnalysis?: {
    time?: string;
    space?: string;
  };
  isFollowUp?: boolean;
  adaptiveDifficulty?: number;
}

export interface IInterviewResult extends mongoose.Document {
  candidateId: mongoose.Types.ObjectId;
  interviewId?: mongoose.Types.ObjectId;
  jobRole: string;
  experienceLevel: string;
  interviewMode: InterviewMode;
  difficulty?: string;
  duration?: number;
  resumeProfileId?: mongoose.Types.ObjectId;
  totalScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  date: Date;
  codeSubmissions?: ICodeSubmissionRecord[];
  rubricBreakdown?: IRubricBreakdown;
  suggestedTopicsToRevise?: string[];
  answers: IInterviewAnswer[];
}

const interviewResultSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRoom',
  },
  jobRole: {
    type: String,
    required: true,
  },
  experienceLevel: {
    type: String,
    required: true,
  },
  interviewMode: {
    type: String,
    enum: ['dsa', 'backend', 'fullstack', 'system-design', 'core-cs', 'resume-deep-dive', 'behavioral'],
    default: 'fullstack',
  },
  difficulty: {
    type: String,
    default: 'medium',
  },
  duration: {
    type: Number,
    default: 30,
  },
  resumeProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeProfile',
  },
  totalScore: {
    type: Number,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  strengths: [{
    type: String,
  }],
  improvements: [{
    type: String,
  }],
  date: {
    type: Date,
    default: Date.now,
  },
  codeSubmissions: [
    {
      questionId: String,
      language: String,
      code: String,
      verdict: String,
      passedCases: Number,
      totalCases: Number,
      runtimeMs: Number,
      memoryKb: Number,
    },
  ],
  rubricBreakdown: {
    technicalCorrectness: { type: Number, default: 75 },
    problemSolving: { type: Number, default: 75 },
    clarityOfExplanation: { type: Number, default: 75 },
    complexityAnalysis: { type: Number, default: 75 },
    edgeCases: { type: Number, default: 75 },
    communication: { type: Number, default: 75 },
  },
  suggestedTopicsToRevise: [{
    type: String,
  }],
  answers: [{
    questionId: String,
    questionText: String,
    answerText: String,
    codeSnippet: String,
    codeVerdict: String,
    score: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    complexityAnalysis: {
      time: String,
      space: String,
    },
    isFollowUp: { type: Boolean, default: false },
    adaptiveDifficulty: Number,
  }],
}, {
  timestamps: true,
});

const InterviewResult = mongoose.model<IInterviewResult>('InterviewResult', interviewResultSchema);

export default InterviewResult; 