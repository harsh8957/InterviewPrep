import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Mail,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Save,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Developer Profile State
  const [username, setUsername] = useState('');
  const [headline, setHeadline] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isPublic, setIsPublic] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const p = data.user?.profile || {};
          setUsername(p.username || '');
          setHeadline(p.headline || '');
          setTargetRole(p.targetRole || '');
          setExperienceYears(p.experienceYears !== undefined ? p.experienceYears : '');
          setBio(p.bio || '');
          setSkillsStr((p.skills || []).join(', '));
          setGithubUrl(p.githubUrl || '');
          setLinkedinUrl(p.linkedinUrl || '');
          setTimezone(p.timezone || 'UTC');
          setIsPublic(p.isPublic || false);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setStatusMessage(null);
      const token = localStorage.getItem('token');

      const skills = skillsStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        username: username.trim() || undefined,
        headline: headline.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        experienceYears: experienceYears !== '' ? Number(experienceYears) : undefined,
        bio: bio.trim() || undefined,
        skills,
        githubUrl: githubUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        timezone: timezone || 'UTC',
        isPublic,
      };

      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setStatusMessage({ text: 'Profile saved successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

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
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account & Developer Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal details, developer showcase settings, and workspace preferences.
        </p>
      </div>

      {statusMessage && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in border",
            statusMessage.type === 'success'
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Account Overview Header Card */}
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

          <div className="flex flex-wrap items-center gap-2">
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

            {isPublic && username && (
              <Link
                to={`/u/${username}`}
                target="_blank"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
              >
                <span>View Public Profile</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* Developer Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Developer Showcase Profile
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize how your verified problem-solving metrics and skills appear to recruiters and peers.
              </p>
            </div>

            {/* Public switch */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none">
              <span>Public Profile</span>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-card"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Custom Username (for your public link: /u/username)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. alicedev"
                pattern="^[a-zA-Z0-9_-]+$"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack & Distributed Systems Engineer"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Staff Software Engineer"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Technical Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={e => setSkillsStr(e.target.value)}
                placeholder="TypeScript, Node.js, Python, System Design, PostgreSQL, Redis"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourhandle"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourhandle"
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Timezone (for accurate streak & calendar calculations)
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Describe your engineering focus, recent projects, or preparation goals..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary flex items-center gap-2 text-xs px-5 py-2.5"
            >
              <Save size={16} />
              <span>{savingProfile ? 'Saving...' : 'Save Developer Profile'}</span>
            </button>
          </div>
        </form>
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
