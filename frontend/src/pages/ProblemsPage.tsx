import React, { useState, useEffect } from 'react';
import { Code2, Search, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface ProblemSummary {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  patterns?: string[];
  companyTags?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Fetch problems based on filters & page
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());

    if (difficultyFilter !== 'all') {
      params.set('difficulty', difficultyFilter);
    }
    if (selectedTopic !== 'all') {
      params.set('topic', selectedTopic);
    }
    if (search.trim()) {
      params.set('search', search.trim());
    }

    fetch(`${API_URL}/api/problems?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch problems');
        return res.json();
      })
      .then((data) => {
        setProblems(data.problems || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setLoading(false);
      });
  }, [pagination.page, pagination.limit, difficultyFilter, selectedTopic, search, API_URL]);

  // Reset page to 1 when changing filters
  const handleDifficultyChange = (diff: 'all' | 'easy' | 'medium' | 'hard') => {
    setDifficultyFilter(diff);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Distinct topics for filter dropdown
  const TOPIC_OPTIONS = [
    'all',
    'Arrays',
    'Hash Table',
    'Two Pointers',
    'Sliding Window',
    'Prefix Sum',
    'Binary Search',
    'Sorting',
    'Backtracking',
    'Linked List',
    'Stack',
    'Trees',
    'Heaps',
    'Graphs',
    'Dynamic Programming',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Code2 size={12} />
              Phase 3 Problem Catalog
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Algorithm & Coding Problem Bank
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Curated LeetCode-style algorithmic challenges categorized by topic and target tech company with full Monaco IDE workspace integration.
          </p>
        </div>

        <Link to="/roadmap" className="btn btn-outline btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>View Curriculum Roadmap</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search problems, topics, or companies..."
            className="input pl-10 text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Select */}
          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-xl border border-border">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={selectedTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Topics</option>
              {TOPIC_OPTIONS.filter((t) => t !== 'all').map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Segmented Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border">
            {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => handleDifficultyChange(diff)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                  difficultyFilter === diff
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problems Data Table */}
      <div className="card overflow-hidden border-border p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Problem Title</th>
                <th className="py-3.5 px-4">Topics & Patterns</th>
                <th className="py-3.5 px-4">Difficulty</th>
                <th className="py-3.5 px-4">Target Complexities</th>
                <th className="py-3.5 px-4">Frequently Asked At</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span>Loading problem bank...</span>
                    </div>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No problems found matching the selected filters.
                  </td>
                </tr>
              ) : (
                problems.map((p, index) => {
                  const diffColor =
                    p.difficulty === 'easy'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : p.difficulty === 'medium'
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-rose-500 bg-rose-500/10';

                  const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;

                  return (
                    <tr key={p._id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <Link
                          to={`/problems/${p.slug}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{p.title}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.topics?.slice(0, 2).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground">
                              {t}
                            </span>
                          ))}
                          {p.patterns?.[0] && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium">
                              {p.patterns[0]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold capitalize', diffColor)}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {p.timeComplexity || 'O(n)'} / {p.spaceComplexity || 'O(1)'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.companyTags?.slice(0, 3).map((c) => (
                            <span
                              key={c}
                              className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/problems/${p.slug}`}
                          className="btn btn-outline btn-xs px-2.5 py-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                        >
                          Solve
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {problems.length} of {pagination.total} problems
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="btn btn-outline btn-xs px-2 py-1 flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>
            <span className="font-mono text-xs text-foreground px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-outline btn-xs px-2 py-1 flex items-center gap-1 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span>
          <strong>Phase 3 Live Workspace:</strong> Click "Solve" on any problem to practice in our multi-language Monaco IDE with auto-save. Sandboxed execution verdicts connect in Phase 4.
        </span>
        <Link to="/roadmap" className="text-primary font-semibold hover:underline shrink-0">
          View Structured Roadmap →
        </Link>
      </div>
    </div>
  );
};

export default ProblemsPage;
