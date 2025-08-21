import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, 
  MicOff, 
  Users, 
  Clock, 
  Volume2, 
  VolumeX, 
  Settings, 
  Share2, 
  Copy,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  UserPlus,
  Crown,
  Zap,
  Activity,
  LogOut,
  User
} from 'lucide-react';

// Components
import LandingPage from '@/components/LandingPage';
import { AuthForm } from '@/components/auth/AuthForm';

// Firebase and service imports
import { useAuth } from '@/lib/auth';
import { firestoreService, type Room, type Participant } from '@/lib/firestore';
import { WebRTCService } from '@/lib/webrtc';
import { toast } from '@/hooks/use-toast';

// Type definitions
interface SessionData {
  id: string;
  title: string;
  joinLink?: string;
  maxSpeakingTime?: number;
  createdAt?: Date;
  viewerCount?: number;
  activeViewers?: any[];
  isViewer?: boolean;
  hostId?: string;
}

interface Viewer {
  id: string;
  name: string;
  position: number;
  waitTime: string;
  joinedAt: Date;
  isCurrentSpeaker?: boolean;
}

interface SessionStats {
  totalViewers: number;
  totalSpeakers: number;
  averageSpeakingTime: number;
  sessionDuration: number;
}

interface CurrentSpeaker {
  id?: string;
  name: string;
  timeLeft: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
type QueueStatus = 'not-joined' | 'joining' | 'in-queue' | 'selected' | 'speaking';

interface StreamerDashboardProps {
  sessionData: SessionData;
  setCurrentView: (view: string) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

interface ViewerInterfaceProps {
  sessionData: SessionData;
  setCurrentView: (view: string) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  audioPermission: boolean;
  setAudioPermission: (permission: boolean) => void;
}

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

// Enhanced StreamTalk Application
export default function StreamTalkEnhanced() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'streamer', 'viewer'
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Shared state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [audioPermission, setAudioPermission] = useState(false);
  
  // Firebase auth
  const { user, logout, loading } = useAuth();
  
  // Effect to handle auth state changes
  useEffect(() => {
    if (user && !loading) {
      // User just signed in, show a helpful message
      console.log('User authenticated:', user.email);
    }
  }, [user, loading]);
  
  // Check authentication for streamer actions
  const handleStreamerAction = () => {
    if (!user) {
      setAuthMode('signin');
      setShowAuthForm(true);
      return;
    }
    // Create session for authenticated user
    createSession();
  };
  
  const createSession = async () => {
    if (!user) return;
    
    try {
      const room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'> = {
        hostId: user.uid,
        title: `${user.displayName || 'Anonymous'}'s Live Stream`,
        description: 'Live audio interaction session',
        isActive: true,
        maxParticipants: 50,
        speakingTimeLimit: 45,
        currentSpeakerId: null,
        participantQueue: []
      };
      
      const roomId = await firestoreService.createRoom(room);
      const joinLink = `${window.location.origin}/join/${roomId}`;
      
      const session: SessionData = {
        id: roomId,
        title: room.title,
        joinLink,
        maxSpeakingTime: room.speakingTimeLimit,
        createdAt: new Date(),
        viewerCount: 0,
        activeViewers: [],
        hostId: user.uid
      };
      
      setSessionData(session);
      setCurrentView('streamer');
      
      toast({
        title: 'Session Created',
        description: 'Your StreamTalk session is now live!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage 
          setCurrentView={setCurrentView} 
          setSessionData={setSessionData}
          onShowAuth={(mode) => {
            setAuthMode(mode);
            setShowAuthForm(true);
          }}
        />
        {showAuthForm && (
          <AuthForm
            mode={authMode}
            onClose={() => setShowAuthForm(false)}
            onSuccess={() => setShowAuthForm(false)}
          />
        )}
      </>
    );
  }
  
  // Streamer Dashboard
  if (currentView === 'streamer' && sessionData) {
    return (
      <StreamerDashboard 
        sessionData={sessionData}
        setCurrentView={setCurrentView}
        connectionStatus={connectionStatus}
        setConnectionStatus={setConnectionStatus}
      />
    );
  }
  
  // Viewer Interface
  if (currentView === 'viewer' && sessionData) {
    return (
      <ViewerInterface 
        sessionData={sessionData}
        setCurrentView={setCurrentView}
        connectionStatus={connectionStatus}
        setConnectionStatus={setConnectionStatus}
        audioPermission={audioPermission}
        setAudioPermission={setAudioPermission}
      />
    );
  }
  
  // Fallback to landing if sessionData is null
  return (
    <>
      <LandingPage 
        setCurrentView={setCurrentView} 
        setSessionData={setSessionData}
        onShowAuth={(mode) => {
          setAuthMode(mode);
          setShowAuthForm(true);
        }}
      />
      {showAuthForm && (
        <AuthForm
          mode={authMode}
          onClose={() => setShowAuthForm(false)}
          onSuccess={() => setShowAuthForm(false)}
        />
      )}
    </>
  );
}

// Streamer Dashboard Component
function StreamerDashboard({ sessionData, setCurrentView, connectionStatus, setConnectionStatus }: StreamerDashboardProps) {
  const [queue, setQueue] = useState<Viewer[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Viewer | null>(null);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0);
  const [maxSpeakingTime, setMaxSpeakingTime] = useState(45);
  const [autoSelect, setAutoSelect] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState([75]);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalViewers: 0,
    totalSpeakers: 0,
    averageSpeakingTime: 0,
    sessionDuration: 0
  });
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef(new Date());
  
