import mongoose from 'mongoose';
import { IJudgeProvider, JudgeExecutionRequest, SupportedLanguage } from './types';
import { Judge0Provider } from './judge0Provider';
import { MockJudgeProvider } from './mockJudgeProvider';
import { Submission, ISubmission, SubmissionVerdict } from '../../lib/models/Submission';
import { TestCase, ITestCase } from '../../lib/models/TestCase';
import { AssessmentAttempt } from '../../lib/models/AssessmentAttempt';

export class JudgeService {
  private static instance: JudgeService;
  private provider: IJudgeProvider;
  private userLastSubmissionTime: Map<string, number> = new Map();
  private rateLimitWindowMs: number;
  private maxConcurrency: number;
  private activeJobsCount: number = 0;
  private waitingQueue: Array<() => void> = [];

  private constructor() {
    this.rateLimitWindowMs =
      (parseInt(process.env.JUDGE_SUBMISSION_RATE_LIMIT_SEC || '5', 10) || 5) * 1000;
    this.maxConcurrency =
      parseInt(process.env.JUDGE_QUEUE_CONCURRENCY || '5', 10) || 5;

    const preferredProvider = process.env.JUDGE_PROVIDER || (process.env.NODE_ENV === 'test' ? 'mock' : 'judge0');
    if (preferredProvider === 'judge0' && process.env.JUDGE0_API_URL) {
      this.provider = new Judge0Provider();
    } else {
      this.provider = new MockJudgeProvider();
    }
  }

  public static getInstance(): JudgeService {
    if (!JudgeService.instance) {
      JudgeService.instance = new JudgeService();
    }
    return JudgeService.instance;
  }

