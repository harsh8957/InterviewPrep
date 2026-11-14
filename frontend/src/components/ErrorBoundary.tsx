import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React component rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-background">
          <div className="card max-w-md w-full p-8 text-center space-y-4 border-destructive/30 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground">
                An unexpected application rendering issue occurred. Your progress data and session remain safely saved.
              </p>
            </div>

            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-left font-mono text-xs text-destructive overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <button
                onClick={this.handleReset}
                className="btn btn-outline text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className="btn btn-primary text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="btn btn-outline text-xs flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Return to Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
