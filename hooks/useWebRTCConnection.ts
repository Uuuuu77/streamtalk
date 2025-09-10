import { useState, useEffect, useCallback, useRef } from 'react';
import { firestoreService } from '@/lib/firestore';
import SimplePeer from 'simple-peer';
import { toast } from '@/hooks/use-toast';

interface UseWebRTCConnectionProps {
  roomId: string;
  participantId: string | null; // The participant document ID
  myUserId: string; // The user ID for mapping
  isHost: boolean;
}

export const useWebRTCConnection = ({ roomId, participantId, myUserId, isHost }: UseWebRTCConnectionProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peers, setPeers] = useState<Map<string, SimplePeer.Instance>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const signalUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize local audio stream
  const initializeAudio = useCallback(async () => {
    if (localStreamRef.current) {
      console.log('[WebRTC] Audio already initialized');
      return localStreamRef.current;
    }

    try {
      console.log('[WebRTC] Initializing audio...');
      setConnectionStatus('connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      });
      
      console.log('[WebRTC] Audio stream obtained successfully');
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
      console.error('[WebRTC] Failed to get audio:', error);
      setConnectionStatus('disconnected');
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to continue',
        variant: 'destructive'
      });
      throw error;
    }
  }, []);

  // Determine signal type from payload
  const getSignalType = useCallback((payload: any): 'offer' | 'answer' | 'candidate' => {
    if (payload.type === 'offer') return 'offer';
    if (payload.type === 'answer') return 'answer';
    if (payload.candidate) return 'candidate';
    return 'offer'; // fallback
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(async (targetParticipantId: string, initiator: boolean): Promise<SimplePeer.Instance> => {
    console.log(`[WebRTC] Creating peer connection to ${targetParticipantId}, initiator: ${initiator}`);
    
    // Ensure we have audio if we're initiating or if we're the host
    if (!localStreamRef.current && (initiator || isHost)) {
      console.log('[WebRTC] Initializing audio for peer connection');
      await initializeAudio();
    }

    // Check if peer already exists
    const existingPeer = peersRef.current.get(targetParticipantId);
    if (existingPeer) {
      console.log(`[WebRTC] Peer already exists for ${targetParticipantId}, destroying old connection`);
      existingPeer.destroy();
      peersRef.current.delete(targetParticipantId);
    }

    const peerConfig = {
      initiator,
      trickle: true,
      stream: localStreamRef.current || undefined,
      config: {
        iceServers: [
          // Google's reliable public STUN servers
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          // Additional reliable STUN servers for fallback
          { urls: 'stun:stun.services.mozilla.com' },
          { urls: 'stun:stun.nextcloud.com:443' },
          // Free TURN server for relay when direct connection fails
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
          },
          // Custom TURN server from env (if configured) - takes priority
          ...(process.env.NEXT_PUBLIC_TURN_URL ? [{
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
            credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || ''
          }] : [])
        ]
      }
    };

    console.log('[WebRTC] Creating SimplePeer with config:', { 
      initiator, 
      hasStream: !!localStreamRef.current,
      iceServers: peerConfig.config.iceServers.length 
    });

    const peer = new SimplePeer(peerConfig);

    // Handle signaling
    peer.on('signal', async (data) => {
      console.log(`[WebRTC] Sending ${getSignalType(data)} signal to ${targetParticipantId}:`, data);
      try {
        if (!participantId) {
          console.error('[WebRTC] Cannot send signal: participantId is null');
          return;
        }

        await firestoreService.addSignal(roomId, targetParticipantId, {
          fromParticipantId: participantId,
          type: getSignalType(data),
          payload: data
        });
        console.log(`[WebRTC] Signal sent successfully to ${targetParticipantId}`);
      } catch (error) {
        console.error('[WebRTC] Failed to send signal:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to send connection signal',
          variant: 'destructive'
        });
      }
    });

    // Handle incoming stream
    peer.on('stream', (stream) => {
      console.log(`[WebRTC] Received stream from ${targetParticipantId}:`, {
        id: stream.id,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.set(targetParticipantId, stream);
        console.log(`[WebRTC] Updated remote streams, total: ${updated.size}`);
        return updated;
      });

      toast({
        title: '🎵 Audio Connected',
        description: 'Receiving audio stream',
        variant: 'default'
      });
    });

    // Handle connection established
    peer.on('connect', () => {
      console.log(`[WebRTC] Peer connected successfully: ${targetParticipantId}`);
      toast({
        title: '✅ Connection Established',
        description: 'Audio connection is ready',
        variant: 'default'
      });
    });

    // Handle errors
    peer.on('error', (error) => {
      console.error(`[WebRTC] Peer error with ${targetParticipantId}:`, error);
      toast({
        title: 'Connection Error',
        description: `Failed to connect: ${error.message}`,
        variant: 'destructive'
      });
    });

    // Handle disconnection
    peer.on('close', () => {
      console.log(`[WebRTC] Peer disconnected: ${targetParticipantId}`);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.delete(targetParticipantId);
        console.log(`[WebRTC] Removed stream, remaining: ${updated.size}`);
        return updated;
      });
      
      peersRef.current.delete(targetParticipantId);
      setPeers(new Map(peersRef.current));
    });

    // Store peer reference
    peersRef.current.set(targetParticipantId, peer);
    setPeers(new Map(peersRef.current));

    console.log(`[WebRTC] Peer created and stored for ${targetParticipantId}`);
    return peer;
  }, [roomId, participantId, isHost, initializeAudio, getSignalType]);

  // Handle incoming signal
  const handleIncomingSignal = useCallback(async (signalDoc: { id: string; data: any }) => {
    const { fromParticipantId, payload, type } = signalDoc.data;
    
    console.log(`[WebRTC] Processing incoming ${type} signal from ${fromParticipantId}:`, payload);
    
    if (!participantId) {
      console.error('[WebRTC] Cannot process signal: participantId is null');
      return;
    }

    try {
      let peer = peersRef.current.get(fromParticipantId);
      
      if (!peer) {
        console.log(`[WebRTC] No existing peer for ${fromParticipantId}, creating new peer as responder`);
        // Create peer as responder (initiator: false)
        peer = await createPeerConnection(fromParticipantId, false);
      }
      
      console.log(`[WebRTC] Signaling peer with ${type} data`);
      peer.signal(payload);
      
      // Delete the processed signal
      await firestoreService.deleteSignal(roomId, participantId, signalDoc.id);
      console.log(`[WebRTC] Signal ${signalDoc.id} processed and deleted`);
      
    } catch (error) {
      console.error('[WebRTC] Failed to handle incoming signal:', error);
      // Still try to delete the signal to avoid processing it again
      try {
        await firestoreService.deleteSignal(roomId, participantId, signalDoc.id);
      } catch (deleteError) {
        console.error('[WebRTC] Failed to delete problematic signal:', deleteError);
      }
    }
  }, [roomId, participantId, createPeerConnection]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newEnabledState = !isAudioEnabled;
      
      audioTracks.forEach(track => {
        track.enabled = newEnabledState;
      });
      
      setIsAudioEnabled(newEnabledState);
      
      console.log(`[WebRTC] Microphone ${newEnabledState ? 'enabled' : 'disabled'}`);
      
      toast({
        title: newEnabledState ? '🎤 Unmuted' : '🔇 Muted',
        description: newEnabledState ? 'Your microphone is active' : 'Your microphone is muted',
        variant: 'default'
      });
    } else {
      console.warn('[WebRTC] Cannot toggle microphone: no local stream');
    }
  }, [isAudioEnabled]);

  // Subscribe to incoming signals
  useEffect(() => {
    if (!participantId || !roomId) {
      console.log('[WebRTC] Skipping signal subscription: missing participantId or roomId');
      return;
    }

    console.log(`[WebRTC] Setting up signal subscription for participant: ${participantId}`);

    // Clean up previous subscription
    if (signalUnsubscribeRef.current) {
      signalUnsubscribeRef.current();
      signalUnsubscribeRef.current = null;
    }

    // Subscribe to signals for this participant
    const unsubscribe = firestoreService.subscribeToSignals(
      roomId, 
      participantId, 
      handleIncomingSignal
    );

    signalUnsubscribeRef.current = unsubscribe;

    return () => {
      console.log(`[WebRTC] Cleaning up signal subscription for ${participantId}`);
      if (signalUnsubscribeRef.current) {
        signalUnsubscribeRef.current();
        signalUnsubscribeRef.current = null;
      }
    };
  }, [roomId, participantId, handleIncomingSignal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[WebRTC] Cleaning up WebRTC connection');
      
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`[WebRTC] Stopped track: ${track.kind}`);
        });
      }
      
      // Close all peer connections
      peersRef.current.forEach((peer, participantId) => {
        console.log(`[WebRTC] Destroying peer connection to ${participantId}`);
        peer.destroy();
      });
      peersRef.current.clear();

      // Clean up signal subscription
      if (signalUnsubscribeRef.current) {
        signalUnsubscribeRef.current();
        signalUnsubscribeRef.current = null;
      }
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