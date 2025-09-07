import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/core/queueManager';
import { sessionStore } from '@/lib/core/sessionStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const { viewerId, viewerName, audioReady } = await req.json();
    if (!viewerId || !viewerName) {
      return NextResponse.json({ success: false, error: 'viewerId & viewerName required' }, { status: 400 });
    }
    if (!sessionStore.get(params.sessionId)) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    const result = queueManager.join({ sessionId: params.sessionId, viewerId, viewerName, audioReady });
    return NextResponse.json({ success: true, queueEntry: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Join failed' }, { status: 500 });
  }
}
