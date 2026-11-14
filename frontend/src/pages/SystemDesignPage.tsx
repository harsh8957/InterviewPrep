import React, { useState, useEffect } from 'react';
import { Boxes, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface SystemDesignSummary {
  _id: string;
  slug: string;
  title: string;
  type: 'hld' | 'lld';
  difficulty: 'easy' | 'medium' | 'hard';
  scale: string;
  summary: string;
  architecturePillars: string[];
  order: number;
}

export const SystemDesignPage: React.FC = () => {
  const [cases, setCases] = useState<SystemDesignSummary[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'hld' | 'lld'>('all');
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(`${API_URL}/api/system-design`);
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        }
      } catch (err) {
        console.error('Failed to load system design cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [API_URL]);

  const filteredCases = cases.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Boxes size={12} />
              Interactive Architecture Studio
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            System Design & Distributed Scalability
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Master high-level and low-level system design patterns asked in senior full-stack and backend interviews.
            Diagram with Mermaid, size capacity, analyze bottlenecks, and evaluate tradeoffs.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              typeFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Architectures
          </button>
          <button
            onClick={() => setTypeFilter('hld')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              typeFilter === 'hld' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            High-Level Design (HLD)
          </button>
          <button
            onClick={() => setTypeFilter('lld')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              typeFilter === 'lld' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Low-Level Design (LLD)
          </button>
        </div>
      </div>

      {/* Case Studies Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
          Loading system architecture cases...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No system design problems available for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCases.map((arch) => (
            <div
              key={arch.slug}
              className="card p-6 flex flex-col justify-between hover:border-primary/50 transition-all border border-border rounded-2xl group shadow-sm bg-card"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {arch.scale}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
                      {arch.type.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold capitalize',
                        arch.difficulty === 'easy'
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : arch.difficulty === 'medium'
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-destructive bg-destructive/10'
                      )}
                    >
                      {arch.difficulty}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {arch.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {arch.summary}
                  </p>
                </div>

                {arch.architecturePillars && arch.architecturePillars.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Architecture Pillars
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {arch.architecturePillars.map((p) => (
                        <div
                          key={p}
                          className="flex items-center gap-2 text-xs text-foreground/90 p-2 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <CheckCircle2 size={13} className="text-primary shrink-0" />
                          <span className="truncate">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interactive Mermaid Studio</span>
                <Link
                  to={`/system-design/${arch.slug}`}
                  className="btn btn-primary btn-sm text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemDesignPage;
