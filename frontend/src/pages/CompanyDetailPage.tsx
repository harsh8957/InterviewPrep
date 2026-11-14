import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  BookOpen,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ProblemSummary {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  patterns?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface SystemDesignSummary {
  _id: string;
  title: string;
  slug: string;
  type: string;
  summary: string;
  difficulty: string;
}

interface BehavioralSummary {
  _id: string;
  prompt: string;
  category: string;
  competency: string;
}

interface AssessmentSummary {
  _id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  difficulty: string;
}

interface TrackRound {
  roundName: string;
  type: string;
  description: string;
  durationMinutes: number;
  keyTips: string[];
}

interface TargetRole {
  role: string;
  level: string;
  focusAreas: string[];
}

interface CompanyTrackDetail {
  _id: string;
  name: string;
  slug: string;
  tier: string;
  brandColor?: string;
  description: string;
  headquarters: string;
  website?: string;
  hiringBarOverview: string;
  culturePrinciples: string[];
  targetRoles: TargetRole[];
  rounds: TrackRound[];
  linkedProblemIds: ProblemSummary[];
  linkedSystemDesignIds: SystemDesignSummary[];
  linkedBehavioralIds: BehavioralSummary[];
  linkedAssessmentIds: AssessmentSummary[];
  coreCsTopics: string[];
  stats: {
    totalProblems: number;
    totalSystemDesign: number;
    experienceCount: number;
  };
}

interface ApprovedExperienceSummary {
  _id: string;
  companyName: string;
  companySlug: string;
  role: string;
  experienceLevel: string;
  interviewYear: number;
  interviewSeason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  outcome: string;
  candidateHandle: string;
  isAnonymous: boolean;
  preparationTips: string;
  rounds: Array<{
    roundName: string;
    roundType: string;
    questionsSummary: string;
    difficulty: string;
  }>;
  createdAt: string;
}

type TabType = 'process' | 'dsa' | 'system_design' | 'core_cs' | 'assessments' | 'experiences';

export const CompanyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [track, setTrack] = useState<CompanyTrackDetail | null>(null);
  const [experiences, setExperiences] = useState<ApprovedExperienceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('process');

  useEffect(() => {
    const fetchTrackDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/company-tracks/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.track) {
            setTrack(data.track);
            setExperiences(data.experiences || []);
          } else {
            setError('Company preparation track not found.');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.message || 'Company preparation track not found.');
        }
      } catch (err: any) {
        console.error('Failed to load company track:', err);
        setError('Failed to load company track details.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchTrackDetail();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="card p-8 space-y-4">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Track Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || 'This company track does not exist or has been moved.'}</p>
        <Link to="/companies" className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} />
          <span>Back to All Companies</span>
        </Link>
      </div>
    );
  }

  const difficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Hard</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground/70">{diff}</span>;
    }
  };

  const outcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Offer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">Offer</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/25">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">{outcome}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Companies Catalog</span>
      </Link>

      {/* Hero Banner */}
      <div className="card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-card via-card to-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${
                track.brandColor || 'from-primary to-primary/70'
              } text-white font-extrabold text-2xl shadow-md shrink-0`}
            >
              {track.name.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {track.name} Preparation Track
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                  {track.tier.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck size={11} />
                  Curated Guide
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{track.headquarters}</span>
                {track.website && (
                  <>
                    <span>•</span>
                    <a
                      href={track.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Careers Portal</span>
                      <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm text-foreground/80 max-w-3xl leading-relaxed pt-1">
                {track.description}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0 self-start md:self-center">
            <Link to="/setup" className="btn btn-primary btn-sm flex items-center justify-center gap-1.5 text-xs">
              <Sparkles size={14} />
              <span>Simulate {track.name} Interview</span>
            </Link>
            <Link to="/experiences/new" className="btn btn-outline btn-sm flex items-center justify-center gap-1.5 text-xs">
              <Users size={14} />
              <span>Share Interview Loop</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
          <div className="p-3 rounded-lg bg-card/60 border border-border/60">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <BookOpen size={14} className="text-primary" />
              {track.linkedProblemIds?.length || 0} Problems
            </div>
            <span className="text-[11px] text-muted-foreground">Linked DSA Coding Questions</span>
          </div>

          <div className="p-3 rounded-lg bg-card/60 border border-border/60">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Layers size={14} className="text-indigo-400" />
              {track.linkedSystemDesignIds?.length || 0} Case Studies
            </div>
            <span className="text-[11px] text-muted-foreground">High & Low Level Architectures</span>
          </div>

          <div className="p-3 rounded-lg bg-card/60 border border-border/60">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Clock size={14} className="text-amber-400" />
              {track.rounds?.length || 0} Interview Stages
            </div>
            <span className="text-[11px] text-muted-foreground">From OA to Final Hiring Loop</span>
          </div>

          <div className="p-3 rounded-lg bg-card/60 border border-border/60">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Users size={14} className="text-emerald-400" />
              {experiences.length} Experiences
            </div>
            <span className="text-[11px] text-muted-foreground">Moderated Candidate Reports</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto scrollbar-none pb-px">
        {[
          { key: 'process' as TabType, label: 'Hiring Process & Culture', icon: Building2 },
          { key: 'dsa' as TabType, label: `DSA Coding (${track.linkedProblemIds?.length || 0})`, icon: BookOpen },
          { key: 'system_design' as TabType, label: `System Design (${track.linkedSystemDesignIds?.length || 0})`, icon: Layers },
          { key: 'core_cs' as TabType, label: `Core CS & Behavioral`, icon: Cpu },
          { key: 'assessments' as TabType, label: `Timed Assessments`, icon: Clock },
          { key: 'experiences' as TabType, label: `Interview Loops (${experiences.length})`, icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Hiring Process & Culture */}
      {activeTab === 'process' && (
        <div className="space-y-6 animate-fade-in">
          {/* Hiring Bar Summary */}
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" />
              Engineering Hiring Bar & Philosophy
            </h2>
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
              {track.hiringBarOverview}
            </p>
          </div>

          {/* Culture Principles */}
          {track.culturePrinciples && track.culturePrinciples.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-foreground">
                Core Culture Principles & Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {track.culturePrinciples.map((principle, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/60 border border-border/80 flex items-start gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-foreground">{principle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Roles Breakdown */}
          {track.targetRoles && track.targetRoles.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-foreground">
                Target Roles & Level Expectations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {track.targetRoles.map((roleItem, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{roleItem.role}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                        {roleItem.level}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {roleItem.focusAreas.map((area, aIdx) => (
                        <span key={aIdx} className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground/75 border border-border">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Stages Timeline */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              End-to-End Interview Loop Breakdown
            </h2>
            <div className="space-y-4">
              {track.rounds.map((round, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{round.roundName}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                        {round.type.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={11} />
                        {round.durationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed pl-8">
                    {round.description}
                  </p>

                  {round.keyTips && round.keyTips.length > 0 && (
                    <div className="pl-8 pt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        Candidate Strategy & Tips:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {round.keyTips.map((tip, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary border border-primary/20">
                            • {tip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Linked DSA Problems */}
      {activeTab === 'dsa' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-6 space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Recommended DSA Problems for {track.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              These problems directly mirror algorithmic patterns and complexity bounds emphasized in {track.name} interview rounds.
            </p>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Topics</th>
                    <th className="py-3 px-4">Target Complexity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {track.linkedProblemIds.map(prob => (
                    <tr key={prob._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <Link to={`/problems/${prob.slug}`} className="hover:text-primary transition-colors">
                          {prob.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">{difficultyBadge(prob.difficulty)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prob.topics.slice(0, 2).map((top, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground">
                              {top}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {prob.timeComplexity ? `${prob.timeComplexity} / ${prob.spaceComplexity}` : 'O(N) / O(1)'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/problems/${prob.slug}`}
                          className="btn btn-outline btn-xs inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Solve</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: System Design */}
      {activeTab === 'system_design' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-6 space-y-2">
            <h2 className="text-base font-bold text-foreground">
              System Design & Architecture Cases
            </h2>
            <p className="text-xs text-muted-foreground">
              Interactive architecture studios designed to prepare you for {track.name} system design loops with Mermaid diagrams and capacity math.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {track.linkedSystemDesignIds.map(cs => (
              <div key={cs._id} className="card p-5 space-y-3 flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {cs.type.toUpperCase()}
                    </span>
                    {difficultyBadge(cs.difficulty)}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{cs.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {cs.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <Link
                    to={`/system-design/${cs.slug}`}
                    className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <span>Open Architecture Studio</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Core CS & Behavioral */}
      {activeTab === 'core_cs' && (
        <div className="space-y-6 animate-fade-in">
          {/* Core CS Section */}
          <div className="card p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Cpu size={16} className="text-primary" />
                Key Computer Science Fundamentals for {track.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                In-depth topics tested during technical screen and systems discussion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {track.coreCsTopics.map((topic, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border bg-card/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs">
                      CS
                    </div>
                    <span className="text-xs font-semibold text-foreground">{topic}</span>
                  </div>
                  <Link to="/core-cs" className="btn btn-outline btn-xs">
                    Review Curriculum
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Questions Section */}
          <div className="card p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                Company-Specific Behavioral & Leadership Questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Use the STAR framework (Situation, Task, Action, Result) with metrics.
              </p>
            </div>

            <div className="space-y-3">
              {track.linkedBehavioralIds.map(bq => (
                <div key={bq._id} className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                      {bq.competency}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{bq.category}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    "{bq.prompt}"
                  </p>
                  <div className="pt-1">
                    <Link to="/interview-tips" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                      <span>Practice in Behavioral STAR Studio</span>
                      <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Timed Assessments */}
      {activeTab === 'assessments' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-6 space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Timed Mock Assessments
            </h2>
            <p className="text-xs text-muted-foreground">
              HackerRank and CodeSignal style timed assessments to simulate {track.name} online screening rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {track.linkedAssessmentIds.map(ass => (
              <div key={ass._id} className="card p-5 space-y-3 flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {ass.durationMinutes} Minutes
                    </span>
                    {difficultyBadge(ass.difficulty)}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{ass.title}</h3>
                </div>

                <div className="pt-3 border-t border-border">
                  <Link
                    to="/assessments"
                    className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <span>Launch Timed Assessment</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Interview Experiences */}
      {activeTab === 'experiences' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                Community Interview Loops for {track.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Anonymized, PII-moderated reports of actual technical loops and interview rounds.
              </p>
            </div>

            <Link to="/experiences/new" className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs shrink-0">
              <Users size={14} />
              <span>Share Your {track.name} Loop</span>
            </Link>
          </div>

          {experiences.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Users size={36} className="mx-auto text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground">No interview loops reported yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first to help fellow engineers by sharing your {track.name} interview experience. All submissions are moderated and anonymized.
              </p>
              <Link to="/experiences/new" className="btn btn-outline btn-sm inline-flex items-center gap-1.5">
                <span>Share Interview Experience</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map(exp => (
                <div key={exp._id} className="card p-6 space-y-4 hover:border-primary/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground font-bold text-xs">
                        {exp.candidateHandle.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{exp.role}</h3>
                        <span className="text-[11px] text-muted-foreground">
                          {exp.candidateHandle} • {exp.interviewSeason} {exp.interviewYear}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {outcomeBadge(exp.outcome)}
                      {difficultyBadge(exp.difficulty)}
                    </div>
                  </div>

                  {/* Preparation Tips Quote */}
                  <div className="p-3.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground/85 leading-relaxed italic">
                    "{exp.preparationTips}"
                  </div>

                  {/* Rounds Summary */}
                  {exp.rounds && exp.rounds.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Rounds Logged ({exp.rounds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exp.rounds.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground/80 border border-border"
                          >
                            {r.roundName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Submitted on {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/experiences/${exp._id}`}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Read Full Loop Breakdown</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyDetailPage;
