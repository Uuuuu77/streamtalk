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
  signalData?: any[];
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

  // Participant operations
  async addParticipant(roomId: string, participantData: Omit<Participant, 'id' | 'joinedAt'>): Promise<string> {
    try {
      const participantWithTimestamp = {
        ...participantData,
        roomId,
        joinedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'participants'), participantWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      const participantSnap = await getDoc(participantRef);
      
      if (participantSnap.exists()) {
        return { id: participantSnap.id, ...participantSnap.data() } as Participant;
      }
      return null;
    } catch (error) {
      console.error('Error getting participant:', error);
      throw error;
    }
  }

  async updateParticipant(participantId: string, updates: Partial<Participant>): Promise<void> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      await updateDoc(participantRef, updates);
    } catch (error) {
      console.error('Error updating participant:', error);
      throw error;
    }
  }

  async removeParticipant(participantId: string): Promise<void> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      await deleteDoc(participantRef);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  subscribeToParticipants(roomId: string, callback: (participants: Participant[]) => void): () => void {
    const q = query(
      collection(db, 'participants'),
      where('roomId', '==', roomId),
      orderBy('joinedAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const participants: Participant[] = [];
      querySnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as Participant);
      });
      callback(participants);
    });
  }

  // WebRTC signaling
  async addSignalData(participantId: string, signalData: any): Promise<void> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      const participant = await getDoc(participantRef);
      
      if (participant.exists()) {
        const existingData = participant.data().signalData || [];
        await updateDoc(participantRef, {
          signalData: [...existingData, signalData]
        });
      }
    } catch (error) {
      console.error('Error adding signal data:', error);
      throw error;
    }
  }

  async clearSignalData(participantId: string): Promise<void> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      await updateDoc(participantRef, { signalData: [] });
    } catch (error) {
      console.error('Error clearing signal data:', error);
      throw error;
    }
  }
}

// Export both named and default exports
export const firestoreService = new FirestoreService();
export default firestoreService;