import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Database,
  Network,
  Boxes,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw,
  Sparkles,
  Award,
  BookOpen,
  Layers,
  ArrowRight,
  ArrowLeft,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

type CoreCSSubject = 'os' | 'dbms' | 'cn' | 'oop';
type PracticeMode = 'study' | 'quiz' | 'flashcards';

interface SubjectInfo {
  id: CoreCSSubject;
  title: string;
  description: string;
  icon: string;
  totalQuestions: number;
  totalTopics: number;
  topics: string[];
  solvedCount: number;
  attemptedCount: number;
  masteryPercentage: number;
}

interface QuizItem {
  _id: string;
  subject: CoreCSSubject;
  topic: string;
  slug: string;
  title: string;
  format: 'mcq' | 'scenario' | 'flashcard';
  difficulty: 'easy' | 'medium' | 'hard';
  conceptExplanation: string;
  prompt: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  flashcardBack?: string;
  keyTakeaway: string;
  interviewTips?: string;
  order: number;
  hasAttempted?: boolean;
  userAttempt?: {
    isCorrect: boolean;
    selectedOption: number;
    attemptCount: number;
  } | null;
}

interface GradeResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
  keyTakeaway: string;
  conceptExplanation: string;
  interviewTips?: string;
  attemptCount: number;
}

