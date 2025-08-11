import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/core/sessionStore';
import { CreateSessionInput } from '@/lib/core/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateSessionInput>;
    if (!body.streamerId) {
      return NextResponse.json({ success: false, error: 'streamerId required' }, { status: 400 });
    }
    const session = sessionStore.create({
      streamerId: body.streamerId,
      title: body.title,
      description: body.description,
      maxSpeakingTime: body.maxSpeakingTime,
      autoSelectEnabled: body.autoSelectEnabled,
      recordingEnabled: body.recordingEnabled,
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get('host') ? `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}` : 'http://localhost:3000');
    return NextResponse.json({
      success: true,
      session: {
        ...session,
        joinLink: `${baseUrl}/join/${session.id}`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}
