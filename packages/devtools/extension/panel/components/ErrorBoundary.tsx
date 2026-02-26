// Error Boundary Component

import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { DevToolsError, ErrorBoundaryState } from '../types/errors';
import { ErrorCode } from '../types/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: DevToolsError) => void;
  onRetry?: () => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: {
        code: ErrorCode.RENDER_FAILED,
        message: error.message || 'An unexpected error occurred',
        timestamp: Date.now(),
        stack: error.stack
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const devToolsError: DevToolsError = {
      code: ErrorCode.RENDER_FAILED,
      message: error.message || 'Component failed to render',
      context: {
        componentStack: errorInfo.componentStack
      },
      timestamp: Date.now(),
      stack: error.stack
    };

    console.error('[DevTools ErrorBoundary] Component caught error:', devToolsError);
    console.error('[DevTools ErrorBoundary] Error info:', errorInfo);

    if (this.props.onError) {
      this.props.onError(devToolsError);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: this.state.retryCount + 1
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error?.code && (
              <p className="error-code">Error Code: {this.state.error.code}</p>
            )}
            <div className="error-actions">
              <button
                className="retry-button"
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= 3}
              >
                {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Retry'}
              </button>
            </div>
            {this.state.retryCount >= 3 && (
              <p className="error-hint">
                Please refresh the page or check the console for details
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
