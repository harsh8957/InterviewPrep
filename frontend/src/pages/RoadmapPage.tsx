import React, { useState, useEffect } from 'react';
import { Map, Code2, ArrowRight, Sparkles, BookOpen, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface AssociatedProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  patterns?: string[];
  companyTags?: string[];
}

interface RoadmapNodeItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  order: number;
  prerequisites: string[];
  estimatedHours: number;
  problemsCount: number;
  problems: AssociatedProblem[];
}

export const RoadmapPage: React.FC = () => {
  const [nodes, setNodes] = useState<RoadmapNodeItem[]>([]);
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeItem | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/roadmaps`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch roadmaps');
        return res.json();
      })
      .then((data: RoadmapNodeItem[]) => {
        setNodes(data);
        if (data.length > 0) {
          setSelectedNode(data[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching roadmap:', err);
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Map size={12} />
              Phase 3 DSA Curriculum
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Structured DSA Learning Roadmap
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            16 ordered algorithmic topics with prerequisites, time commitments, and curated problems linked to our Monaco coding workspace.
          </p>
        </div>

        <Link to="/problems" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Code2 size={15} />
          <span>Browse Problem Bank</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-muted/60 rounded-2xl border border-border" />
            ))}
          </div>
          <div className="h-96 bg-muted/60 rounded-2xl border border-border" />
        </div>
      ) : (
        /* Roadmap Navigation Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Module Steps Column */}
          <div className="lg:col-span-2 space-y-3">
            {nodes.map((node) => {
              const isSelected = selectedNode?.slug === node.slug;
              return (
                <div
                  key={node.slug}
                  onClick={() => setSelectedNode(node)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card/60 hover:bg-muted/40 hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {node.order}
                    </div>
                    <div>
                      <h3 className={cn('text-base font-semibold leading-tight', isSelected ? 'text-primary' : 'text-foreground')}>
                        {node.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-muted font-medium text-foreground">
                          {node.category}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Code2 size={12} />
                          {node.problemsCount} Problems
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          ~{node.estimatedHours}h
                        </span>
                        {node.prerequisites && node.prerequisites.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[11px] text-muted-foreground">
                              Requires: {node.prerequisites.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center text-muted-foreground">
                    <ArrowRight
                      size={16}
                      className={cn(isSelected && 'text-primary translate-x-1 transition-transform')}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Module Detail Pane */}
          {selectedNode && (
            <div className="card p-6 space-y-5 sticky top-20 border-primary/20 shadow-md">
              <div className="flex items-start justify-between gap-2 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Topic #{selectedNode.order} • {selectedNode.category}
                  </span>
                  <h2 className="text-xl font-bold text-foreground mt-0.5">{selectedNode.title}</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                  ~{selectedNode.estimatedHours} hrs
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Associated Problems */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={13} className="text-primary" />
                    Curated Problems ({selectedNode.problems.length})
                  </span>
                </div>

                {selectedNode.problems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-muted/20">
                    Additional practice problems are being linked to this roadmap node.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedNode.problems.map((prob) => {
                      const diffColor =
                        prob.difficulty === 'easy'
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : prob.difficulty === 'medium'
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-rose-500 bg-rose-500/10';

                      return (
                        <li key={prob.slug}>
                          <Link
                            to={`/problems/${prob.slug}`}
                            className="group flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border hover:border-primary/40 hover:bg-muted/60 transition-all"
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {prob.title}
                                <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-semibold capitalize', diffColor)}>
                                  {prob.difficulty}
                                </span>
                                {prob.patterns?.[0] && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    • {prob.patterns[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                              Solve →
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Phase 4 Note */}
              <div className="pt-2 border-t border-border">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" /> Phase 3 Monaco IDE Active
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Click "Solve" on any problem to write code in our multi-language Monaco IDE with auto-saved drafts. Sandboxed test evaluation arrives in Phase 4.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
