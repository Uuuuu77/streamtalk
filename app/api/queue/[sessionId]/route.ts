import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/core/queueManager';
import { sessionStore } from '@/lib/core/sessionStore';

// Join queue
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await request.json();
    
    // Verify session exists
    const session = sessionStore.get(params.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Join queue
    const queueEntry = queueManager.join({
      sessionId: params.sessionId,
      viewerId: body.viewerId || `viewer-${Date.now()}`,
      viewerName: body.viewerName || 'Anonymous',
      audioReady: body.audioReady || false,
    });

    return NextResponse.json({
      success: true,
      queueEntry: {
        ...queueEntry,
        sessionId: params.sessionId,
      }
    });
  } catch (error: any) {
    console.error('Error joining queue:', error);
    
    if (error.message === 'Already in queue') {
      return NextResponse.json(
        { error: 'Already in queue' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}

// Get queue status
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const queue = queueManager.getWaiting(params.sessionId);
    
    return NextResponse.json({
      success: true,
      queue: queue,
      totalWaiting: queue.length,
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

// Leave queue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get('viewerId');
    
    if (!viewerId) {
      return NextResponse.json(
        { error: 'viewerId is required' },
        { status: 400 }
      );
    }

    const removed = queueManager.leave(params.sessionId, viewerId);
    
    if (!removed) {
      return NextResponse.json(
        { error: 'Not in queue' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Left queue successfully'
    });
  } catch (error) {
    console.error('Error leaving queue:', error);
    return NextResponse.json(
      { error: 'Failed to leave queue' },
      { status: 500 }
    );
  }
}