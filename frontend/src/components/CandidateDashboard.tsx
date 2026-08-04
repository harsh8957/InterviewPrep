import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, ArrowRight, ChevronRight, Tag, Clipboard,
  TrendingUp, Trophy, Target, Plus, AlertCircle, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface ScheduledInterview {
  _id: string;
  title: string;
  hr: { firstName: string; lastName: string; company: string };
  scheduledFor: string;
  duration: number;
  roomLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface InterviewResult {
  _id: string;
  interview?: { title: string; scheduledFor: string };
  jobRole: string;
  experienceLevel: string;
  totalScore: number;
  date: string;
  isHrScheduled?: boolean;
}

const formatJobRole = (role: string) =>
  role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const formatExperienceLevel = (level: string) =>
  level.charAt(0).toUpperCase() + level.slice(1);

const getScoreMeta = (score: number) => {
  if (score >= 90) return { label: 'Excellent', className: 'badge-success' };
  if (score >= 75) return { label: 'Good', className: 'badge-primary' };
  if (score >= 60) return { label: 'Fair', className: 'badge-warning' };
  return { label: 'Needs Work', className: 'badge-destructive' };
};

const getScoreBarColor = (score: number) => {
  if (score >= 90) return 'bg-success';
  if (score >= 75) return 'bg-primary';
  if (score >= 60) return 'bg-warning';
  return 'bg-destructive';
};

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'scheduled': return { label: 'Scheduled', className: 'badge-primary' };
    case 'completed': return { label: 'Completed', className: 'badge-success' };
    case 'cancelled': return { label: 'Cancelled', className: 'badge-destructive' };
    default: return { label: status, className: 'badge-muted' };
  }
};

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const [intRes, resRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/interviews/candidate`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/interview-results`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!intRes.ok) throw new Error((await intRes.json()).message || 'Failed to fetch interviews');
        if (!resRes.ok) throw new Error((await resRes.json()).message || 'Failed to fetch results');

        setInterviews(await intRes.json());
        setResults(await resRes.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error fetching data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  const upcomingInterviews = interviews.filter(
    i => i.status === 'scheduled' && new Date(i.scheduledFor) > new Date()
  );
  const pastInterviews = interviews.filter(
    i => i.status === 'completed' || (i.status === 'scheduled' && new Date(i.scheduledFor) <= new Date())
  );

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.totalScore, 0) / results.length)
    : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.totalScore)) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition container-content py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, <span className="text-gradient">{user?.firstName}</span> 👋
          </h1>
          <p className="text-muted-foreground">Here's an overview of your interviews and performance</p>
        </div>
        <Link to="/setup" className="btn btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} />
          Start New Interview
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error mb-8 animate-slide-up" role="alert">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            icon: TrendingUp,
            label: 'Total Interviews',
            value: results.length,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            icon: Trophy,
            label: 'Best Score',
            value: bestScore ? `${bestScore}/100` : '—',
            color: 'text-warning',
            bg: 'bg-warning/10',
          },
          {
            icon: Target,
            label: 'Average Score',
            value: avgScore ? `${avgScore}/100` : '—',
            color: 'text-success',
            bg: 'bg-success/10',
          },
          {
            icon: Calendar,
            label: 'Upcoming',
            value: upcomingInterviews.length,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card flex flex-col gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg, s.color)}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Interviews */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Upcoming Interviews</h2>
          {upcomingInterviews.length > 0 && (
            <span className="badge badge-primary">{upcomingInterviews.length}</span>
          )}
        </div>

        {upcomingInterviews.length === 0 ? (
          <div className="card border-dashed text-center py-10">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">No upcoming interviews scheduled.</p>
            <Link to="/setup" className="btn btn-outline btn-sm mx-auto">
              Start a practice interview
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingInterviews.map(interview => {
              const status = getStatusMeta(interview.status);
              return (
                <div key={interview._id} className="card-hover flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-foreground leading-snug">{interview.title}</h3>
                    <span className={cn('badge shrink-0', status.className)}>{status.label}</span>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="shrink-0" />
                      <span>{format(new Date(interview.scheduledFor), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      <span>{format(new Date(interview.scheduledFor), 'p')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard size={14} className="shrink-0" />
                      <span>With {interview.hr.firstName} {interview.hr.lastName}</span>
                    </div>
                    {interview.hr.company && (
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="shrink-0" />
                        <span>{interview.hr.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0" />
                      <span>Duration: {interview.duration} min</span>
                    </div>
                  </div>

                  <Link
                    to={interview.roomLink}
                    className="btn btn-primary w-full mt-auto"
                  >
                    Join Interview
                    <ExternalLink size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interview Results */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Interview Results</h2>
          {results.length > 0 && (
            <span className="badge badge-muted">{results.length} total</span>
          )}
        </div>

        {results.length === 0 ? (
          <div className="card border-dashed text-center py-10">
            <Trophy size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">You haven't completed any interviews yet.</p>
            <Link to="/setup" className="btn btn-primary btn-sm mx-auto">
              Start your first interview
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Date', 'Type', 'Position', 'Level', 'Score', 'Action'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map(result => {
                    const { label, className } = getScoreMeta(result.totalScore);
                    return (
                      <tr key={result._id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-5 py-4 whitespace-nowrap text-foreground">
                          {format(new Date(result.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn('badge', result.interview ? 'badge-primary' : 'badge-muted')}>
                            {result.interview ? 'Scheduled' : 'Practice'}
                          </span>
                          {result.interview && (
                            <div className="text-xs text-muted-foreground mt-1">{result.interview.title}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-foreground font-medium">
                          {formatJobRole(result.jobRole)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                          {formatExperienceLevel(result.experienceLevel)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">{result.totalScore}</span>
                              <span className="text-muted-foreground">/100</span>
                            </div>
                            <span className={cn('badge', className)}>{label}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', getScoreBarColor(result.totalScore))}
                              style={{ width: `${result.totalScore}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link
                            to={`/results/${result._id}`}
                            className="btn btn-ghost btn-sm text-primary group-hover:bg-primary/5"
                          >
                            View Details
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-5">Past Scheduled Interviews</h2>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Date & Time', 'Title', 'Interviewer', 'Company', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pastInterviews.map(interview => {
                    const status = getStatusMeta(interview.status);
                    return (
                      <tr key={interview._id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-foreground">{format(new Date(interview.scheduledFor), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(interview.scheduledFor), 'p')}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-foreground font-medium">
                          {interview.title}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-foreground">
                          {interview.hr.firstName} {interview.hr.lastName}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                          {interview.hr.company || '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn('badge', status.className)}>{status.label}</span>
                          {interview.status === 'scheduled' && (
                            <Link
                              to={interview.roomLink}
                              className="flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                            >
                              Join Room <ChevronRight size={12} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CandidateDashboard;
