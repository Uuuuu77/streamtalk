'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  Users, 
  Mic,
  CheckCircle
} from 'lucide-react';

interface SessionData {
  id: string;
  title: string;
  status: string;
  maxSpeakingTime: number;
  queueLength?: number;
}

export default function JoinSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [viewerName, setViewerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const [checkingAudio, setCheckingAudio] = useState(false);

  // Fetch session details
  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Session not found');
      }
      
      if (data.session.status !== 'active') {
        throw new Error('This session has ended');
      }
      
      setSession(data.session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestMicrophone = async () => {
    setCheckingAudio(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately (we'll request again when actually needed)
      stream.getTracks().forEach(track => track.stop());
      
      setAudioPermission(true);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access is required to join the queue');
      return false;
    } finally {
      setCheckingAudio(false);
    }
  };

  const joinQueue = async () => {
    if (!viewerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      // First check microphone permission
      const hasAudio = await requestMicrophone();
      if (!hasAudio) {
        setJoining(false);
        return;
      }

      // Generate a unique viewer ID
      const viewerId = `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store viewer info in localStorage for reconnection
      localStorage.setItem('streamtalk_viewer', JSON.stringify({
        viewerId,
        viewerName: viewerName.trim(),
        sessionId
      }));

      // Join the queue
      const response = await fetch(`/api/queue/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId,
          viewerName: viewerName.trim(),
          audioReady: true
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join queue');
      }

      setInQueue(true);
      setQueuePosition(data.queueEntry.position);
      
      // Redirect to viewer interface
      router.push(`/viewer/${sessionId}?viewerId=${viewerId}&name=${encodeURIComponent(viewerName)}`);
      
    } catch (err: any) {
      setError(err.message);
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-white">Loading session...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Session Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-white text-center">
            Join StreamTalk Session
          </CardTitle>
          {session && (
            <div className="text-center mt-2">
              <p className="text-purple-300 text-lg font-medium">{session.title}</p>
              <div className="flex justify-center gap-2 mt-3">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
                {session.queueLength !== undefined && session.queueLength > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    {session.queueLength} in queue
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!inQueue ? (
            <>
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Your Name</label>
                <Input
                  value={viewerName}
                  onChange={(e) => setViewerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-500"
                  disabled={joining}
                  onKeyPress={(e) => e.key === 'Enter' && !joining && joinQueue()}
                />
              </div>

              {audioPermission && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Microphone access granted
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </p>
                </div>
              )}

              <Button
                onClick={joinQueue}
                disabled={joining || !viewerName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {checkingAudio ? 'Checking microphone...' : 'Joining queue...'}
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Join Audio Queue
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-gray-400 text-xs">
                  You'll need to allow microphone access to participate
                </p>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">You're in the queue!</p>
                {queuePosition && (
                  <p className="text-gray-300 mt-1">Position #{queuePosition}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">Redirecting to session...</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-white text-sm font-medium mb-2">How it works:</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5">1</Badge>
                <span>Enter your name and join the queue</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5">2</Badge>
                <span>Wait for your turn to speak</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5">3</Badge>
                <span>Speak for up to {session?.maxSpeakingTime || 45} seconds when selected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}