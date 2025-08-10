"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Mic, MicOff, Users, Timer, Volume2, Settings, Share2, Copy, Shuffle, Play, Pause } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QueuedViewer {
  id: string
  name: string
  joinedAt: Date
  position: number
  audioReady: boolean
  avatar?: string
}

export default function StreamerDashboard() {
  const [mounted, setMounted] = useState(false)
  const [sessionId] = useState("stream-" + Math.random().toString(36).substr(2, 9))
  const [isLive, setIsLive] = useState(false)
  const [queue, setQueue] = useState<QueuedViewer[]>([])
  const [activeViewer, setActiveViewer] = useState<QueuedViewer | null>(null)
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0)
  const [maxSpeakingTime, setMaxSpeakingTime] = useState(45)
  const [volume, setVolume] = useState([80])
  const [autoSelect, setAutoSelect] = useState(false)
  const [joinLink, setJoinLink] = useState("") // Initialize as empty string
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    // Set joinLink only after component mounts and window is available
    if (typeof window !== "undefined") {
      setJoinLink(`${window.location.origin}/join/${sessionId}`)
    }
  }, [sessionId])

  // Simulate viewers joining queue
  useEffect(() => {
    if (!mounted || !isLive) return

    const interval = setInterval(() => {
      if (Math.random() > 0.7 && queue.length < 10) {
        const newViewer: QueuedViewer = {
          id: "viewer-" + Math.random().toString(36).substr(2, 9),
          name: `Viewer ${Math.floor(Math.random() * 1000)}`,
          joinedAt: new Date(),
          position: queue.length + 1,
          audioReady: Math.random() > 0.3,
        }
        setQueue((prev) => [...prev, newViewer])

        toast({
          title: "New viewer joined!",
          description: `${newViewer.name} joined the audio queue`,
          duration: 3000,
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [mounted, isLive, queue.length, toast])

  // Speaking timer
  useEffect(() => {
    if (!mounted || speakingTimeLeft <= 0) return

    if (speakingTimeLeft === 1 && activeViewer) {
      // About to end
      setTimeout(() => handleEndSpeaking(), 1000)
      return
    }

    const timer = setTimeout(() => {
      setSpeakingTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [mounted, speakingTimeLeft, activeViewer])

  const handleStartStream = () => {
    setIsLive(true)
    toast({
      title: "Stream started!",
      description: "Your audio queue is now live. Share the link with your viewers.",
      duration: 5000,
    })
  }

  const handleStopStream = () => {
    setIsLive(false)
    setQueue([])
    setActiveViewer(null)
    setSpeakingTimeLeft(0)
    toast({
      title: "Stream ended",
      description: "Your audio session has been terminated.",
    })
  }

  const handleSelectViewer = (viewer: QueuedViewer) => {
    if (activeViewer) {
      toast({
        title: "Someone is already speaking",
        description: "Please wait for the current speaker to finish.",
        variant: "destructive",
      })
      return
    }

    setActiveViewer(viewer)
    setSpeakingTimeLeft(maxSpeakingTime)
    setQueue((prev) => prev.filter((v) => v.id !== viewer.id))

    toast({
      title: "Viewer selected!",
      description: `${viewer.name} can now speak for ${maxSpeakingTime} seconds.`,
    })
  }

  const handleSelectRandom = () => {
    const eligibleViewers = queue.filter((v) => v.audioReady)
    if (eligibleViewers.length === 0) {
      toast({
        title: "No eligible viewers",
        description: "No viewers with audio ready are in the queue.",
        variant: "destructive",
      })
      return
    }

    const randomViewer = eligibleViewers[Math.floor(Math.random() * eligibleViewers.length)]
    handleSelectViewer(randomViewer)
  }

  const handleEndSpeaking = () => {
    if (activeViewer) {
      toast({
        title: "Speaking time ended",
        description: `${activeViewer.name}'s speaking time has ended.`,
      })
    }
    setActiveViewer(null)
    setSpeakingTimeLeft(0)
  }

  const copyJoinLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(joinLink)
      toast({
        title: "Link copied!",
        description: "Share this link with your viewers so they can join the audio queue.",
      })
    } else {
      toast({
        title: "Copy failed",
        description: "Clipboard access not supported or denied.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
          <p className="text-gray-300">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Streamer Dashboard</h1>
            <p className="text-gray-300">Session ID: {sessionId}</p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-green-500" : ""}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? "bg-white animate-pulse" : "bg-gray-400"}`}></div>
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>

            {!isLive ? (
              <Button onClick={handleStartStream} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Stream
              </Button>
            ) : (
              <Button onClick={handleStopStream} variant="destructive">
                <Pause className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Share Link */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  Share Audio Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 rounded-lg p-3 text-gray-300 font-mono text-sm">{joinLink}</div>
                  <Button onClick={copyJoinLink} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Speaker */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  Active Speaker
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeViewer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {activeViewer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{activeViewer.name}</p>
                          <p className="text-gray-400 text-sm">Currently speaking</p>
                        </div>
                      </div>
                      <Button onClick={handleEndSpeaking} variant="destructive" size="sm">
                        <MicOff className="w-4 h-4 mr-2" />
                        End Speaking
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Time Remaining</span>
                        <span className="text-white font-mono">{formatTime(speakingTimeLeft)}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(speakingTimeLeft / maxSpeakingTime) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-400 text-sm">Speaker Volume</label>
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
                        <span className="text-white text-sm w-12">{volume[0]}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MicOff className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No one is currently speaking</p>
                    <p className="text-gray-500 text-sm">Select a viewer from the queue to give them the mic</p>
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
                    Audio Queue ({queue.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSelectRandom}
                      size="sm"
                      disabled={queue.filter((v) => v.audioReady).length === 0 || !!activeViewer}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Random
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queue.length > 0 ? (
                  <div className="space-y-3">
                    {queue.map((viewer, index) => (
                      <div key={viewer.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {viewer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{viewer.name}</p>
                            <p className="text-gray-400 text-sm">Joined {viewer.joinedAt.toLocaleTimeString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={viewer.audioReady ? "default" : "secondary"}
                            className={viewer.audioReady ? "bg-green-500" : ""}
                          >
                            {viewer.audioReady ? "Ready" : "Not Ready"}
                          </Badge>
                          <Button
                            onClick={() => handleSelectViewer(viewer)}
                            size="sm"
                            disabled={!viewer.audioReady || !!activeViewer}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No viewers in queue</p>
                    <p className="text-gray-500 text-sm">Share your link to get viewers to join</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Stream Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">Speaking Time Limit</label>
                  <div className="flex items-center gap-3">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <Slider
                      value={[maxSpeakingTime]}
                      onValueChange={(value) => setMaxSpeakingTime(value[0])}
                      min={15}
                      max={120}
                      step={15}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-12">{maxSpeakingTime}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">Auto-select next viewer</p>
                    <p className="text-gray-400 text-xs">Automatically pick the next speaker</p>
                  </div>
                  <Switch checked={autoSelect} onCheckedChange={setAutoSelect} />
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-white text-sm font-medium mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Viewers</span>
                      <span className="text-white">{queue.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Audio Ready</span>
                      <span className="text-white">{queue.filter((v) => v.audioReady).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Session Duration</span>
                      <span className="text-white">{isLive ? "5:23" : "0:00"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Audio Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latency</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      142ms
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connection</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      Excellent
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audio Quality</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                      HD
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
