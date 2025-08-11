import { QueueEntry, QueueJoinInput, QueueJoinResult } from './types';

class QueueManager {
  private queues = new Map<string, QueueEntry[]>();

  join(input: QueueJoinInput): QueueJoinResult {
    const list = this.queues.get(input.sessionId) || [];
    if (list.find(e => e.viewerId === input.viewerId && e.status === 'waiting')) {
      throw new Error('Already in queue');
    }
    const position = list.filter(e => e.status === 'waiting').length + 1;
    const entry: QueueEntry = {
      id: 'queue-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      sessionId: input.sessionId,
      viewerId: input.viewerId,
      viewerName: input.viewerName,
      position,
      status: 'waiting',
      priorityScore: 0,
      audioReady: input.audioReady ?? false,
      joinedAt: new Date().toISOString(),
    };
    list.push(entry);
    this.queues.set(input.sessionId, list);
    return { id: entry.id, position, estimatedWait: `~${position * 2} minutes` };
  }

  leave(sessionId: string, viewerId: string): boolean {
    const list = this.queues.get(sessionId) || [];
    let changed = false;
    for (const entry of list) {
      if (entry.viewerId === viewerId && entry.status === 'waiting') {
        entry.status = 'left';
        entry.leftAt = new Date().toISOString();
        changed = true;
      }
    }
    // Recalculate positions
    let pos = 1;
    for (const entry of list.filter(e => e.status === 'waiting')) {
      entry.position = pos++;
    }
    return changed;
  }

  getWaiting(sessionId: string): QueueEntry[] {
    return (this.queues.get(sessionId) || []).filter(e => e.status === 'waiting').sort((a,b)=> a.position - b.position);
  }
}

export const queueManager = new QueueManager();
