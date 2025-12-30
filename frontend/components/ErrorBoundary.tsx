import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Captured error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-100"
          role="alert"
        >
          <strong className="text-base">Something went wrong.</strong>
          <p className="mt-2 text-red-100/80">
            {this.state.message || "Please reload the page or try again in a moment."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
