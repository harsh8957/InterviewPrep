import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface RoundInput {
  roundNumber: number;
  roundName: string;
  roundType: 'oa' | 'technical_screen' | 'onsite_coding' | 'system_design' | 'behavioral' | 'hiring_manager';
  durationMinutes: number;
  questionsSummary: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionInput {
  questionText: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const PRESET_COMPANIES = [
  { name: 'Google', slug: 'google' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'Meta', slug: 'meta' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Uber', slug: 'uber' },
  { name: 'Stripe', slug: 'stripe' },
];

export const ExperienceSubmitPage: React.FC = () => {
  // Basic Details
  const [selectedCompany, setSelectedCompany] = useState('google');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'fresher' | 'junior' | 'mid-level' | 'senior' | 'lead'>('mid-level');
  const [interviewYear, setInterviewYear] = useState<number>(2025);
  const [interviewSeason, setInterviewSeason] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Spring' | 'Summer' | 'Fall' | 'Winter'>('Summer');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [outcome, setOutcome] = useState<'Offer' | 'Rejected' | 'Pending' | 'Withdrawn' | 'Declined Offer'>('Offer');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [candidateHandle, setCandidateHandle] = useState('Anonymous Candidate');

  // Rounds
  const [rounds, setRounds] = useState<RoundInput[]>([
    {
      roundNumber: 1,
      roundName: 'Round 1: Technical Screen',
      roundType: 'onsite_coding',
      durationMinutes: 45,
      questionsSummary: '',
      difficulty: 'medium',
    },
  ]);

  // Questions
  const [questions, setQuestions] = useState<QuestionInput[]>([]);

  // Preparation & Timeline
  const [preparationTips, setPreparationTips] = useState('');
  const [timelineNotes, setTimelineNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submittedExperienceId, setSubmittedExperienceId] = useState<string | null>(null);

  const addRound = () => {
    setRounds(prev => [
      ...prev,
      {
        roundNumber: prev.length + 1,
        roundName: `Round ${prev.length + 1}: Technical Interview`,
        roundType: 'onsite_coding',
        durationMinutes: 45,
        questionsSummary: '',
        difficulty: 'medium',
      },
    ]);
  };

  const removeRound = (index: number) => {
    if (rounds.length <= 1) return;
    setRounds(prev => prev.filter((_, idx) => idx !== index).map((r, i) => ({ ...r, roundNumber: i + 1 })));
  };

  const updateRound = (index: number, updates: Partial<RoundInput>) => {
    setRounds(prev => prev.map((r, idx) => (idx === index ? { ...r, ...updates } : r)));
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { questionText: '', topic: 'Algorithms', difficulty: 'medium' },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionInput>) => {
    setQuestions(prev => prev.map((q, idx) => (idx === index ? { ...q, ...updates } : q)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setViolations([]);
    setError(null);

    const compName = selectedCompany === 'custom' ? customCompanyName.trim() : PRESET_COMPANIES.find(c => c.slug === selectedCompany)?.name || selectedCompany;
    const compSlug = selectedCompany === 'custom' ? customCompanyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') : selectedCompany;

    if (!compName) {
      setError('Please provide a company name.');
      return;
    }

    if (!role.trim()) {
      setError('Please provide the job role.');
      return;
    }

    if (preparationTips.trim().length < 20) {
      setError('Preparation tips must be at least 20 characters.');
      return;
    }

    for (let i = 0; i < rounds.length; i++) {
      if (!rounds[i].questionsSummary.trim()) {
        setError(`Please fill in the questions summary for Round ${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        companyName: compName,
        companySlug: compSlug,
        role: role.trim(),
        experienceLevel,
        interviewYear,
        interviewSeason,
        difficulty,
        outcome,
        isAnonymous,
        candidateHandle: isAnonymous ? (candidateHandle.trim() || 'Anonymous Candidate') : undefined,
        rounds,
        questions: questions.filter(q => q.questionText.trim().length > 0),
        preparationTips: preparationTips.trim(),
        timelineNotes: timelineNotes.trim() || undefined,
      };

      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setSubmittedExperienceId(data.experienceId);
      } else {
        if (data?.violations) {
          setViolations(data.violations);
        } else {
          setError(data?.message || 'Failed to submit experience. Please check your inputs.');
        }
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError('Failed to submit experience. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedExperienceId) {
    return (
      <div className="card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 animate-fade-in my-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Interview Experience Submitted!</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Thank you for contributing to the community! Your interview loop has been received and is currently in <strong>pending review</strong>.
            Once verified by moderators for confidentiality and quality, it will be published to the public catalog.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-foreground/80 text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-semibold text-amber-500">Pending Moderation</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Privacy:</span>
            <span>{isAnonymous ? 'Anonymous' : 'Public Handle'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rounds Logged:</span>
            <span>{rounds.length} stages</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to={`/experiences/${submittedExperienceId}`} className="btn btn-primary btn-sm">
            View Your Submission
          </Link>
          <Link to="/experiences" className="btn btn-outline btn-sm">
            Back to Experiences
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        to="/experiences"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Experiences Feed</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <ShieldCheck size={13} />
              Community Contribution
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Share Your Interview Loop Experience
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Help fellow developers prepare by sharing a detailed, anonymized debrief of your interview stages.
          </p>
        </div>
      </div>

      {/* PII & Privacy Guidelines Alert */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-start gap-3">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-foreground/85">
          <strong className="text-primary font-semibold block">Privacy & PII Protection Guidelines:</strong>
          <p>
            Do <strong>NOT</strong> include personal names of interviewers, recruiters, or colleagues. Do not share personal emails, phone numbers, or proprietary code.
            All submissions start as pending and are screened by our automated PII validator before publication.
          </p>
        </div>
      </div>

      {/* Error or PII Violation Banner */}
      {violations.length > 0 && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold text-xs">
            <AlertTriangle size={16} />
            <span>PII Protection Violations Detected</span>
          </div>
          <ul className="text-xs text-destructive/90 space-y-1 list-disc pl-5">
            {violations.map((v, idx) => (
              <li key={idx}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Information */}
        <div className="card p-6 space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <Building2 size={16} className="text-primary" />
            1. Company & Role Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Company *</label>
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                className="input text-xs w-full"
              >
                {PRESET_COMPANIES.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
                <option value="custom">Other / Custom Company</option>
              </select>
            </div>

            {selectedCompany === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company Name *</label>
                <input
                  type="text"
                  value={customCompanyName}
                  onChange={e => setCustomCompanyName(e.target.value)}
                  placeholder="E.g., Datadog, Snowflake, Coinbase..."
                  className="input text-xs w-full"
                  required
                />
              </div>
            )}

            {/* Role Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Role *</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="E.g., Software Engineer (L4), Frontend Engineer..."
                className="input text-xs w-full"
                required
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Experience Level *</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as any)}
                className="input text-xs w-full"
              >
                <option value="fresher">Fresher / Campus Graduate (0 years)</option>
                <option value="junior">Junior Engineer (1-2 years)</option>
                <option value="mid-level">Mid-Level Engineer (3-5 years)</option>
                <option value="senior">Senior Engineer (5-8 years)</option>
                <option value="lead">Staff / Lead Engineer (8+ years)</option>
              </select>
            </div>

            {/* Interview Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Interview Year *</label>
              <select
                value={interviewYear}
                onChange={e => setInterviewYear(parseInt(e.target.value, 10))}
                className="input text-xs w-full"
              >
                {[2026, 2025, 2024, 2023, 2022, 2021].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Season / Quarter *</label>
              <select
                value={interviewSeason}
                onChange={e => setInterviewSeason(e.target.value as any)}
                className="input text-xs w-full"
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            {/* Overall Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Overall Difficulty *</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="input text-xs w-full"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Outcome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Final Outcome *</label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as any)}
                className="input text-xs w-full"
              >
                <option value="Offer">Offer Received</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending / In Progress</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="Declined Offer">Declined Offer</option>
              </select>
            </div>

            {/* Anonymity */}
            <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-lg bg-card/60 border border-border">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Submit Anonymously (Recommended)</span>
              </label>

              {isAnonymous && (
                <div className="pt-2">
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Display Handle:
                  </label>
                  <input
                    type="text"
                    value={candidateHandle}
                    onChange={e => setCandidateHandle(e.target.value)}
                    placeholder="E.g., Anonymous Candidate, L4 Backend Eng..."
                    className="input text-xs w-full max-w-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Rounds Builder */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              2. Interview Stages & Rounds ({rounds.length})
            </h2>

            <button
              type="button"
              onClick={addRound}
              className="btn btn-outline btn-xs flex items-center gap-1 font-semibold"
            >
              <Plus size={13} />
              <span>Add Stage</span>
            </button>
          </div>

          <div className="space-y-4">
            {rounds.map((round, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-card/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary text-xs font-bold">
                      {round.roundNumber}
                    </span>
                    <input
                      type="text"
                      value={round.roundName}
                      onChange={e => updateRound(idx, { roundName: e.target.value })}
                      placeholder="E.g., Round 1: Online Assessment"
                      className="input text-xs py-1 px-2.5 font-semibold w-64"
                      required
                    />
                  </div>

                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(idx)}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
                    <select
                      value={round.roundType}
                      onChange={e => updateRound(idx, { roundType: e.target.value as any })}
                      className="input text-xs w-full"
                    >
                      <option value="oa">Online Assessment (OA)</option>
                      <option value="technical_screen">Phone / Video Screen</option>
                      <option value="onsite_coding">Onsite Coding / DSA</option>
                      <option value="system_design">System Design</option>
                      <option value="behavioral">Behavioral / Leadership</option>
                      <option value="hiring_manager">Hiring Manager / Bar Raiser</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Duration (Mins)</label>
                    <input
                      type="number"
                      value={round.durationMinutes}
                      onChange={e => updateRound(idx, { durationMinutes: parseInt(e.target.value, 10) || 45 })}
                      className="input text-xs w-full"
                      min={15}
                      max={180}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Difficulty</label>
                    <select
                      value={round.difficulty}
                      onChange={e => updateRound(idx, { difficulty: e.target.value as any })}
                      className="input text-xs w-full"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    What was asked in this round? *
                  </label>
                  <textarea
                    value={round.questionsSummary}
                    onChange={e => updateRound(idx, { questionsSummary: e.target.value })}
                    placeholder="Describe the algorithmic problems, design task, or behavioral questions asked. Do not mention interviewer names."
                    rows={3}
                    className="input text-xs w-full resize-none"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Specific Questions (Optional) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-foreground">
                3. Specific Questions Asked (Optional)
              </h2>
              <span className="text-xs text-muted-foreground">Add specific problem statements or topics</span>
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-outline btn-xs flex items-center gap-1 font-semibold"
            >
              <Plus size={13} />
              <span>Add Question</span>
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No specific questions added yet. Click "+ Add Question" if you'd like to list individual problem prompts.
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-border bg-card/60 flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={e => updateQuestion(idx, { questionText: e.target.value })}
                      placeholder="E.g., Find the longest substring with at most k distinct characters..."
                      className="input text-xs w-full"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={q.topic}
                        onChange={e => updateQuestion(idx, { topic: e.target.value })}
                        placeholder="Topic (e.g., Sliding Window, Graphs)"
                        className="input text-xs py-1 px-2 w-48"
                      />
                      <select
                        value={q.difficulty}
                        onChange={e => updateQuestion(idx, { difficulty: e.target.value as any })}
                        className="input text-xs py-1 px-2 w-28"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Preparation Tips & Advice */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground pb-2 border-b border-border">
            4. Preparation Advice & Timeline Notes
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Preparation Tips & High-Yield Strategy * (Min 20 characters)
            </label>
            <textarea
              value={preparationTips}
              onChange={e => setPreparationTips(e.target.value)}
              placeholder="What topics should future candidates focus on? What resources helped you most? What would you do differently?"
              rows={4}
              className="input text-xs w-full resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Timeline & Communication Milestones (Optional)
            </label>
            <input
              type="text"
              value={timelineNotes}
              onChange={e => setTimelineNotes(e.target.value)}
              placeholder="E.g., Recruiter screen on Monday, OA 3 days later, Onsite loop 2 weeks later..."
              className="input text-xs w-full"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/experiences" className="btn btn-outline btn-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold"
          >
            {submitting ? 'Validating & Submitting...' : 'Submit for Moderation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExperienceSubmitPage;
