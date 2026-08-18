import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-variant flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="font-headline text-2xl font-extrabold text-on-surface">Something went wrong</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              We encountered an unexpected error in the simulation. Please reload the app to continue your practice.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-colors active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
