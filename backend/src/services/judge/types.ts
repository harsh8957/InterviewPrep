import { SubmissionVerdict } from '../../lib/models/Submission';

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java';

export interface JudgeExecutionRequest {
  sourceCode: string;
  language: SupportedLanguage;
  stdin: string;
  expectedStdout?: string;
  timeLimitSec?: number; // e.g. 2.0s
  memoryLimitKb?: number; // e.g. 128000 KB
}

export interface JudgeExecutionResponse {
  verdict: SubmissionVerdict;
  runtimeMs: number;
  memoryKb: number;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  rawStatus?: string;
}

export interface IJudgeProvider {
  name: string;
  execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResponse>;
  isAvailable(): Promise<boolean>;
}
