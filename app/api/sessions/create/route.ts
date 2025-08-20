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
    
    // Generate shareable link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
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
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}
