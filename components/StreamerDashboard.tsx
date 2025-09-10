import React, { useEffect, useRef, useState } from 'react';
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection';
import { firestoreService } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Users, Radio, Copy, Volume2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StreamerDashboardProps {
  sessionId: string;
  onEndSession: () => void;
}

export default function StreamerDashboard({ sessionId, onEndSession }: StreamerDashboardProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [hostParticipantId, setHostParticipantId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const { 
    localStream, 
    remoteStreams, 
    connectionStatus, 
    isAudioEnabled,
    toggleMicrophone,
    initializeAudio,
    createPeerConnection
  } = useWebRTCConnection({
    roomId: sessionId,
    participantId: hostParticipantId,
    myUserId: user?.uid || 'host',
    isHost: true
  });

  // Load room and create host participant
  useEffect(() => {
    const initializeHostSession = async () => {
      if (!user?.uid || isInitialized) return;

      try {
        console.log('[StreamerDashboard] Initializing host session');
        
        // Get room data
        const roomData = await firestoreService.getRoom(sessionId);
        if (!roomData) {
          console.error('[StreamerDashboard] Room not found');
          return;
        }
        
        setRoom(roomData);
        console.log('[StreamerDashboard] Room loaded:', roomData.title);

        // Create or get host participant
        let hostParticipantDocId = roomData.hostParticipantId;
        
        if (!hostParticipantDocId) {
          console.log('[StreamerDashboard] Creating host participant document');
          hostParticipantDocId = await firestoreService.createHostParticipant(
            sessionId,
            user.uid,
            user.displayName || 'Host'
          );
        }

        setHostParticipantId(hostParticipantDocId);
        console.log('[StreamerDashboard] Host participant ID:', hostParticipantDocId);

        // Initialize audio immediately (user clicked "Start Hosting")
        await initializeAudio();
        setIsInitialized(true);
        
        console.log('[StreamerDashboard] Host session initialized successfully');
      } catch (error) {
        console.error('[StreamerDashboard] Failed to initialize host session:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to set up hosting session',
          variant: 'destructive'
        });
      }
    };

    initializeHostSession();
  }, [sessionId, user, initializeAudio, isInitialized]);

  // Subscribe to participants
  useEffect(() => {
    if (!sessionId) return;

    console.log('[StreamerDashboard] Subscribing to participants');
    const unsubscribe = firestoreService.subscribeToParticipants(
      sessionId,
      (updatedParticipants) => {
        console.log(`[StreamerDashboard] Participants updated: ${updatedParticipants.length} total`);
        
        // Filter out host participant for display
        const viewerParticipants = updatedParticipants.filter(p => !p.isHost);
        setParticipants(viewerParticipants);

        // Auto-create peer connections for new participants (host initiates)
        if (hostParticipantId && isInitialized) {
          viewerParticipants.forEach(async (participant) => {
            try {
              console.log(`[StreamerDashboard] Creating peer connection to viewer: ${participant.id}`);
              await createPeerConnection(participant.id, true); // Host initiates
            } catch (error) {
              console.error(`[StreamerDashboard] Failed to create peer to ${participant.id}:`, error);
            }
          });
        }
      }
    );

    return unsubscribe;
  }, [sessionId, hostParticipantId, isInitialized, createPeerConnection]);

  // Subscribe to room updates for current speaker
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = firestoreService.subscribeToRoom(sessionId, (room) => {
      if (room?.currentSpeakerId) {
        setCurrentSpeaker(room.currentSpeakerId);
      } else {
        setCurrentSpeaker(null);
      }
    });

    return unsubscribe;
  }, [sessionId]);

  // Handle remote audio streams with automatic playback
  useEffect(() => {
    console.log(`[StreamerDashboard] Processing ${remoteStreams.size} remote streams`);
    
    remoteStreams.forEach((stream, participantId) => {
      if (!audioRefs.current.has(participantId)) {
        console.log(`[StreamerDashboard] Setting up audio element for participant: ${participantId}`);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.volume = 0.8;
        
        // Try to play audio (should work since host clicked "Start Hosting")
        audio.play().catch(error => {
          console.warn(`[StreamerDashboard] Autoplay failed for ${participantId}:`, error);
        });
        
        audioRefs.current.set(participantId, audio);
      }
    });

    // Cleanup removed streams
    audioRefs.current.forEach((audio, participantId) => {
      if (!remoteStreams.has(participantId)) {
        console.log(`[StreamerDashboard] Cleaning up audio for participant: ${participantId}`);
        audio.pause();
        audio.srcObject = null;
        audioRefs.current.delete(participantId);
      }
    });
  }, [remoteStreams]);

  const selectSpeaker = async (participantId: string) => {
    try {
      if (currentSpeaker) {
        toast({
          title: "Speaker already active",
          description: "Please end current speaker's turn first",
          variant: 'destructive'
        });
        return;
      }

      console.log(`[StreamerDashboard] Selecting speaker: ${participantId}`);

      // Update room with current speaker
      await firestoreService.updateRoom(sessionId, {
        currentSpeakerId: participantId
      });

      // Update participant status
      await firestoreService.updateParticipant(sessionId, participantId, {
        status: 'speaking',
        isMuted: false
      });

      setCurrentSpeaker(participantId);
      
      toast({
        title: "Speaker selected",
        description: "Viewer can now speak to the audience",
        variant: 'default'
      });
    } catch (error) {
      console.error('[StreamerDashboard] Error selecting speaker:', error);
      toast({
        title: "Error",
        description: "Failed to select speaker",
        variant: 'destructive'
      });
    }
  };

  const endSpeaking = async () => {
    try {
      if (!currentSpeaker) return;

      console.log(`[StreamerDashboard] Ending speaking for: ${currentSpeaker}`);

      // Update room
      await firestoreService.updateRoom(sessionId, {
        currentSpeakerId: null
      });

      // Update participant status
      await firestoreService.updateParticipant(sessionId, currentSpeaker, {
        status: 'waiting',
        isMuted: true
      });

      setCurrentSpeaker(null);
      
      toast({
        title: "Speaking ended",
        description: "Speaker has been muted",
        variant: 'default'
      });
    } catch (error) {
      console.error('[StreamerDashboard] Error ending speaking:', error);
    }
  };

  const endSession = async () => {
    try {
      console.log('[StreamerDashboard] Ending session');
      await firestoreService.updateRoom(sessionId, {
        isActive: false
      });
      onEndSession();
    } catch (error) {
      console.error('[StreamerDashboard] Error ending session:', error);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/viewer/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Invite link copied to clipboard",
      variant: 'default'
    });
  };

  const waitingParticipants = participants.filter(p => p.status === 'waiting');
  const speakingParticipant = participants.find(p => p.status === 'speaking');

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-white text-center">Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Stream<span className="text-purple-400">Talk</span> Dashboard
              </h1>
              <p className="text-gray-300">{room.title}</p>
              <p className="text-gray-400 text-sm">Session: {sessionId}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Live</span>
              </div>
              <Button
                onClick={endSession}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  Host Audio Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Your Microphone</p>
                    <p className="text-gray-400 text-sm">
                      Status: {connectionStatus} • {isAudioEnabled ? 'On' : 'Off'}
                    </p>
                    {hostParticipantId && (
                      <p className="text-gray-500 text-xs">
                        Host ID: {hostParticipantId}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={toggleMicrophone}
                      variant={isAudioEnabled ? "default" : "destructive"}
                      size="lg"
                      disabled={!isInitialized}
                    >
                      {!isInitialized ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : isAudioEnabled ? (
                        <Mic className="w-5 h-5 mr-2" />
                      ) : (
                        <MicOff className="w-5 h-5 mr-2" />
                      )}
                      {!isInitialized ? 'Initializing...' : isAudioEnabled ? 'Mic On' : 'Mic Off'}
                    </Button>
                  </div>
                </div>

                {/* Audio Level Visualization */}
                <div className="w-full bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Audio Level</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-300"
                      style={{ width: isAudioEnabled ? '60%' : '0%' }}
                    />
                  </div>
                </div>

                {/* Remote Streams Status */}
                {remoteStreams.size > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-white text-sm font-medium mb-2">Connected Viewers</h4>
                    <div className="space-y-2">
                      {Array.from(remoteStreams.keys()).map(participantId => {
                        const participant = participants.find(p => p.id === participantId);
                        return (
                          <div key={participantId} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">
                              {participant?.name || `Participant ${participantId.slice(-4)}`}
                            </span>
                            <span className="text-green-400">🎵 Audio Active</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Speaker */}
            {speakingParticipant && (
              <Card className="bg-slate-800/50 border-slate-700 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-green-400" />
                    Current Speaker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{speakingParticipant.name}</p>
                      <p className="text-gray-400 text-sm">Speaking to audience</p>
                      <p className="text-gray-500 text-xs">ID: {speakingParticipant.id}</p>
                    </div>
                    <Button
                      onClick={endSpeaking}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      End Speaking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Audio Queue ({waitingParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {waitingParticipants.length > 0 ? (
                  <div className="space-y-3">
                    {waitingParticipants.map((participant, index) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{participant.name}</p>
                          <p className="text-gray-400 text-sm">
                            Position: #{index + 1} • {remoteStreams.has(participant.id) ? 'Audio Connected' : 'Connecting...'}
                          </p>
                          <p className="text-gray-500 text-xs">ID: {participant.id}</p>
                        </div>
                        <Button
                          onClick={() => selectSpeaker(participant.id)}
                          disabled={!!currentSpeaker}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No viewers in queue</p>
                    <p className="text-gray-500 text-sm">Share your link to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share Session */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Share Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-gray-300 text-sm font-mono break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/viewer/${sessionId}`}
                  </p>
                </div>
                <Button
                  onClick={copyInviteLink}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Invite Link
                </Button>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Participants</span>
                  <span className="text-white">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">In Queue</span>
                  <span className="text-white">{waitingParticipants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio Connections</span>
                  <span className="text-white">{remoteStreams.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Host Connection</span>
                  <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                    {connectionStatus}
                  </span>
                </div>
                {hostParticipantId && (
                  <div className="pt-2 border-t border-slate-600">
                    <span className="text-gray-400 text-xs">Host Participant ID</span>
                    <p className="text-gray-300 text-xs font-mono">{hostParticipantId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}