const SUBJECT_CONFIG: Record<
  CoreCSSubject,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  os: { icon: Cpu, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  dbms: { icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  cn: { icon: Network, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  oop: { icon: Boxes, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

export const CoreCSPage: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<CoreCSSubject>('os');
  const [activeMode, setActiveMode] = useState<PracticeMode>('quiz');
  const [items, setItems] = useState<QuizItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Quiz state: map of itemId -> selected option index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  // Quiz state: map of itemId -> GradeResult
  const [gradeResults, setGradeResults] = useState<Record<string, GradeResult>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 1. Fetch Subjects Overview
  const fetchSubjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/core-cs/subjects`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects overview:', err);
    }
  }, [API_URL]);

  // 2. Fetch Items for Subject
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (selectedTopic !== 'all') params.append('topic', selectedTopic);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);

      const res = await fetch(`${API_URL}/api/core-cs/${selectedSubject}/items?${params.toString()}`, { headers });
      if (res.ok) {
        const data: QuizItem[] = await res.json();
        setItems(data);

        // Populate previously solved results
        const existingResults: Record<string, GradeResult> = {};
        const existingSelections: Record<string, number> = {};

        data.forEach((item) => {
          if (item.userAttempt) {
            existingSelections[item._id] = item.userAttempt.selectedOption;
            if (item.explanation !== undefined && item.correctAnswerIndex !== undefined) {
              existingResults[item._id] = {
                isCorrect: item.userAttempt.isCorrect,
                correctAnswerIndex: item.correctAnswerIndex,
                explanation: item.explanation,
                keyTakeaway: item.keyTakeaway,
                conceptExplanation: item.conceptExplanation,
                interviewTips: item.interviewTips,
                attemptCount: item.userAttempt.attemptCount,
              };
            }
          }
        });

        setSelectedAnswers(existingSelections);
        setGradeResults(existingResults);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error('Failed to fetch subject items:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedSubject, selectedTopic, difficultyFilter]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const currentSubjectInfo = subjects.find((s) => s.id === selectedSubject);

  // Submit Answer for Server-Side Grading
  const handleSubmitAnswer = async (itemId: string) => {
    const selectedOption = selectedAnswers[itemId];
    if (selectedOption === undefined) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to submit your answer and record your progress.');
      return;
    }

    setSubmittingItemId(itemId);
    try {
      const res = await fetch(`${API_URL}/api/core-cs/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          selectedOption,
          timeSpentSeconds: 15,
        }),
      });

      if (res.ok) {
        const data: GradeResult = await res.json();
        setGradeResults((prev) => ({ ...prev, [itemId]: data }));
        fetchSubjects(); // Refresh progress counter
      }
    } catch (err) {
      console.error('Failed to grade attempt:', err);
    } finally {
      setSubmittingItemId(null);
    }
  };

  // Filter items for flashcard mode
  const flashcardItems = items.filter((i) => i.format === 'flashcard' || i.keyTakeaway);
  const activeFlashcard = flashcardItems[currentCardIndex];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={12} />
              Interactive CS Engineering Curriculum
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Core Computer Science Fundamentals
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Master the core theoretical pillars tested across top engineering companies: Operating Systems,
            Databases, Networking, and Object-Oriented Architecture.
          </p>
        </div>

        {currentSubjectInfo && (
          <div className="flex items-center gap-3 bg-muted/40 border border-border p-3 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {currentSubjectInfo.title.split('&')[0]} Mastery
              </span>
              <span className="text-lg font-black text-foreground">
                {currentSubjectInfo.solvedCount} / {currentSubjectInfo.totalQuestions} Solved
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
              {currentSubjectInfo.masteryPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* Subject Domain Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['os', 'dbms', 'cn', 'oop'] as CoreCSSubject[]).map((subjId) => {
          const config = SUBJECT_CONFIG[subjId];
          const Icon = config.icon;
          const isSelected = selectedSubject === subjId;
          const sInfo = subjects.find((s) => s.id === subjId);

          return (
            <button
              key={subjId}
              onClick={() => {
                setSelectedSubject(subjId);
                setSelectedTopic('all');
              }}
              className={cn(
                'card p-5 text-left transition-all duration-200 border rounded-2xl relative overflow-hidden',
                isSelected
                  ? cn('border-primary/60 bg-primary/5 shadow-md ring-1 ring-primary/30', config.border)
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', config.bg, config.color)}>
                  <Icon size={22} />
                </div>
                {sInfo && sInfo.totalQuestions > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {sInfo.solvedCount}/{sInfo.totalQuestions}
                  </span>
                )}
              </div>

              <h3 className={cn('text-sm font-bold leading-tight', isSelected ? 'text-primary' : 'text-foreground')}>
                {sInfo?.title || subjId.toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {sInfo?.description}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-muted/60 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${sInfo?.masteryPercentage || 0}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Practice Console */}
      <div className="card p-6 border border-border rounded-2xl space-y-6">
        {/* Navigation Mode Switcher & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border w-fit">
            <button
              onClick={() => setActiveMode('quiz')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeMode === 'quiz' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <HelpCircle size={14} />
              <span>Interactive Quiz & Scenarios</span>
            </button>
            <button
              onClick={() => setActiveMode('study')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeMode === 'study' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen size={14} />
              <span>Concept Review</span>
            </button>
            <button
              onClick={() => setActiveMode('flashcards')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeMode === 'flashcards' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers size={14} />
              <span>Flashcards Deck</span>
            </button>
          </div>

          {/* Topic & Difficulty Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentSubjectInfo?.topics && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="select text-xs py-1.5 px-3 h-9 bg-background border-border rounded-lg"
              >
                <option value="all">All Curriculum Topics</option>
                {currentSubjectInfo.topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="select text-xs py-1.5 px-3 h-9 bg-background border-border rounded-lg"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* MODE 1: INTERACTIVE QUIZ & SCENARIO DRILL */}
        {activeMode === 'quiz' && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground text-sm animate-pulse">
                Loading curriculum items...
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No questions found for the selected topic filter.
              </div>
            ) : (
              items.map((item, idx) => {
                const selectedOpt = selectedAnswers[item._id];
                const grade = gradeResults[item._id];
                const isSubmitting = submittingItemId === item._id;

                return (
                  <div
                    key={item._id}
                    className={cn(
                      'p-6 rounded-2xl border transition-all space-y-4',
                      grade?.isCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : grade && !grade.isCorrect
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-border bg-card'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                            {item.topic}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded capitalize',
                              item.difficulty === 'easy'
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : item.difficulty === 'medium'
                                ? 'text-amber-500 bg-amber-500/10'
                                : 'text-destructive bg-destructive/10'
                            )}
                          >
                            {item.difficulty}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {item.format === 'scenario' ? 'Real-world Scenario' : 'Multiple Choice'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground pt-1">
                          {idx + 1}. {item.title}
                        </h4>
                      </div>

                      {grade && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0',
                            grade.isCorrect
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : 'bg-destructive/15 text-destructive border border-destructive/30'
                          )}
                        >
                          {grade.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          <span>{grade.isCorrect ? 'Correct' : 'Needs Review'}</span>
                        </div>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                      {item.prompt}
                    </p>

                    {/* Options Grid */}
                    {item.options && item.options.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {item.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrectOption = grade?.correctAnswerIndex === optIdx;
                          const isWrongSelection = grade && isSelected && !grade.isCorrect;

                          return (
                            <button
                              key={optIdx}
                              disabled={Boolean(grade?.isCorrect) || isSubmitting}
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [item._id]: optIdx }))}
                              className={cn(
                                'w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-start gap-3',
                                isCorrectOption
                                  ? 'border-emerald-500 bg-emerald-500/15 text-foreground ring-1 ring-emerald-500'
                                  : isWrongSelection
                                  ? 'border-destructive bg-destructive/15 text-foreground'
                                  : isSelected
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30 text-muted-foreground'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border',
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-muted/60'
                                )}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {grade?.attemptCount ? `Attempts: ${grade.attemptCount}` : 'Not yet attempted'}
                      </div>

                      {/* Only show submit if not already solved correctly */}
                      {!grade?.isCorrect && item.options && item.options.length > 0 && (
                        <button
                          disabled={selectedOpt === undefined || isSubmitting}
                          onClick={() => handleSubmitAnswer(item._id)}
                          className="btn btn-primary btn-sm text-xs font-semibold"
                        >
                          {isSubmitting ? 'Verifying...' : grade ? 'Try Again' : 'Check Answer'}
                        </button>
                      )}
                    </div>

                    {/* Official Explanation (Revealed only after submission) */}
                    {grade && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs space-y-2">
                          <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <BookOpen size={13} className="text-primary" />
                            Official Explanation
                          </span>
                          <p className="text-muted-foreground leading-relaxed">
                            {grade.explanation}
                          </p>
                        </div>

                        {grade.keyTakeaway && (
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-2">
                            <Award size={15} className="text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-foreground">Key Takeaway: </span>
                              <span className="text-muted-foreground">{grade.keyTakeaway}</span>
                            </div>
                          </div>
                        )}

                        {grade.interviewTips && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs flex items-start gap-2">
                            <HelpCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-foreground">Interview Follow-up Tip: </span>
                              <span className="text-muted-foreground">{grade.interviewTips}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MODE 2: CONCEPT REVIEW & STUDY MODE */}
        {activeMode === 'study' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {items.map((item, idx) => (
                <div key={item._id} className="card p-6 border border-border rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Module {idx + 1} • {item.topic}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold capitalize">
                      {item.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                    {item.conceptExplanation}
                  </div>

                  {item.keyTakeaway && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-2">
                      <Award size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground">Core Principle: </span>
                        <span className="text-muted-foreground">{item.keyTakeaway}</span>
                      </div>
                    </div>
                  )}

                  {item.interviewTips && (
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs flex items-start gap-2">
                      <HelpCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground">Interview Discussion Angle: </span>
                        <span className="text-muted-foreground">{item.interviewTips}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 3: FLASHCARDS DECK MODE */}
        {activeMode === 'flashcards' && (
          <div className="max-w-xl mx-auto py-8 space-y-6">
            {flashcardItems.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No flashcards available for this topic.
              </div>
            ) : activeFlashcard ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>Card {currentCardIndex + 1} of {flashcardItems.length}</span>
                  <span className="capitalize">{activeFlashcard.topic}</span>
                </div>

                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[260px] p-8 rounded-3xl border border-border bg-card shadow-lg hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between select-none relative group"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px]">
                      {isFlipped ? 'Answer & Breakdown' : 'Prompt Question'}
                    </span>
                    <span className="text-[11px] flex items-center gap-1 group-hover:text-primary transition-colors">
                      <RotateCw size={12} />
                      Click or tap to flip
                    </span>
                  </div>

                  <div className="my-auto py-6">
                    {isFlipped ? (
                      <div className="space-y-3 animate-fade-in">
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-line">
                          {activeFlashcard.flashcardBack || activeFlashcard.explanation || activeFlashcard.conceptExplanation}
                        </p>
                        {activeFlashcard.keyTakeaway && (
                          <div className="pt-2 border-t border-border text-[11px] text-primary font-bold">
                            💡 {activeFlashcard.keyTakeaway}
                          </div>
                        )}
                      </div>
                    ) : (
                      <h3 className="text-base font-bold text-foreground text-center leading-relaxed">
                        {activeFlashcard.prompt}
                      </h3>
                    )}
                  </div>

                  <div className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {isFlipped ? 'Click again to view question' : 'Click card to reveal answer'}
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex((prev) => prev - 1);
                      setIsFlipped(false);
                    }}
                    className="btn btn-outline btn-sm text-xs flex items-center gap-1"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                  >
                    <RotateCw size={13} />
                    <span>Flip Card</span>
                  </button>

                  <button
                    disabled={currentCardIndex >= flashcardItems.length - 1}
                    onClick={() => {
                      setCurrentCardIndex((prev) => prev + 1);
                      setIsFlipped(false);
                    }}
                    className="btn btn-outline btn-sm text-xs flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoreCSPage;
