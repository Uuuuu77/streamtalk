'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Users, 
  PlayCircle,
  UserPlus,
  CheckCircle,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AuthForm } from '@/components/auth/AuthForm';
import { toast } from '@/hooks/use-toast';
import { firestoreService } from '@/lib/firestore';

interface LandingPageProps {
  setCurrentView: (view: string) => void;
  setSessionData: (data: any) => void;
}

export default function LandingPage({ setCurrentView, setSessionData }: LandingPageProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { user } = useAuth();

  const handleStartStreaming = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setIsCreatingSession(true);
    
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
        title: 'Stream Started! 🎉',
        description: 'Your live session is now active!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Failed to Start Stream',
        description: 'Could not create your session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleJoinSession = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setShowAuth(true);
    }
  };

  const features = [
    {
      icon: Mic,
      title: 'Live Audio',
      description: 'High-quality real-time voice communication',
      color: 'text-purple-400'
    },
    {
      icon: Users,
      title: 'Interactive Queue',
      description: 'Viewers can request to speak',
      color: 'text-blue-400'
    },
    {
      icon: Clock,
      title: 'Timed Speaking',
      description: 'Fair time limits for all speakers',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Private and encrypted sessions',
      color: 'text-orange-400'
    }
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Stream<span className="text-purple-400">Talk</span>
              </span>
            </div>
            <h2 className="text-xl text-white mb-2">Join StreamTalk</h2>
            <p className="text-gray-400">Sign in to start hosting or joining sessions</p>
          </div>
          
          <AuthForm 
            mode="signin"
            onClose={() => setShowAuth(false)}
          />
          
          <div className="mt-6 text-center">
            <Button
              onClick={() => setShowAuth(false)}
              variant="ghost"
              className="text-purple-400 hover:text-purple-300"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation - Mobile-First Responsive */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="mobile-safe-container py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-white">
                Stream<span className="text-purple-400">Talk</span>
              </span>
            </div>
            
            {user ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="mobile-container-overflow-fix bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="mobile-safe-text text-green-300 text-sm font-medium truncate">
                    Welcome, {user.displayName || user.email?.split('@')[0]}!
                  </span>
                </div>
                <Button
                  onClick={() => setCurrentView('dashboard')}
                  className="mobile-safe-button bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuth(true)}
                className="mobile-safe-button bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                size="lg"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile-First Responsive */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mobile-safe-container text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Stream<span className="text-purple-400">Talk</span>
            </h1>
            <p className="mobile-safe-text text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Real-time audio conversations where your audience can request to speak and join the discussion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Button
                onClick={handleStartStreaming}
                disabled={isCreatingSession}
                size="lg"
                className="mobile-safe-button bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px]"
              >
                {isCreatingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Stream...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Streaming
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleJoinSession}
                variant="outline"
                size="lg"
                className="mobile-safe-button border-purple-400 text-purple-400 hover:bg-purple-400/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto min-w-[200px]"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Join Session
              </Button>
            </div>

            {!user && (
              <p className="mobile-safe-text text-sm text-gray-400 mt-3 sm:mt-4">
                Create a free account to get started
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section - Mobile-First Responsive Grid */}
      <section className="py-12 sm:py-16">
        <div className="mobile-safe-container">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Simple. Interactive. Powerful.
            </h2>
            <p className="mobile-safe-text text-gray-300 max-w-2xl mx-auto">
              Everything you need for engaging live audio conversations
            </p>
          </div>
          
          <div className="mobile-safe-grid lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="mobile-container-overflow-fix bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mobile-safe-text text-gray-300 text-center text-sm sm:text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile-First Responsive */}
      <section className="py-12 sm:py-16 bg-slate-800/30">
        <div className="mobile-safe-container">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Get Started in 3 Steps</h2>
          </div>
          
          <div className="mobile-safe-grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Sign Up</h3>
              <p className="mobile-safe-text text-gray-300 text-sm sm:text-base">Create your account in seconds</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Host or Join</h3>
              <p className="mobile-safe-text text-gray-300 text-sm sm:text-base">Start a stream or join an existing session</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-white font-bold text-lg sm:text-xl">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Start Talking</h3>
              <p className="mobile-safe-text text-gray-300 text-sm sm:text-base">Engage with your audience in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile-First Responsive */}
      <section className="py-16 sm:py-20">
        <div className="mobile-safe-container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Connect?
            </h2>
            <p className="mobile-safe-text text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Join StreamTalk and start meaningful audio conversations today
            </p>
            
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="mobile-safe-button bg-purple-600 hover:bg-purple-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto max-w-sm"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 bg-slate-900">
        <div className="mobile-safe-container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Stream<span className="text-purple-400">Talk</span>
            </span>
          </div>
          <p className="mobile-safe-text text-gray-500 text-sm">
            © 2025 StreamTalk. Real-time audio conversations.
          </p>
        </div>
      </footer>
    </div>
  );
}