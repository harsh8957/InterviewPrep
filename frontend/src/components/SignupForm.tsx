import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BrainCircuit, ArrowRight, AlertCircle, Eye, EyeOff,
  UserCircle, Briefcase, Sparkles, Check
} from 'lucide-react';
import { cn } from '../lib/utils';

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [role, setRole] = useState<'candidate' | 'hr'>('candidate');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup({ ...formData, role });
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    'Unlimited AI-powered mock interviews',
    'Instant feedback on every answer',
    '50+ job roles covered',
    'Track your improvement over time',
  ];

  return (
    <div className="page-transition min-h-[calc(100vh-64px)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 right-12 w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm rotate-6 animate-float" />
        <div className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-white/10 animate-float-slow" />
        <div className="absolute top-1/2 right-1/4 w-14 h-14 rounded-2xl bg-white/10 -rotate-12 animate-float-delayed" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">InterviewPrep</span>
          </Link>

          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={20} className="text-white/80" />
              <span className="text-white/80 text-sm font-medium">Start for free today</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Your Interview Success Starts Here
            </h2>
            <p className="text-white/75 text-lg mb-10 leading-relaxed">
              Join thousands of candidates who've transformed their interview skills
              with AI-powered practice.
            </p>

            <div className="flex flex-col gap-3">
              {benefits.map(b => (
                <div key={b} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-white/85 text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} InterviewPrep. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit mx-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-brand">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">InterviewPrep</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-1">Get started with InterviewPrep — it's free</p>
          </div>

          {/* Role selector */}
          <div className="flex rounded-xl border border-border bg-muted p-1 mb-6 gap-1">
            {[
              { value: 'candidate', label: 'Candidate', icon: UserCircle },
              { value: 'hr', label: 'HR / Recruiter', icon: Briefcase },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                id={`role-${value}`}
                onClick={() => setRole(value as 'candidate' | 'hr')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                  role === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert-error mb-5 animate-slide-up" role="alert">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="signup-firstName" className="label">First name</label>
                <input
                  id="signup-firstName"
                  type="text"
                  name="firstName"
                  className="input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-lastName" className="label">Last name</label>
                <input
                  id="signup-lastName"
                  type="text"
                  name="lastName"
                  className="input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="label">Email address</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                className="input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input pr-11"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* HR-specific fields */}
            {role === 'hr' && (
              <div className="flex flex-col gap-4 animate-slide-up">
                <div className="form-group">
                  <label htmlFor="signup-company" className="label">Company name</label>
                  <input
                    id="signup-company"
                    type="text"
                    name="company"
                    className="input"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-position" className="label">Your position</label>
                  <input
                    id="signup-position"
                    type="text"
                    name="position"
                    className="input"
                    placeholder="HR Manager"
                    value={formData.position}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <button
              id="signup-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg group mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <a href="#" className="underline hover:text-foreground">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
