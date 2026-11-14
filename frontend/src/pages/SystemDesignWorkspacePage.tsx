import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Scale,
  Award,
  Code2,
  Eye,
} from 'lucide-react';
import { cn } from '../lib/utils';
import MermaidViewer from '../components/system-design/MermaidViewer';
import { useTheme } from '../contexts/ThemeContext';

interface SystemDesignDetail {
  _id: string;
  slug: string;
  title: string;
  type: 'hld' | 'lld';
  difficulty: 'easy' | 'medium' | 'hard';
  scale: string;
  summary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  capacityEstimation: {
    rps: string;
    storage: string;
    bandwidth: string;
    memory: string;
    notes: string;
  };
  apiDesign: {
    endpoint: string;
    method: string;
    description: string;
    requestBody?: string;
    responseBody?: string;
  }[];
  dataModels: {
    entity: string;
    fields: string[];
    storageType: string;
    notes?: string;
  }[];
  architecturePillars: string[];
  mermaidDiagram: string;
  tradeoffs: {
    decision: string;
    pros: string[];
    cons: string[];
    rationale: string;
  }[];
  deepDives: {
    topic: string;
    content: string;
  }[];
  evaluationRubric: Record<string, string>;
}

interface RubricSelfScore {
  requirements: number;
  dataModel: number;
  architecture: number;
  scalability: number;
  reliability: number;
  security: number;
  tradeoffs: number;
}

interface AiCritiqueResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  evaluatedAt: string;
}

