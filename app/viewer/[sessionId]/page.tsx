"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Volume2, VolumeX, Users, Clock, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ViewerPageProps {
  params: {
    sessionId: string
  }
}

export default function ViewerPage({ params }: ViewerPageProps) {
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0)
  const [micEnabled, setMicEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [audioReady, setAudioReady] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState<string>("Calculating...")
  const { toast } = useToast()

  // Simulate connection and queue updates
  useEffect(() => {
    // Simulate connection
    setTimeout(() => {
      setConnectionStatus("connected")
      toast({
        title: "Connected to stream!",
        description: "You can now join the audio queue",
      })
    }, 2000)

    // Simulate queue position updates
    if (isInQueue && !isSelected) {
      const interval = setInterval(() => {
        setQueuePosition((prev) => {
          if (prev && prev > 1) {
            const newPos = prev - 1
            setEstimatedWait(`~${newPos * 2} minutes`)
            return newPos
          }
          return prev
        })
      }, 10000) // Update every 10 seconds for demo

      return () => clearInterval(interval)
    }
  }, [isInQueue, isSelected, toast])

  // Speaking timer
  useEffect(() => {
    if (speakingTimeLeft > 0) {
      const timer = setTimeout(() => {
        setSpeakingTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (speakingTimeLeft === 0 && isSelected) {
      handleEndSpeaking()
    }
  }, [speakingTimeLeft, isSelected])

  // Simulate random selection
  useEffect(() => {
    if (isInQueue && queuePosition === 1 && !isSelected) {
      // 30% chance of being selected when at position 1
      const selectionTimer = setTimeout(() => {
        if (Math.random() > 0.7) {
          handleGetSelected()
        }
      }, 5000)

      return () => clearTimeout(selectionTimer)
    }
  }, [queuePosition, isInQueue, isSelected])

  const handleJoinQueue = async () => {
    if (connectionStatus !== "connected") {
      toast({
        title: "Not connected",
        description: "Please wait for connection to establish",
        variant: "destructive",
      })
      return
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioReady(true)
      setIsInQueue(true)
      setQueuePosition(Math.floor(Math.random() * 8) + 1) // Random position 1-8
      setEstimatedWait(`~${queuePosition! * 2} minutes`)

      toast({
        title: "Joined audio queue!",
        description: `You're #${queuePosition} in line. We'll notify you when it's your turn.`,
      })
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to join the queue",
        variant: "destructive",
      })
    }
  }

  const handleLeaveQueue = () => {
    setIsInQueue(false)
    setQueuePosition(null)
    setAudioReady(false)
    toast({
      title: "Left queue",
      description: "You've been removed from the audio queue",
    })
  }

  const handleGetSelected = () => {
    setIsSelected(true)
    setIsInQueue(false)
    setQueuePosition(null)
    setSpeakingTimeLeft(45) // 45 seconds to speak

    toast({
      title: "🎉 You've been selected!",
      description: "You can now speak! Your microphone is live.",
      duration: 5000,
    })

    // Auto-enable mic when selected
    setMicEnabled(true)
  }

  const handleEndSpeaking = () => {
    setIsSelected(false)
    setSpeakingTimeLeft(0)
    setMicEnabled(false)

    toast({
      title: "Speaking time ended",
      description: "Thank you for participating! You can join the queue again.",
    })
  }

  const toggleMic = () => {
    if (!isSelected) {
      toast({
        title: "Not selected",
        description: "You can only use your microphone when selected to speak",
        variant: "destructive",
      })
      return
    }
    setMicEnabled(!micEnabled)
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-400" />
      case "connecting":
        return <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      case "disconnected":
        return <WifiOff className="w-4 h-4 text-red-400" />
    }
  }

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
      case "connecting":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Connecting...</Badge>
      case "disconnected":
        return <Badge className="bg-red-500/20 text-red-400">Disconnected</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Stream<span className="text-purple-400">Talk</span> Viewer
          </h1>
          <p className="text-gray-300">Session: {params.sessionId}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {getConnectionIcon()}
            {getConnectionBadge()}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Your Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSelected ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You're Speaking!</h3>
                    <p className="text-gray-300">Your microphone is live. Make it count!</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Time Remaining</span>
                      <span className="text-white font-mono text-lg">{formatTime(speakingTimeLeft)}</span>
                    </div>
                    <Progress value={(speakingTimeLeft / 45) * 100} className="h-3" />
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={toggleMic}
                      variant={micEnabled ? "default" : "destructive"}
                      size="lg"
                      className={micEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {micEnabled ? <Mic className="w-5 h-5 mr-2" /> : <MicOff className="w-5 h-5 mr-2" />}
                      {micEnabled ? "Mic On" : "Mic Off"}
                    </Button>

                    <Button onClick={handleEndSpeaking} variant="outline">
                      End Speaking
                    </Button>
                  </div>
                </div>
              ) : isInQueue ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You're in the Queue!</h3>
                    <p className="text-gray-300">Hang tight, you'll be selected soon</p>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Position in Queue</span>
                      <Badge className="bg-blue-500/20 text-blue-400 text-lg px-3 py-1">#{queuePosition}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Estimated Wait</span>
                      <span className="text-white">{estimatedWait}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Audio Status</span>
                      <div className="flex items-center gap-2">
                        {audioReady ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Ready</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400">Not Ready</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleLeaveQueue} variant="outline" className="w-full bg-transparent">
                    Leave Queue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Join?</h3>
                    <p className="text-gray-300">Join the audio queue to get a chance to speak with the streamer</p>
                  </div>

                  <Button
                    onClick={handleJoinQueue}
                    disabled={connectionStatus !== "connected"}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Join Audio Queue
                  </Button>

                  {connectionStatus !== "connected" && (
                    <p className="text-center text-gray-400 text-sm">Waiting for connection to establish...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Controls */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-400" />
                Audio Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Stream Audio</p>
                  <p className="text-gray-400 text-sm">Listen to the stream and other speakers</p>
                </div>
                <Button onClick={toggleAudio} variant={audioEnabled ? "default" : "destructive"} size="sm">
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stream Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Stream Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Viewers in Queue</span>
                  <span className="text-white">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio Quality</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    HD
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latency</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    142ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Session Duration</span>
                  <span className="text-white">12:34</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
