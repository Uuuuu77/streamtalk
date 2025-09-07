import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/core/sessionStore';
import { CreateSessionInput } from '@/lib/core/types';
import { createSecureAPIHandler, RateLimitConfigs } from '@/lib/security';
import { ValidationHelpers, FormSchemas } from '@/lib/validation';
import { AppError, ErrorLogger } from '@/lib/error-handling-server';

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const errorLogger = ErrorLogger.getInstance();

  try {
    // Parse and validate input
    const body = await req.json();
    const validation = ValidationHelpers.validateInput(FormSchemas.createSession, body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.errors
      }, { status: 400 });
    }

    if (!validation.data) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    const { title, description, maxParticipants, speakingTimeLimit } = validation.data;

    // Extract user ID from auth (simplified for now)
    const authHeader = req.headers.get('authorization');
    const streamerId = authHeader?.replace('Bearer ', '') || 'anonymous';

    // Create session with validated data
    const session = sessionStore.create({
      streamerId,
      title,
      description,
      maxSpeakingTime: speakingTimeLimit,
      autoSelectEnabled: true,
      recordingEnabled: false,
    });
    
    // Generate shareable link with proper security
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://streamtalk-delta.vercel.app'
      : process.env.NEXT_PUBLIC_APP_URL || 
        (req.headers.get('host')?.includes('localhost') 
          ? `http://${req.headers.get('host')}` 
          : `https://${req.headers.get('host')}`);
    
    const shareableLink = `${baseUrl}/join/${session.id}`;
    
    return NextResponse.json({
      success: true,
      session: {
        ...session,
        shareableLink,
      },
    });
  } catch (error) {
    errorLogger.log(
      error instanceof Error ? error : new AppError('Unknown error in session creation'),
      { endpoint: '/api/sessions/create' }
    );

    return NextResponse.json({
      success: false,
      error: 'Failed to create session'
    }, { status: 500 });
  }
};

// Export the secure handler with rate limiting and validation
export const POST = createSecureAPIHandler(handler, {
  rateLimit: RateLimitConfigs.createSession,
  requireAuth: true,
  validateInput: true
});
