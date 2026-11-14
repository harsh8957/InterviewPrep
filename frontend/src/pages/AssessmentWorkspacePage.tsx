import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Clock,
  CheckCircle2,
  Play,
  Send,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  ArrowLeft,
  Terminal,
  Trophy,
} from 'lucide-react';
import { cn } from '../lib/utils';

type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java';

interface ProblemSummary {
  _id: string;
  title: string;
  slug: string;
  statement?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode?: {
    python?: string;
    javascript?: string;
    typescript?: string;
    cpp?: string;
    java?: string;
  };
}

interface AssessmentDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  problemIds: ProblemSummary[];
}

interface ProblemRecord {
  problemId: string;
  submissionId?: string;
  passed: boolean;
  score: number;
}

interface AttemptData {
  _id: string;
  assessmentId: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  status: 'in-progress' | 'submitted' | 'expired';
  problemSubmissions: ProblemRecord[];
  totalScore: number;
  passed: boolean;
  tabSwitchCount: number;
}

interface Scorecard {
  totalScore: number;
  passingThreshold: number;
  passed: boolean;
  passedProblemsCount: number;
  totalProblemsCount: number;
  tabSwitchCount: number;
  submittedAt: string;
  status: string;
}

const LANGUAGE_CONFIG: Record<SupportedLanguage, { label: string; monacoLang: string; defaultSnippet: string }> = {
  python: {
    label: 'Python 3',
    monacoLang: 'python',
    defaultSnippet: 'class Solution:\n    def solve(self) -> None:\n        # Write your code here\n        pass\n',
  },
  javascript: {
    label: 'JavaScript (Node 20)',
    monacoLang: 'javascript',
    defaultSnippet: 'function solve() {\n    // Write your code here\n}\n',
  },
  typescript: {
    label: 'TypeScript 5',
    monacoLang: 'typescript',
    defaultSnippet: 'function solve(): void {\n    // Write your code here\n}\n',
  },
  cpp: {
    label: 'C++ 20',
    monacoLang: 'cpp',
    defaultSnippet: '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write code here\n    }\n};\n',
  },
  java: {
    label: 'Java 21',
    monacoLang: 'java',
    defaultSnippet: 'import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write code here\n    }\n}\n',
  },
};

