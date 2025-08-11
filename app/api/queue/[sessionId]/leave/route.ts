import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/core/queueManager';

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { viewerId } = await req.json();
    if (!viewerId) return NextResponse.json({ success: false, error: 'viewerId required' }, { status: 400 });
    const changed = queueManager.leave(params.sessionId, viewerId);
    if (!changed) return NextResponse.json({ success: false, error: 'Not in queue' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Leave failed' }, { status: 500 });
  }
}
