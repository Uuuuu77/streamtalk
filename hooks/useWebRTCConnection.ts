import { useState, useEffect, useCallback, useRef } from 'react';
import { firestoreService } from '@/lib/firestore';
import SimplePeer from 'simple-peer';
import { toast } from '@/hooks/use-toast';

interface UseWebRTCConnectionProps {
  roomId: string;
  userId: string;
  isHost: boolean;
}

export const useWebRTCConnection = ({ roomId, userId, isHost }: UseWebRTCConnectionProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peers, setPeers] = useState<Map<string, SimplePeer.Instance>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());

  // Initialize local audio stream
  const initializeAudio = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: false
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnectionStatus('connected');
      
      toast({
        title: '🎤 Microphone Connected',
        description: 'Your audio is ready',
        variant: 'default'
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to get audio:', error);
      setConnectionStatus('disconnected');
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to continue',
        variant: 'destructive'
      });
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(async (targetUserId: string, initiator: boolean) => {
    if (!localStreamRef.current) {
      await initializeAudio();
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStreamRef.current!,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Add TURN servers for better connectivity
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
          }
        ]
      }
    });

    // Handle signaling
    peer.on('signal', async (data) => {
      console.log('Sending signal to:', targetUserId);
      try {
        // Store signal in Firestore
        await firestoreService.addSignalData(roomId, targetUserId, {
          from: userId,
          to: targetUserId,
          type: 'signal',
          signal: data,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Failed to send signal:', error);
      }
    });

    // Handle incoming stream
    peer.on('stream', (stream) => {
      console.log('Received stream from:', targetUserId);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.set(targetUserId, stream);
        return updated;
      });
    });

    // Handle connection
    peer.on('connect', () => {
      console.log('Connected to peer:', targetUserId);
      toast({
        title: '✅ Audio Connected',
        description: 'Audio connection established',
        variant: 'default'
      });
    });

    // Handle errors
    peer.on('error', (error) => {
      console.error('Peer error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to establish audio connection',
        variant: 'destructive'
      });
    });

    // Handle close
    peer.on('close', () => {
      console.log('Peer disconnected:', targetUserId);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.delete(targetUserId);
        return updated;
      });
      
      peersRef.current.delete(targetUserId);
      setPeers(new Map(peersRef.current));
    });

    peersRef.current.set(targetUserId, peer);
    setPeers(new Map(peersRef.current));

    return peer;
  }, [userId, roomId, initializeAudio]);

  // Handle incoming signals
  const handleIncomingSignal = useCallback(async (fromUserId: string, signalData: any) => {
    let peer = peersRef.current.get(fromUserId);
    
    if (!peer) {
      // Create new peer as responder
      peer = await createPeerConnection(fromUserId, false);
    }
    
    try {
      peer.signal(signalData);
    } catch (error) {
      console.error('Failed to handle signal:', error);
    }
  }, [createPeerConnection]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      toast({
        title: isAudioEnabled ? '🔇 Muted' : '🎤 Unmuted',
        description: isAudioEnabled ? 'Your microphone is muted' : 'Your microphone is active',
        variant: 'default'
      });
    }
  }, [isAudioEnabled]);

  // Listen for incoming signals
  useEffect(() => {
    if (!userId || !roomId) return;

    // Subscribe to signals meant for this user
    const unsubscribe = firestoreService.subscribeToSignals(roomId, userId, async (signals) => {
      for (const signal of signals) {
        if (signal.from !== userId && signal.to === userId) {
          await handleIncomingSignal(signal.from, signal.signal);
        }
      }
    });

    return () => unsubscribe();
  }, [userId, roomId, handleIncomingSignal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peersRef.current.forEach(peer => peer.destroy());
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    connectionStatus,
    toggleMicrophone,
    initializeAudio,
    createPeerConnection
  };
};