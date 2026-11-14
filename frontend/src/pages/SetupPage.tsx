import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase as BriefcaseBusiness, GraduationCap, Code, Brain, Palette, Database,
  AlertCircle, CheckCircle, ChevronRight, Terminal, Server, Layers, Network,
  Cpu, FileText, UserCheck, UploadCloud, Clock, Sparkles, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  useInterview,
  JobRole,
  ExperienceLevel,
  InterviewMode,
  InterviewDifficulty,
} from '../contexts/InterviewContext';
import { cn } from '../lib/utils';

interface ModeOption {
  id: InterviewMode;
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface RoleCardProps {
  id: JobRole;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
}

const RoleCard = ({ title, icon, description, color, selected, onSelect }: RoleCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "relative text-left p-4 rounded-xl border-2 transition-all duration-200 group",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      selected
        ? "border-primary bg-primary/5 shadow-glow-primary"
        : "border-border bg-card hover:border-primary/40 hover:shadow-card-hover hover:-translate-y-0.5"
    )}
    aria-pressed={selected}
  >
    {selected && (
      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <CheckCircle size={12} className="text-white" />
      </div>
    )}
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-lg mb-3 text-white transition-all duration-200",
      color,
      selected ? "shadow-md" : "group-hover:scale-105"
    )}>
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
  </button>
);

