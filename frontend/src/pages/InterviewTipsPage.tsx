import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Target,
  BrainCircuit,
  ChevronRight,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
} from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Tip {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty?: string;
  content: string;
}

interface BehavioralQuestion {
  _id: string;
  slug: string;
  prompt: string;
  category: string;
  targetCompetency: string;
  exampleSTAR: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  tips: string[];
}

interface StarStory {
  _id: string;
  title: string;
  category: string;
  questionId?: any;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics?: string;
  learnings?: string;
  companyTags?: string[];
  aiReview?: {
    clarityScore: number;
    impactScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  createdAt: string;
}

export const InterviewTipsPage: React.FC = () => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [activeMainTab, setActiveMainTab] = useState<'star' | 'library' | 'coach'>('star');

  // Existing Tips state
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);

  // Existing Coach state
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('Junior');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // Behavioral Prep & STAR Builder state
  const [questions, setQuestions] = useState<BehavioralQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stories, setStories] = useState<StarStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Active Story Editor Form
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [storyForm, setStoryForm] = useState({
    title: '',
    category: 'leadership',
    situation: '',
    task: '',
    action: '',
    result: '',
    metrics: '',
    learnings: '',
    companyTags: '',
  });
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [reviewingStoryId, setReviewingStoryId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, any>>({});

  // 1. Fetch Existing Tips
  useEffect(() => {
    fetch(`${API_URL}/api/interview-tips`)
      .then((res) => res.json())
      .then((data) => {
        setTips(data);
        setTipsLoading(false);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  // 2. Fetch Behavioral Questions
  useEffect(() => {
    fetch(`${API_URL}/api/behavioral/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error(err));
  }, [API_URL]);

  // 3. Fetch Candidate's Saved STAR Stories
  const fetchStories = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setStoriesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/behavioral/stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setStoriesLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user, fetchStories]);

  // Save Story (Create or Update)
  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to save your STAR stories.');
      return;
    }

    setIsSavingStory(true);
    try {
      const payload = {
        title: storyForm.title,
        category: storyForm.category,
        situation: storyForm.situation,
        task: storyForm.task,
        action: storyForm.action,
        result: storyForm.result,
        metrics: storyForm.metrics,
        learnings: storyForm.learnings,
        companyTags: storyForm.companyTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const url = editingStoryId
        ? `${API_URL}/api/behavioral/stories/${editingStoryId}`
        : `${API_URL}/api/behavioral/stories`;
      const method = editingStoryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingStoryId(null);
        setStoryForm({
          title: '',
          category: 'leadership',
          situation: '',
          task: '',
          action: '',
          result: '',
          metrics: '',
          learnings: '',
          companyTags: '',
        });
        fetchStories();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error saving story');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSavingStory(false);
    }
  };

  // Edit Story
  const handleStartEdit = (story: StarStory) => {
    setEditingStoryId(story._id);
    setStoryForm({
      title: story.title,
      category: story.category,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      metrics: story.metrics || '',
      learnings: story.learnings || '',
      companyTags: (story.companyTags || []).join(', '),
    });
    // Scroll to form smoothly
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Delete Story
  const handleDeleteStory = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token || !confirm('Are you sure you want to delete this STAR story?')) return;

    try {
      const res = await fetch(`${API_URL}/api/behavioral/stories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  // Request Rubric Feedback
  const handleRequestStoryFeedback = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setReviewingStoryId(id);
    try {
      const res = await fetch(`${API_URL}/api/behavioral/stories/${id}/feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackMap((prev) => ({ ...prev, [id]: data.review }));
        fetchStories();
      }
    } catch (err) {
      console.error('Failed to evaluate story:', err);
    } finally {
      setReviewingStoryId(null);
    }
  };

  // AI Roadmap Generator (Existing)
  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setCoachLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/interview-tips/coach/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role, experienceLevel: experience, company: 'Top Tech' }),
      });
      const data = await res.json();
      setRoadmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCoachLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHero
        title="Behavioral & Engineering Preparation Hub"
        description="Master the STAR method, craft high-impact engineering stories, and evaluate your responses against FAANG rubrics."
        badge="Career & Strategy"
      />

      <div className="container-content py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-muted/60 border border-border rounded-2xl w-fit">
          <button
            onClick={() => setActiveMainTab('star')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeMainTab === 'star'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Award size={15} className="text-primary" />
            <span>STAR Story Builder & Behavioral Bank</span>
          </button>
          <button
            onClick={() => setActiveMainTab('library')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeMainTab === 'library'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BookOpen size={15} />
            <span>Strategy Library & Rubrics</span>
          </button>
          <button
            onClick={() => setActiveMainTab('coach')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeMainTab === 'coach'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BrainCircuit size={15} />
            <span>AI Interview Coach</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: BEHAVIORAL QUESTION BANK & STAR STORY BUILDER */}
        {/* ============================================================== */}
        {activeMainTab === 'star' && (
          <div className="space-y-10 animate-fade-in">
            {/* 1. Interactive STAR Story Builder Form */}
            <div className="card p-6 md:p-8 border border-border rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {editingStoryId ? 'Edit Existing Story' : 'Story Crafting Studio'}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {editingStoryId ? 'Update STAR Story' : 'Build a High-Impact STAR Story'}
                  </h3>
                </div>
                {editingStoryId && (
                  <button
                    onClick={() => {
                      setEditingStoryId(null);
                      setStoryForm({
                        title: '',
                        category: 'leadership',
                        situation: '',
                        task: '',
                        action: '',
                        result: '',
                        metrics: '',
                        learnings: '',
                        companyTags: '',
                      });
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveStory} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-foreground">Story Headline / Title</label>
                    <input
                      type="text"
                      className="input text-xs"
                      placeholder="e.g. Scaling Database Connection Pooling Under 5x Peak Load"
                      value={storyForm.title}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Competency Category</label>
                    <select
                      className="select text-xs"
                      value={storyForm.category}
                      onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value })}
                    >
                      <option value="leadership">Leadership & Ownership</option>
                      <option value="failure">Overcoming Failure & Outages</option>
                      <option value="conflict">Constructive Conflict</option>
                      <option value="problem-solving">Problem Solving & Ambiguity</option>
                      <option value="teamwork">Teamwork & Cross-functional</option>
                      <option value="adaptability">Adaptability</option>
                    </select>
                  </div>
                </div>

                {/* S - T - A - R Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        S
                      </span>
                      Situation (Context, timeline, and core challenge)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="What was the business context, company state, or system problem? Keep concise (1-2 sentences)..."
                      value={storyForm.situation}
                      onChange={(e) => setStoryForm({ ...storyForm, situation: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        T
                      </span>
                      Task (Your specific personal objective)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="What was your exact personal responsibility? What did you need to achieve?"
                      value={storyForm.task}
                      onChange={(e) => setStoryForm({ ...storyForm, task: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                      A
                    </span>
                    Action (Crucial: Use "I", explain technical decisions, trade-offs, and execution)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="What specific steps did YOU take? (e.g. 'I instrumented Datadog metrics, discovered X, refactored Y using Z pattern, and negotiated with stakeholder W')..."
                    value={storyForm.action}
                    onChange={(e) => setStoryForm({ ...storyForm, action: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                      R
                    </span>
                    Result (Outcome, business impact, and resolution)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="What was the final outcome? Did you meet the deadline? What was the company value?"
                    value={storyForm.result}
                    onChange={(e) => setStoryForm({ ...storyForm, result: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">
                      Quantifiable Metrics (Numbers, %, latency drop, revenue)
                    </label>
                    <input
                      type="text"
                      className="input text-xs"
                      placeholder="e.g. 40% latency drop, 0 incidents over 6 months, $120K saved"
                      value={storyForm.metrics}
                      onChange={(e) => setStoryForm({ ...storyForm, metrics: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">
                      Target Company Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="input text-xs"
                      placeholder="e.g. Google, Amazon, Stripe"
                      value={storyForm.companyTags}
                      onChange={(e) => setStoryForm({ ...storyForm, companyTags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Key Learnings & Reflection</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Learned to always enforce lease timeouts and monitor connection pool leaks early."
                    value={storyForm.learnings}
                    onChange={(e) => setStoryForm({ ...storyForm, learnings: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isSavingStory}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold text-xs"
                  >
                    <Save size={13} />
                    <span>{isSavingStory ? 'Saving Story...' : editingStoryId ? 'Update Story' : 'Save Story'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Candidate's Saved Story Bank */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">My STAR Story Bank</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review and polish your arsenal of personal behavioral stories.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {stories.length} Stories Saved
                </span>
              </div>

              {storiesLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Loading your saved stories...
                </div>
              ) : stories.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-2">
                  <p>You haven't saved any STAR stories yet.</p>
                  <p className="text-foreground font-semibold">
                    Use the builder above or select a question below to draft your first story!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {stories.map((story) => {
                    const review = feedbackMap[story._id] || story.aiReview;
                    return (
                      <div
                        key={story._id}
                        className="card p-6 border border-border rounded-2xl space-y-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                                {story.category}
                              </span>
                              {story.companyTags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <h4 className="text-base font-bold text-foreground">{story.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRequestStoryFeedback(story._id)}
                              disabled={reviewingStoryId === story._id}
                              className="btn btn-outline btn-sm text-[11px] h-8 flex items-center gap-1"
                            >
                              <Sparkles size={12} className="text-primary" />
                              <span>{reviewingStoryId === story._id ? 'Analyzing...' : 'Evaluate Rubric'}</span>
                            </button>
                            <button
                              onClick={() => handleStartEdit(story)}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Edit Story"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteStory(story._id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              title="Delete Story"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* STAR breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                            <span className="font-bold text-foreground block">Situation:</span>
                            <p className="text-muted-foreground leading-relaxed">{story.situation}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                            <span className="font-bold text-foreground block">Task:</span>
                            <p className="text-muted-foreground leading-relaxed">{story.task}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1 md:col-span-2">
                            <span className="font-bold text-primary block">Action:</span>
                            <p className="text-foreground/90 leading-relaxed">{story.action}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1 md:col-span-2">
                            <span className="font-bold text-emerald-500 block">Result & Metrics:</span>
                            <p className="text-foreground/90 leading-relaxed">{story.result}</p>
                            {story.metrics && (
                              <p className="font-bold text-primary pt-1">📊 Impact: {story.metrics}</p>
                            )}
                          </div>
                        </div>

                        {/* Rubric Review Result */}
                        {review && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <Award size={14} className="text-primary" />
                                Rubric Evaluation
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-background border border-border font-bold text-primary text-[11px]">
                                  Clarity: {review.clarityScore}%
                                </span>
                                <span className="px-2 py-0.5 rounded bg-background border border-border font-bold text-emerald-500 text-[11px]">
                                  Impact: {review.impactScore}%
                                </span>
                              </div>
                            </div>

                            <p className="text-muted-foreground">{review.feedback}</p>

                            {review.strengths && review.strengths.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="font-bold text-emerald-500 text-[10px] uppercase">Strengths:</span>
                                {review.strengths.map((s: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {review.improvements && review.improvements.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="font-bold text-amber-500 text-[10px] uppercase">Areas to Polish:</span>
                                {review.improvements.map((imp: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                                    <AlertCircle size={11} className="text-amber-500 shrink-0" />
                                    <span>{imp}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Behavioral Question Bank */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Curated Behavioral Question Bank</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Common behavioral prompts asked by FAANG hiring committees with target competencies.
                  </p>
                </div>

                {/* Category filters */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="select text-xs py-1.5 px-3 h-9 bg-background border-border rounded-lg"
                >
                  <option value="all">All Competencies</option>
                  <option value="leadership">Leadership</option>
                  <option value="failure">Failure & Resilience</option>
                  <option value="conflict">Conflict Resolution</option>
                  <option value="problem-solving">Problem Solving</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q) => (
                  <div key={q._id} className="card p-5 border border-border rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                          {q.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Target: {q.targetCompetency}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground leading-relaxed">
                        "{q.prompt}"
                      </h4>
                    </div>

                    {/* Example STAR excerpt */}
                    {q.exampleSTAR && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border text-[11px] space-y-1">
                        <span className="font-bold text-primary block">Model Strategy:</span>
                        <p className="text-muted-foreground line-clamp-2">{q.exampleSTAR.action}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border flex items-center justify-end">
                      <button
                        onClick={() => {
                          setStoryForm((prev) => ({
                            ...prev,
                            title: `Response: ${q.prompt.substring(0, 50)}...`,
                            category: q.category,
                          }));
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="btn btn-outline btn-sm text-xs flex items-center gap-1 font-semibold"
                      >
                        <Plus size={13} />
                        <span>Draft Story for This</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: EXISTING STRATEGY LIBRARY & GUIDES */}
        {/* ============================================================== */}
        {activeMainTab === 'library' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="text-primary" /> Strategy Library
              </h2>
            </div>

            {tipsLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tips.map((tip) => (
                  <div key={tip._id} className="card card-hover flex flex-col h-full p-6 border border-border rounded-2xl">
                    <div className="mb-4">
                      <span className="badge badge-primary capitalize mb-2">{tip.category}</span>
                      <h3 className="text-lg font-bold">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                        {tip.content}
                      </p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between text-sm border-t border-border">
                      <span className="text-muted-foreground capitalize text-xs">
                        {tip.difficulty || 'All Levels'}
                      </span>
                      <span className="flex items-center text-primary font-medium text-xs">
                        Read Guide <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: EXISTING AI INTERVIEW COACH */}
        {/* ============================================================== */}
        {activeMainTab === 'coach' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card card-gradient border-primary/20 p-6 md:p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BrainCircuit className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Interview Coach</h2>
                  <p className="text-muted-foreground text-sm">Generate a personalized preparation roadmap</p>
                </div>
              </div>

              <form onSubmit={generateRoadmap} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="label text-xs">Target Role</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Frontend Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Experience Level</label>
                  <select
                    className="select text-xs"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="Junior">Junior (0-2 years)</option>
                    <option value="Mid">Mid-Level (3-5 years)</option>
                    <option value="Senior">Senior (5+ years)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn btn-primary w-full text-xs font-semibold" disabled={coachLoading}>
                    {coachLoading ? 'Generating...' : 'Generate Roadmap'}
                  </button>
                </div>
              </form>

              {roadmap && (
                <div className="mt-8 pt-8 border-t border-border animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4 text-gradient">Your Preparation Roadmap</h3>
                  <div className="space-y-4 mb-6">
                    {roadmap.roadmap?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">
                              {item.week}
                            </span>
                            <h4 className="font-semibold text-base">{item.topic}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{item.focus}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-semibold mb-3 text-sm">Expected Questions to Practice:</h4>
                  <ul className="space-y-2">
                    {roadmap.expectedQuestions?.map((q: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Target size={14} className="text-primary mt-0.5 shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewTipsPage;
