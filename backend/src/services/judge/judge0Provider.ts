import axios, { AxiosInstance } from 'axios';
import { IJudgeProvider, JudgeExecutionRequest, JudgeExecutionResponse, SupportedLanguage } from './types';
import { SubmissionVerdict } from '../../lib/models/Submission';

const LANGUAGE_ID_MAP: Record<SupportedLanguage, number> = {
  python: 71, // Python 3
  javascript: 63, // JavaScript (Node.js)
  typescript: 74, // TypeScript
  cpp: 54, // C++ (GCC)
  java: 62, // Java (OpenJDK)
};

export class Judge0Provider implements IJudgeProvider {
  public name = 'judge0';
  private client: AxiosInstance;
  private isConfigured: boolean;

  constructor() {
    const baseURL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    const apiKey = process.env.JUDGE0_API_KEY;
    const apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

    this.isConfigured = Boolean(process.env.JUDGE0_API_URL || apiKey);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = apiHost;
    }

    this.client = axios.create({
      baseURL,
      headers,
      timeout: 15000,
    });
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      const res = await this.client.get('/about', { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  public async execute(req: JudgeExecutionRequest): Promise<JudgeExecutionResponse> {
    const languageId = LANGUAGE_ID_MAP[req.language];
    if (!languageId) {
      return {
        verdict: 'INTERNAL_ERROR',
        runtimeMs: 0,
        memoryKb: 0,
        stderr: `Unsupported language: ${req.language}`,
      };
    }

    try {
      const payload = {
        source_code: Buffer.from(req.sourceCode).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(req.stdin || '').toString('base64'),
        expected_output: req.expectedStdout
          ? Buffer.from(req.expectedStdout).toString('base64')
          : undefined,
        cpu_time_limit: Math.min(5.0, req.timeLimitSec || 2.0),
        memory_limit: Math.min(256000, req.memoryLimitKb || 128000),
      };

      // Submit with wait=true for synchronous response from Judge0
      const res = await this.client.post('/submissions?base64_encoded=true&wait=true', payload);
      const data = res.data;

      const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf-8') : '';
      const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf-8') : '';
      const compileOutput = data.compile_output
        ? Buffer.from(data.compile_output, 'base64').toString('utf-8')
        : '';

      const runtimeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
      const memoryKb = data.memory ? Math.round(data.memory) : 0;
      const statusId = data.status?.id;

      let verdict: SubmissionVerdict = 'INTERNAL_ERROR';

      switch (statusId) {
        case 3:
          verdict = 'AC';
          break;
        case 4:
          verdict = 'WA';
          break;
        case 5:
          verdict = 'TLE';
          break;
        case 6:
          verdict = 'CE';
          break;
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
          verdict = 'RE';
          break;
        case 13:
        case 14:
          verdict = 'INTERNAL_ERROR';
          break;
        default:
          verdict = data.status?.description?.includes('Time') ? 'TLE' : 'RE';
      }

      return {
        verdict,
        runtimeMs,
        memoryKb,
        stdout: stdout.slice(0, 10000), // Enforce 10k output cap
        stderr: stderr.slice(0, 10000),
        compileOutput: compileOutput.slice(0, 10000),
        rawStatus: data.status?.description,
      };
    } catch (error: any) {
      console.error('[Judge0Provider] Execution failed:', error.message);
      return {
        verdict: 'INTERNAL_ERROR',
        runtimeMs: 0,
        memoryKb: 0,
        stderr: `Judge0 execution error: ${error.message}`,
      };
    }
  }
}

export default Judge0Provider;
