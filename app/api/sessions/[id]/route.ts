import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/core/sessionStore';
import { queueManager } from '@/lib/core/queueManager';
import { UpdateSessionSettingsInput } from '@/lib/core/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = sessionStore.get(params.id);
  if (!session) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  
  // Get queue information
  const queue = queueManager.getWaiting(params.id);
  
  return NextResponse.json({ 
    success: true, 
    session: {
      ...session,
      queueLength: queue.length,
      waitingViewers: queue,
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patch = (await req.json()) as UpdateSessionSettingsInput;
    const updated = sessionStore.update(params.id, patch);
    if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, session: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ended = sessionStore.end(params.id);
  if (!ended) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, session: ended });
}
