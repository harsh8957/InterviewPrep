import React, { useState } from 'react';
import { Code2, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  acceptance: string;
  companies: string[];
}

const SAMPLE_PROBLEMS: Problem[] = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Hashing', acceptance: '52.4%', companies: ['Google', 'Amazon', 'Meta'] },
  { id: 2, title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List', acceptance: '42.1%', companies: ['Amazon', 'Microsoft'] },
  { id: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'Sliding Window', acceptance: '34.8%', companies: ['Google', 'Bloomberg'] },
  { id: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Binary Search', acceptance: '39.2%', companies: ['Google', 'Apple'] },
  { id: 5, title: 'Longest Palindromic Substring', difficulty: 'Medium', category: 'Dynamic Programming', acceptance: '33.5%', companies: ['Amazon', 'Cisco'] },
  { id: 6, title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers', acceptance: '55.1%', companies: ['Adobe', 'Goldman Sachs'] },
  { id: 7, title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack', acceptance: '40.9%', companies: ['Meta', 'Microsoft', 'LinkedIn'] },
  { id: 8, title: 'Merge k Sorted Lists', difficulty: 'Hard', category: 'Heap / Priority Queue', acceptance: '51.8%', companies: ['Uber', 'Twitter'] },
  { id: 9, title: 'Trapping Rain Water', difficulty: 'Hard', category: 'Two Pointers', acceptance: '61.2%', companies: ['Google', 'Amazon'] },
  { id: 10, title: 'Coin Change', difficulty: 'Medium', category: 'Dynamic Programming', acceptance: '44.3%', companies: ['ByteDance', 'Netflix'] },
];

export const ProblemsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredProblems = SAMPLE_PROBLEMS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase()) ||
                          p.companies.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/20">
              <Code2 size={12} />
              Phase 3 Problem Bank
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Algorithm & Coding Problem Bank
          </h1>
          <p className="text-muted-foreground mt-1">
            Curated LeetCode-style algorithmic challenges categorized by topic and target tech company.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice Mock Round</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems, topics, or companies..."
            className="input pl-10 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                difficultyFilter === diff
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Data Table */}
      <div className="card overflow-hidden border-border p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Acceptance</th>
                <th className="py-3 px-4">Frequently Asked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProblems.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                    {p.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <span className="hover:text-primary transition-colors cursor-pointer">{p.title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">
                    {p.category}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-semibold",
                      p.difficulty === 'Easy' ? "text-success bg-success/10" :
                      p.difficulty === 'Medium' ? "text-warning bg-warning/10" :
                      "text-destructive bg-destructive/10"
                    )}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    {p.acceptance}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.companies.map(c => (
                        <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
        <span>Showing {filteredProblems.length} curated problems. Interactive in-browser Monaco IDE execution will be connected in Phase 3.</span>
        <Link to="/roadmap" className="text-primary font-semibold hover:underline">
          View Structured Roadmap →
        </Link>
      </div>
    </div>
  );
};

export default ProblemsPage;
