import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Github,
  Linkedin,
  Award,
  Calendar,
  Lock,
  ArrowLeft
} from 'lucide-react';

interface PublicDeveloper {
  name: string;
  username: string;
  headline?: string;
  targetRole?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  experienceYears?: number;
  bio?: string;
  learningGoals: string[];
  memberSince?: string;
}

interface PublicStats {
  totalSolved: number;
  solvedByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  topMasteredTopics: {
    topic: string;
    level: string;
    solved: number;
  }[];
}

export const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [developer, setDeveloper] = useState<PublicDeveloper | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/profile/public/${username}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Developer profile is private or does not exist.');
        }
        const data = await res.json();
        setDeveloper(data.developer);
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load developer profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading developer profile...</span>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Profile Unavailable</h2>
        <p className="text-sm text-muted-foreground">
          {error || 'This developer profile is set to private or does not exist.'}
        </p>
        <div className="pt-2">
          <Link to="/" className="btn btn-outline inline-flex items-center gap-2 text-xs">
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in pb-16">
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white text-3xl font-bold shadow-glow-primary/30">
              {developer.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{developer.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Verified Developer
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">@{developer.username}</p>
              <p className="text-sm font-medium text-foreground/90">{developer.headline || 'Software Engineer'}</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {developer.githubUrl && (
              <a
                href={developer.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 hover:text-foreground text-muted-foreground transition-colors"
                title="GitHub Profile"
              >
                <Github size={18} />
              </a>
            )}
            {developer.linkedinUrl && (
              <a
                href={developer.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 hover:text-foreground text-muted-foreground transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Bio & Details */}
        <div className="space-y-4 text-sm">
          {developer.bio && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About</h3>
              <p className="text-foreground leading-relaxed">{developer.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {developer.targetRole && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs flex items-center gap-2">
                <Briefcase size={15} className="text-primary" />
                <span>Target Role: <strong className="text-foreground">{developer.targetRole}</strong></span>
              </div>
            )}
            {developer.experienceYears !== undefined && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span>Experience: <strong className="text-foreground">{developer.experienceYears} year(s)</strong></span>
              </div>
            )}
          </div>

          {/* Skills */}
          {developer.skills && developer.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technical Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {developer.skills.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/50 border border-border/60 text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verified Practice & Problem-Solving Stats */}
      {stats && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award size={20} className="text-primary" />
            Verified Platform Achievements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Solved */}
            <div className="card p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Problems Solved
              </span>
              <div className="text-3xl font-extrabold text-foreground">{stats.totalSolved}</div>
              <div className="flex gap-2 text-xs pt-1">
                <span className="text-emerald-500 font-medium">Easy: {stats.solvedByDifficulty.easy}</span>
                <span className="text-amber-500 font-medium">Med: {stats.solvedByDifficulty.medium}</span>
                <span className="text-rose-500 font-medium">Hard: {stats.solvedByDifficulty.hard}</span>
              </div>
            </div>

            {/* Streak */}
            <div className="card p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Study Streak
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">{stats.streak.current}</span>
                <span className="text-xs text-muted-foreground">current days</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                All-time best: <strong className="text-foreground">{stats.streak.longest} days</strong>
              </p>
            </div>

            {/* Top Topics Mastered */}
            <div className="card p-5 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Topics Mastered
              </span>
              <div className="text-3xl font-extrabold text-indigo-400">
                {stats.topMasteredTopics.length}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Proficient or Mastered curriculum areas
              </p>
            </div>
          </div>

          {/* Mastered topics list */}
          {stats.topMasteredTopics.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Mastered Algorithmic & Systems Areas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stats.topMasteredTopics.map(tm => (
                  <div key={tm.topic} className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs space-y-1">
                    <div className="font-semibold text-foreground">{tm.topic}</div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-primary font-medium">{tm.level}</span>
                      <span>{tm.solved} solved</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfilePage;
