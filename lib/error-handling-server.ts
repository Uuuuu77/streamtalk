/**
 * Server-side error handling utilities
 * Safe for use in API routes and server components
 */

// Custom error types
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'GENERAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      true
    );
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      true
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      true
    );
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(
      `${resource} not found`,
      'NOT_FOUND_ERROR',
      404,
      true
    );
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(
      message,
      'NETWORK_ERROR',
      503,
      true
    );
    this.name = 'NetworkError';
  }
}

// Error logger for server-side use
export class ErrorLogger {
  private static instance: ErrorLogger;

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public log(error: Error, context?: Record<string, any>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context || {},
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      }),
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }

    // In production, you would send to your logging service
    // Example: send to logging service, Sentry, etc.
    // this.sendToLoggingService(errorInfo);
  }

  public logAndCreateResponse(error: Error, context?: Record<string, any>): Response {
    this.log(error, context);

    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  /**
   * Create user-friendly error messages
   */
  createUserFriendlyMessage: (error: Error): string => {
    if (error instanceof ValidationError) {
      return error.message;
    }
    
    if (error instanceof AuthenticationError) {
      return 'Please log in to continue';
    }
    
    if (error instanceof AuthorizationError) {
      return 'You do not have permission to perform this action';
    }
    
    if (error instanceof NotFoundError) {
      return error.message;
    }
    
    if (error instanceof RateLimitError) {
      return 'Too many requests. Please try again later';
    }
    
    if (error instanceof NetworkError) {
      return 'Connection error. Please check your internet connection';
    }
    
    // Generic error message for unknown errors
    return process.env.NODE_ENV === 'development'
      ? error.message
      : 'Something went wrong. Please try again';
  },

  /**
   * Check if error is safe to show to user
   */
  isSafeToShow: (error: Error): boolean => {
    return error instanceof AppError && error.isOperational;
  },

  /**
   * Extract status code from error
   */
  getStatusCode: (error: Error): number => {
    if (error instanceof AppError) {
      return error.statusCode;
    }
    return 500;
  },

  /**
   * Extract error code from error
   */
  getErrorCode: (error: Error): string => {
    if (error instanceof AppError) {
      return error.code;
    }
    return 'UNKNOWN_ERROR';
  },
};