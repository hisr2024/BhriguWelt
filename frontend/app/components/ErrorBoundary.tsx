'use client';

import React from 'react';
import GenZCard from './GenZCard';
import GenZButton from './GenZButton';

function sanitizeErrorMessage(message: string): string {
  return message.replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED_API_KEY]');
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: sanitizeErrorMessage(error.message) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    console.error('UI error boundary caught an error:', {
      message: sanitizedMessage,
      stack: sanitizeErrorMessage(error.stack || ''),
      componentStack: sanitizeErrorMessage(errorInfo.componentStack || ''),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <GenZCard variant="glass" className="text-center max-w-xl">
            <h2 className="text-2xl font-display font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-white/80 mb-6">
              We hit a snag loading this experience. Please try again or return to the dashboard.
            </p>
            {this.state.errorMessage && (
              <p className="text-sm text-white/50 mb-6">{this.state.errorMessage}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <GenZButton variant="primary" onClick={this.handleReset}>Try Again</GenZButton>
              <GenZButton variant="outline" onClick={() => window.location.assign('/dashboard')}>Back to Dashboard</GenZButton>
            </div>
          </GenZCard>
        </div>
      );
    }

    return this.props.children;
  }
}
