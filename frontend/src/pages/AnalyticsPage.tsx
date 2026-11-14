import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Brain,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface SolvedByDifficulty {
  easy: number;
  medium: number;
  hard: number;
}

interface TopicMasteryItem {
  topic: string;
  problemsSolved: number;
  quizAccuracy: number;
  masteryLevel: 'Needs Practice' | 'Learning' | 'Proficient' | 'Mastered';
  lastPracticedAt: string;
}

interface WeakTopicItem {
  topic: string;
  reason: string;
  accuracy: number;
  problemsSolved: number;
}

interface RecommendationItem {
  title: string;
  type: string;
  reason: string;
  actionUrl: string;
  priority: number;
}

interface AnalyticsOverview {
  totalSolved: number;
  solvedByDifficulty: SolvedByDifficulty;
  totalAttempts: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate?: string;
  };
  coreCsStats?: {
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
  };
  systemDesignStats?: {
    totalSubmitted: number;
    averageScore: number;
  };
  mockInterviewStats?: {
    totalCompleted: number;
    averageScore: number;
  };
  assessmentStats?: {
    totalAttempts: number;
    passedCount: number;
    averageScore: number;
  };
  weakTopics: WeakTopicItem[];
  nextRecommendations: RecommendationItem[];
  lastCalculatedAt?: string;
}

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dailyActivity, setDailyActivity] = useState<Record<string, number>>({});
  const [topicMastery, setTopicMastery] = useState<TopicMasteryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [overviewRes, heatmapRes, masteryRes] = await Promise.all([
        fetch('/api/analytics/overview', { headers }),
        fetch('/api/analytics/heatmap', { headers }),
        fetch('/api/analytics/topic-mastery', { headers }),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.overview);
      }
      if (heatmapRes.ok) {
        const data = await heatmapRes.json();
        setDailyActivity(data.dailyActivity || {});
      }
      if (masteryRes.ok) {
        const data = await masteryRes.json();
        setTopicMastery(data.topicMastery || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSyncMessage('Progress successfully synchronized with all database events!');
        await fetchAnalytics();
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Generate 52-week calendar grid dates
  const generateHeatmapGrid = () => {
    const weeks: { dateStr: string; count: number; dayOfWeek: number }[][] = [];
    const today = new Date();

    // Start 52 weeks ago on Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    // Align start to Sunday
    start.setDate(start.getDate() - start.getDay());

    let currentWeek: { dateStr: string; count: number; dayOfWeek: number }[] = [];
    const cur = new Date(start);

    while (cur <= today || currentWeek.length > 0) {
      const dateStr = cur.toISOString().split('T')[0];
      const count = dailyActivity[dateStr] || 0;
      currentWeek.push({ dateStr, count, dayOfWeek: cur.getDay() });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cur.setDate(cur.getDate() + 1);
      if (cur > today && currentWeek.length === 0) break;
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const heatmapWeeks = generateHeatmapGrid();

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-muted/40 border-border/40';
    if (count === 1) return 'bg-emerald-500/20 border-emerald-500/30';
    if (count <= 3) return 'bg-emerald-500/50 border-emerald-500/60';
    if (count <= 6) return 'bg-emerald-500/80 border-emerald-500';
    return 'bg-emerald-500 border-emerald-400 shadow-sm';
  };

  const getMasteryBadgeClass = (level: string) => {
    switch (level) {
      case 'Mastered':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Proficient':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Learning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground animate-pulse font-medium">Computing progress analytics...</span>
        </div>
      </div>
    );
  }

  const easySolved = overview?.solvedByDifficulty.easy || 0;
  const medSolved = overview?.solvedByDifficulty.medium || 0;
  const hardSolved = overview?.solvedByDifficulty.hard || 0;
  const totalSolved = overview?.totalSolved || 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Phase 8 Feature
            </span>
            <span className="text-xs text-muted-foreground">
              Last synced: {overview?.lastCalculatedAt ? new Date(overview.lastCalculatedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <BarChart3 className="text-primary" size={28} />
            Developer Progress & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time verified metrics aggregated directly from database submissions, quizzes, and mock assessments.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn btn-outline flex items-center gap-2 self-start sm:self-auto"
        >
          <RotateCcw size={16} className={cn(syncing && "animate-spin text-primary")} />
          <span>{syncing ? 'Recalculating...' : 'Sync Database Progress'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Problems Solved</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{totalSolved}</span>
            <span className="text-xs text-muted-foreground font-medium">unique solved</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-xs">
            <div className="text-emerald-500 font-medium">Easy: {easySolved}</div>
            <div className="text-amber-500 font-medium">Med: {medSolved}</div>
            <div className="text-rose-500 font-medium">Hard: {hardSolved}</div>
          </div>
        </div>

        {/* Study Streak */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Streak</span>
            <Flame size={18} className="text-amber-500 fill-amber-500/20" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">{overview?.streak?.current || 0}</span>
            <span className="text-xs text-muted-foreground">days streak</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Best streak: <strong className="text-foreground">{overview?.streak?.longest || 0} days</strong>
          </p>
        </div>

        {/* Core CS Accuracy */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Core CS Accuracy</span>
            <Brain size={18} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {overview?.coreCsStats?.overallAccuracy || 0}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({overview?.coreCsStats?.totalCorrect || 0}/{overview?.coreCsStats?.totalAttempts || 0})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Concepts verified across 4 subjects
          </p>
        </div>

        {/* Mock Interview Score */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Interview Avg Score</span>
            <Award size={18} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              {overview?.mockInterviewStats?.averageScore || 0}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({overview?.mockInterviewStats?.totalCompleted || 0} done)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Assessments: {overview?.assessmentStats?.passedCount || 0} passed
          </p>
        </div>
      </div>

      {/* 52-Week GitHub-style Activity Heatmap */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Yearly Consistency Heatmap
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily practice activity recorded in your configured timezone.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-muted/40 border border-border/40" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/60" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-500" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    title={`${day.dateStr}: ${day.count} activities`}
                    className={cn(
                      "w-3 h-3 rounded-sm border transition-colors cursor-pointer",
                      getActivityColor(day.count)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weak Topics Detection Alert */}
      {overview?.weakTopics && overview.weakTopics.length > 0 && (
        <div className="card p-5 border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
            <AlertTriangle size={18} />
            <span>Weak-Topic Detection Safeguards</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Our algorithmic engine identified topics that require reinforcement based on your quiz accuracy and solved counts:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {overview.weakTopics.map(wt => (
              <div key={wt.topic} className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
                <div className="font-semibold text-foreground">{wt.topic}</div>
                <div className="text-muted-foreground">{wt.reason}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-amber-500 font-medium">Accuracy: {wt.accuracy}%</span>
                  <span className="text-muted-foreground">Solved: {wt.problemsSolved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Actions */}
      {overview?.nextRecommendations && overview.nextRecommendations.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Recommended Next Activities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overview.nextRecommendations.map((rec, idx) => (
              <Link
                key={idx}
                to={rec.actionUrl}
                className="group p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {rec.type}
                  </span>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mt-2">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium mt-3">
                  <span>Start Practice</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Topic Mastery Grid */}
      <div className="card p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            Curriculum Topic Mastery
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mastery levels adhere to strict anti-inflation rules (minimum 10 problems + 80% accuracy for Mastered).
          </p>
        </div>

        {topicMastery.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No topic practice recorded yet. Solve coding problems or complete quizzes to unlock topic mastery!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicMastery.map(tm => (
              <div key={tm.topic} className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground">{tm.topic}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", getMasteryBadgeClass(tm.masteryLevel))}>
                    {tm.masteryLevel}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Solved Problems</span>
                    <strong className="text-foreground">{tm.problemsSolved}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quiz Accuracy</span>
                    <strong className="text-foreground">{tm.quizAccuracy}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
