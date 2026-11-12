import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Building,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light Mode',
      desc: 'Clean, high-contrast daylight theme',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark Mode',
      desc: 'Low-light, reduced eye-strain theme',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'System Sync',
      desc: 'Matches your operating system preference',
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account & Workspace Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal details, workspace preferences, and authentication session.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white text-2xl font-bold shadow-glow-primary/30">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail size={14} />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
              user?.role === 'admin'
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : user?.role === 'hr'
                ? "bg-secondary/10 text-secondary border-secondary/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {user?.role} Account
            </span>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <User size={13} /> Full Name
            </span>
            <span className="font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Mail size={13} /> Registered Email
            </span>
            <span className="font-medium text-foreground">{user?.email}</span>
          </div>

          {user?.role === 'hr' && (
            <>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Building size={13} /> Company / Organization
                </span>
                <span className="font-medium text-foreground">{user?.company || 'Not Specified'}</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Briefcase size={13} /> Position / Title
                </span>
                <span className="font-medium text-foreground">{user?.position || 'Talent Recruiter'}</span>
              </div>
            </>
          )}

          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Shield size={13} /> Access Control Level
            </span>
            <span className="font-medium text-foreground capitalize">
              {user?.role === 'admin' ? 'Full Administrator' : user?.role === 'hr' ? 'Recruiter & Hiring' : 'Candidate Interviewee'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Lock size={13} /> Session Security
            </span>
            <span className="font-medium text-success flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Active JWT Session (Revocable)
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Theme Preferences */}
      <div className="card p-6 md:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Workspace Theme</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select how the developer workspace appears on this device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map(opt => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/40 hover:border-muted-foreground/30"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon size={18} />
                </div>
                <span className={cn("text-sm font-semibold mb-0.5", isSelected ? "text-primary" : "text-foreground")}>
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Sign Out Section */}
      <div className="card p-6 md:p-8 space-y-5 border-destructive/20">
        <div>
          <h2 className="text-lg font-bold text-foreground">Authentication & Session Security</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            When you sign out, your current session token is immediately registered in the server-side revocation list.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-muted-foreground">
            <p>Signed in as <strong className="text-foreground">{user?.email}</strong></p>
            <p className="mt-0.5">Protected with 24-hour expiring JSON Web Token.</p>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-destructive flex items-center justify-center gap-2 px-5 py-2.5 shrink-0"
          >
            <LogOut size={16} />
            <span>Sign Out Current Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
