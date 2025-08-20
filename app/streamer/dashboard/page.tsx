'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Settings, Copy, Play, Square, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export default function StreamerDashboard() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [copied, setCopied] = useState(false);
  
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
          maxSpeakingTime,
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

  const endSession = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setSession(null);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const copyShareLink = async () => {
    if (!session?.shareableLink) return;
    
    try {
      await navigator.clipboard.writeText(session.shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Stream<span className="text-purple-400">Talk</span> Dashboard
              </h1>
              <p className="text-gray-300">{session.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
              <Button
                onClick={endSession}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
              >
                <Square className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Audio Queue ({session.queueLength || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session.waitingViewers && session.waitingViewers.length > 0 ? (
                  <div className="space-y-3">
                    {session.waitingViewers.map((viewer: any, index: number) => (
                      <div
                        key={viewer.id}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className="bg-purple-500/20 text-purple-300">
                            #{viewer.position}
                          </Badge>
                          <div>
                            <p className="text-white font-medium">{viewer.viewerName}</p>
                            <p className="text-gray-400 text-sm">
                              Joined {new Date(viewer.joinedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {viewer.audioReady ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                          <Badge
                            className={
                              viewer.status === 'speaking'
                                ? 'bg-green-500/20 text-green-400'
                                : viewer.status === 'selected'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }
                          >
                            {viewer.status}
                          </Badge>
                        </div>
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

          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Share Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-gray-300 text-sm font-mono break-all">
                    {session.shareableLink}
                  </p>
                </div>
                <Button
                  onClick={copyShareLink}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Viewers</span>
                  <span className="text-white">{session.queueLength || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
