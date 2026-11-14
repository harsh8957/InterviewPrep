import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ExperienceDetail {
  _id: string;
  companyName: string;
  companySlug: string;
  role: string;
  experienceLevel: string;
  interviewYear: number;
  interviewSeason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  outcome: string;
  provenance: string;
  candidateHandle: string;
  isAnonymous: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rounds: Array<{
    roundNumber: number;
    roundName: string;
    roundType: string;
    durationMinutes: number;
    questionsSummary: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  questions: Array<{
    questionText: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    linkedProblemId?: {
      _id: string;
      title: string;
      slug: string;
      difficulty: string;
    };
  }>;
  preparationTips: string;
  timelineNotes?: string;
  createdAt: string;
}

export const ExperienceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/experiences/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.experience) {
            setExperience(data.experience);
          } else {
            setError('Interview experience not found.');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.message || 'Interview experience not found or pending review.');
        }
      } catch (err: any) {
        console.error('Failed to load experience:', err);
        setError('Failed to load interview experience.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExperience();
    }
  }, [id]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason || reportReason.trim().length < 5) {
      setReportError('Please provide a reason of at least 5 characters.');
      return;
    }

    try {
      setSubmittingReport(true);
      setReportError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/experiences/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess(false);
          setReportReason('');
        }, 1500);
      } else {
        setReportError(data.message || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setReportError('Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const difficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Hard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-muted text-foreground/70">{diff}</span>;
    }
  };

  const outcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Offer':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Offer Received</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">Rejected</span>;
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">Pending Outcome</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-secondary text-secondary-foreground border border-border">{outcome}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="card p-8 space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="card p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Interview Debrief Unavailable</h2>
        <p className="text-sm text-muted-foreground">{error || 'This interview report is unavailable or pending moderation review.'}</p>
        <Link to="/experiences" className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} />
          <span>Back to All Experiences</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/experiences"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Experiences Feed</span>
        </Link>

        <Link
          to={`/companies/${experience.companySlug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>View {experience.companyName} Track</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Moderation Status Banner (if not approved) */}
      {experience.moderationStatus !== 'approved' && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          experience.moderationStatus === 'pending'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Moderation Status: {experience.moderationStatus.toUpperCase()}
            </span>
            <p className="text-foreground/80">
              {experience.moderationStatus === 'pending'
                ? 'This submission is awaiting administrator moderation review. It is currently visible only to you.'
                : `This submission was not approved: ${experience.rejectionReason || 'Does not adhere to community guidelines'}`}
            </p>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/companies/${experience.companySlug}`}
                className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {experience.companyName}
              </Link>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-secondary-foreground">
                {experience.experienceLevel}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={11} />
                PII-Moderated
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {experience.role} Interview Debrief
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span>Candidate: <strong className="text-foreground">{experience.candidateHandle}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {experience.interviewSeason} {experience.interviewYear}
              </span>
              <span>•</span>
              <span>Logged on {new Date(experience.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {outcomeBadge(experience.outcome)}
              {difficultyBadge(experience.difficulty)}
            </div>

            {user && (
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 pt-2 transition-colors"
              >
                <Flag size={12} />
                <span>Report Content</span>
              </button>
            )}
          </div>
        </div>

        {/* Preparation Advice Banner */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Preparation Advice & High-Yield Recommendations
          </h2>
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
            "{experience.preparationTips}"
          </div>
        </div>

        {/* Timeline Notes (if present) */}
        {experience.timelineNotes && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock size={13} />
              Process Timeline & Hiring Milestones
            </h2>
            <div className="p-3.5 rounded-lg bg-card border border-border/70 text-xs text-foreground/80 leading-relaxed">
              {experience.timelineNotes}
            </div>
          </div>
        )}
      </div>

      {/* Round-by-Round Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Round-by-Round Interview Loop ({experience.rounds?.length || 0} Stages)
          </h2>
          <span className="text-xs text-muted-foreground">Detailed technical and behavioral breakdown</span>
        </div>

        <div className="space-y-4">
          {experience.rounds.map((round) => (
            <div key={round.roundNumber} className="card p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    {round.roundNumber}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{round.roundName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">
                    {round.roundType.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    {round.durationMinutes} mins
                  </span>
                  {difficultyBadge(round.difficulty)}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Debrief & What Was Asked:
                </span>
                <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed pl-1 whitespace-pre-line">
                  {round.questionsSummary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specific Questions Asked & Matching Problem Links */}
      {experience.questions && experience.questions.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Specific Questions Asked in This Interview
            </h2>
            <p className="text-xs text-muted-foreground">
              Directly practice questions reported in this interview loop using our coding workspace.
            </p>
          </div>

          <div className="space-y-3">
            {experience.questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {q.topic}
                  </span>
                  {difficultyBadge(q.difficulty)}
                </div>

                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  "{q.questionText}"
                </p>

                {q.linkedProblemId && (
                  <div className="pt-2 border-t border-border/70 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Matching Problem in Problem Bank: <strong>{q.linkedProblemId.title}</strong>
                    </span>
                    <Link
                      to={`/problems/${q.linkedProblemId.slug}`}
                      className="btn btn-outline btn-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Practice in Workspace</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reporting Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-xl border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Flag size={16} className="text-destructive" />
                Report Inappropriate Content
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Help us maintain authentic and respectful content. Reports are investigated by platform administrators.
            </p>

            {reportError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                {reportError}
              </div>
            )}

            {reportSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Thank you. Your report has been submitted to moderators.</span>
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Reason for report:
                  </label>
                  <textarea
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    placeholder="E.g., Contains personal interviewer names, abusive language, NDA breach, or fabricated information..."
                    rows={4}
                    className="input text-xs w-full resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="btn btn-primary btn-sm bg-destructive text-white hover:bg-destructive/90"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceDetailPage;
