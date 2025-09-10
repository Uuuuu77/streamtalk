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

export interface Room {
  id: string;
  hostId: string;
  hostParticipantId?: string; // New field for host participant document ID
  title: string;
  description?: string;
  isActive: boolean;
  maxParticipants: number;
  speakingTimeLimit: number;
  currentSpeakerId: string | null;
  participantQueue: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Participant {
  id: string;
  userId: string;
  roomId: string;
  name: string;
  status: 'waiting' | 'speaking' | 'finished';
  joinedAt: Timestamp;
  isMuted: boolean;
  isHost?: boolean; // New field to identify host participant
}

export interface SignalDoc {
  id: string;
  fromParticipantId: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  timestamp: number;
  createdAt: Timestamp;
}

export class FirestoreService {
  // Room operations
  async createRoom(roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        return { id: roomSnap.id, ...roomSnap.data() } as Room;
      }
      return null;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }

  subscribeToRoom(roomId: string, callback: (room: Room | null) => void): () => void {
    const roomRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Room);
      } else {
        callback(null);
      }
    });
  }

  // Participant operations - updated for subcollection structure
  async addParticipant(roomId: string, participantData: Omit<Participant, 'id' | 'joinedAt' | 'roomId'>): Promise<string> {
    try {
      console.log(`[Firestore] Adding participant to room ${roomId}:`, participantData.name);
      const participantWithTimestamp = {
        ...participantData,
        roomId,
        joinedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'rooms', roomId, 'participants'), participantWithTimestamp);
      console.log(`[Firestore] Participant added with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error adding participant:', error);
      throw error;
    }
  }

  async getParticipant(roomId: string, participantId: string): Promise<Participant | null> {
    try {
      const participantRef = doc(db, 'rooms', roomId, 'participants', participantId);
      const participantSnap = await getDoc(participantRef);
      
      if (participantSnap.exists()) {
        return { id: participantSnap.id, ...participantSnap.data() } as Participant;
      }
      return null;
    } catch (error) {
      console.error('[Firestore] Error getting participant:', error);
      throw error;
    }
  }

  async updateParticipant(roomId: string, participantId: string, updates: Partial<Participant>): Promise<void> {
    try {
      console.log(`[Firestore] Updating participant ${participantId}:`, updates);
      const participantRef = doc(db, 'rooms', roomId, 'participants', participantId);
      await updateDoc(participantRef, updates);
    } catch (error) {
      console.error('[Firestore] Error updating participant:', error);
      throw error;
    }
  }

  async removeParticipant(roomId: string, participantId: string): Promise<void> {
    try {
      console.log(`[Firestore] Removing participant ${participantId} from room ${roomId}`);
      const participantRef = doc(db, 'rooms', roomId, 'participants', participantId);
      await deleteDoc(participantRef);
    } catch (error) {
      console.error('[Firestore] Error removing participant:', error);
      throw error;
    }
  }

  subscribeToParticipants(roomId: string, callback: (participants: Participant[]) => void): () => void {
    console.log(`[Firestore] Subscribing to participants for room: ${roomId}`);
    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const q = query(participantsRef, orderBy('joinedAt', 'asc'));

    return onSnapshot(q, (querySnapshot) => {
      const participants: Participant[] = [];
      querySnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as Participant);
      });
      console.log(`[Firestore] Participants updated: ${participants.length} participants`);
      callback(participants);
    }, (error) => {
      console.error('[Firestore] Error in participants subscription:', error);
    });
  }

  // WebRTC signaling with signals subcollection pattern
  async addSignal(roomId: string, targetParticipantId: string, signalObj: {
    fromParticipantId: string;
    type: 'offer' | 'answer' | 'candidate';
    payload: any;
  }): Promise<string> {
    try {
      console.log(`[Firestore] Adding signal to participant ${targetParticipantId}:`, signalObj.type);
      const signalsRef = collection(db, 'rooms', roomId, 'participants', targetParticipantId, 'signals');
      const docRef = await addDoc(signalsRef, {
        ...signalObj,
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });
      console.log(`[Firestore] Signal added with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error adding signal:', error);
      throw error;
    }
  }

  subscribeToSignals(roomId: string, participantId: string, callback: (signalDoc: { id: string; data: any }) => void): () => void {
    console.log(`[Firestore] Subscribing to signals for participant: ${participantId}`);
    const signalsRef = collection(db, 'rooms', roomId, 'participants', participantId, 'signals');
    const q = query(signalsRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const signalDoc = {
            id: change.doc.id,
            data: change.doc.data()
          };
          console.log(`[Firestore] New signal received for ${participantId}:`, signalDoc.data.type);
          callback(signalDoc);
        }
      });
    }, (error) => {
      console.error('[Firestore] Error in signals subscription:', error);
    });
  }

  async deleteSignal(roomId: string, participantId: string, signalDocId: string): Promise<void> {
    try {
      console.log(`[Firestore] Deleting signal ${signalDocId} for participant ${participantId}`);
      const signalRef = doc(db, 'rooms', roomId, 'participants', participantId, 'signals', signalDocId);
      await deleteDoc(signalRef);
    } catch (error) {
      console.error('[Firestore] Error deleting signal:', error);
      throw error;
    }
  }

  // Host participant management - ensure host has a participant doc
  async createHostParticipant(roomId: string, hostUserId: string, hostName: string = 'Host'): Promise<string> {
    try {
      console.log(`[Firestore] Creating host participant for room ${roomId}`);
      const participantData = {
        userId: hostUserId,
        name: hostName,
        status: 'speaking' as const,
        isMuted: false,
        isHost: true
      };

      const docRef = await addDoc(collection(db, 'rooms', roomId, 'participants'), {
        ...participantData,
        joinedAt: serverTimestamp()
      });
      
      // Update room with host participant ID
      await this.updateRoom(roomId, { hostParticipantId: docRef.id });
      
      console.log(`[Firestore] Host participant created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error creating host participant:', error);
      throw error;
    }
  }
}

// Export both named and default exports
export const firestoreService = new FirestoreService();
export default firestoreService;