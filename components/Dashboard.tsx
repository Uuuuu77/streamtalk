'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Mic, 
  MicOff,
  Users, 
  LogOut,
  User,
  UserPlus,
  PlayCircle,
  Settings,
  Heart,
  ThumbsUp,
  Smile,
  Hand,
  Volume2,
  VolumeX,
  Radio,
  Copy,
  Share2,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { firestoreService } from '@/lib/firestore';

interface DashboardProps {
  setCurrentView: (view: string) => void;
  setSessionData: (data: any) => void;
}

export default function Dashboard({ setCurrentView, setSessionData }: DashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [volumeEnabled, setVolumeEnabled] = useState(true);
  const { user, logout } = useAuth();

  const handleCreateSession = async () => {
    if (!user) return;
    
    setIsCreating(true);
    
    try {
      const room = {
        hostId: user.uid,
        title: `${user.displayName || user.email?.split('@')[0] || 'Anonymous'}'s Live Stream`,
        description: 'Live audio interaction session',
        isActive: true,
        maxParticipants: 50,
        speakingTimeLimit: 45,
        currentSpeakerId: null,
        participantQueue: []
      };
      
      const roomId = await firestoreService.createRoom(room);
      const joinLink = `${window.location.origin}/join/${roomId}`;
      
      const session = {
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
        title: 'Session Created! 🎉',
        description: 'Your StreamTalk session is now live!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Missing Session ID',
        description: 'Please enter a session ID or link to join.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsJoining(true);
    
    try {
      const sessionId = joinCode.includes('/join/') ? 
        joinCode.split('/join/')[1] : joinCode.trim();
      
      const room = await firestoreService.getRoom(sessionId);
      if (!room) {
        throw new Error('Session not found');
      }
      
      if (!room.isActive) {
        throw new Error('Session is no longer active');
      }
      
      setSessionData({
        id: sessionId,
        title: room.title,
        description: room.description,
        isViewer: true,
        maxSpeakingTime: room.speakingTimeLimit
      });
      setCurrentView('viewer');
      
      toast({
        title: 'Joined Session! 🎤',
        description: `Connected to "${room.title}"`,
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error joining session:', error);
      toast({
        title: 'Failed to Join',
        description: error.message || 'Session not found. Please check the ID and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Copied to clipboard',
      variant: 'default'
    });
  };

  const handleReaction = (type: string) => {
    toast({
      title: `${type} sent!`,
      description: 'Your reaction was sent to the stream',
      variant: 'default'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="mobile-safe-container py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Stream<span className="text-purple-400">Talk</span>
              </span>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 hidden sm:inline-flex">
                Dashboard
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm hidden sm:inline">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="mobile-touch-target text-gray-300 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mobile-safe-container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
            </h1>
            <p className="mobile-safe-text text-gray-300">
              Start hosting your own streams or join existing conversations
            </p>
          </div>

          <div className="mobile-safe-grid lg:grid-cols-2 gap-8">
            {/* Host Section */}
            <Card className="bg-slate-800/50 border-slate-700 mobile-container-overflow-fix">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  Host a Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                    <PlayCircle className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="mobile-safe-text text-gray-300 text-sm">
                    Create your own live audio session where viewers can request to speak
                  </p>
                  
                  <Button
                    onClick={handleCreateSession}
                    disabled={isCreating}
                    className="mobile-safe-button w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Hosting
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Join Section */}
            <Card className="bg-slate-800/50 border-slate-700 mobile-container-overflow-fix">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Join a Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter session ID or paste link..."
                    className="bg-slate-900 border-slate-600 text-white mobile-container-overflow-fix"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
                  />
                  <Button
                    onClick={handleJoinSession}
                    disabled={!joinCode.trim() || isJoining}
                    className="mobile-safe-button w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isJoining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Session
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Controls Section */}
          <div className="mt-8">
            <Card className="bg-slate-800/50 border-slate-700 mobile-container-overflow-fix">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-400" />
                  Quick Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mobile-safe-grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Microphone Control */}
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => setMicEnabled(!micEnabled)}
                      variant="outline"
                      size="lg"
                      className={`mobile-touch-target w-full h-16 ${micEnabled 
                        ? 'border-green-500 text-green-400 hover:bg-green-500/10' 
                        : 'border-red-500 text-red-400 hover:bg-red-500/10'
                      }`}
                    >
                      {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </Button>
                    <span className="text-sm text-gray-400">
                      {micEnabled ? 'Mic On' : 'Mic Off'}
                    </span>
                  </div>

                  {/* Volume Control */}
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => setVolumeEnabled(!volumeEnabled)}
                      variant="outline"
                      size="lg"
                      className={`mobile-touch-target w-full h-16 ${volumeEnabled 
                        ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' 
                        : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
                      }`}
                    >
                      {volumeEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </Button>
                    <span className="text-sm text-gray-400">
                      {volumeEnabled ? 'Audio On' : 'Muted'}
                    </span>
                  </div>

                  {/* Request to Speak */}
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => handleReaction('Hand raised')}
                      variant="outline"
                      size="lg"
                      className="mobile-touch-target w-full h-16 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Hand className="w-6 h-6" />
                    </Button>
                    <span className="text-sm text-gray-400">Raise Hand</span>
                  </div>

                  {/* Share */}
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => copyToClipboard(window.location.href)}
                      variant="outline"
                      size="lg"
                      className="mobile-touch-target w-full h-16 border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Share2 className="w-6 h-6" />
                    </Button>
                    <span className="text-sm text-gray-400">Share Link</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reactions Section */}
          <div className="mt-8">
            <Card className="bg-slate-800/50 border-slate-700 mobile-container-overflow-fix">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Quick Reactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
                  <Button
                    onClick={() => handleReaction('❤️')}
                    variant="outline"
                    size="lg"
                    className="mobile-touch-target border-pink-500 text-pink-400 hover:bg-pink-500/10"
                  >
                    ❤️
                  </Button>
                  <Button
                    onClick={() => handleReaction('👍')}
                    variant="outline"
                    size="lg"
                    className="mobile-touch-target border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    👍
                  </Button>
                  <Button
                    onClick={() => handleReaction('😄')}
                    variant="outline"
                    size="lg"
                    className="mobile-touch-target border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    😄
                  </Button>
                  <Button
                    onClick={() => handleReaction('🔥')}
                    variant="outline"
                    size="lg"
                    className="mobile-touch-target border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    🔥
                  </Button>
                  <Button
                    onClick={() => handleReaction('👏')}
                    variant="outline"
                    size="lg"
                    className="mobile-touch-target border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  >
                    👏
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card className="bg-slate-800/50 border-slate-700 mobile-container-overflow-fix">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="mobile-safe-text text-gray-400">No recent activity</p>
                  <p className="mobile-safe-text text-gray-500 text-sm">Start hosting or join a session to see activity here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}