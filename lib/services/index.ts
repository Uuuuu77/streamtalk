/**
 * Service Layer Architecture
 * Clean separation of concerns with proper abstractions
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppError, NetworkError, ValidationError } from '@/components/error-handling';
import { ValidationHelpers, APISchemas } from '@/lib/validation';

// Base service interface
interface IBaseService<T> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  get(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  subscribe(id: string, callback: (data: T | null) => void): () => void;
}

// Domain models
export interface SessionModel {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  isActive: boolean;
  maxParticipants: number;
  speakingTimeLimit: number;
  currentSpeakerId: string | null;
  participantQueue: string[];
  settings: SessionSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ParticipantModel {
  id: string;
  userId: string;
  sessionId: string;
  displayName: string;
  role: 'host' | 'speaker' | 'viewer';
  status: 'waiting' | 'speaking' | 'finished' | 'muted';
  joinedAt: Timestamp;
  permissions: ParticipantPermissions;
  connectionData?: WebRTCConnectionData;
}

export interface QueueEntryModel {
  id: string;
  sessionId: string;
  participantId: string;
  position: number;
  joinedQueueAt: Timestamp;
  estimatedWaitTime: number;
  status: 'waiting' | 'selected' | 'speaking' | 'finished';
}

export interface SessionSettings {
  allowAnonymous: boolean;
  requireApproval: boolean;
  maxQueueSize: number;
  autoSelectNext: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
}

export interface ParticipantPermissions {
  canSpeak: boolean;
  canJoinQueue: boolean;
  canViewQueue: boolean;
  canSendMessages: boolean;
}

export interface WebRTCConnectionData {
  peerId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  lastSignalAt: Timestamp;
}

// Session Service
export class SessionService implements IBaseService<SessionModel> {
  private readonly collection = 'sessions';

  async create(sessionData: Omit<SessionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate input
      const validation = ValidationHelpers.validateInput(
        APISchemas.sessions.create,
        sessionData
      );

      if (!validation.success) {
        throw new ValidationError('Invalid session data', validation.errors?.[0]?.field);
      }

      const docRef = await addDoc(collection(db, this.collection), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new NetworkError('Failed to create session');
    }
  }

  async get(sessionId: string): Promise<SessionModel | null> {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        return { id: sessionSnap.id, ...sessionSnap.data() } as SessionModel;
      }
      return null;
    } catch (error) {
      throw new NetworkError('Failed to fetch session');
    }
  }

  async update(sessionId: string, updates: Partial<SessionModel>): Promise<void> {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new NetworkError('Failed to update session');
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      throw new NetworkError('Failed to delete session');
    }
  }

  subscribe(sessionId: string, callback: (session: SessionModel | null) => void): () => void {
    const sessionRef = doc(db, this.collection, sessionId);
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as SessionModel);
      } else {
        callback(null);
      }
    });
  }

  // Session-specific methods
  async joinSession(sessionId: string, participantData: Omit<ParticipantModel, 'id' | 'joinedAt'>): Promise<string> {
    try {
      const session = await this.get(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      if (!session.isActive) {
        throw new AppError('Session is not active', 400);
      }

      // Check participant limit
      const currentParticipants = await this.getParticipantCount(sessionId);
      if (currentParticipants >= session.maxParticipants) {
        throw new AppError('Session is full', 400);
      }

      // Create participant
      const participantService = new ParticipantService();
      return await participantService.create({
        ...participantData,
        sessionId
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to join session');
    }
  }

  async leaveSession(sessionId: string, participantId: string): Promise<void> {
    try {
      // Remove from queue if present
      const queueService = new QueueService();
      await queueService.removeFromQueue(sessionId, participantId);

      // Remove participant
      const participantService = new ParticipantService();
      await participantService.delete(participantId);
    } catch (error) {
      throw new NetworkError('Failed to leave session');
    }
  }

  async getParticipantCount(sessionId: string): Promise<number> {
    const participantService = new ParticipantService();
    const participants = await participantService.getBySession(sessionId);
    return participants.length;
  }

  async endSession(sessionId: string, hostId: string): Promise<void> {
    try {
      const session = await this.get(sessionId);
      if (!session || session.hostId !== hostId) {
        throw new AppError('Unauthorized to end session', 403);
      }

      // Update session to inactive
      await this.update(sessionId, { isActive: false });

      // Clean up participants and queue
      const participantService = new ParticipantService();
      const queueService = new QueueService();
      
      await participantService.removeAllFromSession(sessionId);
      await queueService.clearQueue(sessionId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to end session');
    }
  }
}

// Participant Service
export class ParticipantService implements IBaseService<ParticipantModel> {
  private readonly collection = 'participants';

  async create(participantData: Omit<ParticipantModel, 'id' | 'joinedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...participantData,
        joinedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw new NetworkError('Failed to create participant');
    }
  }

  async get(participantId: string): Promise<ParticipantModel | null> {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const participantSnap = await getDoc(participantRef);
      
      if (participantSnap.exists()) {
        return { id: participantSnap.id, ...participantSnap.data() } as ParticipantModel;
      }
      return null;
    } catch (error) {
      throw new NetworkError('Failed to fetch participant');
    }
  }

  async update(participantId: string, updates: Partial<ParticipantModel>): Promise<void> {
    try {
      const participantRef = doc(db, this.collection, participantId);
      await updateDoc(participantRef, updates);
    } catch (error) {
      throw new NetworkError('Failed to update participant');
    }
  }

  async delete(participantId: string): Promise<void> {
    try {
      const participantRef = doc(db, this.collection, participantId);
      await deleteDoc(participantRef);
    } catch (error) {
      throw new NetworkError('Failed to delete participant');
    }
  }

  subscribe(participantId: string, callback: (participant: ParticipantModel | null) => void): () => void {
    const participantRef = doc(db, this.collection, participantId);
    return onSnapshot(participantRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as ParticipantModel);
      } else {
        callback(null);
      }
    });
  }

  async getBySession(sessionId: string): Promise<ParticipantModel[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('sessionId', '==', sessionId),
        orderBy('joinedAt', 'asc')
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const participants: ParticipantModel[] = [];
          querySnapshot.forEach((doc) => {
            participants.push({ id: doc.id, ...doc.data() } as ParticipantModel);
          });
          unsubscribe();
          resolve(participants);
        }, reject);
      });
    } catch (error) {
      throw new NetworkError('Failed to fetch session participants');
    }
  }

  async removeAllFromSession(sessionId: string): Promise<void> {
    try {
      const participants = await this.getBySession(sessionId);
      const deletePromises = participants.map(p => this.delete(p.id));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new NetworkError('Failed to remove participants');
    }
  }

  subscribeToSession(sessionId: string, callback: (participants: ParticipantModel[]) => void): () => void {
    const q = query(
      collection(db, this.collection),
      where('sessionId', '==', sessionId),
      orderBy('joinedAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const participants: ParticipantModel[] = [];
      querySnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as ParticipantModel);
      });
      callback(participants);
    });
  }
}

// Queue Service
export class QueueService implements IBaseService<QueueEntryModel> {
  private readonly collection = 'queue_entries';

  async create(queueData: Omit<QueueEntryModel, 'id' | 'joinedQueueAt'>): Promise<string> {
    try {
      // Validate queue entry
      const validation = ValidationHelpers.validateInput(
        APISchemas.queue.join,
        queueData
      );

      if (!validation.success) {
        throw new ValidationError('Invalid queue data');
      }

      const docRef = await addDoc(collection(db, this.collection), {
        ...queueData,
        joinedQueueAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new NetworkError('Failed to join queue');
    }
  }

  async get(queueEntryId: string): Promise<QueueEntryModel | null> {
    try {
      const queueRef = doc(db, this.collection, queueEntryId);
      const queueSnap = await getDoc(queueRef);
      
      if (queueSnap.exists()) {
        return { id: queueSnap.id, ...queueSnap.data() } as QueueEntryModel;
      }
      return null;
    } catch (error) {
      throw new NetworkError('Failed to fetch queue entry');
    }
  }

  async update(queueEntryId: string, updates: Partial<QueueEntryModel>): Promise<void> {
    try {
      const queueRef = doc(db, this.collection, queueEntryId);
      await updateDoc(queueRef, updates);
    } catch (error) {
      throw new NetworkError('Failed to update queue entry');
    }
  }

  async delete(queueEntryId: string): Promise<void> {
    try {
      const queueRef = doc(db, this.collection, queueEntryId);
      await deleteDoc(queueRef);
    } catch (error) {
      throw new NetworkError('Failed to delete queue entry');
    }
  }

  subscribe(queueEntryId: string, callback: (entry: QueueEntryModel | null) => void): () => void {
    const queueRef = doc(db, this.collection, queueEntryId);
    return onSnapshot(queueRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as QueueEntryModel);
      } else {
        callback(null);
      }
    });
  }

  // Queue-specific methods
  async joinQueue(sessionId: string, participantId: string): Promise<string> {
    try {
      // Check if already in queue
      const existingEntry = await this.findByParticipant(sessionId, participantId);
      if (existingEntry) {
        throw new AppError('Already in queue', 400);
      }

      // Get current queue for position calculation
      const currentQueue = await this.getSessionQueue(sessionId);
      const position = currentQueue.length + 1;

      // Estimate wait time (assuming 45 seconds per speaker)
      const estimatedWaitTime = position * 45000; // milliseconds

      return await this.create({
        sessionId,
        participantId,
        position,
        estimatedWaitTime,
        status: 'waiting'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to join queue');
    }
  }

  async leaveQueue(sessionId: string, participantId: string): Promise<void> {
    try {
      const queueEntry = await this.findByParticipant(sessionId, participantId);
      if (!queueEntry) {
        throw new AppError('Not in queue', 400);
      }

      await this.delete(queueEntry.id);
      
      // Reorder remaining queue entries
      await this.reorderQueue(sessionId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new NetworkError('Failed to leave queue');
    }
  }

  async getSessionQueue(sessionId: string): Promise<QueueEntryModel[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('sessionId', '==', sessionId),
        where('status', '==', 'waiting'),
        orderBy('position', 'asc')
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const queue: QueueEntryModel[] = [];
          querySnapshot.forEach((doc) => {
            queue.push({ id: doc.id, ...doc.data() } as QueueEntryModel);
          });
          unsubscribe();
          resolve(queue);
        }, reject);
      });
    } catch (error) {
      throw new NetworkError('Failed to fetch queue');
    }
  }

  async selectNextSpeaker(sessionId: string): Promise<QueueEntryModel | null> {
    try {
      const queue = await this.getSessionQueue(sessionId);
      if (queue.length === 0) return null;

      const nextSpeaker = queue[0];
      await this.update(nextSpeaker.id, { status: 'selected' });
      
      // Reorder remaining queue
      await this.reorderQueue(sessionId);
      
      return nextSpeaker;
    } catch (error) {
      throw new NetworkError('Failed to select next speaker');
    }
  }

  async removeFromQueue(sessionId: string, participantId: string): Promise<void> {
    try {
      const queueEntry = await this.findByParticipant(sessionId, participantId);
      if (queueEntry) {
        await this.delete(queueEntry.id);
        await this.reorderQueue(sessionId);
      }
    } catch (error) {
      throw new NetworkError('Failed to remove from queue');
    }
  }

  async clearQueue(sessionId: string): Promise<void> {
    try {
      const queue = await this.getSessionQueue(sessionId);
      const deletePromises = queue.map(entry => this.delete(entry.id));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new NetworkError('Failed to clear queue');
    }
  }

  private async findByParticipant(sessionId: string, participantId: string): Promise<QueueEntryModel | null> {
    try {
      const q = query(
        collection(db, this.collection),
        where('sessionId', '==', sessionId),
        where('participantId', '==', participantId),
        where('status', '==', 'waiting')
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          let entry: QueueEntryModel | null = null;
          querySnapshot.forEach((doc) => {
            entry = { id: doc.id, ...doc.data() } as QueueEntryModel;
          });
          unsubscribe();
          resolve(entry);
        }, reject);
      });
    } catch (error) {
      throw new NetworkError('Failed to find participant in queue');
    }
  }

  private async reorderQueue(sessionId: string): Promise<void> {
    try {
      const queue = await this.getSessionQueue(sessionId);
      const updatePromises = queue.map((entry, index) => 
        this.update(entry.id, { 
          position: index + 1,
          estimatedWaitTime: (index + 1) * 45000 
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      throw new NetworkError('Failed to reorder queue');
    }
  }

  subscribeToSessionQueue(sessionId: string, callback: (queue: QueueEntryModel[]) => void): () => void {
    const q = query(
      collection(db, this.collection),
      where('sessionId', '==', sessionId),
      where('status', '==', 'waiting'),
      orderBy('position', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const queue: QueueEntryModel[] = [];
      querySnapshot.forEach((doc) => {
        queue.push({ id: doc.id, ...doc.data() } as QueueEntryModel);
      });
      callback(queue);
    });
  }
}

// WebRTC Signaling Service
export class WebRTCService {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private signalingHandlers = new Map<string, (data: any) => void>();

  async createPeerConnection(peerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    try {
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      const peerConnection = new RTCPeerConnection(config);
      this.peerConnections.set(peerId, peerConnection);

      // Set up event handlers
      this.setupPeerConnectionHandlers(peerConnection, peerId);

      return peerConnection;
    } catch (error) {
      throw new AppError('Failed to create peer connection', 500);
    }
  }

  async handleSignaling(fromPeer: string, toPeer: string, signalData: any): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(toPeer);
      if (!peerConnection) {
        throw new AppError('Peer connection not found', 404);
      }

      switch (signalData.type) {
        case 'offer':
          await peerConnection.setRemoteDescription(signalData);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          // Send answer back through signaling service
          break;
          
        case 'answer':
          await peerConnection.setRemoteDescription(signalData);
          break;
          
        case 'ice-candidate':
          await peerConnection.addIceCandidate(signalData);
          break;
      }
    } catch (error) {
      throw new AppError('Failed to handle signaling data', 500);
    }
  }

  private setupPeerConnectionHandlers(peerConnection: RTCPeerConnection, peerId: string): void {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate through signaling service
        this.sendSignal(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      // Handle incoming audio stream
      const audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.srcObject = event.streams[0];
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, peerConnection.connectionState);
    };
  }

  private sendSignal(peerId: string, data: any): void {
    const handler = this.signalingHandlers.get(peerId);
    if (handler) {
      handler(data);
    }
  }

  registerSignalingHandler(peerId: string, handler: (data: any) => void): void {
    this.signalingHandlers.set(peerId, handler);
  }

  async closePeerConnection(peerId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
      this.signalingHandlers.delete(peerId);
    }
  }

  async addLocalStream(peerId: string, stream: MediaStream): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    }
  }
}

// Service Factory for dependency injection
export class ServiceFactory {
  private static instances = new Map<string, any>();

  static getSessionService(): SessionService {
    if (!this.instances.has('session')) {
      this.instances.set('session', new SessionService());
    }
    return this.instances.get('session');
  }

  static getParticipantService(): ParticipantService {
    if (!this.instances.has('participant')) {
      this.instances.set('participant', new ParticipantService());
    }
    return this.instances.get('participant');
  }

  static getQueueService(): QueueService {
    if (!this.instances.has('queue')) {
      this.instances.set('queue', new QueueService());
    }
    return this.instances.get('queue');
  }

  static getWebRTCService(): WebRTCService {
    if (!this.instances.has('webrtc')) {
      this.instances.set('webrtc', new WebRTCService());
    }
    return this.instances.get('webrtc');
  }
}

export default {
  SessionService,
  ParticipantService,
  QueueService,
  WebRTCService,
  ServiceFactory
};