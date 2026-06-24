import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase as BriefcaseBusiness, GraduationCap, Code, Brain, Palette, Database,
  AlertCircle, CheckCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterview, JobRole, ExperienceLevel } from '../contexts/InterviewContext';
import { cn } from '../lib/utils';

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
      "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 group",
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
      "flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-white transition-all duration-200",
      color,
      selected ? "shadow-md" : "group-hover:scale-110"
    )}>
      {icon}
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </button>
);

interface LevelCardProps {
  id: ExperienceLevel;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  selected: boolean;
  onSelect: () => void;
}

const LevelCard = ({ title, description, badge, badgeColor, selected, onSelect }: LevelCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "relative text-left p-5 rounded-2xl border-2 transition-all duration-200",
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
    <span className={cn("badge mb-3", badgeColor)}>{badge}</span>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </button>
);

const SetupPage = () => {
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const { user } = useAuth();
  const { setConfig, startInterview } = useInterview();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) navigate('/login');
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [user, navigate, location]);

  const handleStartInterview = async () => {
    setErrorMessage('');
    if (!selectedRole) { setErrorMessage('Please select a job role to continue'); return; }
    if (!selectedLevel) { setErrorMessage('Please select an experience level to continue'); return; }

    setConfig({ jobRole: selectedRole, experienceLevel: selectedLevel });

    try {
      setIsRequestingMedia(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        await startInterview({ mediaStream, jobRole: selectedRole, experienceLevel: selectedLevel });
        navigate('/interview');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (window.confirm('Unable to access camera or microphone. Would you like to continue without video?')) {
          await startInterview({ jobRole: selectedRole, experienceLevel: selectedLevel });
          navigate('/interview');
        } else {
          setErrorMessage('Interview requires camera and microphone access. Please check permissions.');
        }
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setErrorMessage('Failed to start interview. Please try again.');
    } finally {
      setIsRequestingMedia(false);
    }
  };

  const jobRoles = [
    {
      id: 'web-developer' as JobRole,
      title: 'Web Developer',
      icon: <Code size={24} />,
      description: 'Front-end, back-end, and full-stack web development',
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      id: 'app-developer' as JobRole,
      title: 'App Developer',
      icon: <BriefcaseBusiness size={24} />,
      description: 'Mobile and desktop application development',
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
    },
    {
      id: 'ml-ai' as JobRole,
      title: 'ML & AI Engineer',
      icon: <Brain size={24} />,
      description: 'Machine learning, AI, and data science positions',
      color: 'bg-gradient-to-br from-rose-500 to-pink-600',
    },
    {
      id: 'ux-designer' as JobRole,
      title: 'UX Designer',
      icon: <Palette size={24} />,
      description: 'User experience and interface design roles',
      color: 'bg-gradient-to-br from-orange-500 to-amber-600',
    },
    {
      id: 'data-scientist' as JobRole,
      title: 'Data Scientist',
      icon: <Database size={24} />,
      description: 'Data analysis, modeling, and visualization',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    },
  ];

  const experienceLevels = [
    {
      id: 'fresher' as ExperienceLevel,
      title: 'Fresher / Entry Level',
      description: '0–1 years of experience, new to the industry',
      badge: 'Entry',
      badgeColor: 'badge-success',
    },
    {
      id: 'junior' as ExperienceLevel,
      title: 'Junior',
      description: '1–3 years of experience, some professional work',
      badge: 'Junior',
      badgeColor: 'badge-primary',
    },
    {
      id: 'mid-level' as ExperienceLevel,
      title: 'Mid-Level',
      description: '3–5 years of experience, solid professional skills',
      badge: 'Mid',
      badgeColor: 'badge-warning',
    },
    {
      id: 'senior' as ExperienceLevel,
      title: 'Senior / Lead',
      description: '5+ years of experience, expert-level skills',
      badge: 'Senior',
      badgeColor: 'badge-destructive',
    },
  ];

  const step1Complete = !!selectedRole;
  const step2Complete = !!selectedLevel;

  return (
    <div className="page-transition container-content py-12">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="badge badge-primary mb-4 mx-auto">Interview Setup</div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
            Configure Your{' '}
            <span className="text-gradient">Interview Session</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Select your target role and experience level to receive perfectly tailored questions.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { n: 1, label: 'Job Role', done: step1Complete },
            { n: 2, label: 'Experience', done: step2Complete },
            { n: 3, label: 'Start', done: false },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200",
                  s.done
                    ? "bg-primary text-white shadow-glow-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {s.done ? <CheckCircle size={16} /> : s.n}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  s.done ? "text-primary" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={cn(
                  "h-px w-12 sm:w-20 mt-[-16px] transition-colors duration-200",
                  s.done ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Job Role */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
              step1Complete ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {step1Complete ? <CheckCircle size={14} /> : '1'}
            </div>
            <h2 className="text-xl font-semibold">Choose a Job Role</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobRoles.map(role => (
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

        {/* Step 2 — Experience Level */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
              step2Complete ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {step2Complete ? <CheckCircle size={14} /> : '2'}
            </div>
            <h2 className="text-xl font-semibold">Select Experience Level</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {experienceLevels.map(level => (
              <LevelCard
                key={level.id}
                id={level.id}
                title={level.title}
                description={level.description}
                badge={level.badge}
                badgeColor={level.badgeColor}
                selected={selectedLevel === level.id}
                onSelect={() => setSelectedLevel(level.id)}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="alert-error mb-6 animate-slide-up" role="alert">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Selected summary + Start */}
        {(selectedRole || selectedLevel) && (
          <div className="card-gradient mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-slide-up">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">Your Selection:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRole && (
                  <span className="badge badge-primary">
                    {jobRoles.find(r => r.id === selectedRole)?.title}
                  </span>
                )}
                {selectedLevel && (
                  <span className="badge badge-muted">
                    {experienceLevels.find(l => l.id === selectedLevel)?.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            id="start-interview"
            className={cn(
              "btn btn-primary btn-lg px-10 group",
              isRequestingMedia && "opacity-75 cursor-not-allowed"
            )}
            onClick={handleStartInterview}
            disabled={isRequestingMedia}
          >
            {isRequestingMedia ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Requesting Camera Access...
              </>
            ) : (
              <>
                <GraduationCap size={20} />
                Start Interview
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
            This will start a mock interview session with AI-generated questions specific to your selection.{' '}
            <strong className="text-foreground">Camera and microphone access is required.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
