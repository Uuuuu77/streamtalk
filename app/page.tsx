'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mic, Users, Zap, Share2, Play, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      
      // Navigate directly to dashboard where user can create session
      router.push('/streamer/dashboard');
    } catch (error) {
      console.error('Navigation failed:', error);
      setIsCreating(false);
    }
  };

  const handleJoinSession = () => {
    if (!joinSessionId.trim()) return;
    router.push(`/join/${joinSessionId.trim()}`);
  };

  // Don't render interactive elements until mounted
  if (!mounted) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm mb-6">
            <Zap className="w-4 h-4" />
            Revolutionary Live Streaming
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Stream<span className="text-purple-400">Talk</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your one-way livestreams into dynamic, two-way audio conversations. Give every viewer a voice with
            real-time audio interaction.
          </p>

          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start max-w-4xl mx-auto">
            {/* Create Session Card */}
            <Card className="bg-slate-800/50 border-slate-700 flex-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  For Streamers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Start your interactive streaming session and let your audience speak directly to you.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleCreateSession}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Create Session
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Join Session Card */}
            <Card className="bg-slate-800/50 border-slate-700 flex-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  For Viewers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Join an active session with a session ID to participate in the audio queue.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    placeholder="Enter session ID"
                    className="bg-slate-900 border-slate-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
                  />
                  <Button
                    onClick={handleJoinSession}
                    disabled={!joinSessionId.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Mic className="w-5 h-5 text-purple-400" />}
            title="Real-Time Audio"
            description="Ultra-low latency WebRTC audio connections with automatic queue management and fair selection system."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5 text-purple-400" />}
            title="Smart Queue System"
            description="Intelligent viewer queue with random selection, priority management, and real-time position updates."
          />
          <FeatureCard
            icon={<Share2 className="w-5 h-5 text-purple-400" />}
            title="Universal Integration"
            description="Works with any streaming platform - TikTok, Instagram, YouTube, Twitch. No platform restrictions."
          />
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold">Create Session</h3>
              <p className="text-gray-400 text-sm">Start your StreamTalk session and get a shareable link</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold">Share & Stream</h3>
              <p className="text-gray-400 text-sm">Share your link while streaming on any platform</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold">Interactive Audio</h3>
              <p className="text-gray-400 text-sm">Viewers join your audio queue and speak directly to you</p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <DemoSection />
      </div>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Loading StreamTalk</h2>
        <p className="text-gray-300">Please wait...</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}

function DemoSection() {
  return (
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">See It In Action</h2>
      <div className="bg-slate-800/50 rounded-lg p-8 max-w-4xl mx-auto">
        <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <Play className="w-12 md:w-16 h-12 md:h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300">Interactive Demo Coming Soon</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live Audio Queue
          </Badge>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            3 Viewers Waiting
          </Badge>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
            &lt; 150ms Latency
          </Badge>
        </div>
      </div>
    </div>
  );
}
