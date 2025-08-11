import { Session, CreateSessionInput, UpdateSessionSettingsInput } from './types';

// Simple in-memory store abstraction (replace with DB implementation later)
class SessionStore {
  private sessions = new Map<string, Session>();

  create(input: CreateSessionInput): Session {
    const id = 'stream-' + Math.random().toString(36).slice(2, 11);
    const session: Session = {
      id,
      streamerId: input.streamerId,
      title: input.title || 'StreamTalk Session',
      description: input.description,
      maxSpeakingTime: input.maxSpeakingTime ?? 45,
      autoSelectEnabled: input.autoSelectEnabled ?? true,
      recordingEnabled: input.recordingEnabled ?? true,
      status: 'active',
      createdAt: new Date().toISOString(),
      totalViewers: 0,
      totalSpeakers: 0,
      sessionDuration: 0,
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  update(id: string, patch: UpdateSessionSettingsInput): Session | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    const updated: Session = { ...existing, ...patch };
    this.sessions.set(id, updated);
    return updated;
  }

  end(id: string): Session | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    existing.status = 'ended';
    existing.endedAt = new Date().toISOString();
    this.sessions.set(id, existing);
    return existing;
  }
}

export const sessionStore = new SessionStore();
