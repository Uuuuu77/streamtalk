/**
 * Security Middleware and Utilities
 * Rate limiting, CORS, input sanitization, and authentication helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ValidationHelpers } from '@/lib/validation';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipIf?: (req: NextRequest) => boolean;
}

// In-memory rate limit store (use Redis in production)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, windowMs: number): { count: number; resetTime: number } {
    const resetTime = Date.now() + windowMs;
    const existing = this.get(key);
    const count = existing ? existing.count + 1 : 1;
    const entry = { count, resetTime };
    this.store.set(key, entry);
    return entry;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limiting middleware
 */
export const rateLimit = (config: RateLimitConfig) => {
  return (req: NextRequest): NextResponse | null => {
    // Skip if condition is met
    if (config.skipIf && config.skipIf(req)) {
      return null;
    }

    // Generate key based on IP and path
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-proto') || 'unknown';
    const key = `${ip}:${req.nextUrl.pathname}`;

    // Check rate limit
    const entry = rateLimitStore.set(key, config.windowMs);

    if (entry.count > config.maxRequests) {
      return NextResponse.json(
        { 
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count).toString(),
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      );
    }

    return null; // Continue to next middleware
  };
};

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  },

  // Moderate limits for session creation
  createSession: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    message: 'Too many sessions created, please wait before creating another'
  },

  // Generous limits for joining sessions
  joinSession: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many join attempts, please wait a moment'
  },

  // Very strict limits for queue operations
  queueOperations: {
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 5,
    message: 'Too many queue operations, please slow down'
  },

  // Moderate limits for WebRTC signaling
  webrtcSignaling: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many signaling messages, connection may be unstable'
  },

  // General API limits
  general: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Rate limit exceeded, please slow down'
  }
} as const;

/**
 * CORS configuration for security
 */
export const CORSConfig = {
  development: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  production: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
} as const;

/**
 * Apply CORS headers to response
 */
export const applyCORS = (response: NextResponse, request: NextRequest): NextResponse => {
  const config = process.env.NODE_ENV === 'production' 
    ? CORSConfig.production 
    : CORSConfig.development;

  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && (config.origin as string[]).includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Credentials', config.credentials.toString());
  response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
};

/**
 * Security headers middleware
 */
export const securityHeaders = (response: NextResponse): NextResponse => {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent content-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-eval needed for some WebRTC libs
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // HTTPS-only cookies in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = <T>(data: T): T => {
  if (typeof data === 'string') {
    return ValidationHelpers.sanitizeHtml(data) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item)) as T;
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Session validation middleware
 */
export interface SessionValidationOptions {
  requireAuth?: boolean;
  requireHost?: boolean;
  sessionId?: string;
}

export const validateSession = async (
  request: NextRequest,
  options: SessionValidationOptions = {}
): Promise<{ valid: boolean; error?: string; userId?: string; isHost?: boolean }> => {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader && options.requireAuth) {
      return { valid: false, error: 'Authentication required' };
    }

    // Validate session token (implement your auth logic here)
    // This is a placeholder - implement actual Firebase Auth verification
    const token = authHeader?.replace('Bearer ', '');
    if (!token && options.requireAuth) {
      return { valid: false, error: 'Invalid token' };
    }

    // For now, return mock validation
    // In real implementation, verify Firebase token here
    const userId = 'mock-user-id'; // Extract from verified token
    
    if (options.requireHost && options.sessionId) {
      // Check if user is host of the session
      // Implementation would check against database
      const isHost = true; // Mock check
      
      if (!isHost) {
        return { valid: false, error: 'Host access required' };
      }
      
      return { valid: true, userId, isHost: true };
    }

    return { valid: true, userId };
  } catch (error) {
    return { valid: false, error: 'Session validation failed' };
  }
};

/**
 * API request logger for security monitoring
 */
export const logSecurityEvent = (
  event: 'rate_limit' | 'auth_failure' | 'invalid_input' | 'suspicious_activity',
  request: NextRequest,
  details?: Record<string, any>
): void => {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
    details: details || {}
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Security Event:', logEntry);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to security monitoring service
    // Example: LogRocket, Datadog, custom endpoint
  }
};

/**
 * Comprehensive API middleware composer
 */
export const createSecureAPIHandler = (
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig;
    requireAuth?: boolean;
    requireHost?: boolean;
    validateInput?: boolean;
  } = {}
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResult = rateLimit(options.rateLimit)(request);
        if (rateLimitResult) {
          logSecurityEvent('rate_limit', request);
          return rateLimitResult;
        }
      }

      // Validate session if required
      if (options.requireAuth || options.requireHost) {
        const sessionValidation = await validateSession(request, {
          requireAuth: options.requireAuth,
          requireHost: options.requireHost
        });

        if (!sessionValidation.valid) {
          logSecurityEvent('auth_failure', request, { error: sessionValidation.error });
          return NextResponse.json(
            { error: sessionValidation.error },
            { status: 401 }
          );
        }
      }

      // Execute the handler
      const response = await handler(request);

      // Apply security headers
      const secureResponse = securityHeaders(response);
      
      // Apply CORS
      return applyCORS(secureResponse, request);

    } catch (error) {
      logSecurityEvent('suspicious_activity', request, { error: String(error) });
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};

export default {
  rateLimit,
  RateLimitConfigs,
  applyCORS,
  securityHeaders,
  sanitizeInput,
  validateSession,
  logSecurityEvent,
  createSecureAPIHandler
};