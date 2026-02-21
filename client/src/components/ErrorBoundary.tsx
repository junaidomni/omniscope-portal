import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback UI to render instead of the default error screen */
  fallback?: ReactNode;
  /** Called when an error is caught — use for external logging */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

/**
 * Centralized Error Boundary for OmniScope Intelligence Portal.
 *
 * Features:
 * - Catches React rendering errors and displays a branded recovery screen
 * - Distinguishes between tRPC/network errors and React component errors
 * - Provides retry and navigation escape routes
 * - Logs errors via optional onError callback for future telemetry
 * - Collapsible stack trace for debugging
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console with structured format for server-side log collection
    console.error(
      `[ErrorBoundary] Uncaught error in component tree:`,
      {
        message: error.message,
        name: error.name,
        componentStack: errorInfo.componentStack,
      }
    );
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  classifyError(): { title: string; description: string; severity: "warning" | "error" } {
    const error = this.state.error;
    if (!error) return { title: "Unknown Error", description: "An unexpected error occurred.", severity: "error" };

    const msg = error.message.toLowerCase();

    // tRPC / network errors
    if (msg.includes("trpc") || msg.includes("fetch") || msg.includes("network")) {
      return {
        title: "Connection Issue",
        description: "Unable to reach the server. This may be a temporary network issue.",
        severity: "warning",
      };
    }

    // Auth errors
    if (msg.includes("unauthorized") || msg.includes("login") || msg.includes("10001")) {
      return {
        title: "Session Expired",
        description: "Your session has expired. Please log in again to continue.",
        severity: "warning",
      };
    }

    // Permission errors
    if (msg.includes("forbidden") || msg.includes("permission") || msg.includes("10002")) {
      return {
        title: "Access Denied",
        description: "You do not have permission to access this resource.",
        severity: "warning",
      };
    }

    // Rendering / React errors
    return {
      title: "Something Went Wrong",
      description: "A component failed to render. This has been logged for review.",
      severity: "error",
    };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { title, description, severity } = this.classifyError();
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="flex flex-col items-center w-full max-w-lg text-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-6",
              severity === "error" ? "bg-destructive/10" : "bg-amber-500/10"
            )}>
              <AlertTriangle
                size={32}
                className={severity === "error" ? "text-destructive" : "text-amber-500"}
              />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{description}</p>

            <div className="flex items-center gap-3 mb-6">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "hover:opacity-90 transition-opacity cursor-pointer"
                  )}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                  "border border-border text-foreground",
                  "hover:bg-muted transition-colors cursor-pointer"
                )}
              >
                <Home size={16} />
                Go Home
              </button>
              {!canRetry && (
                <button
                  onClick={this.handleReload}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "hover:opacity-90 transition-opacity cursor-pointer"
                  )}
                >
                  <RefreshCw size={16} />
                  Reload Page
                </button>
              )}
            </div>

            {this.state.retryCount > 0 && canRetry && (
              <p className="text-xs text-muted-foreground mb-4">
                Retry attempt {this.state.retryCount} of 3
              </p>
            )}

            {/* Collapsible error details for debugging */}
            {this.state.error && (
              <div className="w-full">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto cursor-pointer"
                >
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {this.state.showDetails ? "Hide" : "Show"} technical details
                </button>
                {this.state.showDetails && (
                  <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border overflow-auto max-h-64 text-left">
                    <p className="text-xs font-mono text-muted-foreground mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs font-mono text-muted-foreground/70 whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
