'use client';

import { useState } from 'react';
import StreamerDashboard from '@/components/StreamerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Play, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  maxSpeakingTime: number;
  autoSelectEnabled: boolean;
  recordingEnabled: boolean;
  status: string;
  shareableLink?: string;
  queueLength?: number;
  waitingViewers?: any[];
  createdAt?: string;
}

export default function StreamerDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  
  // Form state
  const [streamerId] = useState(`streamer-${Date.now()}`);
  const [title, setTitle] = useState('My StreamTalk Session');
  const [description, setDescription] = useState('');
  const [maxSpeakingTime, setMaxSpeakingTime] = useState(45);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  const createSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId,
          title,
          description,
          speakingTimeLimit: maxSpeakingTime,
          maxParticipants: 50, // Add required field
          autoSelectEnabled,
          recordingEnabled,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
      } else {
        console.error('Failed to create session:', data.error);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    setSession(null);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Stream<span className="text-purple-400">Talk</span> Dashboard
            </h1>
            <p className="text-gray-300">Create and manage your interactive streaming session</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Create New Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Session Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter session title"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your session"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 text-sm">Max Speaking Time (seconds)</label>
                <Input
                  type="number"
                  value={maxSpeakingTime}
                  onChange={(e) => setMaxSpeakingTime(Number(e.target.value))}
                  min="15"
                  max="300"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Auto-select speakers</label>
                    <p className="text-gray-500 text-xs">Automatically select next speaker from queue</p>
                  </div>
                  <Switch
                    checked={autoSelectEnabled}
                    onCheckedChange={setAutoSelectEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Enable recording</label>
                    <p className="text-gray-500 text-xs">Record the entire session</p>
                  </div>
                  <Switch
                    checked={recordingEnabled}
                    onCheckedChange={setRecordingEnabled}
                  />
                </div>
              </div>

              <Button
                onClick={createSession}
                disabled={loading || !title.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <StreamerDashboard 
      sessionId={session.id} 
      onEndSession={handleEndSession}
    />
  );
}
