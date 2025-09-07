"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Volume2, VolumeX, Users, Clock, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react"

interface ViewerPageProps {
  params: Promise<{
    sessionId: string
  }>
}

type ConnectionStatus = "connecting" | "connected" | "disconnected"

export default function ViewerPage({ params }: ViewerPageProps) {
  const [mounted, setMounted] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0)
  const [micEnabled, setMicEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [audioReady, setAudioReady] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState<string>("Calculating...")
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Load session ID from params
  useEffect(() => {
    params.then(p => {
      setSessionId(p.sessionId)
      setMounted(true)
    })
  }, [params])

  // Show notification helper
  const showNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Don't render until we have the session ID
  if (!mounted || !sessionId) {
    return <div>Loading...</div>
  }

  // Simulate connection
  useEffect(() => {
    if (!mounted) return

    const connectionTimer = setTimeout(() => {
      setConnectionStatus("connected")
      showNotification("success", "Connected to stream! You can now join the audio queue.")
    }, 2000)

    return () => clearTimeout(connectionTimer)
  }, [mounted, showNotification])

  // Queue position updates
  useEffect(() => {
    if (!mounted || !isInQueue || isSelected || !queuePosition || queuePosition <= 1) return

    const interval = setInterval(() => {
      setQueuePosition((prev) => {
        if (prev && prev > 1) {
          const newPos = prev - 1
          setEstimatedWait(`~${newPos * 2} minutes`)
          return newPos
        }
        return prev
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [mounted, isInQueue, isSelected, queuePosition])

  // Speaking timer
  useEffect(() => {
    if (!mounted || speakingTimeLeft <= 0) return

    if (speakingTimeLeft === 1 && isSelected) {
      // About to end
      setTimeout(() => handleEndSpeaking(), 1000)
      return
    }

    const timer = setTimeout(() => {
      setSpeakingTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [mounted, speakingTimeLeft, isSelected])

  // Random selection simulation
  useEffect(() => {
    if (!mounted || !isInQueue || queuePosition !== 1 || isSelected) return

    const selectionTimer = setTimeout(() => {
      if (Math.random() > 0.7) {
        handleGetSelected()
      }
    }, 5000)

    return () => clearTimeout(selectionTimer)
  }, [mounted, queuePosition, isInQueue, isSelected])

  const handleJoinQueue = async () => {
    if (connectionStatus !== "connected") {
      showNotification("error", "Not connected. Please wait for connection to establish.")
      return
    }

    try {
      // Request microphone permission safely
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setAudioReady(true)
        setIsInQueue(true)
        const randomPosition = Math.floor(Math.random() * 8) + 1
        setQueuePosition(randomPosition)
        setEstimatedWait(`~${randomPosition * 2} minutes`)

        showNotification("success", `Joined audio queue! You're #${randomPosition} in line.`)
      } else {
        throw new Error("Media devices not supported")
      }
    } catch (error) {
      console.error("Microphone access error:", error)
      showNotification("error", "Microphone access denied. Please allow microphone access to join the queue.")
    }
  }

  const handleLeaveQueue = () => {
    setIsInQueue(false)
    setQueuePosition(null)
    setAudioReady(false)
    showNotification("success", "Left queue successfully.")
  }

  const handleGetSelected = () => {
    setIsSelected(true)
    setIsInQueue(false)
    setQueuePosition(null)
    setSpeakingTimeLeft(45)
    setMicEnabled(true)
    showNotification("success", "🎉 You've been selected! Your microphone is now live.")
  }

  const handleEndSpeaking = () => {
    setIsSelected(false)
    setSpeakingTimeLeft(0)
    setMicEnabled(false)
    showNotification("success", "Speaking time ended. Thank you for participating!")
  }

  const toggleMic = () => {
    if (!isSelected) {
      showNotification("error", "You can only use your microphone when selected to speak.")
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

  if (!mounted) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Stream<span className="text-purple-400">Talk</span> Viewer
          </h1>
          <p className="text-gray-300">Session: {sessionId}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ConnectionIcon status={connectionStatus} />
            <ConnectionBadge status={connectionStatus} />
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          <StatusCard
            isSelected={isSelected}
            isInQueue={isInQueue}
            queuePosition={queuePosition}
            speakingTimeLeft={speakingTimeLeft}
            estimatedWait={estimatedWait}
            audioReady={audioReady}
            micEnabled={micEnabled}
            connectionStatus={connectionStatus}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
            onToggleMic={toggleMic}
            onEndSpeaking={handleEndSpeaking}
            formatTime={formatTime}
          />

          <AudioControlsCard audioEnabled={audioEnabled} onToggleAudio={toggleAudio} />

          <StreamInfoCard />
        </div>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Loading Viewer</h2>
        <p className="text-gray-300">Please wait...</p>
      </div>
    </div>
  )
}

function ConnectionIcon({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case "connected":
      return <Wifi className="w-4 h-4 text-green-400" />
    case "connecting":
      return <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    case "disconnected":
      return <WifiOff className="w-4 h-4 text-red-400" />
  }
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const styles = {
    connected: "bg-green-500/20 text-green-400",
    connecting: "bg-yellow-500/20 text-yellow-400",
    disconnected: "bg-red-500/20 text-red-400",
  }

  const labels = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
  }

  return <Badge className={styles[status]}>{labels[status]}</Badge>
}

interface StatusCardProps {
  isSelected: boolean
  isInQueue: boolean
  queuePosition: number | null
  speakingTimeLeft: number
  estimatedWait: string
  audioReady: boolean
  micEnabled: boolean
  connectionStatus: ConnectionStatus
  onJoinQueue: () => void
  onLeaveQueue: () => void
  onToggleMic: () => void
  onEndSpeaking: () => void
  formatTime: (seconds: number) => string
}

function StatusCard({
  isSelected,
  isInQueue,
  queuePosition,
  speakingTimeLeft,
  estimatedWait,
  audioReady,
  micEnabled,
  connectionStatus,
  onJoinQueue,
  onLeaveQueue,
  onToggleMic,
  onEndSpeaking,
  formatTime,
}: StatusCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Your Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSelected ? (
          <SpeakingStatus
            speakingTimeLeft={speakingTimeLeft}
            micEnabled={micEnabled}
            onToggleMic={onToggleMic}
            onEndSpeaking={onEndSpeaking}
            formatTime={formatTime}
          />
        ) : isInQueue ? (
          <QueueStatus
            queuePosition={queuePosition}
            estimatedWait={estimatedWait}
            audioReady={audioReady}
            onLeaveQueue={onLeaveQueue}
          />
        ) : (
          <ReadyToJoinStatus connectionStatus={connectionStatus} onJoinQueue={onJoinQueue} />
        )}
      </CardContent>
    </Card>
  )
}

function SpeakingStatus({
  speakingTimeLeft,
  micEnabled,
  onToggleMic,
  onEndSpeaking,
  formatTime,
}: {
  speakingTimeLeft: number
  micEnabled: boolean
  onToggleMic: () => void
  onEndSpeaking: () => void
  formatTime: (seconds: number) => string
}) {
  return (
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
          onClick={onToggleMic}
          variant={micEnabled ? "default" : "destructive"}
          size="lg"
          className={micEnabled ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {micEnabled ? <Mic className="w-5 h-5 mr-2" /> : <MicOff className="w-5 h-5 mr-2" />}
          {micEnabled ? "Mic On" : "Mic Off"}
        </Button>

        <Button onClick={onEndSpeaking} variant="outline">
          End Speaking
        </Button>
      </div>
    </div>
  )
}

function QueueStatus({
  queuePosition,
  estimatedWait,
  audioReady,
  onLeaveQueue,
}: {
  queuePosition: number | null
  estimatedWait: string
  audioReady: boolean
  onLeaveQueue: () => void
}) {
  return (
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

      <Button onClick={onLeaveQueue} variant="outline" className="w-full bg-transparent">
        Leave Queue
      </Button>
    </div>
  )
}

function ReadyToJoinStatus({
  connectionStatus,
  onJoinQueue,
}: {
  connectionStatus: ConnectionStatus
  onJoinQueue: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ready to Join?</h3>
        <p className="text-gray-300">Join the audio queue to get a chance to speak with the streamer</p>
      </div>

      <Button
        onClick={onJoinQueue}
        disabled={connectionStatus !== "connected"}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        <Mic className="w-5 h-5 mr-2" />
        Join Audio Queue
      </Button>

      {connectionStatus !== "connected" && (
        <p className="text-center text-gray-400 text-sm">Waiting for connection to establish...</p>
      )}
    </div>
  )
}

function AudioControlsCard({ audioEnabled, onToggleAudio }: { audioEnabled: boolean; onToggleAudio: () => void }) {
  return (
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
          <Button onClick={onToggleAudio} variant={audioEnabled ? "default" : "destructive"} size="sm">
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StreamInfoCard() {
  return (
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
  )
}
