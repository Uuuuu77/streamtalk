import { QueueEntry, QueueJoinInput, QueueJoinResult } from './types';

class QueueManager {
  private queues = new Map<string, QueueEntry[]>();

  join(input: QueueJoinInput): QueueJoinResult {
    const list = this.queues.get(input.sessionId) || [];
    
    // Check if viewer is already in queue
    const existingEntry = list.find(e => e.viewerId === input.viewerId && e.status !== 'left');
    if (existingEntry) {
      throw new Error('Already in queue');
    }
    
    // Calculate position among waiting viewers
    const waitingViewers = list.filter(e => e.status === 'waiting');
    const position = waitingViewers.length + 1;
    
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
    
    // Recalculate positions for all waiting viewers
    this.recalculatePositions(input.sessionId);
    
    return { 
      id: entry.id, 
      position, 
      estimatedWait: `~${position * 2} minutes` 
    };
  }

  leave(sessionId: string, viewerId: string): boolean {
    const list = this.queues.get(sessionId) || [];
    let changed = false;
    
    for (const entry of list) {
      if (entry.viewerId === viewerId && (entry.status === 'waiting' || entry.status === 'selected')) {
        entry.status = 'left';
        entry.leftAt = new Date().toISOString();
        changed = true;
        break;
      }
    }
    
    if (changed) {
      // Recalculate positions after someone leaves
      this.recalculatePositions(sessionId);
    }
    
    return changed;
  }

  getWaiting(sessionId: string): QueueEntry[] {
    const list = this.queues.get(sessionId) || [];
    return list.filter(e => e.status === 'waiting').sort((a, b) => a.position - b.position);
  }

  getAll(sessionId: string): QueueEntry[] {
    return this.queues.get(sessionId) || [];
  }

  selectNext(sessionId: string): QueueEntry | null {
    const waitingList = this.getWaiting(sessionId);
    if (waitingList.length === 0) return null;
    
    // Select the first person in queue
    const selected = waitingList[0];
    selected.status = 'selected';
    selected.selectedAt = new Date().toISOString();
    
    // Recalculate positions
    this.recalculatePositions(sessionId);
    
    return selected;
  }

  startSpeaking(sessionId: string, viewerId: string): QueueEntry | null {
    const list = this.queues.get(sessionId) || [];
    const entry = list.find(e => e.viewerId === viewerId && e.status === 'selected');
    
    if (!entry) return null;
    
    entry.status = 'speaking';
    entry.speakingStartedAt = new Date().toISOString();
    
    return entry;
  }

  endSpeaking(sessionId: string, viewerId: string): QueueEntry | null {
    const list = this.queues.get(sessionId) || [];
    const entry = list.find(e => e.viewerId === viewerId && e.status === 'speaking');
    
    if (!entry) return null;
    
    entry.status = 'completed';
    entry.speakingEndedAt = new Date().toISOString();
    
    return entry;
  }

  private recalculatePositions(sessionId: string): void {
    const list = this.queues.get(sessionId) || [];
    const waitingEntries = list.filter(e => e.status === 'waiting')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    
    waitingEntries.forEach((entry, index) => {
      entry.position = index + 1;
    });
  }

  // Get viewer's current queue entry
  getViewerEntry(sessionId: string, viewerId: string): QueueEntry | null {
    const list = this.queues.get(sessionId) || [];
    return list.find(e => e.viewerId === viewerId) || null;
  }

  // Get current speaker
  getCurrentSpeaker(sessionId: string): QueueEntry | null {
    const list = this.queues.get(sessionId) || [];
    return list.find(e => e.status === 'speaking') || null;
  }

  // Get statistics
  getStats(sessionId: string) {
    const list = this.queues.get(sessionId) || [];
    return {
      totalJoined: list.length,
      waiting: list.filter(e => e.status === 'waiting').length,
      completed: list.filter(e => e.status === 'completed').length,
      currentSpeaker: this.getCurrentSpeaker(sessionId),
    };
  }
}

export const queueManager = new QueueManager();
