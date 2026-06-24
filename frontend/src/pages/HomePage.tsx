import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, MessageSquare, Video, BarChart4,
  Star, TrendingUp, Users, Award, Zap, Shield, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const stats = [
  { value: '10K+', label: 'Interviews Completed', icon: TrendingUp },
  { value: '95%', label: 'Success Rate', icon: Award },
  { value: '50+', label: 'Job Roles Covered', icon: Users },
  { value: '4.9★', label: 'Average Rating', icon: Star },
];

const features = [
  {
    icon: CheckCircle,
    title: 'Choose Your Path',
    description: 'Select your target role and experience level to receive hyper-relevant, tailored interview questions.',
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: MessageSquare,
    title: 'AI-Powered Questions',
    description: 'Our AI crafts industry-specific questions that closely mirror real interviews at top companies.',
    gradient: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary',
  },
  {
    icon: Video,
    title: 'Video & Audio Analysis',
    description: 'We analyze your spoken responses, delivery, and communication style in real time.',
    gradient: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: BarChart4,
    title: 'Detailed Feedback',
    description: 'Receive a scored breakdown with strengths, areas to improve, and actionable next steps.',
    gradient: 'from-success/20 to-success/5',
    iconColor: 'text-success',
  },
];

const testimonials = [
  {
    quote: "After practicing with InterviewPrep for two weeks, I felt so much more confident. I got the job at a top tech company!",
    name: 'Sarah L.',
    role: 'Software Engineer',
    initials: 'SL',
    color: 'from-primary to-secondary',
  },
  {
    quote: "The personalized feedback helped me identify my weak points and fix them before the real interview. Spot-on questions!",
    name: 'Michael T.',
    role: 'Data Scientist',
    initials: 'MT',
    color: 'from-secondary to-accent',
  },
  {
    quote: "As a career changer, I was nervous about technical interviews. InterviewPrep helped me practice until I was ready!",
    name: 'Jamie K.',
    role: 'UX Designer',
    initials: 'JK',
    color: 'from-accent to-success',
  },
];

const howItWorks = [
  { step: '01', title: 'Sign Up Free', desc: 'Create your account in under 60 seconds.' },
  { step: '02', title: 'Pick Your Role', desc: 'Choose your target job and experience level.' },
  { step: '03', title: 'Practice Interview', desc: 'Answer AI-generated questions via voice or text.' },
  { step: '04', title: 'Get Feedback', desc: 'Receive detailed scores and personalized tips.' },
];

const whyUs = [
  { icon: Zap, title: 'Instant Feedback', desc: 'Get AI analysis of every answer within seconds.' },
  { icon: Shield, title: 'Privacy First', desc: 'Your data stays private and is never shared.' },
  { icon: Clock, title: 'Practice Anytime', desc: 'Available 24/7 — practice at your own pace.' },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="page-transition">

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] animate-float-slow" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[100px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px] animate-float" />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-20 right-[10%] w-4 h-4 rounded-full bg-primary/40 animate-float" />
        <div className="absolute bottom-32 left-[12%] w-3 h-3 rounded-full bg-secondary/40 animate-float-slow" />
        <div className="absolute top-1/3 left-[8%] w-2 h-2 rounded-full bg-accent/50 animate-float-delayed" />

        <div className="container-content w-full py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
              <Zap size={14} />
              <span>AI-Powered Interview Practice Platform</span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-slide-up leading-[1.1]">
              Ace Your Next{' '}
              <span className="text-gradient-hero">Interview</span>
              {' '}with AI
            </h1>

            {/* Subheading */}
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed animate-slide-up">
              Practice with real industry questions, get instant AI-powered feedback,
              and build the confidence to land your dream job — all in one platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              {user ? (
                <Link to="/setup" className="btn btn-primary btn-lg group">
                  <span>Start Your Interview</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/signup" className="btn btn-primary btn-lg group">
                  <span>Get Started Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                to={user ? `/${user.role}/dashboard` : '/login'}
                className="btn btn-outline btn-lg"
              >
                {user ? 'My Dashboard' : 'Sign In'}
              </Link>
            </div>

            {/* Social proof mini */}
            <p className="mt-8 text-xs text-muted-foreground animate-fade-in">
              No credit card required · Free forever for candidates
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border bg-surface">
        <div className="container-content py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2 py-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-1">
                  <Icon size={20} />
                </div>
                <span className="text-2xl font-bold text-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="section">
        <div className="container-content">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="badge badge-primary mb-4 mx-auto">How It Works</div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to{' '}
              <span className="text-gradient">Interview Like a Pro</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform uses advanced AI to simulate real interview experiences
              tailored to your career goals and experience level.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-hover flex flex-col gap-4"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} ${feature.iconColor}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works Steps ── */}
      <section className="section bg-surface">
        <div className="container-content">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="badge badge-primary mb-4 mx-auto">Process</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and Running in{' '}
              <span className="text-gradient">4 Simple Steps</span>
            </h2>
          </div>
          <div className="relative grid gap-8 md:grid-cols-4">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30" />

            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex flex-col items-center text-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand text-white font-bold text-lg shadow-glow-primary">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why InterviewPrep ── */}
      <section className="section">
        <div className="container-content">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <div className="badge badge-primary mb-4">Why InterviewPrep</div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                The Smarter Way to{' '}
                <span className="text-gradient">Prepare</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Stop guessing what employers want. Our AI has analyzed thousands of
                real interviews to give you the most relevant practice experience possible.
              </p>
              <div className="flex flex-col gap-4">
                {whyUs.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-0.5">{title}</h4>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-gradient p-6 flex flex-col gap-2">
                <div className="text-4xl font-bold text-gradient">10K+</div>
                <p className="text-sm text-muted-foreground">Successful interviews practiced</p>
              </div>
              <div className="card p-6 flex flex-col gap-2 border-primary/20">
                <div className="text-4xl font-bold text-gradient">50+</div>
                <p className="text-sm text-muted-foreground">Job roles covered across industries</p>
              </div>
              <div className="card p-6 flex flex-col gap-2 border-secondary/20">
                <div className="text-4xl font-bold text-gradient">95%</div>
                <p className="text-sm text-muted-foreground">Candidates report improved confidence</p>
              </div>
              <div className="card-gradient p-6 flex flex-col gap-2">
                <div className="text-4xl font-bold text-gradient">4.9★</div>
                <p className="text-sm text-muted-foreground">Average user satisfaction rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section bg-surface">
        <div className="container-content">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="badge badge-primary mb-4 mx-auto">Testimonials</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real Success{' '}
              <span className="text-gradient">Stories</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              See how InterviewPrep has helped candidates land their dream jobs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="card-glass-hover flex flex-col gap-4">
                <div className="flex gap-1 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="section">
        <div className="container-content">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-brand opacity-90 -z-10 rounded-3xl" />
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-2xl -z-10" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-2xl -z-10" />

            <div className="text-white">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to Ace Your Interview?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/85">
                Join thousands of candidates who have improved their interview skills
                with InterviewPrep. Start practicing for free today.
              </p>
              {user ? (
                <Link
                  to="/setup"
                  className="inline-flex items-center gap-2 btn bg-white text-primary hover:bg-white/90 btn-lg font-bold shadow-lg group"
                >
                  <span>Start Your Interview Now</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 btn bg-white text-primary hover:bg-white/90 btn-lg font-bold shadow-lg group"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <p className="mt-5 text-sm text-white/70">
                No credit card required · Set up in 60 seconds
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
