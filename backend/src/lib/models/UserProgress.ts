import mongoose, { Document, Schema } from 'mongoose';

export type MasteryLevel = 'Unstarted' | 'Beginner' | 'Practicing' | 'Proficient' | 'Mastered';

export interface ITopicMastery {
  topic: string;
  problemsSolved: number;
  totalProblems: number;
  quizAttempts: number;
  quizCorrect: number;
  accuracy: number;
  masteryScore: number;
  masteryLevel: MasteryLevel;
}

export interface IWeakTopic {
  topic: string;
  reason: string;
  accuracy: number;
  recommendation: string;
}

export interface INextRecommendation {
  type: 'problem' | 'core_cs' | 'system_design' | 'mock_interview' | 'revision';
  title: string;
  slug: string;
  reason: string;
  difficulty?: string;
}

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  solvedProblemIds: mongoose.Types.ObjectId[];
  attemptedProblemIds: mongoose.Types.ObjectId[];
  solvedByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalSolved: number;
  totalAttempts: number;
  topicMastery: ITopicMastery[];
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string; // YYYY-MM-DD
  };
  dailyActivity: { [dateStr: string]: number }; // YYYY-MM-DD -> count
  coreCsStats: {
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    bySubject: Array<{
      subject: string;
      attempts: number;
      correct: number;
      accuracy: number;
    }>;
  };
  systemDesignStats: {
    totalSubmitted: number;
    averageScore: number;
  };
  mockInterviewStats: {
    totalCompleted: number;
    averageScore: number;
    scoreHistory: Array<{
      resultId: mongoose.Types.ObjectId;
      date: Date;
      score: number;
      mode: string;
      difficulty: string;
    }>;
  };
  assessmentStats: {
    totalAttempts: number;
    passedCount: number;
    averageScore: number;
  };
  weakTopics: IWeakTopic[];
  nextRecommendations: INextRecommendation[];
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    solvedProblemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    attemptedProblemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    solvedByDifficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    totalSolved: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    topicMastery: [
      {
        topic: { type: String, required: true },
        problemsSolved: { type: Number, default: 0 },
        totalProblems: { type: Number, default: 0 },
        quizAttempts: { type: Number, default: 0 },
        quizCorrect: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        masteryScore: { type: Number, default: 0 },
        masteryLevel: {
          type: String,
          enum: ['Unstarted', 'Beginner', 'Practicing', 'Proficient', 'Mastered'],
          default: 'Unstarted',
        },
      },
    ],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: '' },
    },
    dailyActivity: { type: Map, of: Number, default: {} },
    coreCsStats: {
      totalAttempts: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      overallAccuracy: { type: Number, default: 0 },
      bySubject: [
        {
          subject: { type: String, required: true },
          attempts: { type: Number, default: 0 },
          correct: { type: Number, default: 0 },
          accuracy: { type: Number, default: 0 },
        },
      ],
    },
    systemDesignStats: {
      totalSubmitted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
    mockInterviewStats: {
      totalCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      scoreHistory: [
        {
          resultId: { type: Schema.Types.ObjectId, ref: 'InterviewResult' },
          date: { type: Date, default: Date.now },
          score: { type: Number, required: true },
          mode: { type: String, default: 'dsa' },
          difficulty: { type: String, default: 'medium' },
        },
      ],
    },
    assessmentStats: {
      totalAttempts: { type: Number, default: 0 },
      passedCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
    weakTopics: [
      {
        topic: { type: String, required: true },
        reason: { type: String, required: true },
        accuracy: { type: Number, default: 0 },
        recommendation: { type: String, required: true },
      },
    ],
    nextRecommendations: [
      {
        type: {
          type: String,
          enum: ['problem', 'core_cs', 'system_design', 'mock_interview', 'revision'],
          required: true,
        },
        title: { type: String, required: true },
        slug: { type: String, required: true },
        reason: { type: String, required: true },
        difficulty: { type: String },
      },
    ],
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', userProgressSchema);
export default UserProgress;
