import React, { useState, useEffect } from 'react';
import { FileCode2, Clock, Sparkles, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface AssessmentItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  problemCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  passingScore: number;
  tags: string[];
}

export const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/assessments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AssessmentItem[]) => {
        setAssessments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching assessments:', err);
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <FileCode2 size={12} />
              Phase 4 Online Assessments
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Timed Coding Assessments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Simulated screening assessments that mirror HackerRank, CodeSignal, and Karat environments with authoritative server-side timers and test evaluation.
          </p>
        </div>

        <Link to="/roadmap" className="btn btn-outline btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice Roadmap First</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-card/60 border border-border rounded-2xl" />
          <div className="h-64 bg-card/60 border border-border rounded-2xl" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="card p-12 text-center text-xs text-muted-foreground">
          No published assessments found. Check back soon or seed assessments.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((item) => {
            const diffColor =
              item.difficulty === 'easy'
                ? 'text-emerald-500 bg-emerald-500/10'
                : item.difficulty === 'medium'
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-rose-500 bg-rose-500/10';

            return (
              <div
                key={item.slug}
                className="card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-sm space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', diffColor)}>
                      {item.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Clock size={13} className="text-primary" /> {item.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.description}</p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Problems</span>
                      <div className="font-bold text-foreground">{item.problemCount} Challenges</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Passing Score</span>
                      <div className="font-bold text-foreground">{item.passingScore}% Pass Mark</div>
                    </div>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Covered Topics
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-foreground font-medium border border-border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                    <span>Auto-graded sandbox</span>
                  </div>

                  <Link
                    to={`/assessments/${item.slug}/attempt`}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rules Banner */}
      <div className="card p-5 bg-muted/20 border-border text-xs space-y-2">
        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
          <CheckCircle size={16} className="text-primary" />
          <span>Assessment Environment Protocols</span>
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs leading-relaxed">
          <li><strong>Authoritative Expiry:</strong> Timer countdown runs on the server. Submissions sent after expiration will be rejected.</li>
          <li><strong>Confidential Test Cases:</strong> Submissions are evaluated against both sample and confidential edge cases.</li>
          <li><strong>Progress Persistence:</strong> You can switch between problems at any time; code drafts and individual problem results are persisted in real time.</li>
        </ul>
      </div>
    </div>
  );
};

export default AssessmentsPage;
