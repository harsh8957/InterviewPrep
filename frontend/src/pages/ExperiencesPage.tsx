import React, { useState, useEffect } from 'react';
import { Users, Search, ArrowRight, ShieldCheck, PlusCircle, Building2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExperienceFeedItem {
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
  rounds: Array<{
    roundName: string;
    roundType: string;
    durationMinutes: number;
    difficulty: string;
  }>;
  questions: Array<{
    questionText: string;
    topic: string;
    difficulty: string;
  }>;
  preparationTips: string;
  createdAt: string;
}

export const ExperiencesPage: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [outcome, setOutcome] = useState('all');
  const [year, setYear] = useState('all');

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', '10');
        if (search) params.append('search', search);
        if (company !== 'all') params.append('company', company);
        if (difficulty !== 'all') params.append('difficulty', difficulty);
        if (outcome !== 'all') params.append('outcome', outcome);
        if (year !== 'all') params.append('year', year);

        const res = await fetch(`/api/experiences?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success) {
            setExperiences(data.experiences || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
          }
        } else {
          setError('Failed to load interview experiences.');
        }
      } catch (err) {
        console.error('Failed to load experiences:', err);
        setError('Failed to load interview experiences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchExperiences, 200);
    return () => clearTimeout(timer);
  }, [page, search, company, difficulty, outcome, year]);

  const difficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Hard</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground/70">{diff}</span>;
    }
  };

  const outcomeBadge = (out: string) => {
    switch (out) {
      case 'Offer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">Offer</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/25">Rejected</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/25">Pending</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">{out}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Users size={13} />
              Interview Experience Bank
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck size={11} />
              PII Moderated
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Engineering Interview Loops & Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
            Authentic, anonymized interview debriefs submitted by candidates. Review exact rounds, questions asked, difficulty ratings, and key preparation advice.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link to="/companies" className="btn btn-outline btn-sm flex items-center gap-1.5">
            <Building2 size={14} />
            <span>Company Tracks</span>
          </Link>
          <Link to="/experiences/new" className="btn btn-primary btn-sm flex items-center gap-1.5">
            <PlusCircle size={14} />
            <span>Share Your Experience</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by company, role, question topic, or tips..."
              className="input pl-10 text-xs w-full"
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Company Dropdown */}
            <select
              value={company}
              onChange={e => { setCompany(e.target.value); setPage(1); }}
              className="input text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="all">All Companies</option>
              <option value="google">Google</option>
              <option value="amazon">Amazon</option>
              <option value="meta">Meta</option>
              <option value="microsoft">Microsoft</option>
              <option value="uber">Uber</option>
              <option value="stripe">Stripe</option>
            </select>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={e => { setDifficulty(e.target.value); setPage(1); }}
              className="input text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Outcome */}
            <select
              value={outcome}
              onChange={e => { setOutcome(e.target.value); setPage(1); }}
              className="input text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="all">All Outcomes</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Year */}
            <select
              value={year}
              onChange={e => { setYear(e.target.value); setPage(1); }}
              className="input text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {(search || company !== 'all' || difficulty !== 'all' || outcome !== 'all' || year !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCompany('all');
                  setDifficulty('all');
                  setOutcome('all');
                  setYear('all');
                  setPage(1);
                }}
                className="btn btn-ghost btn-xs text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>Showing {experiences.length} of {total} approved interview loops</span>
          <span className="text-[11px] font-medium">Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-muted rounded w-1/4" />
                <div className="h-5 bg-muted rounded w-20" />
              </div>
              <div className="h-16 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card p-8 text-center space-y-3 border-destructive/30 bg-destructive/5">
          <AlertCircle size={32} className="mx-auto text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Experiences List */}
      {!loading && !error && (
        <div className="space-y-4">
          {experiences.map(exp => (
            <div
              key={exp._id}
              className="card p-6 space-y-4 hover:border-primary/50 transition-all hover:shadow-sm group"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/companies/${exp.companySlug}`}
                      className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {exp.companyName}
                    </Link>
                    <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      <Link to={`/experiences/${exp._id}`}>{exp.role}</Link>
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                      {exp.experienceLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{exp.candidateHandle}</span>
                    <span>•</span>
                    <span>{exp.interviewSeason} {exp.interviewYear}</span>
                    <span>•</span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Logged {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {outcomeBadge(exp.outcome)}
                  {difficultyBadge(exp.difficulty)}
                </div>
              </div>

              {/* Advice Quote */}
              <div className="p-3.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground/85 leading-relaxed italic">
                "{exp.preparationTips}"
              </div>

              {/* Rounds & Questions Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                {exp.rounds && exp.rounds.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Rounds ({exp.rounds.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exp.rounds.map((r, rIdx) => (
                        <span key={rIdx} className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground/80 border border-border">
                          {r.roundName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {exp.questions && exp.questions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Topics Covered ({exp.questions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exp.questions.map((q, qIdx) => (
                        <span key={qIdx} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/15">
                          {q.topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Action Link */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Verified & PII-Safe
                </span>

                <Link
                  to={`/experiences/${exp._id}`}
                  className="btn btn-outline btn-xs flex items-center gap-1 font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                >
                  <span>View Full Interview Debrief</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && experiences.length === 0 && (
        <div className="card p-12 text-center space-y-4">
          <Users size={40} className="mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No interview loops found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or clear active filters.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearch('');
                setCompany('all');
                setDifficulty('all');
                setOutcome('all');
                setYear('all');
                setPage(1);
              }}
              className="btn btn-outline btn-sm"
            >
              Reset Filters
            </button>
            <Link to="/experiences/new" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <PlusCircle size={14} />
              <span>Share Experience</span>
            </Link>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm flex items-center gap-1 text-xs disabled:opacity-50"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-outline btn-sm flex items-center gap-1 text-xs disabled:opacity-50"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExperiencesPage;
