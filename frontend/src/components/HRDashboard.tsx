import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import {
  ChevronRight, Plus, X, Calendar, Users, CheckCircle2,
  XCircle, AlertCircle, Copy, ExternalLink, BarChart2, TrendingUp
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Interview {
  _id: string;
  title: string;
  candidate: { firstName: string; lastName: string; email: string };
  scheduledFor: string;
  duration: number;
  jobRole: string;
  experienceLevel: string;
  roomLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const formatJobRole = (role: string) => {
  if (!role) return 'N/A';
  return role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatExperienceLevel = (level: string) => {
  if (!level) return 'N/A';
  return level.charAt(0).toUpperCase() + level.slice(1);
};

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showNewInterview, setShowNewInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({
    title: '',
    candidateEmail: '',
    scheduledFor: '',
    duration: 60,
    jobRole: 'web-developer',
    experienceLevel: 'mid-level',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch interviews');
      setInterviews(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error fetching interviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newInterview, hr: user?._id }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create interview');
      const data = await response.json();
      setInterviews([...interviews, data]);
      setShowNewInterview(false);
      setNewInterview({ title: '', candidateEmail: '', scheduledFor: '', duration: 60, jobRole: 'web-developer', experienceLevel: 'mid-level' });
      setSuccessMsg('Interview scheduled successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to cancel interview');
      await fetchInterviews();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cancelling interview');
    }
  };

  const handleViewResults = async (interviewId: string) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/interview-results/interview/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          alert(data.interviewStatus === 'completed'
            ? 'This interview is marked as completed, but results are not yet available.'
            : 'No results are available for this interview yet.'
          );
          return;
        }
        throw new Error(data.message || 'Failed to fetch interview results');
      }
      navigate(`/results/${interviewId}?by=schedule`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error fetching interview results');
    }
  };

  const isInterviewActive = (interview: Interview) => {
    if (interview.status !== 'scheduled') return false;
    const now = new Date();
    const start = new Date(interview.scheduledFor);
    const end = new Date(start.getTime() + interview.duration * 60000);
    return now >= start && now <= end;
  };

  const getStatusMeta = (interview: Interview) => {
    if (isInterviewActive(interview)) return { label: 'Active Now', className: 'badge-success' };
    switch (interview.status) {
      case 'scheduled': return { label: new Date() < new Date(interview.scheduledFor) ? 'Scheduled' : 'Missed', className: 'badge-primary' };
      case 'completed': return { label: 'Completed', className: 'badge-success' };
      case 'cancelled': return { label: 'Cancelled', className: 'badge-destructive' };
      default: return { label: interview.status, className: 'badge-muted' };
    }
  };

  const handleCopyLink = (interview: Interview) => {
    navigator.clipboard.writeText(`${window.location.origin}${interview.roomLink}`);
    setCopiedId(interview._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stats
  const scheduled = interviews.filter(i => i.status === 'scheduled').length;
  const completed = interviews.filter(i => i.status === 'completed').length;
  const cancelled = interviews.filter(i => i.status === 'cancelled').length;

  const inputClass = "input text-sm";
  const labelClass = "label";

  return (
    <div className="page-transition container-content py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            HR Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user?.firstName}</span> — manage and schedule interviews
          </p>
        </div>
        <button
          id="schedule-interview-btn"
          onClick={() => setShowNewInterview(true)}
          className="btn btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total', value: interviews.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Scheduled', value: scheduled, icon: Calendar, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Completed', value: completed, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Cancelled', value: cancelled, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
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

      {/* Success message */}
      {successMsg && (
        <div className="alert border-success/30 bg-success/8 text-success mb-6 animate-slide-up" role="status">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert-error mb-6 animate-slide-up" role="alert">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Schedule Interview Modal/Panel */}
      {showNewInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewInterview(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-modal animate-scale-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Schedule New Interview</h2>
              <button
                onClick={() => setShowNewInterview(false)}
                className="btn btn-ghost btn-icon text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="p-6 flex flex-col gap-5">
              <div className="form-group">
                <label htmlFor="new-title" className={labelClass}>Interview title</label>
                <input
                  id="new-title"
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Frontend Developer Interview"
                  value={newInterview.title}
                  onChange={e => setNewInterview({ ...newInterview, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-candidate-email" className={labelClass}>Candidate email</label>
                <input
                  id="new-candidate-email"
                  type="email"
                  className={inputClass}
                  placeholder="candidate@example.com"
                  value={newInterview.candidateEmail}
                  onChange={e => setNewInterview({ ...newInterview, candidateEmail: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-scheduled-for" className={labelClass}>Date & Time</label>
                <input
                  id="new-scheduled-for"
                  type="datetime-local"
                  className={inputClass}
                  value={newInterview.scheduledFor}
                  onChange={e => setNewInterview({ ...newInterview, scheduledFor: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="new-duration" className={labelClass}>Duration</label>
                  <select
                    id="new-duration"
                    className={inputClass}
                    value={newInterview.duration}
                    onChange={e => setNewInterview({ ...newInterview, duration: parseInt(e.target.value, 10) })}
                    required
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="new-experience" className={labelClass}>Experience</label>
                  <select
                    id="new-experience"
                    className={inputClass}
                    value={newInterview.experienceLevel}
                    onChange={e => setNewInterview({ ...newInterview, experienceLevel: e.target.value })}
                    required
                  >
                    <option value="fresher">Fresher</option>
                    <option value="junior">Junior</option>
                    <option value="mid-level">Mid-Level</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-job-role" className={labelClass}>Job role</label>
                <select
                  id="new-job-role"
                  className={inputClass}
                  value={newInterview.jobRole}
                  onChange={e => setNewInterview({ ...newInterview, jobRole: e.target.value })}
                  required
                >
                  <option value="web-developer">Web Developer</option>
                  <option value="app-developer">App Developer</option>
                  <option value="ml-ai">ML/AI Engineer</option>
                  <option value="ux-designer">UX Designer</option>
                  <option value="data-scientist">Data Scientist</option>
                </select>
              </div>

              {error && (
                <div className="alert-error text-sm" role="alert">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInterview(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Interview'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interviews Table */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">All Interviews</h2>
          {isLoading && (
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          )}
        </div>

        {!isLoading && interviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <Calendar size={40} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">No interviews scheduled yet.</p>
            <button
              onClick={() => setShowNewInterview(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              Schedule Your First Interview
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Title', 'Candidate', 'Role / Level', 'Date & Time', 'Duration', 'Status', 'Room', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {interviews.map(interview => {
                  const { label, className } = getStatusMeta(interview);
                  const active = isInterviewActive(interview);
                  return (
                    <tr key={interview._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium text-foreground">{interview.title}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {interview.candidate.firstName} {interview.candidate.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{interview.candidate.email}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-foreground">{formatJobRole(interview.jobRole)}</div>
                        <div className="text-xs text-muted-foreground">{formatExperienceLevel(interview.experienceLevel)}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-foreground">{format(new Date(interview.scheduledFor), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(interview.scheduledFor), 'p')}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                        {interview.duration} min
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={cn('badge', className)}>{label}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {interview.status === 'scheduled' && (
                          <div className="flex flex-col gap-1.5">
                            <a
                              href={interview.roomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "btn btn-sm flex items-center gap-1.5 w-fit",
                                active ? "btn-primary" : "btn-outline"
                              )}
                            >
                              {active ? 'Join Now' : 'Join Room'}
                              <ExternalLink size={12} />
                            </a>
                            <button
                              onClick={() => handleCopyLink(interview)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Copy size={11} />
                              {copiedId === interview._id ? 'Copied!' : 'Copy link'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {interview.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelInterview(interview._id)}
                            className="btn btn-sm text-destructive hover:bg-destructive/10 hover:border-destructive/30 border border-transparent transition-colors"
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                        )}
                        {interview.status === 'completed' && (
                          <button
                            onClick={() => handleViewResults(interview._id)}
                            className="btn btn-outline btn-sm flex items-center gap-1.5"
                          >
                            <BarChart2 size={14} />
                            Results
                            <ChevronRight size={14} />
                          </button>
                        )}
                        {interview.status === 'cancelled' && (
                          <span className="text-xs text-muted-foreground">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
