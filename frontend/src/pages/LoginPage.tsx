import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Eye, EyeOff, BrainCircuit, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) { setFormError('Please enter your email'); return; }
    if (!password) { setFormError('Please enter your password'); return; }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(`/${loggedInUser.role}/dashboard`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unknown login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition min-h-[calc(100vh-64px)] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand" />
        <div className="absolute inset-0 noise-overlay" />
        {/* Floating shapes */}
        <div className="absolute top-16 left-16 w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm rotate-12 animate-float" />
        <div className="absolute bottom-24 right-16 w-24 h-24 rounded-full bg-white/10 animate-float-slow" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-2xl bg-white/10 -rotate-6 animate-float-delayed" />

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
              <span className="text-white/80 text-sm font-medium">AI-Powered Practice</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Land Your Dream Job with Confidence
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Practice with real-world questions, get instant AI feedback,
              and track your improvement over time.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { value: '10K+', label: 'Interviews' },
                { value: '95%', label: 'Success Rate' },
                { value: '50+', label: 'Job Roles' },
                { value: '4.9★', label: 'Rating' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-white/70 text-sm">{s.label}</div>
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
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Log in to continue your interview practice</p>
          </div>

          {formError && (
            <div className="alert-error mb-6 animate-slide-up" role="alert">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
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

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg group mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign up free
            </Link>
          </p>

          <div className="mt-8 rounded-xl bg-muted/60 border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Demo:</span> You can log in with any registered email and password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
