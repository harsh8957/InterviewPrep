import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  FileText,
  HelpCircle,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Activity,
  Code2,
  Map,
  Plus,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminStats {
  blogs: number;
  faqs: number;
  jobs: number;
  team: number;
  problems?: number;
  roadmaps?: number;
}

interface AdminProblemItem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  status: 'published' | 'draft';
}

export const AdminDashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  const [stats, setStats] = useState<AdminStats>({
    blogs: 0,
    faqs: 0,
    jobs: 0,
    team: 0,
    problems: 0,
    roadmaps: 0,
  });
  const [problems, setProblems] = useState<AdminProblemItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Problem Form Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    statement: '',
    topics: 'Arrays, Hash Table',
    patterns: 'Hashing',
    constraints: '1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
    exampleInput: 'nums = [2,7,11,15], target = 9',
    exampleOutput: '[0,1]',
    starterCodePython: 'class Solution:\n    def solve(self, nums: List[int]) -> List[int]:\n        pass',
    testCaseInput: 'nums = [2,7,11,15], target = 9',
    testCaseOutput: '[0,1]',
  });

  // Security: Check role and redirect non-admins
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, loading, navigate]);

  const fetchStatsAndProblems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing admin authorization token');

      const [statsRes, problemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/problems?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok) {
        if (statsRes.status === 403) throw new Error('Forbidden: Administrative access required.');
        throw new Error(`Failed to load admin stats (HTTP ${statsRes.status})`);
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      if (problemsRes.ok) {
        const probData = await problemsRes.json();
        setProblems(probData.problems || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching administrative statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStatsAndProblems();
    }
  }, [user]);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase(),
        difficulty: formData.difficulty,
        statement: formData.statement.trim(),
        topics: formData.topics.split(',').map((t) => t.trim()).filter(Boolean),
        patterns: formData.patterns.split(',').map((p) => p.trim()).filter(Boolean),
        constraints: formData.constraints.split('\n').map((c) => c.trim()).filter(Boolean),
        examples: [
          {
            input: formData.exampleInput,
            output: formData.exampleOutput,
          },
        ],
        starterCode: {
          python: formData.starterCodePython,
        },
        testCases: [
          {
            input: formData.testCaseInput,
            expectedOutput: formData.testCaseOutput,
            isHidden: false,
            order: 1,
          },
        ],
        status: 'published',
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create problem');
      }

      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowCreateModal(false);
        fetchStatsAndProblems();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p._id !== id));
        setStats((prev) => ({ ...prev, problems: Math.max(0, (prev.problems || 1) - 1) }));
      }
    } catch (err) {
      console.error('Delete problem failed:', err);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Shield size={12} />
              Platform Administrator
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Administration & Governance Console
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage problem catalog, roadmap tracks, knowledge bases, and inspect security telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create Problem</span>
          </button>
          <button
            onClick={fetchStatsAndProblems}
            disabled={isLoading}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert-error flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Administration Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid (6 cards: DSA Problems, Roadmaps, Blogs, FAQs, Jobs, Team) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: 'DSA Problems',
            value: stats.problems ?? 0,
            desc: 'Catalog challenges',
            icon: Code2,
            color: 'text-primary',
            bg: 'bg-primary/10',
            link: '/problems',
          },
          {
            title: 'Roadmaps',
            value: stats.roadmaps ?? 16,
            desc: 'Core topics',
            icon: Map,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
            link: '/roadmap',
          },
          {
            title: 'Published Blogs',
            value: stats.blogs,
            desc: 'Career insights',
            icon: FileText,
            color: 'text-accent',
            bg: 'bg-accent/10',
            link: '/blog',
          },
          {
            title: 'System FAQs',
            value: stats.faqs,
            desc: 'Help center',
            icon: HelpCircle,
            color: 'text-success',
            bg: 'bg-success/10',
            link: '/faq',
          },
          {
            title: 'Active Jobs',
            value: stats.jobs,
            desc: 'Career board',
            icon: Briefcase,
            color: 'text-primary',
            bg: 'bg-primary/10',
            link: '/careers',
          },
          {
            title: 'Team Directory',
            value: stats.team,
            desc: 'Personnel profiles',
            icon: Users,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
            link: '/about',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="card p-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', item.bg, item.color)}>
                  <Icon size={14} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Link
                to={item.link}
                className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] font-medium text-primary hover:underline"
              >
                <span>View</span>
                <ExternalLink size={10} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* DSA Problem Management Section */}
      <div className="card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">DSA Problem Bank Governance</h2>
              <p className="text-xs text-muted-foreground">Administer challenges, starter code, and test cases</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-outline btn-xs flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add Problem</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">Title & Slug</th>
                <th className="py-2.5 px-3">Difficulty</th>
                <th className="py-2.5 px-3">Topics</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No problems retrieved. Seed problems or add a new problem.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{p.slug}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold capitalize',
                          p.difficulty === 'easy'
                            ? 'text-emerald-500 bg-emerald-500/10'
                            : p.difficulty === 'medium'
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-rose-500 bg-rose-500/10'
                        )}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{p.topics?.join(', ')}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold text-foreground capitalize">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <Link
                        to={`/problems/${p.slug}`}
                        className="text-primary hover:underline font-semibold"
                        target="_blank"
                      >
                        Workspace
                      </Link>
                      <button
                        onClick={() => handleDeleteProblem(p._id)}
                        className="text-destructive hover:underline font-semibold"
                        title="Delete problem"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content & Governance Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Management Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Content Governance</h2>
              <p className="text-xs text-muted-foreground">Manage articles, knowledge bases, and regulatory documents</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            All administrative write operations enforce strict server-side schema whitelisting, preventing mass-assignment and privilege escalation.
          </p>

          <div className="space-y-2 pt-2">
            <Link
              to="/blog"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-primary" />
                <span>Career & Technical Engineering Blog</span>
              </div>
              <span className="text-xs text-muted-foreground">{stats.blogs} posts</span>
            </Link>

            <Link
              to="/faq"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={16} className="text-secondary" />
                <span>Frequently Asked Questions Knowledge Base</span>
              </div>
              <span className="text-xs text-muted-foreground">{stats.faqs} FAQs</span>
            </Link>

            <Link
              to="/privacy-policy"
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Lock size={16} className="text-accent" />
                <span>Privacy Policy & Legal Terms</span>
              </div>
              <ExternalLink size={14} className="text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Security & Access Guard Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Security Controls & Status</h2>
              <p className="text-xs text-muted-foreground">Enforced server-side guardrails & telemetry</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-sm">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/80">
              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">Public Signup Guard Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Public registrations are strictly constrained to <code className="text-[11px] bg-muted px-1 rounded">candidate</code> and <code className="text-[11px] bg-muted px-1 rounded">hr</code>. Client-supplied admin roles are rejected with HTTP 400.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/80">
              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">Token Revocation Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Revoked tokens on logout are automatically tracked with MongoDB TTL indexes and blocked on subsequent API calls.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/80">
              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">Server-Side Admin CLI</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  New administrators can only be provisioned via the secure host CLI:
                  <code className="block text-[11px] bg-card p-1.5 rounded mt-1 border border-border font-mono">
                    npm run create-admin -- --email=... --password=...
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Problem Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Create New DSA Problem</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {createSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-foreground">Problem Created Successfully!</h4>
                <p className="text-xs text-muted-foreground">Refreshing problem list...</p>
              </div>
            ) : (
              <form onSubmit={handleCreateProblem} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Problem Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reverse Integer"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        })
                      }
                      className="input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Slug</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="input text-xs w-full font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="select select-sm text-xs w-full rounded-lg border border-border bg-card"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Topics (comma separated)</label>
                    <input
                      type="text"
                      required
                      value={formData.topics}
                      onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                      className="input text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-foreground">Problem Statement</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    className="input text-xs w-full py-2"
                    placeholder="Describe problem, requirements, and constraints..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Example Input</label>
                    <input
                      type="text"
                      required
                      value={formData.exampleInput}
                      onChange={(e) => setFormData({ ...formData, exampleInput: e.target.value })}
                      className="input text-xs w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-foreground">Example Output</label>
                    <input
                      type="text"
                      required
                      value={formData.exampleOutput}
                      onChange={(e) => setFormData({ ...formData, exampleOutput: e.target.value })}
                      className="input text-xs w-full font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-foreground">Starter Code (Python)</label>
                  <textarea
                    rows={3}
                    value={formData.starterCodePython}
                    onChange={(e) => setFormData({ ...formData, starterCodePython: e.target.value })}
                    className="input text-xs w-full py-2 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-outline btn-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-xs"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Problem'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
