import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface ExperienceAuthor {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface AdminExperience {
  _id: string;
  companyName: string;
  companySlug: string;
  role: string;
  experienceLevel: string;
  interviewYear: number;
  interviewSeason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  outcome: string;
  candidateHandle: string;
  isAnonymous: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  author: ExperienceAuthor;
  rounds: Array<{
    roundNumber: number;
    roundName: string;
    roundType: string;
    durationMinutes: number;
    questionsSummary: string;
    difficulty: string;
  }>;
  questions: Array<{
    questionText: string;
    topic: string;
    difficulty: string;
  }>;
  preparationTips: string;
  timelineNotes?: string;
  reports: Array<{
    reason: string;
    createdAt: string;
  }>;
  moderationHistory: Array<{
    action: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
}

export const AdminExperiencesPage: React.FC = () => {
  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [hasReportsFilter, setHasReportsFilter] = useState(false);

  // Review Modal
  const [selectedExperience, setSelectedExperience] = useState<AdminExperience | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (hasReportsFilter) params.append('hasReports', 'true');
      params.append('limit', '50');

      const res = await fetch(`/api/admin/experiences?${params.toString()}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setExperiences(data.experiences || []);
        setTotal(data.total || 0);
        setPendingCount(data.pendingCount || 0);
        setReportedCount(data.reportedCount || 0);
      } else {
        setError(data?.message || 'Failed to load moderation queue.');
      }
    } catch (err: any) {
      console.error('Failed to load admin experiences:', err);
      setError('Failed to load moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [statusFilter, hasReportsFilter]);

  const handleModerate = async (experienceId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/experiences/${experienceId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? (rejectionReason || 'Does not adhere to community standards') : undefined,
          notes: moderationNotes || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setSelectedExperience(null);
        setModerationNotes('');
        setRejectionReason('');
        await fetchExperiences();
      } else {
        alert(data?.message || 'Failed to moderate experience.');
      }
    } catch (err: any) {
      alert('Failed to moderate experience.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (experienceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this experience?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/experiences/${experienceId}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        if (selectedExperience?._id === experienceId) {
          setSelectedExperience(null);
        }
        await fetchExperiences();
      } else {
        alert(data?.message || 'Failed to delete experience.');
      }
    } catch (err: any) {
      alert('Failed to delete experience.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Shield size={13} />
              Administrator Governance
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Interview Experience Moderation
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review candidate interview loop submissions, verify PII compliance, resolve reported content, and approve for public catalog.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => { setStatusFilter('pending'); setHasReportsFilter(false); }}
          className={`card p-5 cursor-pointer transition-all ${
            statusFilter === 'pending' && !hasReportsFilter ? 'border-primary ring-1 ring-primary/40' : 'hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{pendingCount}</div>
          <span className="text-[11px] text-muted-foreground">Awaiting moderator sign-off</span>
        </div>

        <div
          onClick={() => { setHasReportsFilter(true); setStatusFilter('all'); }}
          className={`card p-5 cursor-pointer transition-all ${
            hasReportsFilter ? 'border-destructive ring-1 ring-destructive/40' : 'hover:border-destructive/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported Content</span>
            <AlertTriangle size={16} className="text-destructive" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{reportedCount}</div>
          <span className="text-[11px] text-muted-foreground">Flagged by community members</span>
        </div>

        <div
          onClick={() => { setStatusFilter('all'); setHasReportsFilter(false); }}
          className={`card p-5 cursor-pointer transition-all ${
            statusFilter === 'all' && !hasReportsFilter ? 'border-primary ring-1 ring-primary/40' : 'hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Submissions</span>
            <Building2 size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{total}</div>
          <span className="text-[11px] text-muted-foreground">All logged experiences</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        {[
          { key: 'pending' as const, label: 'Pending Review', count: pendingCount },
          { key: 'approved' as const, label: 'Approved & Live' },
          { key: 'rejected' as const, label: 'Rejected' },
          { key: 'all' as const, label: 'All Experiences', count: total },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setHasReportsFilter(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              statusFilter === tab.key && !hasReportsFilter
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary-foreground font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={() => { setHasReportsFilter(true); setStatusFilter('all'); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            hasReportsFilter
              ? 'border-destructive text-destructive'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle size={12} />
          <span>Flagged Reports</span>
          {reportedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-destructive/20 text-destructive font-mono font-bold">
              {reportedCount}
            </span>
          )}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* Queue Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 space-y-3 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500/50" />
          <h3 className="text-base font-semibold text-foreground">Moderation Queue Clear</h3>
          <p className="text-xs text-muted-foreground">
            There are currently no experiences matching the selected moderation filter.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rounds</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {experiences.map(exp => (
                  <tr key={exp._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                          {exp.companyName}
                        </span>
                        <span>{exp.role}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="space-y-0.5">
                        <div className="text-foreground font-medium">
                          {exp.author ? `${exp.author.firstName || ''} ${exp.author.lastName || ''}` : exp.candidateHandle}
                        </div>
                        {exp.author?.email && (
                          <div className="text-[10px] text-muted-foreground/75 font-mono">{exp.author.email}</div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {exp.moderationStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          Pending
                        </span>
                      )}
                      {exp.moderationStatus === 'approved' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          Approved
                        </span>
                      )}
                      {exp.moderationStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {exp.rounds?.length || 0} stages
                    </td>

                    <td className="py-3.5 px-4">
                      {exp.reports && exp.reports.length > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                          {exp.reports.length} report(s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedExperience(exp)}
                          className="btn btn-outline btn-xs flex items-center gap-1 font-semibold"
                        >
                          <Eye size={12} />
                          <span>Review</span>
                        </button>

                        {exp.moderationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleModerate(exp._id, 'approve')}
                              className="btn btn-outline btn-xs text-emerald-500 hover:bg-emerald-500/10 p-1.5"
                              title="Approve Experience"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => { setSelectedExperience(exp); }}
                              className="btn btn-outline btn-xs text-destructive hover:bg-destructive/10 p-1.5"
                              title="Reject with Notes"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Review & Moderation Modal */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border-border">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Reviewing Submission ID: {selectedExperience._id}
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedExperience.companyName} — {selectedExperience.role}
                </h2>
              </div>
              <button
                onClick={() => setSelectedExperience(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* Author & Meta */}
            <div className="p-3 rounded-lg bg-card border border-border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-muted-foreground block text-[10px]">Author</span>
                <span className="font-semibold text-foreground">
                  {selectedExperience.author ? `${selectedExperience.author.firstName} ${selectedExperience.author.lastName}` : selectedExperience.candidateHandle}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Level / Year</span>
                <span className="text-foreground">{selectedExperience.experienceLevel} • {selectedExperience.interviewYear}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Outcome</span>
                <span className="font-semibold text-foreground">{selectedExperience.outcome}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Status</span>
                <span className="font-semibold uppercase text-[10px]">{selectedExperience.moderationStatus}</span>
              </div>
            </div>

            {/* Preparation Advice */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Preparation Tips & Advice:
              </span>
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground/90 whitespace-pre-line">
                {selectedExperience.preparationTips}
              </div>
            </div>

            {/* Rounds Detail */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rounds Logged ({selectedExperience.rounds.length}):
              </span>
              <div className="space-y-2">
                {selectedExperience.rounds.map(r => (
                  <div key={r.roundNumber} className="p-3 rounded-lg border border-border bg-card/60 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Round {r.roundNumber}: {r.roundName}</span>
                      <span className="text-muted-foreground font-normal">{r.durationMinutes} mins • {r.difficulty}</span>
                    </div>
                    <p className="text-foreground/85">{r.questionsSummary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Reports (if any) */}
            {selectedExperience.reports && selectedExperience.reports.length > 0 && (
              <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 space-y-2">
                <span className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Community Flags & Reports:
                </span>
                <ul className="text-xs text-destructive/90 space-y-1 list-disc pl-5">
                  {selectedExperience.reports.map((rep, rIdx) => (
                    <li key={rIdx}>{rep.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Moderation Controls */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-bold text-foreground block">
                Moderator Decision & Notes:
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  value={moderationNotes}
                  onChange={e => setModerationNotes(e.target.value)}
                  placeholder="Internal audit note (e.g., Verified PII clean, approved for catalog)..."
                  className="input text-xs w-full"
                />

                <input
                  type="text"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason sent to candidate (if rejecting)..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedExperience._id)}
                  className="btn btn-outline btn-xs text-destructive hover:bg-destructive/10 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Delete Permanently</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModerate(selectedExperience._id, 'reject')}
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm text-destructive hover:bg-destructive/10"
                  >
                    Reject Submission
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModerate(selectedExperience._id, 'approve')}
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {actionLoading ? 'Saving...' : 'Approve & Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExperiencesPage;
