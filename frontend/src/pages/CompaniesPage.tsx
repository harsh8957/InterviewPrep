import React, { useState } from 'react';
import { Building2, Search, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMPANIES = [
  { name: 'Google', focus: 'Strict Big-O, Clean Code, Graphs & Concurrency', rounds: 'Phone Screen + 4 Onsite DSA + System Design', color: 'from-blue-500/20 to-red-500/10' },
  { name: 'Amazon', focus: 'Leadership Principles (LP), Dynamic Programming, Tree Traversals', rounds: 'Online Assessment + 4 Loop Rounds with LP emphasis', color: 'from-amber-500/20 to-yellow-500/10' },
  { name: 'Meta', focus: 'High Speed Problem Solving (2 Mediums in 40 mins), Architecture', rounds: 'Initial Screen + 2 Coding + 1 System Design + 1 Behavioral', color: 'from-blue-600/20 to-indigo-500/10' },
  { name: 'Microsoft', focus: 'Arrays, Strings, Pragmatic Code, System Architecture', rounds: 'Technical Screen + 3-4 Rounds on data structures & design', color: 'from-sky-500/20 to-emerald-500/10' },
  { name: 'Apple', focus: 'Domain Depth (OS, Memory, Hardware-aware programming, Swift/C++)', rounds: 'Recruiter Call + Technical Screen + 5 Onsite rounds', color: 'from-slate-500/20 to-zinc-500/10' },
  { name: 'Netflix', focus: 'Senior Engineering Culture, Distributed Systems, High Availability', rounds: 'Recruiter + 2 Technical Interviews + System Architecture Loop', color: 'from-red-600/20 to-black/10' },
];

export const CompaniesPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.focus.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Building2 size={12} />
              Phase 7 Company Tracks
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Target Company Preparation Tracks
          </h1>
          <p className="text-muted-foreground mt-1">
            Company-specific question trends, interview round breakdowns, and evaluation rubrics.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice Interview</span>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter target tech companies..."
          className="input pl-10 text-sm w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(comp => (
          <div key={comp.name} className="card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-white font-bold text-sm">
                    {comp.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{comp.name}</h3>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Key Focus</span>
                  <p className="text-foreground leading-relaxed">{comp.focus}</p>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Interview Rounds</span>
                  <p className="text-foreground/80 leading-relaxed">{comp.rounds}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border">
              <Link
                to="/setup"
                className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
              >
                <span>Practice {comp.name} Simulation</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompaniesPage;