  // Simulate real-time data
  useEffect(() => {
    // Simulate connection
    setTimeout(() => setConnectionStatus('connected'), 1000);
    
    // Add demo viewers to queue
    const demoViewers = [
      { id: 'v1', name: 'Sarah M.', position: 1, waitTime: '2 min', joinedAt: new Date() },
      { id: 'v2', name: 'Alex K.', position: 2, waitTime: '4 min', joinedAt: new Date() },
      { id: 'v3', name: 'Jordan P.', position: 3, waitTime: '6 min', joinedAt: new Date() },
    ];
    
    setTimeout(() => {
      setQueue(demoViewers);
      setSessionStats((prev: SessionStats) => ({ ...prev, totalViewers: demoViewers.length }));
    }, 2000);
    
    // Session duration timer
    const sessionTimer = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000);
      setSessionStats((prev: SessionStats) => ({ ...prev, sessionDuration: duration }));
    }, 1000);
    
    return () => {
      clearInterval(sessionTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Speaking timer
  useEffect(() => {
    if (currentSpeaker && speakingTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSpeakingTimeLeft((prev: number) => {
          if (prev <= 1) {
            endSpeaking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSpeaker, speakingTimeLeft]);
  
  const selectViewer = (viewer: Viewer) => {
    if (currentSpeaker) return; // Already someone speaking
    
    setCurrentSpeaker(viewer);
    setSpeakingTimeLeft(maxSpeakingTime);
    setQueue((prev: Viewer[]) => prev.filter((v: Viewer) => v.id !== viewer.id));
    setSessionStats((prev: SessionStats) => ({ 
      ...prev, 
      totalSpeakers: prev.totalSpeakers + 1 
    }));
  };
  
  const endSpeaking = () => {
    if (currentSpeaker) {
      const speakingDuration = maxSpeakingTime - speakingTimeLeft;
      setSessionStats((prev: SessionStats) => ({
        ...prev,
        averageSpeakingTime: Math.round((prev.averageSpeakingTime * (prev.totalSpeakers - 1) + speakingDuration) / prev.totalSpeakers)
      }));
    }
    
    setCurrentSpeaker(null);
    setSpeakingTimeLeft(0);
    
    // Auto-select next viewer if enabled
    if (autoSelect && queue.length > 0) {
      setTimeout(() => {
        const nextViewer = queue[0];
        selectViewer(nextViewer);
      }, 1000);
    }
  };
  
  const copyJoinLink = () => {
    if (sessionData?.joinLink) {
      navigator.clipboard.writeText(sessionData.joinLink);
      // You could show a toast here
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('landing')}
              className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent mb-4"
            >
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">
              <Crown className="w-6 h-6 text-yellow-400 inline mr-2" />
              Streamer Dashboard
            </h1>
            <p className="text-gray-300">{sessionData?.title}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} />
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Speaker */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  Currently Speaking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentSpeaker ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {currentSpeaker.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{currentSpeaker.name}</div>
                          <div className="text-gray-400 text-sm">Speaking now</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Activity className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                        <Button
                          onClick={endSpeaking}
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          End Speaking
                        </Button>
                      </div>
                    </div>
                    
                    {/* Speaking Timer */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Time Remaining</span>
                        <span className="text-white font-mono">{formatTime(speakingTimeLeft)}</span>
                      </div>
                      <Progress 
                        value={(speakingTimeLeft / maxSpeakingTime) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {/* Audio Visualizer */}
                    <div className="flex items-center justify-center gap-1 py-4">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-400 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 30 + 10}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MicOff className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No one is currently speaking</p>
                    <p className="text-gray-500 text-sm">Select a viewer from the queue to start</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Queue Management */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Viewer Queue ({queue.length})
                  </div>
                  {queue.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {queue.length} waiting
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queue.length > 0 ? (
                  <div className="space-y-3">
                    {queue.map((viewer, index) => (
                      <div
                        key={viewer.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                            #{viewer.position}
                          </Badge>
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {viewer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{viewer.name}</div>
                            <div className="text-gray-400 text-sm">Waiting ~{viewer.waitTime}</div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => selectViewer(viewer)}
                          disabled={!!currentSpeaker}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No viewers in queue</p>
                    <p className="text-gray-500 text-sm">Share your session link to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">Join Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={sessionData?.joinLink || ''}
                      readOnly
                      className="bg-slate-900 border-slate-600 text-white text-xs"
                    />
                    <Button
                      onClick={copyJoinLink}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">{sessionStats.totalViewers}</div>
                    <div className="text-gray-400 text-sm">Total Viewers</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">{sessionStats.totalSpeakers}</div>
                    <div className="text-gray-400 text-sm">Speakers</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-400 text-sm">Session Duration</div>
                  <div className="text-xl font-mono text-white">{formatTime(sessionStats.sessionDuration)}</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Settings */}
            {showSettings && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Max Speaking Time (seconds)</label>
                    <Slider
                      value={[maxSpeakingTime]}
                      onValueChange={([value]) => setMaxSpeakingTime(value)}
                      min={15}
                      max={120}
                      step={5}
                      className="py-2"
                    />
                    <div className="text-center text-white text-sm">{maxSpeakingTime}s</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Auto-select next viewer</span>
                    <Switch
                      checked={autoSelect}
                      onCheckedChange={setAutoSelect}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Audio Volume</label>
                    <Slider
                      value={volumeLevel}
                      onValueChange={setVolumeLevel}
                      min={0}
                      max={100}
                      step={5}
                      className="py-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Viewer Interface Component
function ViewerInterface({ sessionData, setCurrentView, connectionStatus, setConnectionStatus, audioPermission, setAudioPermission }: ViewerInterfaceProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>('not-joined');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<CurrentSpeaker | null>(null);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState([75]);
  const [viewerName, setViewerName] = useState('');
  
  // Simulate real-time updates
  useEffect(() => {
    // Simulate connection
    setTimeout(() => setConnectionStatus('connected'), 1000);
    
    // Simulate current speaker
    setCurrentSpeaker({
      name: 'Alex K.',
      timeLeft: 23
    });
    
    const speakerTimer = setInterval(() => {
      setCurrentSpeaker((prev: CurrentSpeaker | null) => {
        if (prev && prev.timeLeft > 0) {
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        }
        return null;
      });
    }, 1000);
    
    return () => clearInterval(speakerTimer);
  }, []);
  
  const requestMicrophone = async () => {
    try {
      // Simulate microphone request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAudioPermission(true);
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  };
  
  const joinQueue = async () => {
    if (!viewerName.trim()) {
      alert('Please enter your name first');
      return;
    }
    
    setQueueStatus('joining');
    
    // Request microphone first
    const hasAudio = await requestMicrophone();
    if (!hasAudio) {
      setQueueStatus('not-joined');
      return;
    }
    
    // Simulate joining queue
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setQueueStatus('in-queue');
    setQueuePosition(3);
    setEstimatedWait('~6 minutes');
  };
  
  const leaveQueue = () => {
    setQueueStatus('not-joined');
    setQueuePosition(null);
    setEstimatedWait(null);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('landing')}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">
            <Users className="w-6 h-6 text-purple-400 inline mr-2" />
            StreamTalk Viewer
          </h1>
          <p className="text-gray-300">{sessionData?.title}</p>
        </div>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ConnectionStatus status={connectionStatus} />
                  <span className="text-white">Session Connection</span>
                </div>
                {audioPermission && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Mic className="w-3 h-3 mr-1" />
                    Mic Ready
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Current Speaker Display */}
          {currentSpeaker && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-400" />
                  Now Speaking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {currentSpeaker.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{currentSpeaker.name}</div>
                      <div className="text-gray-400 text-sm">Speaking now</div>
                    </div>
                  </div>
                  
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Activity className="w-3 h-3 mr-1" />
                    {formatTime(currentSpeaker.timeLeft)} left
                  </Badge>
                </div>
                
                {/* Audio Visualizer for Current Speaker */}
                <div className="flex items-center justify-center gap-1 py-4">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-green-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 8}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Queue Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {queueStatus === 'not-joined' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <UserPlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 mb-4">Ready to join the audio queue?</p>
                    <div className="space-y-3">
                      <Input
                        value={viewerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setViewerName(e.target.value)}
                        placeholder="Enter your name"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-500"
                      />
                      <Button
                        onClick={joinQueue}
                        disabled={!viewerName.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Join Queue
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {queueStatus === 'joining' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="text-white font-medium">Joining Queue...</p>
                    <p className="text-gray-400 text-sm">Requesting microphone access</p>
                  </div>
                </div>
              )}
              
              {queueStatus === 'in-queue' && queuePosition && (
                <div className="text-center space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">#{queuePosition}</div>
                    <p className="text-white font-medium">You're in the queue!</p>
                    <p className="text-gray-400 text-sm">Estimated wait: {estimatedWait}</p>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                      Position {queuePosition}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Audio Ready
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={leaveQueue}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    Leave Queue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Audio Controls (when in queue or speaking) */}
          {(queueStatus === 'in-queue' || queueStatus === 'speaking') && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  Audio Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Microphone</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setMicEnabled(!micEnabled)}
                      variant="outline"
                      size="sm"
                      className={`border-slate-600 ${micEnabled 
                        ? 'text-green-400 hover:bg-green-500/10' 
                        : 'text-red-400 hover:bg-red-500/10'
                      } bg-transparent`}
                      disabled={queueStatus !== 'speaking'}
                    >
                      {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    {queueStatus !== 'speaking' && (
                      <span className="text-xs text-gray-500">Enabled when selected</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Speaker Volume</span>
                    <span className="text-white text-sm">{volumeLevel[0]}%</span>
                  </div>
                  <Slider
                    value={volumeLevel}
                    onValueChange={setVolumeLevel}
                    min={0}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Queue Instructions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs mt-1">1</Badge>
                  <div>
                    <p className="text-white text-sm font-medium">Join the queue</p>
                    <p className="text-gray-400 text-xs">Grant microphone access and wait your turn</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs mt-1">2</Badge>
                  <div>
                    <p className="text-white text-sm font-medium">Get selected</p>
                    <p className="text-gray-400 text-xs">The streamer will choose you to speak</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-1">3</Badge>
                  <div>
                    <p className="text-white text-sm font-medium">Share your voice</p>
                    <p className="text-gray-400 text-xs">Speak for up to 45 seconds with the audience</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: { 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-500/20', 
      borderColor: 'border-yellow-500/30',
      icon: Clock,
      text: 'Connecting...' 
    },
    connected: { 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/20', 
      borderColor: 'border-green-500/30',
      icon: CheckCircle,
      text: 'Connected' 
    },
    disconnected: { 
      color: 'text-red-400', 
      bgColor: 'bg-red-500/20', 
      borderColor: 'border-red-500/30',
      icon: AlertCircle,
      text: 'Disconnected' 
    }
  };
  
  const config = statusConfig[status] || statusConfig.disconnected;
  const IconComponent = config.icon;
  
  return (
    <Badge className={`${config.bgColor} ${config.color} ${config.borderColor}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
}
