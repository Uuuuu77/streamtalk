import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/core/queueManager';

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const queue = queueManager.getWaiting(params.sessionId);
  return NextResponse.json({ success: true, queue });
}
