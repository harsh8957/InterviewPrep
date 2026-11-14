import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  Lightbulb,
  BookOpen,
  FileText,
  Clock,
  HardDrive,
  Building,
  Tag,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  History,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';

type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java';

interface ProblemDetail {
  _id: string;
  title: string;
  slug: string;
  statement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  patterns: string[];
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
  hints?: string[];
  editorial?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  companyTags?: string[];
  publicTestCases?: {
    input: string;
    expectedOutput: string;
    order: number;
  }[];
}

interface TestCaseResult {
  testCaseId?: string;
  passed: boolean;
  verdict: string;
  runtimeMs: number;
  memoryKb: number;
  stdin?: string;
  expectedStdout?: string;
  actualStdout?: string;
  errorOutput?: string;
  isHidden?: boolean;
}

interface SubmissionResponse {
  _id: string;
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb: number;
  compileOutput?: string;
  error?: string;
  isSampleRun: boolean;
  testCaseResults: TestCaseResult[];
  createdAt: string;
  language: string;
  sourceCode?: string;
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
    defaultSnippet: '/**\n * @return {void}\n */\nfunction solve() {\n    // Write your code here\n}\n',
  },
  typescript: {
    label: 'TypeScript 5',
    monacoLang: 'typescript',
    defaultSnippet: 'function solve(): void {\n    // Write your code here\n}\n',
  },
  cpp: {
    label: 'C++ 20',
    monacoLang: 'cpp',
    defaultSnippet: '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};\n',
  },
  java: {
    label: 'Java 21',
    monacoLang: 'java',
    defaultSnippet: 'import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}\n',
  },
};

