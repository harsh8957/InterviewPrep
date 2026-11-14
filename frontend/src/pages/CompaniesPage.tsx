import React, { useState, useEffect } from 'react';
import { Building2, Search, ArrowRight, Sparkles, BookOpen, Layers, Users, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TargetRole {
  role: string;
  level: string;
  focusAreas: string[];
}

interface CompanyTrackSummary {
  _id: string;
  name: string;
  slug: string;
  tier: 'faang_tier' | 'enterprise_saas' | 'high_growth_startup' | 'fintech';
  brandColor?: string;
  description: string;
  headquarters: string;
  website?: string;
  hiringBarOverview: string;
  culturePrinciples: string[];
  targetRoles: TargetRole[];
  stats: {
    totalProblems: number;
    totalSystemDesign: number;
    experienceCount: number;
  };
}

const TIER_LABELS: Record<string, string> = {
  all: 'All Companies',
  faang_tier: 'FAANG & Tier 1',
  enterprise_saas: 'Enterprise SaaS',
  high_growth_startup: 'High-Growth Tech',
  fintech: 'FinTech Leaders',
};

export const CompaniesPage: React.FC = () => {
  const [tracks, setTracks] = useState<CompanyTrackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (selectedTier !== 'all') queryParams.append('tier', selectedTier);
        if (search) queryParams.append('search', search);

        const res = await fetch(`/api/company-tracks?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.tracks)) {
            setTracks(data.tracks);
          }
        } else {
          setError('Failed to load company tracks.');
        }
      } catch (err) {
        console.error('Failed to load company tracks:', err);
        setError('Failed to load company tracks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchTracks, 200);
    return () => clearTimeout(timer);
  }, [search, selectedTier]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Building2 size={13} />
              Company Preparation Tracks
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck size={11} />
              Verified Curricula
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Target Company Engineering Tracks
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
            Structured algorithmic roadmaps, system design blueprints, hiring bars, and real community interview loops for top tech companies.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link to="/experiences" className="btn btn-outline btn-sm flex items-center gap-1.5">
            <Users size={14} />
            <span>Interview Loops</span>
          </Link>
          <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>AI Practice Simulation</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {Object.entries(TIER_LABELS).map(([tierKey, label]) => (
            <button
              key={tierKey}
              onClick={() => setSelectedTier(tierKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTier === tierKey
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, role, or focus..."
            className="input pl-10 text-xs w-full"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
              <div className="h-14 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card p-8 text-center space-y-3 border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Company Tracks Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map(track => (
            <div
              key={track.slug}
              className="card p-6 flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header with Brand Initial and Metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                        track.brandColor || 'from-primary to-primary/70'
                      } text-white font-bold text-lg shadow-sm`}
                    >
                      {track.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {track.name}
                        {track.website && (
                          <a
                            href={track.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-block"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </h2>
                      <span className="text-xs text-muted-foreground">{track.headquarters}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                    {track.tier.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {track.description}
                </p>

                {/* Target Roles Pills */}
                {track.targetRoles && track.targetRoles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Target Tracks
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {track.targetRoles.slice(0, 2).map((tr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground/80 border border-border"
                        >
                          {tr.role}
                        </span>
                      ))}
                      {track.targetRoles.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-muted/60">
                          +{track.targetRoles.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Metrics Badges */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/80 text-center">
                  <div className="p-2 rounded-lg bg-card/50 border border-border/50">
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                      <BookOpen size={12} className="text-primary" />
                      {track.stats.totalProblems}
                    </div>
                    <span className="text-[10px] text-muted-foreground">DSA Problems</span>
                  </div>

                  <div className="p-2 rounded-lg bg-card/50 border border-border/50">
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                      <Layers size={12} className="text-indigo-400" />
                      {track.stats.totalSystemDesign}
                    </div>
                    <span className="text-[10px] text-muted-foreground">System Design</span>
                  </div>

                  <div className="p-2 rounded-lg bg-card/50 border border-border/50">
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                      <Users size={12} className="text-emerald-400" />
                      {track.stats.experienceCount}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Loops Logged</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-3 border-t border-border">
                <Link
                  to={`/companies/${track.slug}`}
                  className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                >
                  <span>Explore {track.name} Track</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tracks.length === 0 && (
        <div className="card p-12 text-center space-y-4">
          <Building2 size={36} className="mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No matching company tracks</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or selecting a different tier filter.
          </p>
          <button onClick={() => { setSearch(''); setSelectedTier('all'); }} className="btn btn-outline btn-sm">
            Reset Filters
          </button>
        </div>
      )}

      {/* Community Interview Loops Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-card via-card to-primary/5 border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
              Community Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Real Interview Loops & Compensation Insights
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Read structured round-by-round interview debriefs submitted by candidates, moderated for PII and factual accuracy. See exact questions asked, duration, and preparation takeaways.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link to="/experiences" className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs">
            <Users size={14} />
            <span>Browse All Loops</span>
          </Link>
          <Link to="/experiences/new" className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs">
            <span>Share Your Experience</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
