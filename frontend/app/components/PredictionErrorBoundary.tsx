'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureException } from '@/lib/sentry';

type PredictionErrorBoundaryProps = {
  children: React.ReactNode;
  context?: string;
};

type PredictionErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export default class PredictionErrorBoundary extends React.Component<
  PredictionErrorBoundaryProps,
  PredictionErrorBoundaryState
> {
  state: PredictionErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): PredictionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      boundary: 'PredictionErrorBoundary',
      context: this.props.context,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-xl w-full rounded-2xl border border-purple-500/30 bg-slate-900/60 p-8 text-center shadow-xl">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 text-purple-300">
                <AlertTriangle className="h-7 w-7" />
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Prediction unavailable</h2>
            <p className="mt-3 text-sm text-slate-300">
              We hit a snag while preparing your Bhrigu prediction. Please try again in a moment.
            </p>
            {this.state.error?.message ? (
              <p className="mt-2 text-xs text-slate-500">{this.state.error.message}</p>
            ) : null}
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-100 transition hover:border-purple-300/70 hover:bg-purple-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
