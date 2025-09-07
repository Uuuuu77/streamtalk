/**
 * Comprehensive Error Handling System
 * Global error boundaries, logging, and recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

// Custom error types
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, true, { field });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, status?: number) {
    super(message, status || 500, true);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

export class WebRTCError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, true, context);
    this.name = 'WebRTCError';
  }
}

// Error logging service
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: Array<{ error: Error; context?: Record<string, any>; timestamp: number }> = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error with context
   */
  logError(error: Error, context?: Record<string, any>): void {
    const errorEntry = {
      error,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      },
      timestamp: Date.now()
    };

    this.errorQueue.push(errorEntry);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry);
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorEntry);
    }

    // Clean up old entries
    this.cleanupOldEntries();
  }

  /**
   * Send error to external logging service
   */
  private async sendToLoggingService(errorEntry: any): Promise<void> {
    try {
      // Example: Send to Sentry, LogRocket, or custom logging endpoint
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(errorEntry.error, {
          extra: errorEntry.context
        });
      }

      // Alternative: Send to custom logging endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorEntry)
      // });
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }

  /**
   * Clean up old error entries to prevent memory leaks
   */
  private cleanupOldEntries(): void {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    this.errorQueue = this.errorQueue.filter(entry => now - entry.timestamp < maxAge);
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(): Array<{ error: Error; context?: Record<string, any>; timestamp: number }> {
    return [...this.errorQueue];
  }
}

// Global error handler for unhandled promises and errors
export const setupGlobalErrorHandling = (): void => {
  const errorLogger = ErrorLogger.getInstance();

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      errorLogger.logError(error, { type: 'unhandledrejection' });
      
      toast({
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      errorLogger.logError(error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
};

// React Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorLogger = ErrorLogger.getInstance();
    
    this.setState({ error, errorInfo });
    
    // Log the error
    errorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.resetError);
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-300 mb-4 text-sm">
          We apologize for the inconvenience. The application encountered an unexpected error.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-400 cursor-pointer">Error details (Development)</summary>
            <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-300 overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={resetError}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const errorLogger = ErrorLogger.getInstance();

  const handleError = React.useCallback((error: Error, context?: Record<string, any>) => {
    errorLogger.logError(error, context);
    
    toast({
      title: 'Error',
      description: error instanceof AppError && error.isOperational 
        ? error.message 
        : 'An unexpected error occurred. Please try again.',
      variant: 'destructive'
    });
  }, [errorLogger]);

  const handleAsyncError = React.useCallback(
    async function<T>(
      asyncFn: () => Promise<T>,
      context?: Record<string, any>
    ): Promise<T | null> {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), context);
        return null;
      }
    },
    [handleError]
  );

  return { handleError, handleAsyncError };
};

// Utility functions for common error scenarios
export const ErrorUtils = {
  /**
   * Create user-friendly error messages
   */
  getUserFriendlyMessage: (error: Error): string => {
    if (error instanceof ValidationError) {
      return error.message;
    }
    
    if (error instanceof NetworkError) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error instanceof AuthenticationError) {
      return 'Please sign in to continue.';
    }
    
    if (error instanceof AuthorizationError) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error instanceof WebRTCError) {
      return 'Audio connection error. Please check your microphone permissions.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if error should be retried
   */
  isRetryableError: (error: Error): boolean => {
    if (error instanceof NetworkError) {
      return true;
    }
    
    if (error instanceof AppError) {
      return error.statusCode >= 500;
    }
    
    return false;
  },

  /**
   * Format error for logging
   */
  formatErrorForLogging: (error: Error, context?: Record<string, any>): Record<string, any> => {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error instanceof AppError ? error.statusCode : undefined,
      isOperational: error instanceof AppError ? error.isOperational : false,
      context: context || {},
      timestamp: new Date().toISOString()
    };
  }
} as const;

export default {
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  WebRTCError,
  ErrorLogger,
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  ErrorUtils,
  setupGlobalErrorHandling
};