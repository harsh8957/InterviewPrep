import { Link } from 'react-router-dom';
import { Home, ArrowLeft, BrainCircuit } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="page-transition flex min-h-[calc(100vh-128px)] flex-col items-center justify-center px-4 text-center">
      {/* Animated background orbs */}
      <div className="absolute -z-10 top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float-slow" />
      <div className="absolute -z-10 bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary/5 blur-3xl animate-float" />

      {/* Icon */}
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-brand shadow-glow-primary mb-6 animate-scale-in">
        <BrainCircuit size={36} className="text-white" />
      </div>

      {/* 404 */}
      <h1 className="text-8xl font-bold text-gradient mb-4 animate-slide-up">
        404
      </h1>

      <h2 className="text-2xl font-semibold mb-3 animate-slide-up">
        Page Not Found
      </h2>

      <p className="mb-8 max-w-md text-muted-foreground text-lg leading-relaxed animate-fade-in">
        Looks like this page has gone off-script. Let's get you back to your interview preparation.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 animate-slide-up">
        <Link to="/" className="btn btn-primary btn-lg">
          <Home size={18} />
          Return to Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline btn-lg"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
