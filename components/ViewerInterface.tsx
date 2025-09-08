import React, { useEffect, useState, useRef } from 'react';
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection';
import { firestoreService } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Users, Radio, Loader2, Volume2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ViewerInterfaceProps {
  sessionId: string;
}

export default function ViewerInterface({ sessionId }: ViewerInterfaceProps) {
  const [viewerName, setViewerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [userId] = useState(`viewer-${Math.random().toString(36).substr(2, 9)}`);
  const [room, setRoom] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hostAudioRef = useRef<HTMLAudioElement>(null);

  const {
    localStream,
    remoteStreams,
    isAudioEnabled,
    connectionStatus,
    toggleMicrophone,
    initializeAudio,
    createPeerConnection
  } = useWebRTCConnection({
    roomId: sessionId,
    userId: userId,
    isHost: false
  });

  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomData = await firestoreService.getRoom(sessionId);
        if (roomData) {
          setRoom(roomData);
        } else {
          toast({
            title: 'Session Not Found',
            description: 'This session does not exist or has ended',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Failed to load room:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to session',
          variant: 'destructive'
        });
      }
    };
    loadRoom();

    // Subscribe to room updates
    const unsubscribe = firestoreService.subscribeToRoom(sessionId, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom);
        
        // Check if this user is currently speaking
        if (participantId && updatedRoom.currentSpeakerId === participantId) {
          setIsSpeaking(true);
        } else {
          setIsSpeaking(false);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, participantId]);

  // Subscribe to queue position updates
  useEffect(() => {
    if (!hasJoined || !participantId) return;

    const unsubscribe = firestoreService.subscribeToParticipants(sessionId, (participants) => {
      const waitingParticipants = participants
        .filter(p => p.status === 'waiting')
        .sort((a, b) => a.joinedAt.toMillis() - b.joinedAt.toMillis());
      
      const myIndex = waitingParticipants.findIndex(p => p.id === participantId);
      setQueuePosition(myIndex >= 0 ? myIndex + 1 : null);
    });

    return () => unsubscribe();
  }, [hasJoined, participantId, sessionId]);

  // Play host audio
  useEffect(() => {
    const hostStream = remoteStreams.get(room?.hostId);
    if (hostStream && hostAudioRef.current) {
      hostAudioRef.current.srcObject = hostStream;
      hostAudioRef.current.volume = 0.8;
      hostAudioRef.current.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [remoteStreams, room?.hostId]);

  // Handle speaking status changes
  useEffect(() => {
    if (isSpeaking && !isInitialized) {
      // Initialize audio when selected to speak
      initializeAudio().then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error('Failed to initialize audio for speaking:', error);
        toast({
          title: 'Microphone Required',
          description: 'Please allow microphone access to speak',
          variant: 'destructive'
        });
      });
    }
  }, [isSpeaking, isInitialized, initializeAudio]);

  const joinQueue = async () => {
    if (!viewerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to join',
        variant: 'destructive'
      });
      return;
    }

    if (!room?.isActive) {
      toast({
        title: 'Session Ended',
        description: 'This session is no longer active',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Initialize audio for connection (without speaking permission yet)
      await initializeAudio();
      setIsInitialized(true);

      // Add participant to Firestore
      const participantData = {
        userId: userId,
        roomId: sessionId,
        name: viewerName,
        status: 'waiting' as const,
        isMuted: true // Start muted until selected to speak
      };

      const id = await firestoreService.addParticipant(sessionId, participantData);
      setParticipantId(id);
      setHasJoined(true);

      // Create peer connection to host
      if (room.hostId) {
        await createPeerConnection(room.hostId, true);
      }

      toast({
        title: 'Joined Queue! 🎤',
        description: 'You are now in the queue to speak',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to join queue:', error);
      toast({
        title: 'Failed to Join',
        description: 'Could not join the queue. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const leaveQueue = async () => {
    if (participantId) {
      try {
        await firestoreService.removeParticipant(participantId);
        setHasJoined(false);
        setParticipantId(null);
        setQueuePosition(null);
        setIsSpeaking(false);
        setIsInitialized(false);
        
        toast({
          title: 'Left Queue',
          description: 'You have left the queue',
          variant: 'default'
        });
      } catch (error) {
        console.error('Failed to leave queue:', error);
      }
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Session Header */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              {room.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{room.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-400">
                  {room.isActive ? 'Live' : 'Ended'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Session active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                  'bg-red-500'
                }`} />
                <span className="text-sm text-gray-400">
                  {connectionStatus === 'connected' ? 'Audio connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 
                   'Audio disconnected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Player for Host */}
        <audio ref={hostAudioRef} autoPlay />

        {!hasJoined ? (
          /* Join Form */
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Join the Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Your Name</label>
                <Input
                  value={viewerName}
                  onChange={(e) => setViewerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-700 border-slate-600 text-white"
                  maxLength={50}
                  onKeyPress={(e) => e.key === 'Enter' && joinQueue()}
                />
              </div>
              
              <Button 
                onClick={joinQueue}
                className="w-full"
                disabled={!room.isActive || connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Join Queue to Speak'
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                By joining, you agree to allow microphone access when selected to speak
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Queue Status */
          <div className="space-y-4">
            {isSpeaking ? (
              /* Speaking View */
              <Card className="bg-purple-900/30 border-purple-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-purple-400" />
                    You're Speaking!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-purple-300">
                      You're now live! The host and all viewers can hear you.
                    </p>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={toggleMicrophone}
                        variant={isAudioEnabled ? "default" : "destructive"}
                        className="flex-1"
                        disabled={!isInitialized}
                      >
                        {!isInitialized ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Initializing...
                          </>
                        ) : isAudioEnabled ? (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Microphone On
                          </>
                        ) : (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Microphone Off
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={leaveQueue}
                        variant="outline"
                        className="flex-1"
                      >
                        Finish Speaking
                      </Button>
                    </div>

                    {/* Audio Level Indicator */}
                    {localStream && isAudioEnabled && (
                      <div>
                        <div className="text-sm text-purple-300 mb-2">Your Audio Level</div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-100"
                            style={{ width: '60%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Waiting in Queue */
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Waiting in Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-yellow-400 mb-2">
                        {queuePosition ? `#${queuePosition}` : '—'}
                      </div>
                      <p className="text-gray-300">
                        {queuePosition 
                          ? `You are ${queuePosition === 1 ? 'next' : `${queuePosition} in line`} to speak`
                          : 'You are in the queue'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        The host will select you when it's your turn
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          remoteStreams.has(room.hostId) ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                        }`} />
                        <span className="text-white text-sm">Host Audio</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {remoteStreams.has(room.hostId) ? 'Connected' : 'Connecting...'}
                      </span>
                    </div>
                    
                    <Button
                      onClick={leaveQueue}
                      variant="outline"
                      className="w-full"
                    >
                      Leave Queue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Host Audio Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  Audio Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Host Audio:</span>
                    <span className={`text-sm ${
                      remoteStreams.has(room.hostId) ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {remoteStreams.has(room.hostId) ? '🔊 Playing' : '🔄 Connecting'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Your Connection:</span>
                    <span className={`text-sm ${
                      connectionStatus === 'connected' ? 'text-green-400' : 
                      connectionStatus === 'connecting' ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {connectionStatus === 'connected' ? '✅ Ready' : 
                       connectionStatus === 'connecting' ? '🔄 Connecting' : 
                       '❌ Disconnected'}
                    </span>
                  </div>
                  {isSpeaking && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Your Microphone:</span>
                      <span className={`text-sm ${isAudioEnabled ? 'text-green-400' : 'text-red-400'}`}>
                        {isAudioEnabled ? '🎤 Active' : '🔇 Muted'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}