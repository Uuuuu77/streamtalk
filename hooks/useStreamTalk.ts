"use client"

import { useState, useEffect, useCallback } from "react"
import { WebRTCService } from "@/lib/webrtc"
import { WebSocketService } from "@/lib/websocket"

interface UseStreamTalkProps {
  sessionId: string
  viewerId: string
  role: "streamer" | "viewer"
}

export function useStreamTalk({ sessionId, viewerId, role }: UseStreamTalkProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0)
  const [micEnabled, setMicEnabled] = useState(false)
  const [audioReady, setAudioReady] = useState(false)

  const [webrtc] = useState(() => new WebRTCService(sessionId, viewerId))
  const [websocket] = useState(() => new WebSocketService(sessionId, viewerId))

  useEffect(() => {
    // Initialize WebSocket
    websocket.onConnectionChange = (state) => {
      setConnectionStatus(state === "connected" ? "connected" : "disconnected")
    }

    websocket.onQueueUpdate = (data) => {
      setQueuePosition(data.position)
    }

    websocket.onViewerSelected = (data) => {
      if (data.viewerId === viewerId) {
        setIsSelected(true)
        setIsInQueue(false)
        setSpeakingTimeLeft(data.speakingTime || 45)
      }
    }

    websocket.onSpeakingEnded = (data) => {
      if (data.viewerId === viewerId) {
        setIsSelected(false)
        setSpeakingTimeLeft(0)
        setMicEnabled(false)
      }
    }

    websocket.connect()

    // Initialize WebRTC
    webrtc.initialize()

    return () => {
      websocket.disconnect()
      webrtc.disconnect()
    }
  }, [sessionId, viewerId, websocket, webrtc])

  const joinQueue = useCallback(async () => {
    try {
      const hasAudio = await webrtc.requestMicrophone()
      if (!hasAudio) {
        throw new Error("Microphone access required")
      }

      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          viewerId,
          viewerName: `Viewer ${viewerId.slice(-4)}`,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsInQueue(true)
        setQueuePosition(data.queueEntry.position)
        setAudioReady(true)
        return data.queueEntry
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to join queue:", error)
      throw error
    }
  }, [sessionId, viewerId, webrtc])

  const leaveQueue = useCallback(async () => {
    try {
      await fetch("/api/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, viewerId }),
      })

      setIsInQueue(false)
      setQueuePosition(null)
      setAudioReady(false)
      webrtc.disconnect()
    } catch (error) {
      console.error("Failed to leave queue:", error)
      throw error
    }
  }, [sessionId, viewerId, webrtc])

  const toggleMicrophone = useCallback(() => {
    if (isSelected) {
      const newState = !micEnabled
      setMicEnabled(newState)
      webrtc.muteMicrophone(!newState)
    }
  }, [isSelected, micEnabled, webrtc])

  const endSpeaking = useCallback(() => {
    websocket.send({
      type: "end-speaking",
      sessionId,
      viewerId,
    })
  }, [websocket, sessionId, viewerId])

  return {
    connectionStatus,
    isInQueue,
    queuePosition,
    isSelected,
    speakingTimeLeft,
    micEnabled,
    audioReady,
    joinQueue,
    leaveQueue,
    toggleMicrophone,
    endSpeaking,
  }
}