export const ProblemWorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'editorial' | 'testcases' | 'results' | 'submissions'>('description');
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Execution & Judge State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionType, setExecutionType] = useState<'sample' | 'submit' | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionResponse | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Fetch problem details
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/problems/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Problem not found' : 'Failed to load problem');
        }
        return res.json();
      })
      .then((data: ProblemDetail) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, API_URL]);

  // Load code draft from localStorage or fallback to starter code
  useEffect(() => {
    if (!problem || !slug) return;

    const draftKey = `ip-draft-${slug}-${selectedLanguage}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft !== null && savedDraft.trim() !== '') {
      setCode(savedDraft);
    } else {
      const defaultCode =
        problem.starterCode?.[selectedLanguage] ||
        LANGUAGE_CONFIG[selectedLanguage].defaultSnippet;
      setCode(defaultCode);
    }
  }, [problem, slug, selectedLanguage]);

  // Fetch submission history
  const fetchSubmissionHistory = useCallback(() => {
    if (!problem) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setHistoryLoading(true);
    fetch(`${API_URL}/api/submissions/problem/${problem._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SubmissionResponse[]) => {
        setSubmissionHistory(data);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, [problem, API_URL]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissionHistory();
    }
  }, [activeTab, fetchSubmissionHistory]);

  // Handle Code Change with Debounced LocalStorage Sync
  const handleCodeChange = (newCode?: string) => {
    const updated = newCode ?? '';
    setCode(updated);
    setSaveStatus('saving');

    if (slug) {
      const draftKey = `ip-draft-${slug}-${selectedLanguage}`;
      localStorage.setItem(draftKey, updated);
      setTimeout(() => setSaveStatus('saved'), 400);
    }
  };

  // Reset to original starter code
  const handleResetCode = () => {
    if (!problem || !slug) return;
    const defaultCode =
      problem.starterCode?.[selectedLanguage] ||
      LANGUAGE_CONFIG[selectedLanguage].defaultSnippet;
    setCode(defaultCode);
    localStorage.removeItem(`ip-draft-${slug}-${selectedLanguage}`);
    setSaveStatus('saved');
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Run Sample Tests
  const handleRunTests = async () => {
    if (!problem || isExecuting) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setExecutionError('Please sign in to execute code.');
      return;
    }

    setIsExecuting(true);
    setExecutionType('sample');
    setExecutionError(null);
    setActiveTab('results');

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem._id,
          language: selectedLanguage,
          sourceCode: code,
          isSampleRun: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Execution error');
      }

      const result: SubmissionResponse = await res.json();
      setLastSubmission(result);
    } catch (err: any) {
      setExecutionError(err.message || 'Network error executing code');
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  };

  // Submit Final Solution
  const handleSubmitSolution = async () => {
    if (!problem || isExecuting) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setExecutionError('Please sign in to submit solutions.');
      return;
    }

    setIsExecuting(true);
    setExecutionType('submit');
    setExecutionError(null);
    setActiveTab('results');

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: problem._id,
          language: selectedLanguage,
          sourceCode: code,
          isSampleRun: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Submission error');
      }

      const result: SubmissionResponse = await res.json();
      setLastSubmission(result);
      fetchSubmissionHistory();
    } catch (err: any) {
      setExecutionError(err.message || 'Network error submitting code');
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  };

  const difficultyBadge = useMemo(() => {
    if (!problem) return null;
    const diff = problem.difficulty;
    const colors =
      diff === 'easy'
        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        : diff === 'medium'
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border', colors)}>
        {diff}
      </span>
    );
  }, [problem]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
          <div className="lg:col-span-5 bg-card/60 border border-border rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
          <div className="lg:col-span-7 bg-card/60 border border-border rounded-2xl p-4 flex flex-col justify-between">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-[500px] bg-muted/40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Problem Unavailable</h2>
        <p className="text-sm text-muted-foreground">
          {error || 'The requested problem could not be found or has not been published.'}
        </p>
        <Link to="/problems" className="btn btn-primary btn-sm inline-flex items-center gap-2 mt-2">
          <ArrowLeft size={16} />
          Back to Problem Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Navigation & Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Back to Problem Catalog"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                {problem.title}
              </h1>
              {difficultyBadge}
            </div>
          </div>
        </div>

        {/* Phase 4 Live Execution & Draft Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-muted/60 text-muted-foreground border border-border">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
              )}
            />
            <span>{saveStatus === 'saved' ? 'Draft autosaved' : 'Saving...'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles size={13} />
            <span>Judge0 CE Online</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[680px]">
        {/* Left Panel: Problem Specification, Hints, Editorial, Live Results, Submissions */}
        <div className="lg:col-span-5 flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-border bg-muted/40 px-3 pt-2 gap-1 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'description'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText size={14} />
              Description
            </button>
            <button
              onClick={() => setActiveTab('hints')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'hints'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Lightbulb size={14} />
              Hints {problem.hints && problem.hints.length > 0 && `(${problem.hints.length})`}
            </button>
            <button
              onClick={() => setActiveTab('editorial')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'editorial'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen size={14} />
              Editorial
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'testcases'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <HelpCircle size={14} />
              Cases
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'results'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Terminal size={14} />
              Results {lastSubmission && `(${lastSubmission.verdict})`}
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all',
                activeTab === 'submissions'
                  ? 'border-primary text-foreground bg-card font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <History size={14} />
              Submissions
            </button>
          </div>

          {/* Panel Content Area */}
          <div className="p-5 overflow-y-auto max-h-[640px] space-y-6 text-sm">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-6 animate-fade-in">
                {/* Statement */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line font-sans">
                  {problem.statement}
                </div>

                {/* Formatted Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Examples</h3>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1.5">
                        <span className="text-xs font-bold text-foreground">Example {idx + 1}:</span>
                        <div className="font-mono text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground font-semibold">Input: </span>
                            <span className="text-foreground">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold">Output: </span>
                            <span className="text-foreground">{ex.output}</span>
                          </div>
                          {ex.explanation && (
                            <div className="text-muted-foreground pt-1 italic font-sans text-xs">
                              <span className="font-semibold not-italic">Explanation: </span>
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Constraints</h3>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>
                          <span className="text-foreground">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Complexities */}
                {(problem.timeComplexity || problem.spaceComplexity) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {problem.timeComplexity && (
                      <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Expected Time</div>
                          <div className="font-mono text-xs font-bold text-foreground">{problem.timeComplexity}</div>
                        </div>
                      </div>
                    )}
                    {problem.spaceComplexity && (
                      <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center gap-2">
                        <HardDrive size={16} className="text-secondary" />
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Expected Space</div>
                          <div className="font-mono text-xs font-bold text-foreground">{problem.spaceComplexity}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Topics & Company Tags */}
                <div className="pt-2 border-t border-border space-y-3">
                  {problem.topics && problem.topics.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
                        <Tag size={13} />
                        Topics & Patterns
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {problem.topics.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-foreground font-medium border border-border">
                            {t}
                          </span>
                        ))}
                        {problem.patterns?.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {problem.companyTags && problem.companyTags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
                        <Building size={13} />
                        Frequently Asked By
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {problem.companyTags.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-md bg-muted/80 text-[11px] text-muted-foreground font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Execution Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Terminal size={15} />
                    <span>Execution Output</span>
                  </h3>
                  {lastSubmission && (
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                        lastSubmission.verdict === 'AC'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : lastSubmission.verdict === 'WA'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      )}
                    >
                      {lastSubmission.verdict === 'AC' ? 'Accepted' : lastSubmission.verdict}
                    </span>
                  )}
                </div>

                {isExecuting ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium">
                      {executionType === 'sample' ? 'Executing against sample test cases...' : 'Evaluating against public & hidden test suite...'}
                    </p>
                  </div>
                ) : executionError ? (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle size={15} />
                      <span>Execution Error</span>
                    </div>
                    <p>{executionError}</p>
                    <button
                      onClick={executionType === 'sample' ? handleRunTests : handleSubmitSolution}
                      className="btn btn-outline btn-xs mt-2"
                    >
                      Retry Execution
                    </button>
                  </div>
                ) : !lastSubmission ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Click <strong>"Run Tests"</strong> to test sample cases, or <strong>"Submit"</strong> to run formal assessment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Metrics Banner */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border text-center text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Passed Cases</div>
                        <div className="font-bold text-foreground">
                          {lastSubmission.passedCount} / {lastSubmission.totalCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Runtime</div>
                        <div className="font-bold text-foreground">{lastSubmission.runtimeMs} ms</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Memory</div>
                        <div className="font-bold text-foreground">
                          {Math.round(lastSubmission.memoryKb / 1024)} MB
                        </div>
                      </div>
                    </div>

                    {/* Compilation Error Details */}
                    {lastSubmission.compileOutput && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-rose-500">Compilation Error</span>
                        <pre className="p-3 rounded-xl bg-black/80 text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {lastSubmission.compileOutput}
                        </pre>
                      </div>
                    )}

                    {/* Individual Test Cases */}
                    <div className="space-y-2.5">
                      {lastSubmission.testCaseResults?.map((tc, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-3 rounded-xl border text-xs font-mono space-y-1.5',
                            tc.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                          )}
                        >
                          <div className="flex items-center justify-between font-sans text-xs">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {tc.passed ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              ) : (
                                <XCircle size={14} className="text-rose-500" />
                              )}
                              <span>Test Case {idx + 1} {tc.isHidden ? '(Confidential)' : ''}</span>
                            </span>
                            <span
                              className={cn(
                                'font-semibold text-[11px]',
                                tc.passed ? 'text-emerald-500' : 'text-rose-500'
                              )}
                            >
                              {tc.verdict} ({tc.runtimeMs}ms)
                            </span>
                          </div>

                          {!tc.isHidden ? (
                            <div className="space-y-1 pt-1 text-[11px]">
                              <div>
                                <span className="text-muted-foreground font-semibold">Input: </span>
                                <span className="text-foreground">{tc.stdin}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-semibold">Expected: </span>
                                <span className="text-foreground">{tc.expectedStdout}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-semibold">Actual: </span>
                                <span className="text-foreground">{tc.actualStdout || '<no output>'}</span>
                              </div>
                              {tc.errorOutput && (
                                <div className="text-rose-500 text-[10px]">
                                  <span>Error: </span>
                                  {tc.errorOutput}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic text-[11px] pt-1">
                              Inputs and outputs are hidden for this evaluation test case.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submissions History Tab */}
            {activeTab === 'submissions' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <History size={15} />
                    <span>My Past Submissions</span>
                  </h3>
                  <button
                    onClick={fetchSubmissionHistory}
                    disabled={historyLoading}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title="Refresh history"
                  >
                    <RefreshCw size={13} className={cn(historyLoading && 'animate-spin')} />
                  </button>
                </div>

                {historyLoading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading submissions...</div>
                ) : submissionHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No submissions recorded yet for this problem.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-bold uppercase text-[11px]',
                                sub.verdict === 'AC' ? 'text-emerald-500' : 'text-rose-500'
                              )}
                            >
                              {sub.verdict === 'AC' ? 'Accepted' : sub.verdict}
                            </span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                              ({sub.passedCount}/{sub.totalCount} passed)
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{sub.language}</span>
                            <span>•</span>
                            <span>{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-right text-xs font-mono text-muted-foreground">
                          <div>{sub.runtimeMs}ms</div>
                          <div>{Math.round(sub.memoryKb / 1024)}MB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hints Tab */}
            {activeTab === 'hints' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm">Progressive Hints</h3>
                  <span className="text-xs text-muted-foreground">Reveal one by one</span>
                </div>

                {(!problem.hints || problem.hints.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic">No hints available for this problem yet.</p>
                ) : (
                  <div className="space-y-3">
                    {problem.hints.map((hint, idx) => {
                      const isRevealed = revealedHints[idx];
                      return (
                        <div key={idx} className="rounded-xl border border-border overflow-hidden bg-muted/20">
                          <button
                            onClick={() => toggleHint(idx)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors"
                          >
                            <span className="font-semibold text-xs text-foreground flex items-center gap-2">
                              <Lightbulb size={14} className={isRevealed ? 'text-amber-500' : 'text-muted-foreground'} />
                              Hint {idx + 1}
                            </span>
                            <span className="text-[11px] text-primary font-medium">
                              {isRevealed ? 'Hide' : 'Reveal'}
                            </span>
                          </button>
                          {isRevealed && (
                            <div className="p-3.5 pt-0 text-xs text-muted-foreground border-t border-border/50 bg-card leading-relaxed">
                              {hint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Editorial Tab */}
            {activeTab === 'editorial' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm">Official Editorial & Approach</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary/15 text-secondary font-medium">
                    Verified Solution
                  </span>
                </div>

                {problem.editorial ? (
                  <div className="prose prose-sm dark:prose-invert text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                    {problem.editorial}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Editorial analysis is currently being curated for this problem.
                  </p>
                )}
              </div>
            )}

            {/* Test Cases Tab */}
            {activeTab === 'testcases' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-foreground text-sm">Public Test Cases</h3>
                  <span className="text-[11px] text-muted-foreground">Public preview cases</span>
                </div>

                <div className="space-y-3">
                  {(problem.publicTestCases && problem.publicTestCases.length > 0
                    ? problem.publicTestCases
                    : problem.examples || []
                  ).map((tc, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-muted/30 font-mono text-xs space-y-1">
                      <div className="text-[11px] font-bold text-primary font-sans">Case {idx + 1}</div>
                      <div>
                        <span className="text-muted-foreground">Input: </span>
                        <span className="text-foreground">{tc.input}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected: </span>
                        <span className="text-foreground">{'expectedOutput' in tc ? tc.expectedOutput : tc.output}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Additional hidden edge cases evaluate your solution during formal assessment.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Monaco Editor & Live Run/Submit Actions */}
        <div className="lg:col-span-7 flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/40 border-b border-border text-xs">
            {/* Language Selection */}
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

              {/* Theme Selector */}
              <select
                value={editorTheme}
                onChange={(e) => setEditorTheme(e.target.value as 'vs-dark' | 'light')}
                className="select select-sm text-xs py-1 px-2.5 rounded-lg border border-border bg-card text-foreground"
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">VS Light</option>
              </select>

              {/* Font Size */}
              <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg bg-card px-1 py-0.5">
                <button
                  onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground text-xs font-mono"
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono text-muted-foreground px-1">{fontSize}px</span>
                <button
                  onClick={() => setFontSize((s) => Math.min(20, s + 1))}
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground text-xs font-mono"
                  title="Increase font size"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="btn btn-outline btn-xs flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                title="Copy code to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleResetCode}
                className="btn btn-outline btn-xs flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-destructive"
                title="Reset to starter template"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Component */}
          <div className="flex-1 min-h-[460px] relative">
            <Editor
              height="100%"
              language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
              value={code}
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

          {/* Bottom Execution Bar with Real Actions */}
          <div className="p-3 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                <strong>Isolated Sandbox:</strong> Code runs in a secure cgroups execution environment.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleRunTests}
                disabled={isExecuting}
                className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs font-semibold"
                title="Run code against sample test cases"
              >
                {isExecuting && executionType === 'sample' ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={13} className="text-emerald-500" />
                )}
                <span>Run Tests</span>
              </button>
              <button
                onClick={handleSubmitSolution}
                disabled={isExecuting}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                title="Submit solution for full test evaluation"
              >
                {isExecuting && executionType === 'submit' ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                <span>Submit Solution</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemWorkspacePage;