const SetupPage = () => {
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('fullstack');
  const [selectedRole, setSelectedRole] = useState<JobRole | null>('web-developer');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>('mid-level');
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewDifficulty>('adaptive');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [attachResume, setAttachResume] = useState<boolean>(false);
  const [resumeProfile, setResumeProfile] = useState<any>(null);
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { setConfig, startInterview } = useInterview();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  // Load existing parsed resume profile
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      window.history.replaceState({}, document.title);
    }

    const fetchResumeProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/resume/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setResumeProfile(data);
            setAttachResume(true);
          }
        }
      } catch (err) {
        console.warn('Could not load resume profile:', err);
      }
    };

    fetchResumeProfile();
  }, [user, navigate, location, API_BASE_URL]);

  // Handle instant resume upload
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Please upload a PDF document (.pdf)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploadingResume(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetRole', selectedRole || 'Full-Stack Software Engineer');

      const res = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload and parse resume');
      }

      setResumeProfile(data.profile);
      setAttachResume(true);
    } catch (err: any) {
      setResumeError(err.message || 'Failed to parse resume');
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/resume/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumeProfile(null);
      setAttachResume(false);
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  const handleStartInterview = async () => {
    setErrorMessage('');
    if (!selectedRole) { setErrorMessage('Please select a target job role.'); return; }
    if (!selectedLevel) { setErrorMessage('Please select an experience level.'); return; }

    const isResumeMode = selectedMode === 'resume-deep-dive';
    const useResume = isResumeMode || (attachResume && Boolean(resumeProfile));

    setConfig({
      jobRole: selectedRole,
      experienceLevel: selectedLevel,
      interviewMode: selectedMode,
      difficulty: selectedDifficulty,
      durationMinutes: selectedDuration,
      useResumeProfile: useResume,
    });

    try {
      setIsRequestingMedia(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        await startInterview({
          mediaStream,
          jobRole: selectedRole,
          experienceLevel: selectedLevel,
          interviewMode: selectedMode,
          difficulty: selectedDifficulty,
          durationMinutes: selectedDuration,
          useResumeProfile: useResume,
        });
        navigate('/interview');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (window.confirm('Unable to access camera or microphone. Would you like to continue in audio/text mode?')) {
          await startInterview({
            jobRole: selectedRole,
            experienceLevel: selectedLevel,
            interviewMode: selectedMode,
            difficulty: selectedDifficulty,
            durationMinutes: selectedDuration,
            useResumeProfile: useResume,
          });
          navigate('/interview');
        } else {
          setErrorMessage('Interview requires camera and microphone permissions to proceed.');
        }
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setErrorMessage('Failed to start interview. Please check your network and try again.');
    } finally {
      setIsRequestingMedia(false);
    }
  };

  const interviewModes: ModeOption[] = [
    {
      id: 'dsa',
      title: 'DSA Coding Round',
      badge: 'Code + Complexity',
      icon: <Terminal size={20} />,
      description: 'Algorithm design, data structures, Big-O analysis, and live coding evaluation.',
      color: 'bg-emerald-600',
    },
    {
      id: 'backend',
      title: 'Backend Systems',
      badge: 'APIs & Scaling',
      icon: <Server size={20} />,
      description: 'REST architecture, database indexing, caching strategies, concurrency, and locks.',
      color: 'bg-indigo-600',
    },
    {
      id: 'fullstack',
      title: 'Full-Stack Engineering',
      badge: 'End-to-End',
      icon: <Layers size={20} />,
      description: 'Client state, server rendering, API integration, auth flow, and web security.',
      color: 'bg-blue-600',
    },
    {
      id: 'system-design',
      title: 'System Design',
      badge: 'Architecture',
      icon: <Network size={20} />,
      description: 'High-level architectures, load balancing, sharding, caching, and distributed trade-offs.',
      color: 'bg-purple-600',
    },
    {
      id: 'core-cs',
      title: 'Core Computer Science',
      badge: 'Foundations',
      icon: <Cpu size={20} />,
      description: 'Operating systems (processes/deadlocks), DBMS (ACID), computer networks (TCP/IP), and OOP.',
      color: 'bg-amber-600',
    },
    {
      id: 'resume-deep-dive',
      title: 'Resume Deep-Dive',
      badge: 'Project Proof',
      icon: <FileText size={20} />,
      description: 'Questions targeted specifically at your verified projects, claimed stack, and technical achievements.',
      color: 'bg-rose-600',
    },
    {
      id: 'behavioral',
      title: 'Behavioral & Leadership',
      badge: 'STAR Method',
      icon: <UserCheck size={20} />,
      description: 'Competency questions using STAR format: ownership, conflict resolution, and teamwork.',
      color: 'bg-teal-600',
    },
  ];

  const jobRoles = [
    {
      id: 'web-developer' as JobRole,
      title: 'Web Developer',
      icon: <Code size={20} />,
      description: 'Frontend, backend, and full-stack web applications',
      color: 'bg-blue-600',
    },
    {
      id: 'app-developer' as JobRole,
      title: 'App Developer',
      icon: <BriefcaseBusiness size={20} />,
      description: 'Mobile and cross-platform native application development',
      color: 'bg-violet-600',
    },
    {
      id: 'ml-ai' as JobRole,
      title: 'ML & AI Engineer',
      icon: <Brain size={20} />,
      description: 'Machine learning, generative models, and data pipelines',
      color: 'bg-rose-600',
    },
    {
      id: 'ux-designer' as JobRole,
      title: 'UX Designer',
      icon: <Palette size={20} />,
      description: 'Design systems, accessibility, and user research',
      color: 'bg-orange-600',
    },
    {
      id: 'data-scientist' as JobRole,
      title: 'Data Scientist',
      icon: <Database size={20} />,
      description: 'Analytics, statistical modeling, and data visualization',
      color: 'bg-teal-600',
    },
  ];

  const experienceLevels = [
    { id: 'fresher' as ExperienceLevel, title: 'Fresher / Entry', badge: '0–1 Yrs', color: 'badge-success' },
    { id: 'junior' as ExperienceLevel, title: 'Junior', badge: '1–3 Yrs', color: 'badge-primary' },
    { id: 'mid-level' as ExperienceLevel, title: 'Mid-Level', badge: '3–5 Yrs', color: 'badge-warning' },
    { id: 'senior' as ExperienceLevel, title: 'Senior / Lead', badge: '5+ Yrs', color: 'badge-destructive' },
  ];

  const difficulties: { id: InterviewDifficulty; label: string; desc: string }[] = [
    { id: 'easy', label: 'Standard / Easy', desc: 'Core fundamentals & direct questions' },
    { id: 'medium', label: 'Intermediate', desc: 'Practical trade-offs & edge cases' },
    { id: 'hard', label: 'Advanced', desc: 'Deep optimizations & complex architectures' },
    { id: 'adaptive', label: 'Adaptive (Dynamic)', desc: 'Scales up or down based on your answers' },
  ];

  return (
    <div className="page-transition container-content py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="badge badge-primary mb-3 mx-auto flex items-center gap-1.5 w-fit">
          <Sparkles size={14} /> AI Mock Interview Setup
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Configure Your <span className="text-gradient">Interview Session</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Tailor interview format, role, difficulty, and optional resume context for realistic technical practice.
        </p>
      </div>

      {/* Step 1: Mode Selection */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="text-lg font-semibold text-foreground">Select Interview Mode</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {interviewModes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all group relative',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5'
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn('p-2 rounded-lg text-white', mode.color)}>
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-none">{mode.title}</h3>
                    <span className="text-[11px] text-primary font-medium">{mode.badge}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{mode.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Target Role */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</span>
          <h2 className="text-lg font-semibold text-foreground">Target Role</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {jobRoles.map((role) => (
            <RoleCard
              key={role.id}
              id={role.id}
              title={role.title}
              icon={role.icon}
              description={role.description}
              color={role.color}
              selected={selectedRole === role.id}
              onSelect={() => setSelectedRole(role.id)}
            />
          ))}
        </div>
      </div>

      {/* Step 3: Experience Level & Difficulty & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Experience Level */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">3</span>
            <h3 className="text-base font-semibold text-foreground">Experience Level</h3>
          </div>
          <div className="space-y-2">
            {experienceLevels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all',
                  selectedLevel === lvl.id
                    ? 'border-primary bg-primary/5 font-semibold text-primary'
                    : 'border-border bg-card hover:border-primary/40 text-foreground'
                )}
              >
                <span>{lvl.title}</span>
                <span className={cn('badge text-[11px]', lvl.color)}>{lvl.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">4</span>
            <h3 className="text-base font-semibold text-foreground">Difficulty</h3>
          </div>
          <div className="space-y-2">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setSelectedDifficulty(diff.id)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg border text-xs transition-all',
                  selectedDifficulty === diff.id
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <div className="font-semibold text-foreground">{diff.label}</div>
                <div className="text-muted-foreground text-[11px]">{diff.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">5</span>
            <h3 className="text-base font-semibold text-foreground">Session Duration</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedDuration(mins)}
                className={cn(
                  'flex items-center justify-center gap-1.5 p-4 rounded-lg border text-sm font-semibold transition-all',
                  selectedDuration === mins
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 text-foreground'
                )}
              >
                <Clock size={16} /> {mins} Mins
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 4: Resume Context & Upload */}
      <div className="mb-10 p-5 rounded-2xl border border-border bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Resume Context
              {selectedMode === 'resume-deep-dive' && (
                <span className="badge badge-primary text-[10px]">Required for Mode</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Attach your verified projects, technologies, and achievements so questions reference your real work.
            </p>
          </div>
          {resumeProfile && (
            <button
              type="button"
              onClick={handleDeleteResume}
              className="text-xs text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 size={13} /> Remove Profile
            </button>
          )}
        </div>

        {resumeProfile ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div>
              <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                <CheckCircle size={16} className="text-success" />
                <span>{resumeProfile.fileName}</span>
                {resumeProfile.atsScore && (
                  <span className="badge badge-success text-[10px]">ATS Score: {resumeProfile.atsScore}%</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                <span>{(resumeProfile.parsedProfile?.skills || []).length} verified skills</span>
                <span>•</span>
                <span>{(resumeProfile.parsedProfile?.projects || []).length} projects extracted</span>
                <span>•</span>
                <span className="text-foreground/80 font-mono text-[11px]">{resumeProfile.targetRole}</span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none">
              <input
                type="checkbox"
                checked={attachResume || selectedMode === 'resume-deep-dive'}
                disabled={selectedMode === 'resume-deep-dive'}
                onChange={(e) => setAttachResume(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              Inject Verified Resume Context
            </label>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleResumeFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingResume}
              className={cn(
                'w-full border-2 border-dashed border-border hover:border-primary/50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors',
                isUploadingResume && 'opacity-60 cursor-not-allowed'
              )}
            >
              <UploadCloud size={24} className="text-muted-foreground" />
              <div className="text-sm font-semibold text-foreground">
                {isUploadingResume ? 'Parsing PDF Document...' : 'Upload PDF Resume (Max 5MB)'}
              </div>
              <p className="text-xs text-muted-foreground">
                Securely parsed in-memory. Verified projects and skills will be used for tailored interview questions.
              </p>
            </button>
          </div>
        )}

        {resumeError && (
          <div className="alert-error mt-3 text-xs flex items-center gap-1.5 p-2 rounded">
            <AlertCircle size={14} /> {resumeError}
          </div>
        )}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="alert-error mb-6 flex items-center gap-2 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {/* Start Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isRequestingMedia}
          className="btn btn-primary btn-lg px-8 py-3 text-base font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
        >
          {isRequestingMedia ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Requesting Media Permissions...
            </>
          ) : (
            <>
              <GraduationCap size={20} />
              Start Mock Interview
              <ChevronRight size={18} />
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          Mock session runs with AI evaluation against our 6-dimension engineering rubric.{' '}
          <span className="font-semibold text-foreground">Camera and microphone access recommended.</span>
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
