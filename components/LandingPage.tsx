'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Mic, 
  Users, 
  Share2, 
  Zap,
  Activity,
  LogOut,
  User,
  UserPlus,
  PlayCircle,
  Star,
  Shield,
  Clock,
  Globe,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { firestoreService } from '@/lib/firestore';

interface LandingPageProps {
  setCurrentView: (view: string) => void;
  setSessionData: (data: any) => void;
  onShowAuth: (mode: 'signin' | 'signup') => void;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

export default function LandingPage({ setCurrentView, setSessionData, onShowAuth }: LandingPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { user, logout } = useAuth();
  
  const handleCreateSession = async () => {
    if (!user) {
      onShowAuth('signin');
      return;
    }
    
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
        description: 'Your StreamTalk session is now live and ready for viewers!',
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Stream<span className="text-purple-400">Talk</span>
            </span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {user.emailVerified && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => onShowAuth('signin')}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-slate-700"
              >
                Sign In
              </Button>
              <Button
                onClick={() => onShowAuth('signup')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </nav>
      
      <div className="container mx-auto px-4 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm mb-6">
            <Zap className="w-4 h-4" />
            Revolutionary Live Streaming Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Give Every Viewer
            <br />
            <span className="text-purple-400">A Voice</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your one-way livestreams into dynamic, two-way audio conversations. 
            StreamTalk enables real-time audio interaction between streamers and viewers 
            with intelligent queue management and crystal-clear WebRTC audio.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg disabled:opacity-50 min-w-[200px]"
              onClick={handleCreateSession}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start Streaming
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg min-w-[200px]"
              onClick={() => document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Users className="w-5 h-5 mr-2" />
              Join Stream
            </Button>
          </div>
          
          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              value="2.5K+"
              label="Active Users"
              color="text-blue-400"
            />
            <StatCard
              icon={<Mic className="w-5 h-5" />}
              value="850+"
              label="Live Sessions"
              color="text-purple-400"
            />
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              value="&lt; 150ms"
              label="Audio Latency"
              color="text-green-400"
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              value="4.9/5"
              label="User Rating"
              color="text-yellow-400"
            />
          </div>
        </div>
        
        {/* Join Session Section */}
        <div id="join-section" className="max-w-md mx-auto mb-16">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Join a Live Stream
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Enter a session ID or paste the stream link
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Session ID or stream link..."
                className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-500 h-12"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
              <Button
                onClick={handleJoinSession}
                disabled={!joinCode.trim() || isJoining}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 h-12"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Queue
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why StreamTalk?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Built for modern content creators who want to break the barrier 
              between streamers and their audience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-green-400" />}
              title="Ultra-Low Latency"
              description="WebRTC-powered audio with &lt; 150ms latency for natural conversations"
              highlighted
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-blue-400" />}
              title="Smart Queue System"
              description="Intelligent viewer management with fair selection and automatic moderation"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-purple-400" />}
              title="Universal Platform"
              description="Works with TikTok, Instagram, YouTube, Twitch, and any streaming platform"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-yellow-400" />}
              title="Time Management"
              description="Configurable speaking time limits with automatic transitions"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-pink-400" />}
              title="Analytics Dashboard"
              description="Real-time insights into viewer engagement and session metrics"
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6 text-cyan-400" />}
              title="Professional Audio"
              description="High-quality audio processing with noise reduction and echo cancellation"
            />
          </div>
        </div>
        
        {/* How It Works */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-300 text-lg">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Create Session</h3>
              <p className="text-gray-300">
                Start your StreamTalk session and get your unique link to share with viewers
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Share Link</h3>
              <p className="text-gray-300">
                Add the link to your stream description or chat for viewers to join the queue
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Engage Audience</h3>
              <p className="text-gray-300">
                Select viewers to speak live and create interactive conversations
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Streams?
          </h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of content creators who are already using StreamTalk 
            to create more engaging and interactive live experiences.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onShowAuth('signup')}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3"
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => onShowAuth('signin')}
                variant="outline"
                size="lg"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 px-8 py-3"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCreateSession}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Your First Session'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, highlighted = false }: FeatureCardProps) {
  return (
    <Card className={`bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 ${
      highlighted ? 'ring-2 ring-purple-500/50' : ''
    }`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="bg-slate-800/30 rounded-lg p-4 text-center">
      <div className={`flex justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}