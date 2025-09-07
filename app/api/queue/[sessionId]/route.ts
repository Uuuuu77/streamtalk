import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/core/queueManager';
import { sessionStore } from '@/lib/core/sessionStore';

// Join queue
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Verify session exists
    const session = sessionStore.get(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const { viewerId, viewerName, audioReady } = body;
    if (!viewerId || !viewerName) {
      return NextResponse.json(
        { success: false, error: 'viewerId and viewerName are required' },
        { status: 400 }
      );
    }

    // Join the queue
    const queueEntry = queueManager.join({
      sessionId: params.sessionId,
      viewerId,
      viewerName,
      audioReady: audioReady || false
    });

    return NextResponse.json({
      success: true,
      queueEntry
    });

  } catch (error) {
    console.error('Error joining queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}

// Get queue status
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    // Verify session exists
    const session = sessionStore.get(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const queue = queueManager.getWaiting(params.sessionId);
    return NextResponse.json({
      success: true,
      queue
    });

  } catch (error) {
    console.error('Error getting queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get queue' },
      { status: 500 }
    );
  }
}

// Remove from queue
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // Verify session exists
    const session = sessionStore.get(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const { viewerId } = body;
    if (!viewerId) {
      return NextResponse.json(
        { success: false, error: 'viewerId is required' },
        { status: 400 }
      );
    }

    // Remove from queue
    const removed = queueManager.leave(params.sessionId, viewerId);

    return NextResponse.json({
      success: true,
      removed
    });

  } catch (error) {
    console.error('Error leaving queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to leave queue' },
      { status: 500 }
    );
  }
}
