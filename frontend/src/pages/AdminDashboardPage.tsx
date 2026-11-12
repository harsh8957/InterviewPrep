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
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminStats {
  blogs: number;
  faqs: number;
  jobs: number;
  team: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  const [stats, setStats] = useState<AdminStats>({ blogs: 0, faqs: 0, jobs: 0, team: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing admin authorization token');

      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: Administrative access required.');
        throw new Error(`Failed to load admin stats (HTTP ${res.status})`);
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching administrative statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  if (loading || (!user || user.role !== 'admin')) {
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
          <p className="text-muted-foreground mt-1">
            Manage public knowledge base, review platform contents, and inspect security telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Published Blogs',
            value: stats.blogs,
            desc: 'Articles in Career Blog',
            icon: FileText,
            color: 'text-primary',
            bg: 'bg-primary/10',
            link: '/blog'
          },
          {
            title: 'System FAQs',
            value: stats.faqs,
            desc: 'Platform help center items',
            icon: HelpCircle,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
            link: '/faq'
          },
          {
            title: 'Job Opportunities',
            value: stats.jobs,
            desc: 'Active job board listings',
            icon: Briefcase,
            color: 'text-accent',
            bg: 'bg-accent/10',
            link: '/careers'
          },
          {
            title: 'Team Directory',
            value: stats.team,
            desc: 'Platform personnel members',
            icon: Users,
            color: 'text-success',
            bg: 'bg-success/10',
            link: '/about'
          },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card p-5 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{item.title}</span>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", item.bg, item.color)}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-foreground">{item.value}</span>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <Link
                to={item.link}
                className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-medium text-primary hover:underline"
              >
                <span>View Entries</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          );
        })}
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
    </div>
  );
};

export default AdminDashboardPage;
