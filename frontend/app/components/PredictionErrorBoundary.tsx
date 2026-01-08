'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PredictionErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

interface PredictionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  resetKey: number;
}

export default class PredictionErrorBoundary extends React.Component<
  PredictionErrorBoundaryProps,
  PredictionErrorBoundaryState
> {
  state: PredictionErrorBoundaryState = {
    hasError: false,
    error: undefined,
    resetKey: 0
  };

  static getDerivedStateFromError(error: Error): PredictionErrorBoundaryState {
    return {
      hasError: true,
      error,
      resetKey: 0
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Prediction view error:', error, info);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      resetKey: prevState.resetKey + 1
    }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 rounded-3xl border border-rose-500/30 bg-slate-950/40 px-6 py-10 text-center shadow-[0_0_60px_rgba(244,63,94,0.12)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              {this.props.title ?? 'Prediction temporarily unavailable'}
            </h2>
            <p className="text-sm text-slate-300">
              {this.props.description ??
                'Something went wrong while loading this prediction. Please try again to continue.'}
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-rose-200/80">{this.state.error.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-5 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300/60 hover:bg-rose-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry prediction
          </button>
        </div>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