export const SystemDesignWorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [designCase, setDesignCase] = useState<SystemDesignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Left Panel Tabs: 'requirements' | 'capacity' | 'apis' | 'tradeoffs' | 'rubric'
  const [activeTab, setActiveTab] = useState<'requirements' | 'capacity' | 'apis' | 'tradeoffs' | 'rubric'>('requirements');

  // Right Panel Diagram mode: 'candidate' | 'reference'
  const [diagramView, setDiagramView] = useState<'candidate' | 'reference'>('candidate');
  const [candidateDiagram, setCandidateDiagram] = useState<string>('');
  const [candidateNotes, setCandidateNotes] = useState<string>('');

  // Self Rubric Scores
  const [rubricScores, setRubricScores] = useState<RubricSelfScore>({
    requirements: 3,
    dataModel: 3,
    architecture: 3,
    scalability: 3,
    reliability: 3,
    security: 3,
    tradeoffs: 3,
  });

  // AI Critique State
  const [critique, setCritique] = useState<AiCritiqueResult | null>(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch Case & User Attempt
  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/system-design/${slug}`);
      if (res.ok) {
        const data: SystemDesignDetail = await res.json();
        setDesignCase(data);

        // Fetch candidate saved draft if logged in
        const token = localStorage.getItem('token');
        if (token) {
          const attemptRes = await fetch(`${API_URL}/api/system-design/${slug}/attempt`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (attemptRes.ok) {
            const attemptData = await attemptRes.json();
            if (attemptData.attempt) {
              setCandidateDiagram(attemptData.attempt.mermaidDiagram || '');
              setCandidateNotes(attemptData.attempt.notes || '');
              if (attemptData.attempt.rubricSelfScore) {
                setRubricScores(attemptData.attempt.rubricSelfScore);
              }
              if (attemptData.attempt.aiCritique) {
                setCritique(attemptData.attempt.aiCritique);
              }
            } else {
              // Initial default starter diagram
              setCandidateDiagram(`flowchart TD\n  Client[User Clients] --> LB[Load Balancer]\n  LB --> Gateway[API Gateway]\n  Gateway --> DB[(Database)]`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load system design case:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Progress
  const handleSave = async () => {
    if (!slug) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to save your system design progress.');
      return;
    }

    setSaveStatus('Saving...');
    try {
      const res = await fetch(`${API_URL}/api/system-design/${slug}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mermaidDiagram: candidateDiagram,
          notes: candidateNotes,
          rubricSelfScore: rubricScores,
        }),
      });

      if (res.ok) {
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        setSaveStatus('Error saving');
      }
    } catch (err) {
      console.error('Error saving:', err);
      setSaveStatus('Error saving');
    }
  };

  // Request AI Critique
  const handleRequestCritique = async () => {
    if (!slug) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to request an architectural critique.');
      return;
    }

    setCritiqueLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/system-design/${slug}/critique`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: candidateNotes,
          mermaidDiagram: candidateDiagram,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCritique(data.critique);
        setActiveTab('rubric'); // Switch to rubric tab to show critique
      }
    } catch (err) {
      console.error('Error generating critique:', err);
    } finally {
      setCritiqueLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
        Loading interactive design studio...
      </div>
    );
  }

  if (!designCase) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">System design case not found</h2>
        <Link to="/system-design" className="btn btn-primary btn-sm">
          Back to System Design Catalog
        </Link>
      </div>
    );
  }

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/system-design"
            className="p-2 rounded-xl border border-border hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                {designCase.scale}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                {designCase.type.toUpperCase()} Architecture
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{designCase.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {saveStatus && (
            <span className="text-xs font-semibold text-primary animate-pulse">{saveStatus}</span>
          )}
          <button
            onClick={handleSave}
            className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
          >
            <Save size={13} />
            <span>Save Draft</span>
          </button>
          <button
            onClick={handleRequestCritique}
            disabled={critiqueLoading}
            className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>{critiqueLoading ? 'Evaluating Architecture...' : 'Architectural Review'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Case Study Tabs (5 cols) */}
        <div className="lg:col-span-5 card p-5 border border-border rounded-2xl space-y-4">
          {/* Tabs Switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('requirements')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all',
                activeTab === 'requirements' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all',
                activeTab === 'capacity' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Capacity
            </button>
            <button
              onClick={() => setActiveTab('apis')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all',
                activeTab === 'apis' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              APIs & Data
            </button>
            <button
              onClick={() => setActiveTab('tradeoffs')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all',
                activeTab === 'tradeoffs' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Tradeoffs
            </button>
            <button
              onClick={() => setActiveTab('rubric')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1',
                activeTab === 'rubric' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Award size={12} />
              <span>Rubric {critique && '★'}</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="max-h-[620px] overflow-y-auto space-y-5 text-xs pr-1">
            {/* 1. Requirements */}
            {activeTab === 'requirements' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-primary" />
                    Functional Requirements
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {designCase.functionalRequirements.map((req, i) => (
                      <li key={i} className="text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border">
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Scale size={13} className="text-amber-500" />
                    Non-Functional Requirements & SLAs
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {designCase.nonFunctionalRequirements.map((req, i) => (
                      <li key={i} className="text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {designCase.summary && (
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1">
                    <span className="font-bold text-foreground block">Executive Overview:</span>
                    <p className="text-muted-foreground leading-relaxed">{designCase.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Capacity Estimation */}
            {activeTab === 'capacity' && (
              <div className="space-y-3">
                <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                  Back-of-the-Envelope Math
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground font-semibold block text-[10px] uppercase">RPS / QPS</span>
                    <span className="font-bold text-foreground text-sm">{designCase.capacityEstimation.rps}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Storage</span>
                    <span className="font-bold text-foreground text-sm">{designCase.capacityEstimation.storage}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Bandwidth</span>
                    <span className="font-bold text-foreground text-sm">{designCase.capacityEstimation.bandwidth}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-muted-foreground font-semibold block text-[10px] uppercase">RAM Cache</span>
                    <span className="font-bold text-foreground text-sm">{designCase.capacityEstimation.memory}</span>
                  </div>
                </div>

                {designCase.capacityEstimation.notes && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground block mb-0.5">Sizing Strategy:</span>
                    {designCase.capacityEstimation.notes}
                  </div>
                )}
              </div>
            )}

            {/* 3. APIs & Data Models */}
            {activeTab === 'apis' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Code2 size={13} className="text-primary" />
                    API Endpoints Specification
                  </h4>
                  <div className="space-y-2">
                    {designCase.apiDesign.map((api, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border font-mono text-[11px] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{api.method}</span>
                          <span className="text-foreground">{api.endpoint}</span>
                        </div>
                        <p className="font-sans text-muted-foreground text-[11px]">{api.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Database size={13} className="text-emerald-500" />
                    Data Models & Storage Entities
                  </h4>
                  <div className="space-y-2">
                    {designCase.dataModels.map((dm, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{dm.entity}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {dm.storageType}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {dm.fields.join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Trade-offs & Deep Dives */}
            {activeTab === 'tradeoffs' && (
              <div className="space-y-4">
                <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                  Architectural Decisions & Trade-offs
                </span>
                {designCase.tradeoffs.map((t, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2">
                    <span className="font-bold text-foreground block">{t.decision}</span>
                    <div className="space-y-1 text-muted-foreground">
                      <p><span className="text-emerald-500 font-bold">Pros:</span> {t.pros.join('; ')}</p>
                      <p><span className="text-destructive font-bold">Cons:</span> {t.cons.join('; ')}</p>
                      <p className="pt-1 text-foreground font-sans"><span className="font-bold">Rationale:</span> {t.rationale}</p>
                    </div>
                  </div>
                ))}

                {designCase.deepDives && designCase.deepDives.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-3">
                    <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                      Engineering Deep-Dives
                    </span>
                    {designCase.deepDives.map((dd, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                        <span className="font-bold text-foreground block">{dd.topic}</span>
                        <p className="text-muted-foreground leading-relaxed">{dd.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Evaluation Rubric & AI Critique */}
            {activeTab === 'rubric' && (
              <div className="space-y-5">
                {/* AI Critique Review Card (if available) */}
                {critique && (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" />
                        Architectural Scorecard
                      </span>
                      <span className="px-3 py-1 rounded-full font-bold text-xs bg-primary text-primary-foreground">
                        {critique.score} / 100
                      </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{critique.feedback}</p>

                    {critique.strengths && critique.strengths.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-500 text-[11px] uppercase">Key Strengths:</span>
                        {critique.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                            <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {critique.improvements && critique.improvements.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-bold text-amber-500 text-[11px] uppercase">Architectural Gaps:</span>
                        {critique.improvements.map((imp, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                            <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 8-Criteria Self-Assessment Sliders */}
                <div className="space-y-3">
                  <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
                    8-Point Evaluation Rubric (Self Score 1 - 5)
                  </span>

                  {(Object.keys(rubricScores) as (keyof RubricSelfScore)[]).map((key) => {
                    const score = rubricScores[key];
                    return (
                      <div key={key} className="space-y-1 p-2.5 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground capitalize">{key}</span>
                          <span className="font-bold text-primary">{score} / 5</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={score}
                          onChange={(e) =>
                            setRubricScores((prev) => ({
                              ...prev,
                              [key]: parseInt(e.target.value, 10),
                            }))
                          }
                          className="w-full accent-primary h-1.5 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Mermaid Architecture Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 border border-border rounded-2xl space-y-4">
            {/* View Switcher: Candidate vs Reference */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border">
                <button
                  onClick={() => setDiagramView('candidate')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    diagramView === 'candidate' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <Code2 size={13} />
                  <span>My Architecture Diagram</span>
                </button>
                <button
                  onClick={() => setDiagramView('reference')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    diagramView === 'reference' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  <Eye size={13} />
                  <span>Official Reference Architecture</span>
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground font-mono">
                Mermaid.js Engine
              </span>
            </div>

            {/* LIVE MERMAID RENDER PREVIEW */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Live Architecture Topology Preview
              </span>
              <MermaidViewer
                chart={diagramView === 'candidate' ? candidateDiagram : designCase.mermaidDiagram}
                isDark={isDarkMode}
                className="min-h-[220px]"
              />
            </div>

            {/* DIAGRAM CODE EDITOR (Editable in Candidate Mode) */}
            {diagramView === 'candidate' && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mermaid Diagram Definition
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      onClick={() =>
                        setCandidateDiagram((prev) => `${prev}\n  Gateway --> Redis[(Redis Cache)]`)
                      }
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-mono"
                    >
                      + Redis
                    </button>
                    <button
                      onClick={() =>
                        setCandidateDiagram((prev) => `${prev}\n  Gateway --> Kafka[Kafka Queue]`)
                      }
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-mono"
                    >
                      + Kafka
                    </button>
                  </div>
                </div>

                <textarea
                  value={candidateDiagram}
                  onChange={(e) => setCandidateDiagram(e.target.value)}
                  placeholder="Enter Mermaid flowchart or sequenceDiagram syntax..."
                  rows={6}
                  className="w-full p-3 rounded-xl bg-background border border-border text-xs font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* ARCHITECTURAL NOTES & CALCULATIONS */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Architectural Explanations, Bottleneck Analysis & Trade-off Notes
              </span>
              <textarea
                value={candidateNotes}
                onChange={(e) => setCandidateNotes(e.target.value)}
                placeholder="Document your database sharding strategy, caching tiers, failure recovery plans, and trade-offs..."
                rows={5}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDesignWorkspacePage;
