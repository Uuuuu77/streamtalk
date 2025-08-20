// Core shared types for StreamTalk Phase 1

export type SessionStatus = 'active' | 'ended' | 'scheduled';
export type QueueEntryStatus = 'waiting' | 'selected' | 'speaking' | 'completed' | 'left';

export interface Session {
  id: string;
  streamerId: string;
  title: string;
  description?: string;
  maxSpeakingTime: number;
  autoSelectEnabled: boolean;
  status: SessionStatus;
  recordingEnabled: boolean;
  recordingPath?: string;
  createdAt: string; // ISO
  startedAt?: string;
  endedAt?: string;
  totalViewers: number;
  totalSpeakers: number;
  sessionDuration: number; // seconds
}

export interface QueueEntry {
  id: string;
  sessionId: string;
  viewerId: string;
  viewerName: string;
  position: number;
  status: QueueEntryStatus;
  priorityScore: number;
  audioReady: boolean;
  joinedAt: string;
  selectedAt?: string;
  speakingStartedAt?: string;
  speakingEndedAt?: string;
  leftAt?: string;
  connectionQuality?: Record<string, any>;
}

export interface CreateSessionInput {
  streamerId: string;
  title?: string;
  description?: string;
  maxSpeakingTime?: number;
  autoSelectEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface UpdateSessionSettingsInput {
  title?: string;
  description?: string;
  maxSpeakingTime?: number;
  autoSelectEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface QueueJoinInput {
  sessionId: string;
  viewerId: string;
  viewerName: string;
  audioReady?: boolean;
}

export interface QueueJoinResult {
  id: string;
  position: number;
  estimatedWait: string;
}
