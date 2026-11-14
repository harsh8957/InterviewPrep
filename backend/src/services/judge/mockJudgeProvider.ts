import { IJudgeProvider, JudgeExecutionRequest, JudgeExecutionResponse } from './types';
import { SubmissionVerdict } from '../../lib/models/Submission';

export class MockJudgeProvider implements IJudgeProvider {
  public name = 'mock';

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async execute(req: JudgeExecutionRequest): Promise<JudgeExecutionResponse> {
    const code = req.sourceCode || '';
    const stdin = (req.stdin || '').trim();
    const expected = (req.expectedStdout || '').trim();

    // 1. Empty code check -> CE
    if (!code.trim()) {
      return {
        verdict: 'CE',
        runtimeMs: 0,
        memoryKb: 0,
        compileOutput: 'Compilation Error: Empty source file.',
      };
    }

    // 2. Syntax / Compilation Error trigger
    if (code.includes('SYNTAX_ERROR') || code.includes('compile_error') || code.includes('@@INVALID@@')) {
      return {
        verdict: 'CE',
        runtimeMs: 0,
        memoryKb: 0,
        compileOutput: 'SyntaxError: invalid syntax on line 1',
      };
    }

    // 3. Time Limit Exceeded trigger
    if (code.includes('INFINITE_LOOP') || code.includes('while True:') || code.includes('while(true)')) {
      return {
        verdict: 'TLE',
        runtimeMs: 2005,
        memoryKb: 14200,
        stderr: 'Time Limit Exceeded: Execution timed out after 2.0s',
      };
    }

    // 4. Memory Limit Exceeded trigger
    if (code.includes('MEMORY_EXHAUSTION') || code.includes('OutOfMemoryError')) {
      return {
        verdict: 'MLE',
        runtimeMs: 450,
        memoryKb: 262144, // 256MB
        stderr: 'Memory Limit Exceeded: Exceeded allocated memory limit 128MB',
      };
    }

    // 5. Runtime Error trigger
    if (code.includes('RUNTIME_EXCEPTION') || code.includes('raise Exception') || code.includes('throw new Error')) {
      return {
        verdict: 'RE',
        runtimeMs: 35,
        memoryKb: 18400,
        stderr: 'ZeroDivisionError: division by zero or Uncaught Exception',
      };
    }

    // 6. Infrastructure Error trigger
    if (code.includes('INFRA_FAILURE') || code.includes('INTERNAL_ERROR')) {
      return {
        verdict: 'INTERNAL_ERROR',
        runtimeMs: 0,
        memoryKb: 0,
        stderr: 'Infrastructure Error: Worker timeout connecting to sandbox',
      };
    }

    // 7. Wrong Answer trigger
    if (code.includes('WRONG_ANSWER') || code.includes('return -1') || code.includes('return None')) {
      return {
        verdict: 'WA',
        runtimeMs: 25,
        memoryKb: 16500,
        stdout: '[-1]',
        stderr: 'Assertion failed: expected output does not match.',
      };
    }

    // 8. Normal execution simulation for valid solutions
    // Realistic execution metrics
    const runtimeMs = Math.floor(Math.random() * 35) + 15; // 15 - 50 ms
    const memoryKb = Math.floor(Math.random() * 5000) + 28000; // ~28-33 MB

    return {
      verdict: 'AC',
      runtimeMs,
      memoryKb,
      stdout: expected || 'OK',
    };
  }
}

export default MockJudgeProvider;