export const AssessmentWorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Problem Index
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);

  // Editor State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<boolean>(false);

  // Execution & Submissions
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionType, setExecutionType] = useState<'sample' | 'submit' | null>(null);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Authoritative Timer (remaining seconds)
  const [remainingSec, setRemainingSec] = useState<number>(0);

  // Final Scorecard Modal
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Start or resume attempt
  useEffect(() => {
    if (!slug) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/assessments/${slug}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to start assessment attempt');
        }
        return res.json();
      })
      .then((data) => {
        setAssessment(data.assessment);
        setAttempt(data.attempt);
        setRemainingSec(data.remainingSeconds || 0);

        // Preload starter codes for problems
        const initialMap: Record<string, string> = {};
        data.assessment?.problemIds?.forEach((p: ProblemSummary) => {
          const draftKey = `ip-oa-${data.attempt._id}-${p.slug}-${selectedLanguage}`;
          const saved = localStorage.getItem(draftKey);
          initialMap[p._id] =
            saved ||
            p.starterCode?.[selectedLanguage] ||
            LANGUAGE_CONFIG[selectedLanguage].defaultSnippet;
        });
        setCodeMap(initialMap);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, API_URL, navigate, selectedLanguage]);

  // Countdown Timer
  // Auto-expire when timer hits 0
  const handleAutoExpire = useCallback(async () => {
    if (!attempt) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/assessments/attempts/${attempt._id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setScorecard(data.scorecard);
      setAttempt(data.attempt);
    } catch (err) {
      console.error('Auto-expire submission failed:', err);
    }
  }, [attempt, API_URL]);

  // Countdown timer tick
  useEffect(() => {
    if (remainingSec <= 0 || !attempt || attempt.status !== 'in-progress') return;

    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSec, attempt, handleAutoExpire]);

  // Tab switch telemetry tracking
  useEffect(() => {
    if (!attempt || attempt.status !== 'in-progress') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        fetch(`${API_URL}/api/assessments/attempts/${attempt._id}/telemetry`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt, API_URL]);

  const activeProblem = useMemo(() => {
    if (!assessment || !assessment.problemIds || assessment.problemIds.length === 0) return null;
    return assessment.problemIds[activeProblemIdx] || null;
  }, [assessment, activeProblemIdx]);

  const currentCode = useMemo(() => {
    if (!activeProblem) return '';
    return codeMap[activeProblem._id] || '';
  }, [codeMap, activeProblem]);

  const handleCodeChange = (newCode?: string) => {
    if (!activeProblem || !attempt) return;
    const val = newCode || '';
    setCodeMap((prev) => ({ ...prev, [activeProblem._id]: val }));
    localStorage.setItem(`ip-oa-${attempt._id}-${activeProblem.slug}-${selectedLanguage}`, val);
  };

  const handleResetCode = () => {
    if (!activeProblem || !attempt) return;
    const defaultCode =
      activeProblem.starterCode?.[selectedLanguage] ||
      LANGUAGE_CONFIG[selectedLanguage].defaultSnippet;
    setCodeMap((prev) => ({ ...prev, [activeProblem._id]: defaultCode }));
    localStorage.removeItem(`ip-oa-${attempt._id}-${activeProblem.slug}-${selectedLanguage}`);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  // Run Tests (Sample)
  const handleRunTests = async () => {
    if (!activeProblem || isExecuting) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsExecuting(true);
    setExecutionType('sample');
    setExecutionError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: activeProblem._id,
          language: selectedLanguage,
          sourceCode: currentCode,
          isSampleRun: true,
          attemptId: attempt?._id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Execution error');
      }

      const result = await res.json();
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionError(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  };

  // Submit Problem Solution (Full evaluation linked to attempt)
  const handleSubmitProblem = async () => {
    if (!activeProblem || !attempt || isExecuting) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsExecuting(true);
    setExecutionType('submit');
    setExecutionError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: activeProblem._id,
          language: selectedLanguage,
          sourceCode: currentCode,
          isSampleRun: false,
          attemptId: attempt._id,
          assessmentId: assessment?._id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Submission error');
      }

      const result = await res.json();
      setExecutionResult(result);

      // Refresh attempt state to reflect passed status
      const attemptRes = await fetch(`${API_URL}/api/assessments/attempts/${attempt._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (attemptRes.ok) {
        const fresh = await attemptRes.json();
        setAttempt(fresh.attempt);
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Submission failed');
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  };

  // Final Finish Assessment
  const handleFinishAssessment = async () => {
    if (!attempt) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsFinishing(true);
    try {
      const res = await fetch(`${API_URL}/api/assessments/attempts/${attempt._id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setScorecard(data.scorecard);
      setAttempt(data.attempt);
      setShowConfirmFinish(false);
    } catch (err: any) {
      setError(err.message || 'Error submitting assessment');
    } finally {
      setIsFinishing(false);
    }
  };

  // Format Timer
  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSec / 3600);
    const minutes = Math.floor((remainingSec % 3600) / 60);
    const seconds = remainingSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${hours > 0 ? `${pad(hours)}:` : ''}${pad(minutes)}:${pad(seconds)}`;
  }, [remainingSec]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Initializing timed assessment environment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment || !attempt) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Assessment Unavailable</h2>
        <p className="text-sm text-muted-foreground">{error || 'Could not load assessment details.'}</p>
        <Link to="/assessments" className="btn btn-primary btn-sm inline-flex items-center gap-2 mt-2">
          <ArrowLeft size={16} />
          Back to Assessments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Assessment Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/assessments"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Exit assessment"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground">
              {assessment.title}
            </h1>
            <span className="text-xs text-muted-foreground">
              Passing Mark: {assessment.passingScore}% • {assessment.problemIds.length} Challenges
            </span>
          </div>
        </div>

        {/* Timer & Finish Assessment Action */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-sm transition-colors',
              remainingSec <= 300
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                : 'bg-muted/60 text-foreground border-border'
            )}
          >
            <Clock size={16} className={remainingSec <= 300 ? 'text-rose-500' : 'text-primary'} />
            <span>{formattedTime}</span>
          </div>

          <button
            onClick={() => setShowConfirmFinish(true)}
            className="btn btn-primary btn-sm text-xs font-semibold"
          >
            Finish Assessment
          </button>
        </div>
      </div>

      {/* Multi-Problem Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {assessment.problemIds.map((prob, idx) => {
          const isSelected = activeProblemIdx === idx;
          const attemptRecord = attempt.problemSubmissions?.find(
            (p) => p.problemId.toString() === prob._id.toString()
          );
          const isPassed = attemptRecord?.passed;

          return (
            <button
              key={prob._id}
              onClick={() => {
                setActiveProblemIdx(idx);
                setExecutionResult(null);
                setExecutionError(null);
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <span>Problem {idx + 1}: {prob.title}</span>
              {isPassed ? (
                <CheckCircle2 size={14} className={isSelected ? 'text-primary-foreground' : 'text-emerald-500'} />
              ) : (
                <span className={cn('text-[10px] px-1.5 py-0.2 rounded capitalize', isSelected ? 'bg-primary-foreground/20' : 'bg-muted')}>
                  {prob.difficulty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Problem Workspace Grid */}
      {activeProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
          {/* Left Panel: Problem Statement & Live Result */}
          <div className="lg:col-span-5 flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Challenge {activeProblemIdx + 1}</span>
                <h2 className="text-base font-bold text-foreground">{activeProblem.title}</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize bg-muted text-muted-foreground">
                {activeProblem.difficulty}
              </span>
            </div>

            <div className="p-5 overflow-y-auto max-h-[600px] space-y-6 text-sm">
              {/* Statement */}
              <div className="prose prose-sm dark:prose-invert text-xs leading-relaxed whitespace-pre-line text-foreground">
                {activeProblem.statement}
              </div>

              {/* Examples */}
              {activeProblem.examples && activeProblem.examples.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sample Test Cases</span>
                  {activeProblem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono space-y-1">
                      <div><span className="text-muted-foreground">Input: </span><span>{ex.input}</span></div>
                      <div><span className="text-muted-foreground">Output: </span><span>{ex.output}</span></div>
                      {ex.explanation && (
                        <div className="text-muted-foreground italic font-sans text-[11px] pt-1">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {activeProblem.constraints && activeProblem.constraints.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Constraints</span>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground font-mono space-y-0.5">
                    {activeProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live Execution Output Drawer */}
              {(isExecuting || executionResult || executionError) && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Terminal size={14} className="text-primary" /> Execution Output
                    </span>
                    {executionResult && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-bold uppercase',
                          executionResult.verdict === 'AC'
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : 'text-rose-500 bg-rose-500/10'
                        )}
                      >
                        {executionResult.verdict === 'AC' ? 'Accepted' : executionResult.verdict}
                      </span>
                    )}
                  </div>

                  {isExecuting ? (
                    <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <span>{executionType === 'sample' ? 'Running sample test...' : 'Submitting to test runner...'}</span>
                    </div>
                  ) : executionError ? (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                      {executionError}
                    </div>
                  ) : executionResult ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                        <span>Passed: <strong>{executionResult.passedCount} / {executionResult.totalCount}</strong></span>
                        <span>Runtime: <strong>{executionResult.runtimeMs}ms</strong></span>
                        <span>Memory: <strong>{Math.round(executionResult.memoryKb / 1024)}MB</strong></span>
                      </div>

                      {executionResult.testCaseResults?.map((tc: any, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            'p-2.5 rounded-lg border text-xs font-mono',
                            tc.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                          )}
                        >
                          <div className="flex items-center justify-between text-[11px] font-sans font-bold">
                            <span>Case {i + 1} {tc.isHidden ? '(Confidential)' : ''}</span>
                            <span className={tc.passed ? 'text-emerald-500' : 'text-rose-500'}>{tc.verdict}</span>
                          </div>
                          {!tc.isHidden && (
                            <div className="pt-1 text-[11px] text-muted-foreground">
                              <div>Actual: <span className="text-foreground">{tc.actualStdout}</span></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Monaco Editor & Run/Submit */}
          <div className="lg:col-span-7 flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/40 border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                  className="select select-sm text-xs font-mono font-semibold py-1 px-2.5 rounded-lg border border-border bg-card text-foreground"
                >
                  {(Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[]).map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_CONFIG[lang].label}
                    </option>
                  ))}
                </select>

                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value as 'vs-dark' | 'light')}
                  className="select select-sm text-xs py-1 px-2.5 rounded-lg border border-border bg-card text-foreground"
                >
                  <option value="vs-dark">VS Dark</option>
                  <option value="light">VS Light</option>
                </select>

                <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg bg-card px-1 py-0.5">
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                    className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground text-xs font-mono"
                  >
                    A-
                  </button>
                  <span className="text-[11px] font-mono text-muted-foreground px-1">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(20, s + 1))}
                    className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground text-xs font-mono"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="btn btn-outline btn-xs flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleResetCode}
                  className="btn btn-outline btn-xs flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-[460px] relative">
              <Editor
                height="100%"
                language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
                value={currentCode}
                theme={editorTheme}
                onChange={handleCodeChange}
                options={{
                  fontSize,
                  tabSize: 4,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  formatOnPaste: true,
                  fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                  fontLigatures: true,
                }}
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Each submission contributes to your final assessment score.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRunTests}
                  disabled={isExecuting || remainingSec <= 0}
                  className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs font-semibold"
                >
                  {isExecuting && executionType === 'sample' ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play size={13} className="text-emerald-500" />
                  )}
                  <span>Run Tests</span>
                </button>

                <button
                  onClick={handleSubmitProblem}
                  disabled={isExecuting || remainingSec <= 0}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                >
                  {isExecuting && executionType === 'submit' ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Submit Problem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full space-y-4 shadow-xl border-border animate-fade-in">
            <h3 className="text-lg font-bold text-foreground">Finish Assessment?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to finalize your assessment? Once submitted, your score will be computed and no further edits can be made.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="btn btn-outline btn-sm text-xs"
              >
                Continue Working
              </button>
              <button
                onClick={handleFinishAssessment}
                disabled={isFinishing}
                className="btn btn-primary btn-sm text-xs font-semibold"
              >
                {isFinishing ? 'Grading...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Scorecard Modal */}
      {scorecard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card p-8 max-w-lg w-full space-y-6 text-center border-border shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Trophy size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Assessment Complete</h2>
              <p className="text-xs text-muted-foreground">{assessment.title}</p>
            </div>

            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="text-4xl font-black tracking-tight text-foreground">
                {scorecard.totalScore}%
              </div>
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    scorecard.passed
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  )}
                >
                  {scorecard.passed ? 'Passed Screening' : 'Did Not Pass'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Passing requirement: {scorecard.passingThreshold}% • Solved {scorecard.passedProblemsCount} of {scorecard.totalProblemsCount} challenges
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/assessments')}
                className="btn btn-primary btn-md w-full text-sm font-semibold"
              >
                Back to Assessments Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentWorkspacePage;
