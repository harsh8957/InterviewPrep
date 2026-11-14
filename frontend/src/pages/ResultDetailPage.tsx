import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  BarChart, Trophy, Target, AlertCircle, Share2, Download, Printer, CheckCircle,
  XCircle, ArrowLeft, Terminal, BookOpen, Layers, Sparkles
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

// Define the interface for the interview result
interface InterviewAnswer {
  questionId: string;
  text?: string;
  answerText?: string;
  codeSnippet?: string;
  codeVerdict?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionText?: string;
  isFollowUp?: boolean;
  adaptiveDifficulty?: number;
  complexityAnalysis?: {
    time?: string;
    space?: string;
  };
}

interface CodeSubmissionItem {
  questionId: string;
  language: string;
  code: string;
  verdict: string;
  passedCases: number;
  totalCases: number;
  runtimeMs?: number;
  memoryKb?: number;
}

interface RubricMetrics {
  technicalCorrectness: number;
  problemSolving: number;
  clarityOfExplanation: number;
  complexityAnalysis?: number;
  edgeCases?: number;
  communication: number;
}

interface InterviewResult {
  _id: string; // This is the result's own ID
  candidate: string;
  interview?: { // This would be the original scheduled interview ID
    _id: string;
    title: string;
    scheduledFor: string;
  };
  jobRole: string;
  isHrScheduled?: boolean;
  experienceLevel: string;
  interviewMode?: string;
  difficulty?: string;
  duration?: number;
  totalScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  answers: InterviewAnswer[];
  date: string;
  cheatingDetected?: boolean;
  codeSubmissions?: CodeSubmissionItem[];
  rubricBreakdown?: RubricMetrics;
  suggestedTopicsToRevise?: string[];
}

const ResultDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchInterviewResult = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams(location.search);
        const idType = queryParams.get('by');

        let relativeFetchUrl = `/api/interview-results/${id}`;
        if (idType === 'schedule' && id) {
          relativeFetchUrl = `/api/interview-results/interview/${id}`;
          // // console.log(`[ResultDetailPage] Fetching by schedule ID: ${id} using URL: ${API_BASE_URL}${relativeFetchUrl}`);
        } else if (id) {
          // // console.log(`[ResultDetailPage] Fetching by result ID: ${id} using URL: ${API_BASE_URL}${relativeFetchUrl}`);
        }
        const fetchUrl = `${API_BASE_URL}${relativeFetchUrl}`;

        const response = await fetch(fetchUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch interview result');
        }

        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error('Error fetching interview result:', error);
        setError(error instanceof Error ? error.message : 'Error fetching interview result');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      // // console.log(`[ResultDetailPage] Fetching result for interview ID from URL: ${id}`);
      fetchInterviewResult();
    } else {
      // // console.log("[ResultDetailPage] No ID in URL params.");
      setError("No interview ID provided to fetch results.");
      setIsLoading(false);
    }
  }, [id, location.search, API_BASE_URL]); // Add API_BASE_URL

  // Access control logic removed as per new requirement for users/candidates to view HR scheduled results.
  // The page will now rely on the user being authenticated (if needed by the API for fetching results)
  // or simply display results if publicly accessible via ID.

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-warning-foreground';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-success';
    if (score >= 75) return 'bg-primary';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const formatJobRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const dashboardPath = user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  const handleShare = async () => {
    const shareData = {
      title: 'My InterviewPrep Results',
      text: `I scored ${result?.totalScore}/100 on my ${result?.jobRole} interview on InterviewPrep!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const lines = [
      `InterviewPrep Interview Results`,
      `Date: ${formatDate(new Date(result.date))}`,
      `Role: ${formatJobRole(result.jobRole)} | Level: ${formatExperienceLevel(result.experienceLevel)}`,
      `Overall Score: ${result.totalScore}/100`,
      ``,
      `Feedback: ${result.feedback}`,
      ``,
      `Strengths:`,
      ...result.strengths.map(s => `  - ${s}`),
      ``,
      `Areas for Improvement:`,
      ...result.improvements.map(i => `  - ${i}`),
      ``,
      `--- Answer Details ---`,
      ...result.answers.map((a, idx) => [
        `Q${idx + 1}: ${a.questionText || 'N/A'}`,
        `Answer: ${a.text || 'Skipped'}`,
        `Score: ${a.score ?? 0}/100`,
        `Feedback: ${a.feedback || 'N/A'}`,
        ``,
      ].join('\n')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviewprep-results-${result.jobRole}-${new Date(result.date).toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const handleResources = () => navigate('/setup');

  if (isLoading) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition container-content py-10">
        <div className="mx-auto max-w-4xl">
          <div className="alert-error mb-6" role="alert">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <div className="text-center">
            <button onClick={() => navigate(dashboardPath)} className="btn btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-transition container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Interview Result Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested interview result could not be found.</p>
            <button 
              onClick={() => navigate('/candidate/dashboard')} 
              className="btn btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link 
          to={user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} 
          className="flex items-center text-primary mb-6 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
          <AlertCircle className="text-primary mt-0.5 flex-shrink-0" size={18} />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Educational Assessment Disclaimer:</strong>{' '}
            This evaluation is an automated technical preparation tool designed for practice and skill benchmarking.
            Scoring rubrics provide diagnostic feedback to guide learning and do not constitute an official employment or hiring decision.
          </div>
        </div>

        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge badge-primary uppercase text-[11px] font-bold tracking-wider">
                {result.interviewMode || 'Full-Stack'} Mode
              </span>
              <span className="badge badge-muted capitalize text-[11px]">
                {result.difficulty || 'Medium'} Difficulty
              </span>
              <span className="badge badge-outline text-[11px]">
                {result.duration || 30} Minutes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Interview Results</h1>
            <p className="text-muted-foreground text-sm">
              {formatJobRole(result.jobRole)} • {formatExperienceLevel(result.experienceLevel)} Level • {formatDate(new Date(result.date))}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handleShare} className="btn btn-sm btn-outline flex items-center space-x-1">
              <Share2 size={14} />
              <span>Share</span>
            </button>
            <button onClick={handleDownload} className="btn btn-sm btn-outline flex items-center space-x-1">
              <Download size={14} />
              <span>Download</span>
            </button>
            <button onClick={handlePrint} className="btn btn-sm btn-outline flex items-center space-x-1">
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="card flex flex-col items-center justify-center text-center p-5">
            <div className="mb-2 text-primary">
              <Trophy size={36} />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Overall Score</h2>
            <div className="flex items-center space-x-3">
              <div className={`${getScoreBg(result.totalScore)} flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md`}>
                <span className="text-2xl font-bold">{result.totalScore}</span>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-medium">out of 100</p>
                <p className={`${getScoreColor(result.totalScore)} text-sm font-bold`}>
                  {result.totalScore >= 90 ? 'Excellent' : 
                   result.totalScore >= 75 ? 'Good' : 
                   result.totalScore >= 60 ? 'Satisfactory' : 
                   'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-2 text-primary">
              <Target size={22} />
            </div>
            <h2 className="mb-2 text-base font-semibold">Key Strengths</h2>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {result.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={14} className="mr-1.5 mt-0.5 text-success flex-shrink-0" />
                  <span className="text-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <div className="mb-2 text-primary">
              <BarChart size={22} />
            </div>
            <h2 className="mb-2 text-base font-semibold">Areas for Improvement</h2>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {result.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <Target size={14} className="mr-1.5 mt-0.5 text-warning flex-shrink-0" />
                  <span className="text-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 6-Dimension Rubric Breakdown */}
        {result.rubricBreakdown && (
          <div className="card p-6 mb-8 border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              Technical Evaluation Rubric
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Technical Correctness', val: result.rubricBreakdown.technicalCorrectness },
                { label: 'Problem Solving', val: result.rubricBreakdown.problemSolving },
                { label: 'Clarity of Explanation', val: result.rubricBreakdown.clarityOfExplanation },
                { label: 'Complexity Analysis', val: result.rubricBreakdown.complexityAnalysis ?? 75 },
                { label: 'Edge Case Handling', val: result.rubricBreakdown.edgeCases ?? 70 },
                { label: 'Communication & Delivery', val: result.rubricBreakdown.communication },
              ].map((rubric, rIdx) => (
                <div key={rIdx} className="p-3 rounded-lg border border-border/60 bg-muted/20">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-foreground">{rubric.label}</span>
                    <span className="font-bold text-primary">{rubric.val}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        rubric.val >= 80 ? 'bg-success' : rubric.val >= 60 ? 'bg-primary' : 'bg-destructive'
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, rubric.val))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Revision Topics */}
        {result.suggestedTopicsToRevise && result.suggestedTopicsToRevise.length > 0 && (
          <div className="card p-5 mb-8 border border-border bg-card">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Recommended Topics to Revise
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.suggestedTopicsToRevise.map((topic, tIdx) => (
                <Link
                  key={tIdx}
                  to="/roadmap"
                  className="badge badge-primary px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1.5"
                >
                  <Sparkles size={11} /> {topic}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Code Submissions History */}
        {result.codeSubmissions && result.codeSubmissions.length > 0 && (
          <div className="card p-5 mb-8 border border-border bg-card space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              Submitted Code Solutions ({result.codeSubmissions.length})
            </h2>
            <div className="space-y-3">
              {result.codeSubmissions.map((sub, sIdx) => (
                <div key={sIdx} className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/40 p-2.5 px-3 flex items-center justify-between text-xs border-b border-border">
                    <span className="font-mono text-foreground font-medium uppercase">{sub.language}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'badge text-[10px] font-bold',
                        sub.verdict === 'AC' ? 'badge-success' : 'badge-destructive'
                      )}>
                        Verdict: {sub.verdict}
                      </span>
                      {sub.runtimeMs !== undefined && (
                        <span className="text-muted-foreground">{sub.runtimeMs}ms</span>
                      )}
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre">
                    {sub.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cheating Detection Alert */}
        {result.cheatingDetected && (
          <div className="mb-10 rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start">
              <AlertCircle size={24} className="mr-3 mt-0.5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Potential Cheating Detected</h3>
                <p className="mt-1 text-sm">
                  Our eye-tracking system detected potential reference checking or assistance during the interview. 
                  In a real interview, this would be considered unprofessional and could disqualify you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Detailed Feedback</h2>
          <p className="mb-6">{result.feedback}</p>

          <div className="space-y-6">
            {result.answers.map((answer, index) => (
              <div key={index} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border p-4 bg-muted/20 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">Question {index + 1}</span>
                      {answer.isFollowUp && (
                        <span className="badge badge-warning text-[10px]">Adaptive Follow-Up</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{answer.questionText || "Question not available"}</p>
                  </div>
                  {answer.complexityAnalysis && (
                    <div className="flex gap-1.5 flex-shrink-0 text-[10px]">
                      {answer.complexityAnalysis.time && (
                        <span className="badge badge-outline font-mono">Time: {answer.complexityAnalysis.time}</span>
                      )}
                      {answer.complexityAnalysis.space && (
                        <span className="badge badge-outline font-mono">Space: {answer.complexityAnalysis.space}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Answer:</h4>
                    <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                      {answer.answerText || answer.text || "No verbal/text answer provided"}
                    </p>
                  </div>

                  {answer.codeSnippet && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal size={13} /> Submitted Code:
                        </h4>
                        {answer.codeVerdict && (
                          <span className={cn(
                            'badge text-[10px] font-bold',
                            answer.codeVerdict === 'AC' ? 'badge-success' : 'badge-destructive'
                          )}>
                            Verdict: {answer.codeVerdict}
                          </span>
                        )}
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre">
                        {answer.codeSnippet}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-3">
                      <div className={`${getScoreBg(answer.score || 0)} rounded-full px-2.5 py-0.5 text-xs font-bold text-white`}>
                        Score: {answer.score || 0}/100
                      </div>
                      <span className={`text-xs font-semibold ${getScoreColor(answer.score || 0)}`}>
                        {answer.score && answer.score >= 90 ? 'Excellent' : 
                         answer.score && answer.score >= 75 ? 'Good' : 
                         answer.score && answer.score >= 60 ? 'Satisfactory' : 
                         'Needs Improvement'}
                      </span>
                    </div>
                    
                    {(answer.answerText || answer.text || answer.codeSnippet) ? (
                      <div className="flex items-center text-xs text-success font-medium">
                        <CheckCircle size={14} className="mr-1" />
                        <span>Answered</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-destructive font-medium">
                        <XCircle size={14} className="mr-1" />
                        <span>Skipped</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnostic Feedback:</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed italic bg-card p-3 rounded border border-border/40">
                      {answer.feedback || "No feedback available"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/setup" className="btn btn-primary">
            Take Another Interview
          </Link>
          <button onClick={handleResources} className="btn btn-outline">
            See Recommended Resources
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDetailPage; 
