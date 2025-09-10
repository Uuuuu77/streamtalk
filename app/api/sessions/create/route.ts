import { NextRequest, NextResponse } from 'next/server';
import { firestoreService } from '@/lib/firestore';
import { createSecureAPIHandler, RateLimitConfigs } from '@/lib/security';
import { ValidationHelpers, FormSchemas } from '@/lib/validation';
import { AppError, ErrorLogger } from '@/lib/error-handling-server';
import { z } from 'zod';

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const errorLogger = ErrorLogger.getInstance();

  try {
    console.log('[API] Creating session...');
    
    // Parse and validate input
    const body = await req.json();
    console.log('[API] Request body:', body);
    
    // Create a custom validation schema that includes streamerId
    const createSessionWithStreamerSchema = FormSchemas.createSession.extend({
      streamerId: z.string().min(1, 'Streamer ID is required')
    });
    
    const validation = ValidationHelpers.validateInput(createSessionWithStreamerSchema, body);
    
    if (!validation.success) {
      console.log('[API] Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.errors
      }, { status: 400 });
    }

    if (!validation.data) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    const { title, description, speakingTimeLimit = 45, streamerId } = validation.data;
    console.log('[API] Validated data:', { title, description, speakingTimeLimit, streamerId });

    // Create room using Firestore service
    const roomData = {
      hostId: streamerId,
      title,
      description: description || 'Live audio interaction session',
      isActive: true,
      maxParticipants: 50,
      speakingTimeLimit: speakingTimeLimit,
      currentSpeakerId: null,
      participantQueue: []
    };

    const roomId = await firestoreService.createRoom(roomData);
    console.log('[API] Room created with ID:', roomId);
    
    // Generate shareable link with proper security
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://streamtalk-delta.vercel.app'
      : process.env.NEXT_PUBLIC_APP_URL || 
        (req.headers.get('host')?.includes('localhost') 
          ? `http://${req.headers.get('host')}` 
          : `https://${req.headers.get('host')}`);
    
    const shareableLink = `${baseUrl}/viewer/${roomId}`;
    
    const sessionResponse = {
      id: roomId,
      title,
      description,
      maxSpeakingTime: speakingTimeLimit,
      autoSelectEnabled: true,
      recordingEnabled: false,
      status: 'active',
      shareableLink,
      queueLength: 0,
      waitingViewers: [],
      createdAt: new Date().toISOString()
    };

    console.log('[API] Session created successfully:', sessionResponse);
    
    return NextResponse.json({
      success: true,
      session: sessionResponse,
    });
  } catch (error) {
    console.error('[API] Error creating session:', error);
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
  requireAuth: false, // Allow creation without strict auth for now
  validateInput: false // We're doing validation manually above
});
