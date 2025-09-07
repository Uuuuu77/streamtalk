/**
 * Comprehensive Input Validation Schemas using Zod
 * Implements security-first validation for all user inputs
 */

import { z } from 'zod';

// Helper validation patterns
const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');

// Custom validation functions
const noScriptTags = (value: string) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value);
const noHtmlTags = (value: string) => !/<[^>]*>/g.test(value);

// User input validation schemas
export const UserInputSchemas = {
  // Display name validation
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Only alphanumeric characters, spaces, hyphens, underscores, and periods allowed')
    .transform(sanitizeString)
    .refine(noHtmlTags, 'HTML tags are not allowed'),

  // Email validation
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email cannot exceed 254 characters')
    .transform(str => str.toLowerCase().trim()),

  // Password validation (enhanced security)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 'Password must contain at least one special character'),

  // Session/Room title validation
  sessionTitle: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .transform(sanitizeString)
    .refine(noHtmlTags, 'HTML tags are not allowed')
    .refine(noScriptTags, 'Script tags are not allowed'),

  // Session description validation
  sessionDescription: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .transform((str) => str ? sanitizeString(str) : undefined)
    .refine((str) => !str || noHtmlTags(str), 'HTML tags are not allowed')
    .refine((str) => !str || noScriptTags(str), 'Script tags are not allowed'),

  // Room/Session ID validation
  sessionId: z
    .string()
    .min(1, 'Session ID is required')
    .max(50, 'Session ID cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Session ID can only contain alphanumeric characters, hyphens, and underscores'),

  // User ID validation
  userId: z
    .string()
    .min(1, 'User ID is required')
    .max(128, 'User ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'User ID can only contain alphanumeric characters, hyphens, and underscores'),

  // Speaking time limit validation
  speakingTimeLimit: z
    .number()
    .int('Speaking time must be a whole number')
    .min(15, 'Speaking time must be at least 15 seconds')
    .max(300, 'Speaking time cannot exceed 5 minutes'),

  // Max participants validation
  maxParticipants: z
    .number()
    .int('Participant count must be a whole number')
    .min(2, 'Must allow at least 2 participants')
    .max(100, 'Cannot exceed 100 participants'),

  // Message content validation (for chat features)
  messageContent: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message cannot exceed 500 characters')
    .transform(sanitizeString)
    .refine(noHtmlTags, 'HTML tags are not allowed')
    .refine(noScriptTags, 'Script tags are not allowed'),

  // WebRTC signal data validation
  signalData: z.object({
    type: z.enum(['offer', 'answer', 'ice-candidate']),
    sdp: z.string().optional(),
    candidate: z.string().optional(),
    sdpMLineIndex: z.number().optional(),
    sdpMid: z.string().optional(),
    timestamp: z.number().min(0)
  })
} as const;

// Complete form validation schemas
export const FormSchemas = {
  // Authentication forms
  signUp: z.object({
    email: UserInputSchemas.email,
    password: UserInputSchemas.password,
    displayName: UserInputSchemas.displayName,
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  signIn: z.object({
    email: UserInputSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),

  // Session creation form
  createSession: z.object({
    title: UserInputSchemas.sessionTitle,
    description: UserInputSchemas.sessionDescription,
    maxParticipants: UserInputSchemas.maxParticipants,
    speakingTimeLimit: UserInputSchemas.speakingTimeLimit,
    isPrivate: z.boolean().default(false)
  }),

  // Join session form
  joinSession: z.object({
    sessionId: UserInputSchemas.sessionId,
    displayName: UserInputSchemas.displayName
  }),

  // Update profile form
  updateProfile: z.object({
    displayName: UserInputSchemas.displayName,
    email: UserInputSchemas.email.optional()
  }),

  // Session settings update
  updateSessionSettings: z.object({
    title: UserInputSchemas.sessionTitle.optional(),
    description: UserInputSchemas.sessionDescription,
    maxParticipants: UserInputSchemas.maxParticipants.optional(),
    speakingTimeLimit: UserInputSchemas.speakingTimeLimit.optional(),
    isActive: z.boolean().optional()
  })
} as const;

// API endpoint validation schemas
export const APISchemas = {
  // Session management
  sessions: {
    create: FormSchemas.createSession,
    update: z.object({
      sessionId: UserInputSchemas.sessionId,
      updates: FormSchemas.updateSessionSettings
    }),
    join: FormSchemas.joinSession,
    leave: z.object({
      sessionId: UserInputSchemas.sessionId
    })
  },

  // Queue management
  queue: {
    join: z.object({
      sessionId: UserInputSchemas.sessionId,
      viewerId: UserInputSchemas.userId,
      viewerName: UserInputSchemas.displayName
    }),
    leave: z.object({
      sessionId: UserInputSchemas.sessionId,
      viewerId: UserInputSchemas.userId
    }),
    status: z.object({
      sessionId: UserInputSchemas.sessionId
    })
  },

  // WebRTC signaling
  webrtc: {
    signal: z.object({
      sessionId: UserInputSchemas.sessionId,
      fromUserId: UserInputSchemas.userId,
      toUserId: UserInputSchemas.userId,
      signalData: UserInputSchemas.signalData
    })
  }
} as const;

// Validation helper functions
export const ValidationHelpers = {
  /**
   * Validate and sanitize user input with detailed error reporting
   */
  validateInput: <T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: { field: string; message: string }[];
  } => {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return { success: true, data: result.data };
      }
      
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return { success: false, errors };
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      };
    }
  },

  /**
   * Sanitize HTML content to prevent XSS
   */
  sanitizeHtml: (content: string): string => {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Validate file uploads (for future avatar features)
   */
  validateFile: (file: File, maxSize: number = 5 * 1024 * 1024): {
    valid: boolean;
    error?: string;
  } => {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds maximum allowed size' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file name
    if (!/^[a-zA-Z0-9\-_.\s]+$/.test(file.name)) {
      return { valid: false, error: 'Invalid file name' };
    }

    return { valid: true };
  },

  /**
   * Rate limiting validation helper
   */
  checkRateLimit: (actions: number[], timeWindow: number, maxActions: number): boolean => {
    const now = Date.now();
    const recentActions = actions.filter(timestamp => now - timestamp < timeWindow);
    return recentActions.length < maxActions;
  }
} as const;

// Export types for TypeScript
export type UserInputType = keyof typeof UserInputSchemas;
export type FormSchemaType = keyof typeof FormSchemas;
export type APISchemaType = keyof typeof APISchemas;

export default {
  UserInputSchemas,
  FormSchemas,
  APISchemas,
  ValidationHelpers
};