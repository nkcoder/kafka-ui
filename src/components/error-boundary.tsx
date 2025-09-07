/**
 * ERROR BOUNDARY COMPONENT
 *
 * REACT ERROR BOUNDARY PATTERN:
 * - Catches JavaScript errors anywhere in the component tree
 * - Logs error information for debugging
 * - Displays fallback UI instead of component tree crash
 * - Follows React 18+ patterns with getDerivedStateFromError
 *
 * NEXT.JS INTEGRATION:
 * - Works with both Server and Client Components
 * - Handles hydration errors gracefully
 * - Provides user-friendly error messages
 *
 * ERROR RECOVERY:
 * - Provides "Try again" functionality
 * - Clears error state when user attempts recovery
 * - Maintains application stability during errors
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  // STATIC METHOD: Update state when error occurs
  public static getDerivedStateFromError(error: Error): State {
    // Update state to trigger fallback UI render
    return { hasError: true, error };
  }

  // LIFECYCLE METHOD: Log error details for debugging
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to send this to an error reporting service
    // reportErrorToService(error, errorInfo);
  }

  // ERROR RECOVERY: Reset error state
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // CUSTOM FALLBACK UI: User provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // DEFAULT FALLBACK UI: Error message with recovery option
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
              {/* Error Icon */}
              <div className="text-4xl mb-4">⚠️</div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>

              {/* Error Description */}
              <p className="text-muted-foreground mb-4">
                The application encountered an unexpected error. This has been logged for
                investigation.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-background border rounded p-3 mb-4 text-left">
                  <p className="text-xs font-mono text-error">{this.state.error.message}</p>
                </div>
              )}

              {/* Recovery Actions */}
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset} variant="primary" size="sm">
                  Try Again
                </Button>

                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // NO ERROR: Render children normally
    return this.props.children;
  }
}