  public setProvider(provider: IJudgeProvider): void {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public resetRateLimits(): void {
    this.userLastSubmissionTime.clear();
  }

  public setRateLimitWindowMs(ms: number): void {
    this.rateLimitWindowMs = ms;
  }

  /**
   * Rate limiting check per user.
   */
  public checkRateLimit(userId: string): { allowed: boolean; retryAfterSec?: number } {
    const now = Date.now();
    const lastTime = this.userLastSubmissionTime.get(userId) || 0;
    const elapsed = now - lastTime;

    if (elapsed < this.rateLimitWindowMs) {
      const retryAfterSec = Math.ceil((this.rateLimitWindowMs - elapsed) / 1000);
      return { allowed: false, retryAfterSec };
    }

    this.userLastSubmissionTime.set(userId, now);
    return { allowed: true };
  }

  /**
   * Executes arbitrary code directly via the configured judge provider
   * (used by interview coding workspace and rapid code checks).
   */
  public async executeCustom(request: JudgeExecutionRequest) {
    await this.acquireSlot();
    try {
      return await this.provider.execute(request);
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * Concurrency slot acquisition.
   */
  private async acquireSlot(): Promise<void> {
    if (this.activeJobsCount < this.maxConcurrency) {
      this.activeJobsCount++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitingQueue.push(() => {
        this.activeJobsCount++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
    const next = this.waitingQueue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Core orchestrator method: loads submission, executes against test cases,
   * sanitizes outputs, updates submission and attempt state in MongoDB.
   */
  public async processSubmission(submissionId: string | mongoose.Types.ObjectId): Promise<ISubmission> {
    await this.acquireSlot();

    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // If already evaluated, return existing
      if (submission.verdict !== 'PENDING') {
        return submission;
      }

      // Fetch appropriate test cases
      const testCaseFilter: Record<string, any> = { problemId: submission.problemId };
      if (submission.isSampleRun) {
        // Sample runs only evaluate against public test cases
        testCaseFilter.isHidden = false;
      }

      const testCases = await TestCase.find(testCaseFilter).sort({ order: 1 }).lean<ITestCase[]>();

      if (!testCases || testCases.length === 0) {
        submission.verdict = 'INTERNAL_ERROR';
        submission.error = 'No test cases configured for this problem';
        await submission.save();
        return submission;
      }

      let overallVerdict: SubmissionVerdict = 'AC';
      let passedCount = 0;
      let maxRuntimeMs = 0;
      let maxMemoryKb = 0;
      let compileOutput: string | undefined;
      const results = [];

      for (const tc of testCases) {
        const req: JudgeExecutionRequest = {
          sourceCode: submission.sourceCode,
          language: submission.language as SupportedLanguage,
          stdin: tc.input,
          expectedStdout: tc.expectedOutput,
          timeLimitSec: 2.0,
          memoryLimitKb: 128000,
        };

        const res = await this.provider.execute(req);

        maxRuntimeMs = Math.max(maxRuntimeMs, res.runtimeMs);
        maxMemoryKb = Math.max(maxMemoryKb, res.memoryKb);

        if (res.compileOutput) {
          compileOutput = res.compileOutput;
        }

        const isPassed = res.verdict === 'AC';
        if (isPassed) {
          passedCount++;
        } else if (overallVerdict === 'AC') {
          // First non-AC verdict determines the primary overall verdict
          overallVerdict = res.verdict;
        }

        // Apply strict sanitization: never leak hidden test inputs or outputs
        results.push({
          testCaseId: tc._id,
          passed: isPassed,
          verdict: res.verdict,
          runtimeMs: res.runtimeMs,
          memoryKb: res.memoryKb,
          stdin: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedStdout: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualStdout: tc.isHidden ? '[Hidden]' : res.stdout,
          errorOutput: tc.isHidden ? (res.stderr ? 'Runtime exception' : undefined) : res.stderr,
          isHidden: tc.isHidden,
        });

        // Fast-fail on Compilation Error or Internal Error across all test cases
        if (res.verdict === 'CE' || res.verdict === 'INTERNAL_ERROR') {
          overallVerdict = res.verdict;
          break;
        }
      }

      submission.verdict = overallVerdict;
      submission.passedCount = passedCount;
      submission.totalCount = testCases.length;
      submission.runtimeMs = maxRuntimeMs;
      submission.memoryKb = maxMemoryKb;
      submission.compileOutput = compileOutput;
      submission.testCaseResults = results;

      await submission.save();

      // If submission is linked to an assessment attempt, update attempt progress
      if (submission.attemptId) {
        await this.syncAttemptScore(submission.attemptId, submission.problemId, submission);
      }

      return submission;
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * Syncs latest submission result into the candidate's assessment attempt.
   */
  private async syncAttemptScore(
    attemptId: mongoose.Types.ObjectId,
    problemId: mongoose.Types.ObjectId,
    submission: ISubmission
  ): Promise<void> {
    try {
      const attempt = await AssessmentAttempt.findById(attemptId);
      if (!attempt || attempt.status !== 'in-progress') return;

      const passed = submission.verdict === 'AC';
      const score = passed ? 100 : Math.round((submission.passedCount / Math.max(1, submission.totalCount)) * 50);

      const existingRecordIndex = attempt.problemSubmissions.findIndex(
        (p: any) => p.problemId.toString() === problemId.toString()
      );

      if (existingRecordIndex >= 0) {
        attempt.problemSubmissions[existingRecordIndex] = {
          problemId,
          submissionId: submission._id as mongoose.Types.ObjectId,
          passed,
          score,
        };
      } else {
        attempt.problemSubmissions.push({
          problemId,
          submissionId: submission._id as mongoose.Types.ObjectId,
          passed,
          score,
        });
      }

      // Recompute total average score across problems
      if (attempt.problemSubmissions.length > 0) {
        const totalSum = attempt.problemSubmissions.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
        attempt.totalScore = Math.round(totalSum / attempt.problemSubmissions.length);
        attempt.passed = attempt.totalScore >= 70;
      }

      await attempt.save();
    } catch (err) {
      console.error('[JudgeService] Error syncing attempt score:', err);
    }
  }
}

export default JudgeService.getInstance();
